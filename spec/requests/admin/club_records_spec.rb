require "rails_helper"

RSpec.describe "Admin Break Periods, Coach Invitations, Club Managers and progress", type: :request do
  include ActiveJob::TestHelper

  let(:admin) { create(:user, :admin) }

  before { sign_in admin }

  it "opens every admin page" do
    club = create(:club)
    break_period = create(:break_period, club: club)
    membership = create(:club_membership, club: club)
    invitation, = CoachInvitation.issue(club: club, invited_by: admin, name: "Rui", email: "rui@example.com")
    completion = create(:exercise_completion)
    progress = create(:user_module_progress)

    {
      "break_periods" => break_period, "club_memberships" => membership, "coach_invitations" => invitation,
      "exercise_completions" => completion, "module_progresses" => progress, "clubs" => club
    }.each do |path, record|
      get "/admin/#{path}"
      expect(response).to have_http_status(200), path
      get "/admin/#{path}/#{record.id}"
      expect(response).to have_http_status(200), path
      get "/admin/#{path}/new"
      expect(response).to have_http_status(200), path
      next if path == "coach_invitations"

      get "/admin/#{path}/#{record.id}/edit"
      expect(response).to have_http_status(200), path
    end
  end

  it "creates, edits and deletes a Break Period" do
    club = create(:club)

    expect {
      post "/admin/break_periods", params: { break_period: { club_id: club.id, name: "Easter", starts_on: "2027-03-29",
                                                             ends_on: "2027-04-04" } }
    }.to change(club.break_periods, :count).by(1)

    period = club.break_periods.last
    patch "/admin/break_periods/#{period.id}", params: { break_period: { ends_on: "2027-04-06" } }
    expect(period.reload.ends_on).to eq(Date.new(2027, 4, 6))

    expect { delete "/admin/break_periods/#{period.id}" }.to change(BreakPeriod, :count).by(-1)
  end

  it "issues and emails a Coach Invitation, and expires it" do
    club = create(:club)

    expect {
      post "/admin/coach_invitations", params: { coach_invitation: { club_id: club.id, name: "Rui", email: "Rui@Example.com" } }
    }.to have_enqueued_mail(CoachInvitationMailer, :invite)

    invitation = CoachInvitation.last
    expect(invitation).to have_attributes(club: club, invited_by: admin, email: "rui@example.com")
    expect(invitation).to be_pending

    post "/admin/coach_invitations/#{invitation.id}/expire"
    expect(invitation.reload).to be_expired
  end

  it "refuses an invitation to an email that has an account" do
    create(:user, email: "taken@example.com")

    expect {
      post "/admin/coach_invitations", params: { coach_invitation: { club_id: create(:club).id, name: "T", email: "taken@example.com" } }
    }.not_to change(CoachInvitation, :count)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "links a Club Manager to a Club, and refuses a Coach" do
    club = create(:club)
    manager = create(:user, :club_manager)

    expect {
      post "/admin/club_memberships", params: { club_membership: { user_id: manager.id, club_id: club.id } }
    }.to change(manager.managed_clubs, :count).by(1)

    expect {
      post "/admin/club_memberships", params: { club_membership: { user_id: create(:user, :coach).id, club_id: club.id } }
    }.not_to change(ClubMembership, :count)
  end

  it "records a Module Completion and an Exercise Completion" do
    user = create(:user, :coach)
    course_module = create(:course_module)
    exercise = create(:exercise, course_module: course_module)

    post "/admin/module_progresses", params: { user_module_progress: { user_id: user.id, course_module_id: course_module.id,
                                                                       status: "done", progress: "100" } }
    post "/admin/exercise_completions", params: { exercise_completion: { user_id: user.id, exercise_id: exercise.id } }

    expect(UserModuleProgress.find_by(user: user, course_module: course_module)).to be_done
    expect(exercise.completed_for?(user)).to be true
  end

  it "sets a user's language" do
    user = create(:user, :coach)

    patch "/admin/users/#{user.id}", params: { user: { email: user.email, role: "coach", locale: "en", password: "" } }

    expect(user.reload.locale).to eq("en")
  end
end
