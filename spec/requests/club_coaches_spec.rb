require "rails_helper"

# A Club Manager removes a Coach from one of their Clubs: the Coach loses
# access but their account and history are kept, unless the Coach still owns
# Class Groups (docs/adr/0006-manager-oversight.md).
RSpec.describe "Removing a Coach", type: :request do
  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:coach) { create(:user, :coach, club: club, name: "Fran") }
  let(:manager) { create(:user, :club_manager).tap { |m| create(:club_membership, user: m, club: club) } }

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def remove(user, club: self.club)
    delete "/dashboard/clubs/#{club.id}/coaches/#{user.id}"
  end

  def class_group_of(coach)
    ClassGroup.create!(coach: coach, players: [create(:player, club: coach.club)], level: "beginner",
                       starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: ["tuesday"],
                       start_time: "18:00", duration: 60)
  end

  it "removes a Coach with no Class Groups from the Club, keeping their course progress and Exercise Completions" do
    create(:quiz_attempt, user: coach)
    create(:exercise_completion, user: coach)
    sign_in manager

    expect { remove(coach) }.not_to(change { [User.count, QuizAttempt.count, ExerciseCompletion.count] })

    expect(coach.reload).to be_removed
    expect(response).to redirect_to("/dashboard/clubs/#{club.id}")
    follow_redirect!
    expect(page_props["coaches"]).to eq([])
  end

  it "refuses to remove a Coach who owns a Class Group, telling the Manager to reassign it first" do
    group = class_group_of(coach)
    sign_in manager

    remove(coach)

    expect(coach.reload).not_to be_removed
    expect(ClassGroup.find(group.id).coach).to eq(coach)
    expect(response).to redirect_to("/dashboard/clubs/#{club.id}")
    follow_redirect!
    expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["has_class_groups"])
    expect(page_props["refusedEdit"]).to eq(coach.id)
  end

  it "lets a Manager of two Clubs remove a Coach of either" do
    other_club = create(:club)
    create(:club_membership, user: manager, club: other_club)
    other_coach = create(:user, :coach, club: other_club)
    sign_in manager

    remove(other_coach, club: other_club)

    expect(other_coach.reload).to be_removed
  end

  describe "refusals, as if the Coach did not exist" do
    {
      "a Coach already removed" => lambda {
        target = create(:user, :coach, club: club, removed_at: 1.day.ago)
        [target, club]
      },
      "a Coach of a Club the Manager is not linked to" => lambda {
        target = create(:user, :coach)
        [target, target.club]
      },
      "a Coach of another Club, through this Club" => -> { [create(:user, :coach), club] },
      "a Club Manager of the Club" => -> { [create(:club_membership, club: club).user, club] },
      "an Admin" => -> { [create(:user, :admin), club] },
      "the Manager themselves" => -> { [manager, club] }
    }.each do |who, target|
      it "404s for #{who}" do
        user, through = instance_exec(&target)
        sign_in manager

        expect { remove(user, club: through) }.not_to(change { user.reload.removed_at })
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  {
    "a Coach" => -> { create(:user, :coach, club: club) },
    "an Admin" => -> { create(:user, :admin) }
  }.each do |who, user|
    it "404s for #{who}, who cannot remove Coaches" do
      target = coach
      sign_in instance_exec(&user)

      remove(target)

      expect(response).to have_http_status(:not_found)
      expect(target.reload).not_to be_removed
    end
  end

  it "requires authentication" do
    target = coach

    remove(target)

    expect(response).to redirect_to(new_user_session_path)
    expect(target.reload).not_to be_removed
  end
end
