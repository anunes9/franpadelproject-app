require "rails_helper"

RSpec.describe "Break Periods", type: :request do
  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:manager) { create(:user, :club_manager) }
  let(:christmas) do
    { break_period: { name: "Christmas", starts_on: "2026-12-21", ends_on: "2027-01-03" } }
  end

  before { create(:club_membership, user: manager, club: club) }

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  describe "adding a Break Period" do
    it "lets a Club Manager add a Break Period to a linked Club" do
      sign_in manager

      post "/dashboard/clubs/#{club.id}/break_periods", params: christmas

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/break_periods")
      follow_redirect!
      expect(page_props["breakPeriods"]).to match(
        [hash_including("name" => "Christmas", "startsOn" => "2026-12-21", "endsOn" => "2027-01-03")]
      )
    end

    it "accepts a one-day Break Period" do
      sign_in manager

      post "/dashboard/clubs/#{club.id}/break_periods",
           params: { break_period: { name: "Carnival", starts_on: "2027-02-09", ends_on: "2027-02-09" } }

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/break_periods")
      expect(club.break_periods.count).to eq(1)
    end

    it "rejects an end date before the start date, or a missing name, and shows the errors" do
      sign_in manager

      post "/dashboard/clubs/#{club.id}/break_periods",
           params: { break_period: { name: "", starts_on: "2027-01-03", ends_on: "2026-12-21" } }

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/break_periods/new")
      expect(club.break_periods.count).to eq(0)
      follow_redirect!
      expect(response.body).to include(%q("component":"BreakPeriods/Form"))
      expect(page_props["errors"]).to eq(
        "name" => ["can't be blank"],
        "ends_on" => ["must be on or after the start date"]
      )
    end

    it "404s for a Club Manager not linked to the Club" do
      sign_in create(:user, :club_manager)

      post "/dashboard/clubs/#{club.id}/break_periods", params: christmas

      expect(response).to have_http_status(:not_found)
      expect(BreakPeriod.count).to eq(0)
    end

    it "404s for a Coach of the Club" do
      sign_in create(:user, :coach, club: club)

      post "/dashboard/clubs/#{club.id}/break_periods", params: christmas

      expect(response).to have_http_status(:not_found)
      expect(BreakPeriod.count).to eq(0)
    end

    it "requires authentication" do
      post "/dashboard/clubs/#{club.id}/break_periods", params: christmas

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  describe "the Break Periods list" do
    it "shows a Club Manager the Club's Break Periods in date order, and no other Club's" do
      create(:break_period, club: club, name: "August", starts_on: "2027-08-01", ends_on: "2027-08-31")
      create(:break_period, club: club, name: "Christmas", starts_on: "2026-12-21", ends_on: "2027-01-03")
      create(:break_period, name: "Elsewhere")
      sign_in manager

      get "/dashboard/clubs/#{club.id}/break_periods"

      expect(response).to have_http_status(200)
      expect(response.body).to include(%q("component":"BreakPeriods/Index"))
      expect(page_props["club"]).to eq("id" => club.id, "name" => "Padel Clube Lisboa")
      expect(page_props["breakPeriods"].map { |b| b["name"] }).to eq(%w[Christmas August])
    end

    it "keeps each Club's Break Periods apart for a Club Manager of several Clubs" do
      other_linked_club = create(:club)
      create(:club_membership, user: manager, club: other_linked_club)
      create(:break_period, club: other_linked_club, name: "Easter")
      sign_in manager

      get "/dashboard/clubs/#{club.id}/break_periods"

      expect(page_props["breakPeriods"]).to eq([])
    end

    it "404s for a Club Manager not linked to the Club" do
      sign_in create(:user, :club_manager)

      get "/dashboard/clubs/#{club.id}/break_periods"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for a Coach of the Club" do
      sign_in create(:user, :coach, club: club)

      get "/dashboard/clubs/#{club.id}/break_periods"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for an Admin, who manages Clubs through the admin screens" do
      sign_in create(:user, :admin)

      get "/dashboard/clubs/#{club.id}/break_periods"

      expect(response).to have_http_status(:not_found)
    end

    it "renders the new Break Period form" do
      sign_in manager

      get "/dashboard/clubs/#{club.id}/break_periods/new"

      expect(response).to have_http_status(200)
      expect(response.body).to include(%q("component":"BreakPeriods/Form"))
      expect(page_props["breakPeriod"]).to be_nil
    end

    it "404s the new Break Period form for a Coach" do
      sign_in create(:user, :coach, club: club)

      get "/dashboard/clubs/#{club.id}/break_periods/new"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "editing a Break Period" do
    let!(:break_period) { create(:break_period, club: club, name: "Christmas") }

    it "lets a linked Club Manager edit the Break Period" do
      sign_in manager

      get "/dashboard/break_periods/#{break_period.id}/edit"
      expect(response).to have_http_status(200)
      expect(response.body).to include(%q("component":"BreakPeriods/Form"))
      expect(page_props["breakPeriod"]).to include("name" => "Christmas", "startsOn" => "2026-12-21")

      patch "/dashboard/break_periods/#{break_period.id}",
            params: { break_period: { name: "Christmas holidays", ends_on: "2027-01-06" } }

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/break_periods")
      follow_redirect!
      expect(page_props["breakPeriods"]).to match(
        [hash_including("name" => "Christmas holidays", "startsOn" => "2026-12-21", "endsOn" => "2027-01-06")]
      )
    end

    it "rejects an end date before the start date and shows the error" do
      sign_in manager

      patch "/dashboard/break_periods/#{break_period.id}", params: { break_period: { ends_on: "2026-12-01" } }

      expect(response).to redirect_to("/dashboard/break_periods/#{break_period.id}/edit")
      expect(break_period.reload.ends_on).to eq(Date.new(2027, 1, 3))
      follow_redirect!
      expect(page_props["errors"]).to eq("ends_on" => ["must be on or after the start date"])
    end

    it "never moves a Break Period to another Club" do
      sign_in manager

      patch "/dashboard/break_periods/#{break_period.id}", params: { break_period: { club_id: create(:club).id } }

      expect(break_period.reload.club).to eq(club)
    end

    it "404s the edit form for a Club Manager not linked to the Club" do
      other_manager = create(:user, :club_manager)
      create(:club_membership, user: other_manager, club: create(:club))
      sign_in other_manager

      get "/dashboard/break_periods/#{break_period.id}/edit"

      expect(response).to have_http_status(:not_found)
    end

    it "404s updating for a Club Manager not linked to the Club" do
      other_manager = create(:user, :club_manager)
      create(:club_membership, user: other_manager, club: create(:club))
      sign_in other_manager

      patch "/dashboard/break_periods/#{break_period.id}", params: { break_period: { name: "Hacked" } }

      expect(response).to have_http_status(:not_found)
      expect(break_period.reload.name).to eq("Christmas")
    end

    it "404s for a Coach of the Club" do
      sign_in create(:user, :coach, club: club)

      patch "/dashboard/break_periods/#{break_period.id}", params: { break_period: { name: "Hacked" } }

      expect(response).to have_http_status(:not_found)
      expect(break_period.reload.name).to eq("Christmas")
    end
  end

  describe "removing a Break Period" do
    let!(:break_period) { create(:break_period, club: club) }

    it "lets a linked Club Manager remove the Break Period" do
      sign_in manager

      delete "/dashboard/break_periods/#{break_period.id}"

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/break_periods")
      follow_redirect!
      expect(page_props["breakPeriods"]).to eq([])
    end

    it "404s for a Club Manager not linked to the Club" do
      sign_in create(:user, :club_manager)

      delete "/dashboard/break_periods/#{break_period.id}"

      expect(response).to have_http_status(:not_found)
      expect(BreakPeriod.exists?(break_period.id)).to be(true)
    end

    it "404s for a Coach of the Club" do
      sign_in create(:user, :coach, club: club)

      delete "/dashboard/break_periods/#{break_period.id}"

      expect(response).to have_http_status(:not_found)
      expect(BreakPeriod.exists?(break_period.id)).to be(true)
    end
  end
end
