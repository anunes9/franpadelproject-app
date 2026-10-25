require "rails_helper"

RSpec.describe "Coach invitations", type: :request do
  include ActiveJob::TestHelper
  include ActiveSupport::Testing::TimeHelpers

  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:manager) { create(:user, :club_manager, name: "Marta Manager") }
  let(:invite_params) { { coach_invitation: { name: "Carla Coach", email: "carla@example.com" } } }

  before { create(:club_membership, user: manager, club: club) }

  # The Inertia page in the response.
  def page
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])
  end

  def props = page["props"]

  def invite(to: club, params: invite_params)
    perform_enqueued_jobs { post "/dashboard/clubs/#{to.id}/coach_invitations", params: params }
  end

  # The acceptance link in the last email sent.
  def acceptance_path
    body = ActionMailer::Base.deliveries.last.text_part.body.to_s
    URI(body[%r{https?://\S+/invitations/\S+}]).path
  end

  describe "inviting a Coach" do
    it "emails the Coach a link to accept the invitation" do
      sign_in manager

      expect { invite }.to change(ActionMailer::Base.deliveries, :count).by(1)

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}")
      mail = ActionMailer::Base.deliveries.last
      expect(mail.to).to eq(["carla@example.com"])
      expect(mail.text_part.body.to_s).to include("Padel Clube Lisboa")
      expect(acceptance_path).to match(%r{\A/invitations/[^/]+\z})
    end

    it "writes the email in the Club Manager's language" do
      manager.update!(locale: :pt)
      sign_in manager

      invite

      mail = ActionMailer::Base.deliveries.last
      expect(mail.subject).to eq("Convite para treinar no Padel Clube Lisboa")
      expect(mail.text_part.body.to_s).to include("Marta Manager convidou-o")
    end

    it "shows a Club Manager the invitation form for a linked Club" do
      sign_in manager

      get "/dashboard/clubs/#{club.id}/coach_invitations/new"

      expect(page["component"]).to eq("CoachInvitations/New")
      expect(props["club"]).to eq("id" => club.id, "name" => "Padel Clube Lisboa")
    end

    it "404s for a Club the Club Manager is not linked to" do
      other_club = create(:club)
      sign_in manager

      expect { invite(to: other_club) }.not_to change(ActionMailer::Base.deliveries, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "404s the invitation form of a Club the Club Manager is not linked to" do
      sign_in manager

      get "/dashboard/clubs/#{create(:club).id}/coach_invitations/new"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for a Coach, even for their own Club" do
      sign_in create(:user, :coach, club: club)

      expect { invite }.not_to change(ActionMailer::Base.deliveries, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "requires authentication" do
      invite

      expect(response).to redirect_to(new_user_session_path)
      expect(ActionMailer::Base.deliveries).to be_empty
    end

    it "refuses an email that already has an account" do
      create(:user, :coach, email: "carla@example.com")
      sign_in manager

      expect { invite(params: { coach_invitation: { name: "Carla", email: "Carla@Example.com " } }) }
        .not_to change(ActionMailer::Base.deliveries, :count)

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/coach_invitations/new")
      follow_redirect!
      expect(props["errors"]).to eq(
        "email" => [{ "code" => "account_exists", "message" => "already has an account" }]
      )
    end

    it "(for a removed Coach too, who is not reactivated) refuses an email that already has an account" do
      create(:user, :coach, email: "carla@example.com", removed_at: 1.day.ago)
      sign_in manager

      expect { invite(params: { coach_invitation: { name: "Carla", email: "Carla@Example.com " } }) }
        .not_to change(ActionMailer::Base.deliveries, :count)

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/coach_invitations/new")
      follow_redirect!
      expect(props["errors"]).to eq(
        "email" => [{ "code" => "account_exists", "message" => "already has an account" }]
      )
    end

    it "refuses an invitation without a name or a valid email" do
      sign_in manager

      expect { invite(params: { coach_invitation: { name: "", email: "not-an-email" } }) }
        .not_to change(ActionMailer::Base.deliveries, :count)

      follow_redirect!
      expect(props["errors"]).to eq(
        "name" => [{ "code" => "blank", "message" => "can't be blank" }],
        "email" => [{ "code" => "invalid", "message" => "is invalid" }]
      )
    end

    it "lists pending invitations on the Club overview, replacing an earlier one to the same email" do
      sign_in manager

      invite
      invite(params: { coach_invitation: { name: "Carla Costa", email: "carla@example.com" } })
      get "/dashboard/clubs/#{club.id}"

      expect(props["pendingInvitations"]).to match([a_hash_including("name" => "Carla Costa", "email" => "carla@example.com")])
    end
  end

  describe "accepting an invitation" do
    let(:password_params) do
      { invitation: { name: "Carla Costa", password: "secret-pass-1", password_confirmation: "secret-pass-1" } }
    end

    # Invites as the Club Manager, then leaves the session signed out, as the
    # invited Coach opening the email would be.
    def invited_path
      sign_in manager
      invite
      sign_out manager
      acceptance_path
    end

    it "shows the invitation, signed out, from the emailed link" do
      path = invited_path

      get path

      expect(response).to have_http_status(200)
      expect(page["component"]).to eq("Auth/AcceptInvitation")
      expect(props["state"]).to eq("pending")
      expect(props["invitation"]).to eq(
        "name" => "Carla Coach", "email" => "carla@example.com", "club" => "Padel Clube Lisboa"
      )
    end

    it "makes a Coach of exactly that Club, signs them in and lands them on the Coach home" do
      path = invited_path

      expect { patch path, params: password_params }.to change(User, :count).by(1)

      coach = User.find_by!(email: "carla@example.com")
      expect(coach).to have_attributes(role: "coach", club: club, name: "Carla Costa")
      expect(response).to redirect_to("/dashboard")
      follow_redirect!
      expect(page["component"]).to eq("Dashboard/Home")
    end

    it "lets the Coach sign in with the password they chose" do
      path = invited_path
      patch path, params: password_params
      sign_out :user

      post "/users/sign_in", params: { user: { email: "carla@example.com", password: "secret-pass-1" } }

      expect(response).to redirect_to("/dashboard")
    end

    it "drops the invitation from the Club overview once accepted" do
      patch invited_path, params: password_params
      sign_in manager

      get "/dashboard/clubs/#{club.id}"

      expect(props["pendingInvitations"]).to eq([])
      expect(props["coaches"]).to match([a_hash_including("name" => "Carla Costa")])
    end

    it "refuses a password that is too short or does not match its confirmation" do
      path = invited_path

      expect do
        patch path, params: { invitation: { name: "Carla", password: "short", password_confirmation: "other" } }
      end.not_to change(User, :count)

      expect(response).to redirect_to(path)
      follow_redirect!
      expect(props["state"]).to eq("pending")
      expect(props["errors"]).to eq(
        "password" => [{ "code" => "too_short", "message" => "is too short (minimum is 6 characters)" }],
        "password_confirmation" => [{ "code" => "confirmation", "message" => "doesn't match Password" }]
      )
    end

    it "works only once" do
      path = invited_path
      patch path, params: password_params
      sign_out :user

      get path
      expect(props["state"]).to eq("accepted")

      expect { patch path, params: password_params }.not_to change(User, :count)
      expect(response).to redirect_to(path)
    end

    it "stops working once the invitation expires" do
      path = invited_path

      travel CoachInvitation::VALID_FOR + 1.minute do
        get path
        expect(props["state"]).to eq("expired")

        expect { patch path, params: password_params }.not_to change(User, :count)
      end
    end

    it "stops working when a newer invitation to the same email replaces it" do
      old_path = invited_path
      new_path = invited_path

      get old_path
      expect(props["state"]).to eq("expired")
      get new_path
      expect(props["state"]).to eq("pending")
    end

    it "refuses when the email got an account after the invitation was sent" do
      path = invited_path
      create(:user, :coach, email: "carla@example.com")

      expect { patch path, params: password_params }.not_to change(User, :count)

      follow_redirect!
      expect(props["errors"]).to eq(
        "email" => [{ "code" => "account_exists", "message" => "already has an account" }]
      )
    end

    it "404s for a link that was never sent" do
      get "/invitations/not-a-real-token"

      expect(response).to have_http_status(:not_found)
    end
  end
end
