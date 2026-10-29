require "rails_helper"

# The Coach's home: today's Classes and their current Class Groups, above
# their own Course progress.
RSpec.describe "Coach home", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }

  # Weekly from Monday 7 September 2026: Tuesday 8 September is its first
  # Tuesday, Thursday 10 September its first Thursday.
  def planned_group(coach: self.coach, players: create_list(:player, 2, club: coach.club), weekdays: ["tuesday"],
                    start_time: "18:00", duration: 60)
    group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: weekdays, start_time: start_time, duration: duration)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def class_on(group, date = Date.new(2026, 9, 8))
    group.training_classes.find_by!(date: date)
  end

  describe "today's Classes" do
    it "lists today's Classes of the Coach's groups by start time, without skipped or other days' Classes" do
      evening = planned_group(start_time: "18:00", duration: 90)
      morning = planned_group(start_time: "10:00", players: create_list(:player, 3, club: club))
      skipped = planned_group(start_time: "14:00")
      class_on(skipped).update!(skipped: true)
      planned_group(weekdays: ["thursday"], start_time: "12:00")
      sign_in coach

      travel_to Time.utc(2026, 9, 8, 9) do
        get "/dashboard"
      end

      expect(page_props["todayClasses"]).to eq([
        { "id" => class_on(morning).id, "startTime" => "10:00", "duration" => 60, "kind" => "regular",
          "done" => false, "module" => { "slug" => serve.slug, "number" => 1, "title" => "Serve" },
          "group" => { "id" => morning.id, "name" => nil, "level" => "beginner", "playerCount" => 3 } },
        { "id" => class_on(evening).id, "startTime" => "18:00", "duration" => 90, "kind" => "regular",
          "done" => false, "module" => { "slug" => serve.slug, "number" => 1, "title" => "Serve" },
          "group" => { "id" => evening.id, "name" => nil, "level" => "beginner", "playerCount" => 2 } }
      ])
    end

    it "never shows another Coach's Classes of the same day, even of the same Club" do
      other_coach = create(:user, :coach, club: club)
      planned_group(coach: other_coach)
      own = planned_group(start_time: "10:00")
      sign_in coach

      travel_to(Time.utc(2026, 9, 8, 9)) { get "/dashboard" }

      expect(page_props["todayClasses"].pluck("id")).to eq([class_on(own).id])
    end

    it "takes today as the date in Lisbon, an hour ahead of UTC in September" do
      group = planned_group
      sign_in coach

      # 23:30 UTC on Monday 7 September is 00:30 on Tuesday 8 in Lisbon.
      travel_to(Time.utc(2026, 9, 7, 23, 30)) { get "/dashboard" }

      expect(page_props["todayClasses"].pluck("id")).to eq([class_on(group).id])
    end

    it "marks a done Assessment Class as such" do
      group = planned_group
      assessment = group.training_classes.assessment.first
      assessment.update!(done: true)
      sign_in coach

      travel_to(Time.utc(assessment.date.year, assessment.date.month, assessment.date.day, 9)) { get "/dashboard" }

      expect(page_props["todayClasses"]).to contain_exactly(include("id" => assessment.id, "kind" => "assessment",
                                                                    "done" => true))
    end

    it "is empty on a day without Classes" do
      planned_group
      sign_in coach

      travel_to(Time.utc(2026, 9, 9, 9)) { get "/dashboard" }

      expect(page_props["todayClasses"]).to eq([])
    end
  end

  describe "my groups" do
    it "lists only the Coach's current groups, leaving finished and other Coaches' groups out" do
      current = planned_group(weekdays: ["thursday"])
      planned_group.training_classes.each { |c| c.update!(done: true) }
      planned_group(coach: create(:user, :coach, club: club), start_time: "10:00")
      sign_in coach

      get "/dashboard"

      expect(page_props["classGroups"]).to contain_exactly(
        include("id" => current.id, "level" => "beginner", "weekdays" => ["thursday"], "startTime" => "18:00",
                "duration" => 60, "playerCount" => 2, "finished" => false)
      )
    end

    it "is empty, like today's Classes, for a Coach without groups" do
      sign_in coach

      get "/dashboard"

      expect(page_props).to include("todayClasses" => [], "classGroups" => [])
    end
  end

  it "loads today's Classes and the groups without a query per Class or group" do
    sign_in coach
    planned_group(start_time: "08:00")
    planned_group(start_time: "10:00")
    # The first request loads the signed-in Coach from the session afresh.
    get "/dashboard"
    queries_for_two = travel_to(Time.utc(2026, 9, 8, 9)) { count_queries { get "/dashboard" } }
    planned_group(start_time: "14:00")
    planned_group(start_time: "18:00")

    queries_for_four = travel_to(Time.utc(2026, 9, 8, 9)) { count_queries { get "/dashboard" } }

    expect(page_props["todayClasses"].size).to eq(4)
    expect(page_props["classGroups"].size).to eq(4)
    expect(queries_for_four).to eq(queries_for_two)
  end

  it "works out the Coach's Module states once for both the stats and the Modules list" do
    create(:exercise, course_module: serve)
    sign_in coach
    get "/dashboard"

    # Working out the states counts each Module's Exercise Completions, once.
    state_queries = count_queries(matching: /FROM "exercise_completions" INNER JOIN "exercises"/) { get "/dashboard" }

    expect(page_props).to include("courseStats" => be_present, "modules" => [include("title" => "Serve")])
    expect(state_queries).to eq(1)
  end

  # The SQL queries run by the block, cached ones included; with `matching`,
  # only those whose SQL matches it.
  def count_queries(matching: nil, &)
    count = 0
    counter = lambda do |*, payload|
      next if payload[:name].in?(%w[SCHEMA TRANSACTION])

      count += 1 if matching.nil? || payload[:sql].match?(matching)
    end
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &)
    count
  end

  it "keeps the Courses, Modules and Exercises library reachable for the Coach" do
    create(:exercise, ref: "EX-1", course_module: serve)
    sign_in coach

    get "/dashboard"

    # The nav (AppShell) shows the library to every signed-in role.
    expect(page_props).to include("current_user" => include("role" => "coach"), "dashboardUser" => be_present)
    expect(page_props).to include("modules" => [include("title" => "Serve")], "courseStats" => be_present)
    %W[/dashboard/courses /dashboard/courses/#{serve.slug} /dashboard/exercises /dashboard/exercises/EX-1].each do |path|
      get path
      expect(response).to have_http_status(200), path
    end
  end

  describe "a Club Manager" do
    let(:manager) { create(:user, :club_manager) }

    it "is still sent to the overview of their Club" do
      create(:club_membership, user: manager, club: club)
      sign_in manager

      get "/dashboard"

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}")
    end

    it "without a Club gets the empty Manager home, without a Coach's Classes or groups" do
      sign_in manager

      get "/dashboard"

      expect(response.body).to include('"component":"Clubs/Show"')
      expect(page_props).not_to include("todayClasses")
    end
  end
end
