require "rails_helper"

RSpec.describe "Admin Players, Class Groups and Classes", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:admin) { create(:user, :admin) }
  let(:coach) { create(:user, :coach) }
  let!(:course_modules) { create_list(:course_module, 2, level: :beginner) }
  let(:players) { create_list(:player, 2, club: coach.club) }

  before { sign_in admin }

  def group_params(**overrides)
    { coach_id: coach.id, level: "beginner", starts_on: "2026-09-07", cadence: "1", weekdays: ["", "tuesday"],
      start_time: "18:00", duration: "60", player_ids: ["", *players.map(&:id)] }.merge(overrides)
  end

  def create_group
    group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: ["tuesday"], start_time: "18:00", duration: 60)
    group.create_with_plan or raise group.errors.full_messages.to_sentence
    group
  end

  describe "Players" do
    it "lists, shows and edits Players" do
      player = create(:player, name: "Ana Silva")

      get "/admin/players"
      expect(response.body).to include("Ana Silva")
      get "/admin/players/#{player.id}"
      expect(response).to have_http_status(200)
      get "/admin/players/new"
      expect(response).to have_http_status(200)
      get "/admin/players/#{player.id}/edit"
      expect(response).to have_http_status(200)
    end

    it "filters Players by Level" do
      create(:player, name: "Beginner Bea", level: :beginner)
      create(:player, name: "Advanced Abel", level: :advanced)

      get "/admin/players", params: { q: { level_eq: Player.levels["advanced"] } }

      expect(response.body).to include("Advanced Abel")
      expect(response.body).not_to include("Beginner Bea")
    end

    it "creates and updates a Player" do
      club = create(:club)

      expect {
        post "/admin/players", params: { player: { club_id: club.id, name: "New Player", level: "intermediate",
                                                   position: "left", hand: "right" } }
      }.to change(Player, :count).by(1)

      player = Player.find_by!(name: "New Player")
      patch "/admin/players/#{player.id}", params: { player: { level: "advanced" } }
      expect(player.reload.level).to eq("advanced")
    end

    it "refuses to delete a Player in a Class Group" do
      group = create_group

      delete "/admin/players/#{group.players.first.id}"

      expect(Player.exists?(group.players.first.id)).to be true
      follow_redirect!
      expect(response.body).to include("they are in a Class Group")
    end
  end

  describe "Class Groups" do
    it "lists, shows and edits Class Groups" do
      group = create_group

      get "/admin/class_groups"
      expect(response.body).to include(coach.name)
      get "/admin/class_groups/#{group.id}"
      expect(response.body).to include("Training Plan (#{group.training_classes.count} Classes)")
      get "/admin/class_groups/new"
      expect(response).to have_http_status(200)
      get "/admin/class_groups/#{group.id}/edit"
      expect(response).to have_http_status(200)
    end

    it "creates a Class Group with its Training Plan" do
      expect { post "/admin/class_groups", params: { class_group: group_params } }.to change(ClassGroup, :count).by(1)

      group = ClassGroup.last
      expect(group.players).to match_array(players)
      expect(group.training_classes).not_to be_empty
    end

    it "refuses a Class Group that clashes with another of the Coach's" do
      create_group

      expect { post "/admin/class_groups", params: { class_group: group_params } }.not_to change(ClassGroup, :count)
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.body).to include("would overlap in time")
    end

    it "edits a Class Group, keeping its Classes and Level" do
      group = create_group
      class_ids = group.training_classes.ids

      patch "/admin/class_groups/#{group.id}", params: { class_group: group_params(name: "Tuesday crew", level: "advanced") }

      expect(group.reload).to have_attributes(name: "Tuesday crew", level: "beginner")
      expect(group.training_classes.ids).to match_array(class_ids)
    end

    it "reassigns a Class Group to another Coach of its Club" do
      group = create_group
      other = create(:user, :coach, club: coach.club)

      patch "/admin/class_groups/#{group.id}", params: { class_group: group_params(coach_id: other.id) }

      expect(group.reload.coach).to eq(other)
    end

    it "refuses to reassign a Class Group to a Coach of another Club" do
      group = create_group
      other = create(:user, :coach)

      patch "/admin/class_groups/#{group.id}", params: { class_group: group_params(coach_id: other.id) }

      expect(group.reload.coach).to eq(coach)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "regenerates a Training Plan" do
      group = create_group

      travel_to(Time.utc(2026, 9, 1, 9)) { post "/admin/class_groups/#{group.id}/regenerate_plan" }

      follow_redirect!
      expect(response.body).to include("The Training Plan was regenerated.")
    end

    it "deletes a Class Group with its Classes" do
      group = create_group

      expect { delete "/admin/class_groups/#{group.id}" }.to change(ClassGroup, :count).by(-1)
      expect(TrainingClass.where(class_group_id: group.id)).to be_empty
    end
  end

  describe "Classes" do
    it "lists, shows and edits Classes" do
      training_class = create_group.training_classes.first

      get "/admin/classes"
      expect(response).to have_http_status(200)
      get "/admin/classes/#{training_class.id}"
      expect(response).to have_http_status(200)
      get "/admin/classes/new", params: { training_class: { class_group_id: training_class.class_group_id } }
      expect(response).to have_http_status(200)
      get "/admin/classes/#{training_class.id}/edit"
      expect(response).to have_http_status(200)
    end

    it "adds a Class to a plan" do
      group = create_group

      expect {
        post "/admin/classes", params: { training_class: { class_group_id: group.id, course_module_id: course_modules.first.id,
                                                           date: "2026-09-12", start_time: "10:00", kind: "regular" } }
      }.to change(group.training_classes, :count).by(1)
      expect(group.training_classes.find_by(date: Date.new(2026, 9, 12))).to be_coach_added
    end

    it "refuses to move a Class onto another Class of the Coach" do
      group = create_group
      first, second = group.training_classes.first(2)

      patch "/admin/classes/#{second.id}", params: { training_class: { date: first.date.iso8601 } }

      expect(second.reload.date).not_to eq(first.date)
      expect(response.body).to include("would overlap in time")
    end

    it "marks a Class done" do
      training_class = create_group.training_classes.first

      patch "/admin/classes/#{training_class.id}", params: { training_class: { done: "1" } }

      expect(training_class.reload).to be_done
    end

    it "picks and removes an Exercise of the Class's Module" do
      training_class = create_group.training_classes.first
      exercise = create(:exercise, course_module: training_class.course_module)

      post "/admin/classes/#{training_class.id}/pick_exercise", params: { exercise_id: exercise.id }
      expect(training_class.exercises.reload).to eq([exercise])

      delete "/admin/classes/#{training_class.id}/remove_exercise", params: { exercise_id: exercise.id }
      expect(training_class.exercises.reload).to be_empty
    end

    it "refuses an Exercise of another Module" do
      training_class = create_group.training_classes.first
      exercise = create(:exercise)

      post "/admin/classes/#{training_class.id}/pick_exercise", params: { exercise_id: exercise.id }

      expect(training_class.exercises.reload).to be_empty
      follow_redirect!
      expect(response.body).to include("must be an Exercise of the Class&#39;s Module")
    end
  end
end
