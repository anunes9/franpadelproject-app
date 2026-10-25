require "rails_helper"

RSpec.describe "Class Groups", type: :request do
  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:coach) { create(:user, :coach, club: club, name: "Fran") }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }
  let!(:volley) { create(:course_module, level: :beginner, position: 2, title: "Volley") }
  let(:players) { create_list(:player, 2, club: club) }

  # Starts on Monday 7 September 2026, with Classes on Tuesdays.
  let(:group_params) do
    {
      level: "beginner", starts_on: "2026-09-07", cadence: 1, weekdays: ["tuesday"],
      start_time: "18:00", duration: 60, player_ids: players.map(&:id)
    }
  end

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def create_group(params = group_params)
    post "/dashboard/class_groups", params: { class_group: params }
  end

  describe "creating a Class Group" do
    it "creates the group with its Players and shows its full Training Plan" do
      sign_in coach

      expect { create_group }.to change(ClassGroup, :count).by(1)

      group = ClassGroup.last
      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.players).to match_array(players)

      follow_redirect!
      expect(response.body).to include(%q("component":"ClassGroups/Show"))
      plan = page_props["classes"]
      # Once a week: six weeks per Module, the sixth an Assessment Class.
      expect(plan.size).to eq(12)
      expect(plan.first).to include("date" => "2026-09-08", "startTime" => "18:00", "kind" => "regular")
      expect(plan.first["module"]).to eq("slug" => serve.slug, "number" => 1, "title" => "Serve")
      expect(plan[5]).to include("date" => "2026-10-13", "kind" => "assessment")
      expect(plan[6]["module"]).to include("title" => "Volley")
      expect(plan.last).to include("date" => "2026-11-24", "kind" => "assessment")
      expect(page_props["classGroup"]).to include(
        "level" => "beginner", "cadence" => 1, "weekdays" => ["tuesday"],
        "startTime" => "18:00", "duration" => 60, "coach" => "Fran"
      )
    end

    it "generates four weeks per Module at twice a week, skipping the Club's Break Periods" do
      create(:break_period, club: club, starts_on: Date.new(2026, 9, 14), ends_on: Date.new(2026, 9, 20))
      sign_in coach

      create_group(group_params.merge(cadence: 2, weekdays: %w[tuesday thursday], duration: 90))
      follow_redirect!

      plan = page_props["classes"]
      expect(plan.size).to eq(16)
      expect(plan.first(3).map { |c| c["date"] }).to eq(%w[2026-09-08 2026-09-10 2026-09-22])
      # The last Class of each Module's fourth week is its Assessment Class.
      expect(plan.each_index.select { |i| plan[i]["kind"] == "assessment" }).to eq([7, 15])
    end

    it "accepts eight Players" do
      sign_in coach

      expect { create_group(group_params.merge(player_ids: create_list(:player, 8, club: club).map(&:id))) }
        .to change(ClassGroup, :count).by(1)
    end

    it "refuses more than eight Players and creates nothing" do
      sign_in coach

      expect { create_group(group_params.merge(player_ids: create_list(:player, 9, club: club).map(&:id))) }
        .not_to change(TrainingClass, :count)
      expect(ClassGroup.count).to eq(0)
      expect(response).to redirect_to("/dashboard/class_groups/new")

      follow_redirect!
      expect(page_props["errors"]["players"]).to eq([{ "code" => "too_many", "message" => "is too many (maximum is 8)" }])
    end

    it "refuses a group with no Players" do
      sign_in coach

      expect { create_group(group_params.merge(player_ids: [])) }.not_to change(ClassGroup, :count)

      follow_redirect!
      expect(page_props["errors"]["players"].map { |e| e["code"] }).to eq(["blank"])
    end

    it "refuses Players of another Club" do
      sign_in coach

      expect { create_group(group_params.merge(player_ids: [create(:player).id])) }.not_to change(ClassGroup, :count)

      follow_redirect!
      expect(page_props["errors"]["players"].map { |e| e["code"] }).to eq(["other_club"])
    end

    it "refuses weekdays that do not match the cadence" do
      sign_in coach

      expect { create_group(group_params.merge(cadence: 2, weekdays: ["tuesday"])) }.not_to change(ClassGroup, :count)

      follow_redirect!
      expect(page_props["errors"]["weekdays"].map { |e| e["code"] }).to eq(["cadence_mismatch"])
    end

    it "refuses a Course without Modules" do
      sign_in coach

      expect { create_group(group_params.merge(level: "intermediate")) }.not_to change(ClassGroup, :count)

      follow_redirect!
      expect(page_props["errors"]["level"].map { |e| e["code"] }).to eq(["no_modules"])
    end

    it "refuses a group whose Classes would cross midnight" do
      sign_in coach

      expect { create_group(group_params.merge(start_time: "23:30")) }.not_to change(ClassGroup, :count)

      follow_redirect!
      expect(page_props["errors"]["start_time"]).to eq(
        [{ "code" => "crosses_midnight", "message" => "must let the Class end by midnight" }]
      )
    end

    it "accepts a group whose Classes end exactly at midnight" do
      sign_in coach

      expect { create_group(group_params.merge(start_time: "22:30", duration: 90)) }
        .to change(ClassGroup, :count).by(1)
    end

    it "refuses, and creates nothing, when saving the Training Plan fails" do
      sign_in coach
      allow_any_instance_of(TrainingClass).to receive(:save!).and_raise(ActiveRecord::RecordNotSaved)

      expect { create_group }.not_to(change { [ClassGroup.count, TrainingClass.count, ClassGroupPlayer.count] })
      expect(response).to redirect_to("/dashboard/class_groups/new")

      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["not_saved"])
    end

    it "404s for a Coach without a Club" do
      clubless = create(:user, :coach)
      clubless.update_column(:club_id, nil)
      sign_in clubless

      get "/dashboard/class_groups/new"
      expect(response).to have_http_status(:not_found)

      # A 404 response does not keep the test sign-in, so sign in again.
      sign_in clubless
      expect { create_group(group_params.merge(player_ids: [])) }.not_to change(ClassGroup, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "404s for a Club Manager, who cannot create groups here" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      sign_in manager

      expect { create_group }.not_to change(ClassGroup, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "requires authentication" do
      create_group

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  describe "the clash rule" do
    # A group already planned on Tuesdays from 8 September 2026.
    def existing_group(coach:, players:, start_time: "18:00", duration: 60, weekdays: ["tuesday"])
      group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: Date.new(2026, 9, 7),
                             cadence: 1, weekdays: weekdays, start_time: start_time, duration: duration)
      group.create_with_plan || raise("existing group refused: #{group.errors.full_messages}")
      group
    end

    it "refuses a group that would double-book the Coach, creates nothing and lists the clashing dates" do
      existing_group(coach: coach, players: create_list(:player, 1, club: club))
      sign_in coach

      expect { create_group }.not_to(change { [ClassGroup.count, TrainingClass.count, ClassGroupPlayer.count] })
      expect(response).to redirect_to("/dashboard/class_groups/new")

      follow_redirect!
      expect(page_props["errors"]).to eq(
        "base" => [{ "code" => "clash",
                     "message" => "would overlap in time with another Class of the Coach or of a Player" }]
      )
      # Both plans fall on the same twelve Tuesdays.
      expect(page_props["clashDates"].size).to eq(12)
      expect(page_props["clashDates"].first(2)).to eq(%w[2026-09-08 2026-09-15])
    end

    it "refuses a group that would double-book a Player in another Coach's group" do
      other_coach = create(:user, :coach, club: club)
      existing_group(coach: other_coach, players: [players.first], weekdays: ["thursday"])
      sign_in coach

      expect { create_group(group_params.merge(weekdays: ["thursday"])) }
        .not_to(change { [ClassGroup.count, TrainingClass.count, ClassGroupPlayer.count] })
      expect(response).to redirect_to("/dashboard/class_groups/new")

      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["clash"])
      # Both plans fall on the same twelve Thursdays.
      thursdays = (0...12).map { |week| (Date.new(2026, 9, 10) + (7 * week)).iso8601 }
      expect(page_props["clashDates"]).to eq(thursdays)
    end

    it "forgets the clashing dates once the form is shown again" do
      existing_group(coach: coach, players: create_list(:player, 1, club: club))
      sign_in coach
      create_group
      follow_redirect!

      get "/dashboard/class_groups/new"

      expect(page_props["clashDates"]).to eq([])
    end

    it "detects an overlap in time, not only an identical start" do
      # 18:30 for 90 minutes overlaps 18:00 for 60 minutes.
      existing_group(coach: coach, players: create_list(:player, 1, club: club), start_time: "18:30", duration: 90)
      sign_in coach

      expect { create_group }.not_to change(ClassGroup, :count)
      expect(response).to redirect_to("/dashboard/class_groups/new")
    end

    it "lets Classes follow each other back to back" do
      existing_group(coach: coach, players: players, start_time: "19:00")
      sign_in coach

      expect { create_group }.to change(ClassGroup, :count).by(1)
    end

    it "lets a Player be in several groups that do not overlap" do
      existing_group(coach: create(:user, :coach, club: club), players: players, weekdays: ["friday"])
      sign_in coach

      expect { create_group }.to change(ClassGroup, :count).by(1)
      expect(players.first.reload.class_groups.count).to eq(2)
    end
  end

  describe "seeing a Class Group" do
    let(:group) do
      ClassGroup.new(group_params.merge(coach: coach)).tap { |g| g.create_with_plan || raise("refused") }
    end

    it "shows the plan to the owning Coach" do
      sign_in coach

      get "/dashboard/class_groups/#{group.id}"

      expect(response).to have_http_status(200)
      expect(page_props["classes"].size).to eq(12)
    end

    it "shows the plan to a Club Manager of the Club" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      sign_in manager

      get "/dashboard/class_groups/#{group.id}"

      expect(response).to have_http_status(200)
      expect(page_props["classGroup"]["id"]).to eq(group.id)
    end

    it "404s for another Coach of the same Club" do
      sign_in create(:user, :coach, club: club)

      get "/dashboard/class_groups/#{group.id}"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for a Club Manager of another Club" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: create(:club))
      sign_in manager

      get "/dashboard/class_groups/#{group.id}"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for an Admin" do
      sign_in create(:user, :admin)

      get "/dashboard/class_groups/#{group.id}"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "the Coach's Class Groups list" do
    it "lists the Coach's own groups only" do
      group = ClassGroup.new(group_params.merge(coach: coach)).tap(&:create_with_plan)
      ClassGroup.new(group_params.merge(coach: create(:user, :coach, club: club), weekdays: ["friday"],
                                        player_ids: [create(:player, club: club).id])).tap(&:create_with_plan)
      sign_in coach

      get "/dashboard/class_groups"

      expect(response.body).to include(%q("component":"ClassGroups/Index"))
      expect(page_props["classGroups"].map { |g| g["id"] }).to eq([group.id])
      expect(page_props["classGroups"].first).to include("playerCount" => 2, "startTime" => "18:00")
    end

    it "gives the create form the Coach's Club roster" do
      players
      create(:player, name: "Someone Elsewhere")
      sign_in coach

      get "/dashboard/class_groups/new"

      expect(response.body).to include(%q("component":"ClassGroups/Form"))
      expect(page_props["players"].map { |p| p["id"] }).to match_array(players.map(&:id))
      expect(page_props).to include("maxPlayers" => 8, "durationOptions" => [60, 90], "cadenceOptions" => [1, 2])
    end
  end

  describe "the Club overview" do
    it "lists the Club's Class Groups for its Club Managers" do
      group = ClassGroup.new(group_params.merge(coach: coach)).tap(&:create_with_plan)
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      sign_in manager

      get "/dashboard/clubs/#{club.id}"

      expect(page_props["classGroups"].map { |g| g["id"] }).to eq([group.id])
      expect(page_props["classGroups"].first).to include("coach" => "Fran")
    end
  end
end
