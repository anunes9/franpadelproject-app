require "rails_helper"

RSpec.describe "Regenerating a Training Plan", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }
  let!(:volley) { create(:course_module, level: :beginner, position: 2, title: "Volley") }
  let!(:serve_drill) { create(:exercise, course_module: serve, ref: "S-1", title: "Serve drill") }
  let(:players) { create_list(:player, 2, club: club) }

  # Tuesdays at 18:00 for an hour, from Tuesday 8 September 2026: six Serve
  # Classes (8 Sep to 13 Oct), then six Volley Classes (20 Oct to 24 Nov).
  let(:group) { planned_group(coach: coach, players: players) }

  def planned_group(coach:, players:, weekdays: ["tuesday"], start_time: "18:00", level: "beginner")
    group = ClassGroup.new(coach: coach, players: players, level: level, starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: weekdays, start_time: start_time, duration: 60)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def regenerate(group)
    post "/dashboard/class_groups/#{group.id}/regeneration"
  end

  def plan_of(group)
    get "/dashboard/class_groups/#{group.id}"
    page_props["classes"]
  end

  def classes_of(group) = group.training_classes.reload.to_a

  def mark_done(*classes) = classes.each { |c| c.update!(done: true) }

  def weekly(from, count) = Array.new(count) { |i| (from + (i * 7)).iso8601 }

  describe "what it keeps and replaces" do
    it "keeps the done Classes with their Exercises, and replaces every other Class" do
      serve_classes = classes_of(group).first(6)
      mark_done(*serve_classes.first(2))
      serve_classes.first.pick_exercise(serve_drill)
      serve_classes.third.update!(skipped: true)
      serve_classes.fourth.update!(date: Date.new(2026, 9, 30))
      serve_classes.fifth.pick_exercise(serve_drill)
      group.training_classes.create!(date: Date.new(2026, 9, 26), start_time: "10:00", course_module: volley,
                                     coach_added: true)
      replaced = classes_of(group).reject(&:done).map(&:id)
      sign_in coach

      travel_to Date.new(2026, 9, 20) do
        regenerate(group)
      end

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      plan = plan_of(group)
      expect(plan.first(2).map { |c| c["id"] }).to eq(serve_classes.first(2).map(&:id))
      expect(plan.first["exercises"].map { |e| e["ref"] }).to eq(["S-1"])
      expect(plan.map { |c| c["id"] } & replaced).to be_empty
      expect(plan.drop(2)).to all(include("done" => false, "skipped" => false, "coachAdded" => false,
                                          "exercises" => []))
      expect(TrainingClassExercise.where(training_class_id: replaced)).to be_empty
    end
  end

  describe "continuing the Course" do
    it "continues from the first incomplete Module with only its remaining Classes" do
      mark_done(*classes_of(group).first(8)) # all of Serve, and Volley on 20 and 27 Oct
      sign_in coach

      travel_to(Date.new(2026, 11, 4)) { regenerate(group) }

      plan = plan_of(group)
      expect(plan.size).to eq(12)
      generated = plan.drop(8)
      expect(generated.map { |c| c["date"] }).to eq(weekly(Date.new(2026, 11, 10), 4))
      expect(generated.map { |c| c["module"]["title"] }.uniq).to eq(["Volley"])
      expect(generated.map { |c| c["kind"] }).to eq(%w[regular regular regular assessment])
    end

    it "counts the remaining Classes from the group's current duration" do
      mark_done(*classes_of(group).first(8)) # all of Serve, and Volley on 20 and 27 Oct
      group.update!(duration: 90) # 90-minute Classes: 4 weeks per Module
      sign_in coach

      travel_to(Date.new(2026, 11, 4)) { regenerate(group) }

      generated = plan_of(group).drop(8)
      expect(generated.map { |c| c["date"] }).to eq(weekly(Date.new(2026, 11, 10), 2))
      expect(generated.map { |c| c["kind"] }).to eq(%w[regular assessment])
    end

    it "starts after the last done Class when that is later than today" do
      done = classes_of(group).first(8)
      mark_done(*done)
      done.last.update!(date: Date.new(2026, 11, 5)) # a done Class moved to a Thursday
      sign_in coach

      travel_to(Date.new(2026, 10, 25)) { regenerate(group) }

      generated = plan_of(group).drop(8)
      expect(generated.map { |c| c["date"] }).to eq(weekly(Date.new(2026, 11, 10), 4))
    end

    it "generates the later Modules in full when the Module in progress has none done" do
      mark_done(*classes_of(group).first(6)) # all of Serve
      sign_in coach

      travel_to(Date.new(2026, 10, 21)) { regenerate(group) }

      generated = plan_of(group).drop(6)
      expect(generated.map { |c| c["date"] }).to eq(weekly(Date.new(2026, 10, 27), 6))
      expect(generated.map { |c| c["module"]["title"] }.uniq).to eq(["Volley"])
      expect(generated.map { |c| c["kind"] }).to eq(%w[regular] * 5 + %w[assessment])
    end

    it "starts no earlier than today, on the first of the group's weekdays" do
      sign_in coach

      travel_to(Date.new(2026, 10, 1)) { regenerate(group) }

      plan = plan_of(group)
      expect(plan.map { |c| c["date"] }).to eq(weekly(Date.new(2026, 10, 6), 12))
      expect(plan.first(6).map { |c| c["module"]["title"] }.uniq).to eq(["Serve"])
      expect(plan.map { |c| c["kind"] }.count("assessment")).to eq(2)
    end

    it "decides today in Lisbon, not in UTC" do
      sign_in coach

      # 23:30 UTC on Tuesday 29 September is already Wednesday 30 September in
      # Lisbon (summer time), so no Class falls on the 29th.
      travel_to(Time.utc(2026, 9, 29, 23, 30)) { regenerate(group) }

      expect(plan_of(group).first["date"]).to eq("2026-10-06")
    end

    it "uses the group's current schedule and the Club's current Break Periods" do
      mark_done(*classes_of(group).first(2)) # 8 and 15 Sep
      group.update!(weekdays: ["thursday"], start_time: "19:00")
      create(:break_period, club: club, starts_on: Date.new(2026, 10, 5), ends_on: Date.new(2026, 10, 11))
      sign_in coach

      travel_to(Date.new(2026, 9, 16)) { regenerate(group) }

      generated = plan_of(group).drop(2)
      expect(generated.first(4).map { |c| c["date"] }).to eq(%w[2026-09-17 2026-09-24 2026-10-01 2026-10-15])
      expect(generated.fourth).to include("kind" => "assessment")
      expect(generated.map { |c| c["startTime"] }.uniq).to eq(["19:00"])
      expect(generated.size).to eq(4 + 6)
    end
  end

  describe "refusals" do
    def refusal_codes(field)
      page_props["errors"][field].map { |e| e["code"] }
    end

    it "refuses a plan whose Modules are all complete, and changes nothing" do
      mark_done(*classes_of(group))
      before = classes_of(group).map(&:attributes)
      sign_in coach

      travel_to(Date.new(2026, 12, 1)) { regenerate(group) }

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(classes_of(group).map(&:attributes)).to eq(before)
      follow_redirect!
      expect(refusal_codes("base")).to eq(["plan_complete"])
      expect(page_props["refusedEdit"]).to eq("regeneration")
      expect(page_props["regenerationEdit"]).to eq("regeneration")
    end

    it "refuses a Course with no Modules" do
      unplanned = ClassGroup.create!(coach: coach, players: players, level: "intermediate",
                                     starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: ["tuesday"],
                                     start_time: "18:00", duration: 60)
      sign_in coach

      regenerate(unplanned)

      follow_redirect!
      expect(refusal_codes("level")).to eq(["no_modules"])
      expect(unplanned.training_classes.reload).to be_empty
    end

    it "refuses a group that is no longer valid, such as one with a Player who has left the Club" do
      before = classes_of(group).map(&:attributes)
      players.first.update!(club: create(:club))
      sign_in coach

      travel_to(Date.new(2026, 9, 20)) { regenerate(group) }

      expect(classes_of(group).map(&:attributes)).to eq(before)
      follow_redirect!
      expect(refusal_codes("players")).to eq(["other_club"])
      expect(page_props["clashDates"]).to eq([])
      expect(page_props["refusedEdit"]).to eq("regeneration")
    end

    it "refuses a plan that would clash with another group, lists the dates and changes nothing" do
      group.update!(weekdays: ["thursday"])
      planned_group(coach: create(:user, :coach, club: club), players: [players.last], weekdays: ["thursday"],
                    start_time: "18:30")
      before = classes_of(group).map(&:attributes)
      sign_in coach

      travel_to(Date.new(2026, 9, 20)) { regenerate(group) }

      expect(classes_of(group).map(&:attributes)).to eq(before)
      follow_redirect!
      expect(refusal_codes("base")).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(weekly(Date.new(2026, 9, 24), 10))
      expect(page_props["refusedEdit"]).to eq("regeneration")
    end
  end

  describe "only on request" do
    it "is not triggered by visiting the page, editing a Class or changing the schedule" do
      original = classes_of(group).map(&:id)
      sign_in coach

      get "/dashboard/class_groups/#{group.id}"
      patch "/dashboard/classes/#{original.first}/skip"
      patch "/dashboard/classes/#{original.second}/done"
      group.update!(weekdays: ["friday"])
      get "/dashboard/class_groups/#{group.id}"

      expect(classes_of(group).map(&:id)).to eq(original)
      expect(classes_of(group).map(&:date).map(&:cwday).uniq).to eq([2])
    end
  end

  describe "who can regenerate" do
    def manager_of(club)
      create(:user, :club_manager).tap { |manager| create(:club_membership, user: manager, club: club) }
    end

    it "lets a Club Manager of the group's Club regenerate it" do
      original = classes_of(group).map(&:id)
      sign_in manager_of(club)

      travel_to(Date.new(2026, 9, 20)) { regenerate(group) }

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(classes_of(group).map(&:id) & original).to be_empty
    end

    {
      "another Coach of the same Club" => -> { create(:user, :coach, club: club) },
      "a Club Manager of another Club" => -> { manager_of(create(:club)) },
      "an Admin" => -> { create(:user, :admin) }
    }.each do |who, user|
      it "404s for #{who} and changes nothing" do
        before = classes_of(group).map(&:attributes)
        sign_in instance_exec(&user)

        regenerate(group)

        expect(response).to have_http_status(:not_found)
        expect(classes_of(group).map(&:attributes)).to eq(before)
      end
    end

    it "requires authentication" do
      regenerate(group)

      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
