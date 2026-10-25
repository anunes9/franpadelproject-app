require "rails_helper"

RSpec.describe "Editing a Training Plan", type: :request do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }
  let!(:volley) { create(:course_module, level: :beginner, position: 2, title: "Volley") }
  let(:players) { create_list(:player, 2, club: club) }

  # Tuesdays at 18:00 for an hour, from Tuesday 8 September 2026.
  let(:group) { planned_group(coach: coach, players: players) }
  let(:first_class) { group.training_classes.first }

  def planned_group(coach:, players:, weekdays: ["tuesday"], start_time: "18:00", duration: 60)
    group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: weekdays, start_time: start_time, duration: duration)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def plan_entry(training_class)
    page_props["classes"].find { |entry| entry["id"] == training_class.id }
  end

  describe "marking a Class done" do
    it "marks it done, and undone again, and the plan shows it" do
      sign_in coach

      patch "/dashboard/classes/#{first_class.id}/done"

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(plan_entry(first_class)).to include("done" => true)

      patch "/dashboard/classes/#{first_class.id}/undone"
      follow_redirect!
      expect(plan_entry(first_class)).to include("done" => false)
    end
  end

  describe "moving a Class" do
    def move(training_class, date:, start_time:)
      patch "/dashboard/classes/#{training_class.id}", params: { training_class: { date: date, start_time: start_time } }
    end

    it "moves it to another date and start time, keeping the group's duration" do
      sign_in coach

      move(first_class, date: "2026-09-09", start_time: "19:30")

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(plan_entry(first_class)).to include("date" => "2026-09-09", "startTime" => "19:30")
      expect(page_props["classGroup"]["duration"]).to eq(60)
    end

    it "moves it later on the same day without clashing with itself" do
      sign_in coach

      move(first_class, date: "2026-09-08", start_time: "18:30")

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(first_class.reload.plan_json[:startTime]).to eq("18:30")
    end

    it "refuses a move onto another Class of the Coach, and lists the clashing date" do
      sign_in coach

      move(first_class, date: "2026-09-15", start_time: "18:30")

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(first_class.reload.date).to eq(Date.new(2026, 9, 8))
      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(["2026-09-15"])
      expect(page_props["refusedEdit"]).to eq(first_class.id)
    end

    it "refuses a move onto a Class of one of its Players in another Coach's group" do
      planned_group(coach: create(:user, :coach, club: club), players: [players.last], weekdays: ["thursday"])
      sign_in coach

      move(first_class, date: "2026-09-10", start_time: "17:30")

      expect(first_class.reload.date).to eq(Date.new(2026, 9, 8))
      follow_redirect!
      expect(page_props["clashDates"]).to eq(["2026-09-10"])
    end

    it "refuses a move that would end after midnight" do
      sign_in coach

      move(first_class, date: "2026-09-09", start_time: "23:30")

      expect(first_class.reload.date).to eq(Date.new(2026, 9, 8))
      follow_redirect!
      expect(page_props["errors"]["start_time"].map { |e| e["code"] }).to eq(["crosses_midnight"])
      expect(page_props["clashDates"]).to eq([])
    end
  end

  describe "adding a Class" do
    def add(group, date:, start_time: "18:00", course_module: volley)
      post "/dashboard/class_groups/#{group.id}/classes",
           params: { training_class: { date: date, start_time: start_time, course_module_id: course_module.id } }
    end

    it "adds a regular Class of the Coach's own to the plan, in date order" do
      group
      sign_in coach

      expect { add(group, date: "2026-09-12", start_time: "10:00") }.to change(TrainingClass, :count).by(1)

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      added = page_props["classes"][1]
      expect(added).to include("date" => "2026-09-12", "startTime" => "10:00", "kind" => "regular",
                               "coachAdded" => true, "done" => false, "skipped" => false)
      expect(added["module"]).to include("title" => "Volley")
      expect(page_props["classes"].first).to include("coachAdded" => false)
    end

    it "refuses a Class that would clash, adds nothing and lists the clashing date" do
      group
      sign_in coach

      expect { add(group, date: "2026-09-15", start_time: "18:30") }.not_to change(TrainingClass, :count)

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(["2026-09-15"])
      expect(page_props["refusedEdit"]).to eq("new")
    end

    it "refuses a Class that would end after midnight" do
      group
      sign_in coach

      expect { add(group, date: "2026-09-12", start_time: "23:30") }.not_to change(TrainingClass, :count)

      follow_redirect!
      expect(page_props["errors"]["start_time"].map { |e| e["code"] }).to eq(["crosses_midnight"])
    end

    it "refuses a Module from another Course" do
      group
      other_course = create(:course_module, level: :intermediate, position: 1)
      sign_in coach

      expect { add(group, date: "2026-09-12", course_module: other_course) }.not_to change(TrainingClass, :count)

      follow_redirect!
      expect(page_props["errors"]["course_module"].map { |e| e["code"] }).to eq(["other_course"])
    end

    it "offers the Modules of the group's Course" do
      sign_in coach

      get "/dashboard/class_groups/#{group.id}"

      expect(page_props["moduleOptions"]).to eq([
        { "id" => serve.id, "number" => 1, "title" => "Serve" },
        { "id" => volley.id, "number" => 2, "title" => "Volley" }
      ])
    end

    it "lets a Club Manager of the Club add a Class, and 404s for another Coach" do
      group
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      sign_in manager

      expect { add(group, date: "2026-09-12") }.to change(TrainingClass, :count).by(1)

      sign_in create(:user, :coach, club: club)
      expect { add(group, date: "2026-09-19") }.not_to change(TrainingClass, :count)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "skipping a Class" do
    it "keeps the Class in the plan, shown as skipped, until it is unskipped" do
      first_class
      sign_in coach

      expect { patch "/dashboard/classes/#{first_class.id}/skip" }.not_to change(TrainingClass, :count)

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(plan_entry(first_class)).to include("skipped" => true, "date" => "2026-09-08")

      patch "/dashboard/classes/#{first_class.id}/unskip"
      follow_redirect!
      expect(plan_entry(first_class)).to include("skipped" => false)
    end

    it "frees the Class's time for the Coach's other groups" do
      sign_in coach
      patch "/dashboard/classes/#{first_class.id}/skip"

      post "/dashboard/class_groups", params: { class_group: {
        level: "beginner", starts_on: "2026-09-07", cadence: 1, weekdays: ["tuesday"],
        start_time: "18:00", duration: 60, player_ids: [create(:player, club: club).id]
      } }

      follow_redirect!
      # Both plans fall on the same twelve Tuesdays, but the first is skipped.
      expect(page_props["clashDates"].size).to eq(11)
      expect(page_props["clashDates"]).not_to include("2026-09-08")
    end

    it "refuses to unskip a Class whose time is now taken, and lists the clashing date" do
      sign_in coach
      patch "/dashboard/classes/#{first_class.id}/skip"
      # Meanwhile a Player's Wednesday group gained a Class on that Tuesday at 18:30.
      other = planned_group(coach: create(:user, :coach, club: club), players: [players.first], weekdays: ["wednesday"])
      other.training_classes.create!(date: Date.new(2026, 9, 8), start_time: "18:30", course_module: serve)

      patch "/dashboard/classes/#{first_class.id}/unskip"

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(first_class.reload).to be_skipped
      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(["2026-09-08"])
      expect(page_props["refusedEdit"]).to eq(first_class.id)
    end
  end

  describe "who can edit a plan" do
    def manager_of(club)
      create(:user, :club_manager).tap { |manager| create(:club_membership, user: manager, club: club) }
    end

    it "lets a Club Manager of the group's Club edit it" do
      sign_in manager_of(club)

      patch "/dashboard/classes/#{first_class.id}/done"

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(first_class.reload).to be_done
    end

    {
      "another Coach of the same Club" => -> { create(:user, :coach, club: club) },
      "a Club Manager of another Club" => -> { manager_of(create(:club)) },
      "an Admin" => -> { create(:user, :admin) }
    }.each do |who, user|
      it "404s for #{who}, whatever the edit, and changes nothing" do
        intruder = instance_exec(&user)
        before = first_class.reload.attributes
        edits = %w[done undone skip unskip].map { |edit| "/dashboard/classes/#{first_class.id}/#{edit}" }

        (edits + ["/dashboard/classes/#{first_class.id}"]).each do |path|
          # A 404 response does not keep the test sign-in, so sign in each time.
          sign_in intruder
          patch path, params: { training_class: { date: "2026-09-09", start_time: "10:00" } }

          expect(response).to have_http_status(:not_found)
        end
        sign_in intruder
        expect { post "/dashboard/class_groups/#{group.id}/classes", params: { training_class: { date: "2026-09-12" } } }
          .not_to change(TrainingClass, :count)
        expect(response).to have_http_status(:not_found)
        expect(first_class.reload.attributes).to eq(before)
      end
    end

    it "requires authentication" do
      patch "/dashboard/classes/#{first_class.id}/done"

      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
