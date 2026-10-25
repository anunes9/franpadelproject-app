require "rails_helper"

RSpec.describe "Editing a Class Group", type: :request do
  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:coach) { create(:user, :coach, club: club, name: "Fran") }
  let(:players) { create_list(:player, 2, club: club) }

  before do
    create(:course_module, level: :beginner, position: 1, title: "Serve")
    create(:course_module, level: :beginner, position: 2, title: "Volley")
  end

  # A group planned on Tuesdays at 18:00 for an hour, from 8 September 2026.
  def planned_group(coach: self.coach, players: self.players, weekdays: ["tuesday"], start_time: "18:00",
                    duration: 60)
    group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: Date.new(2026, 9, 7),
                           cadence: weekdays.size, weekdays: weekdays, start_time: start_time, duration: duration)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  let(:group) { planned_group }

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def edit_group(group = self.group, **params)
    patch "/dashboard/class_groups/#{group.id}", params: { class_group: params }, as: :json
  end

  describe "its Players" do
    it "removes a Player" do
      sign_in coach

      edit_group(player_ids: [players.first.id])

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(page_props["classGroup"]["players"].map { |p| p["id"] }).to eq([players.first.id])
    end

    it "adds Players up to eight, leaving the plan as it was" do
      sign_in coach
      plan = group.training_classes.map(&:plan_json)
      added = create_list(:player, 6, club: club)

      edit_group(player_ids: players.map(&:id) + added.map(&:id))

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.players.reload.size).to eq(8)
      expect(group.training_classes.reload.map(&:plan_json)).to eq(plan)
    end

    it "refuses a ninth Player and changes nothing" do
      sign_in coach

      expect { edit_group(player_ids: players.map(&:id) + create_list(:player, 7, club: club).map(&:id)) }
        .not_to(change { group.players.reload.to_a })

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}/edit")
      follow_redirect!
      expect(page_props["errors"]["players"].map { |e| e["code"] }).to eq(["too_many"])
    end

    it "refuses removing every Player" do
      sign_in coach

      expect { edit_group(player_ids: []) }.not_to(change { group.players.reload.to_a })

      follow_redirect!
      expect(page_props["errors"]["players"].map { |e| e["code"] }).to eq(["blank"])
    end

    it "refuses a Player who would be double-booked, lists the clashing dates and changes nothing" do
      busy = create(:player, club: club)
      # Another Coach's group with the Player on the first two of the group's Tuesdays only.
      other = planned_group(coach: create(:user, :coach, club: club), players: [busy], start_time: "18:30")
      other.training_classes.drop(2).each { |c| c.update!(skipped: true) }
      sign_in coach

      expect { edit_group(player_ids: players.map(&:id) + [busy.id]) }.not_to(change { group.players.reload.to_a })

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}/edit")
      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(%w[2026-09-08 2026-09-15])
    end

    it "lets a Player join whose other Classes do not overlap" do
      free = create(:player, club: club)
      planned_group(coach: create(:user, :coach, club: club), players: [free], start_time: "19:00")
      sign_in coach

      edit_group(player_ids: players.map(&:id) + [free.id])

      expect(group.players.reload).to include(free)
    end

    it "never refuses removing a Player" do
      sign_in coach

      edit_group(player_ids: [players.last.id])

      expect(group.players.reload).to eq([players.last])
    end
  end

  describe "the edit form" do
    it "shows the group with its Club roster and the schedule options" do
      players
      create(:player, name: "Someone Elsewhere")
      sign_in coach

      get "/dashboard/class_groups/#{group.id}/edit"

      expect(response.body).to include(%q("component":"ClassGroups/Form"))
      expect(page_props["classGroup"]).to include("id" => group.id, "cadence" => 1, "duration" => 60)
      expect(page_props["players"].map { |p| p["id"] }).to match_array(players.map(&:id))
      expect(page_props).to include("maxPlayers" => 8, "durationOptions" => [60, 90], "clashDates" => [])
    end

    it "does not change the group's Level or start date" do
      sign_in coach

      edit_group(level: "advanced", starts_on: "2027-01-04", start_time: "19:00")

      expect(group.reload).to have_attributes(level: "beginner", starts_on: Date.new(2026, 9, 7))
      expect(group.start_time_text).to eq("19:00")
    end
  end

  describe "who can edit" do
    let(:manager) { create(:user, :club_manager) }

    it "lets a Club Manager of the group's Club edit it" do
      create(:club_membership, user: manager, club: club)
      sign_in manager

      get "/dashboard/class_groups/#{group.id}/edit"
      expect(response).to have_http_status(200)
      expect(page_props["players"].map { |p| p["id"] }).to match_array(players.map(&:id))

      edit_group(player_ids: [players.first.id])
      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.players.reload).to eq([players.first])
    end

    {
      "another Coach of the same Club" => -> { create(:user, :coach, club: club) },
      "a Club Manager of another Club" => lambda {
        create(:user, :club_manager).tap { |m| create(:club_membership, user: m, club: create(:club)) }
      },
      "an Admin" => -> { create(:user, :admin) }
    }.each do |who, user|
      it "404s for #{who}" do
        someone = instance_exec(&user)
        sign_in someone
        get "/dashboard/class_groups/#{group.id}/edit"
        expect(response).to have_http_status(:not_found)

        # A 404 response does not keep the test sign-in, so sign in again.
        sign_in someone
        expect { edit_group(player_ids: [players.first.id]) }.not_to(change { group.players.reload.to_a })
        expect(response).to have_http_status(:not_found)
      end
    end

    it "requires authentication" do
      patch "/dashboard/class_groups/#{group.id}", params: { class_group: { player_ids: [players.first.id] } }

      expect(response).to redirect_to(new_user_session_path)
      expect(group.players.reload.size).to eq(2)
    end
  end

  describe "its schedule" do
    it "stores a new cadence, weekdays and start time without touching any Class" do
      sign_in coach
      plan = group.training_classes.map(&:plan_json)

      edit_group(cadence: 2, weekdays: %w[monday wednesday], start_time: "09:00")

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(page_props["classGroup"]).to include("cadence" => 2, "weekdays" => %w[monday wednesday],
                                                  "startTime" => "09:00", "duration" => 60)
      expect(page_props["classes"]).to eq(plan.map(&:deep_stringify_keys))
    end

    it "does not refuse a new start time that clashes, as the Classes keep theirs until the plan is regenerated" do
      planned_group(players: [create(:player, club: club)], weekdays: ["thursday"])
      sign_in coach

      edit_group(weekdays: ["thursday"], start_time: "18:00")

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.reload.weekdays).to eq(["thursday"])
    end

    it "refuses weekdays that do not match the cadence" do
      sign_in coach

      expect { edit_group(cadence: 2, weekdays: ["monday"]) }.not_to(change { group.reload.attributes })

      follow_redirect!
      expect(page_props["errors"]["weekdays"].map { |e| e["code"] }).to eq(["cadence_mismatch"])
    end

    it "refuses a start time whose Classes would cross midnight" do
      sign_in coach

      expect { edit_group(start_time: "23:30") }.not_to(change { group.reload.attributes })

      follow_redirect!
      expect(page_props["errors"]["start_time"].map { |e| e["code"] }).to eq(["crosses_midnight"])
    end
  end

  describe "its duration" do
    it "makes every Class take the new duration when nothing clashes" do
      planned_group(players: [create(:player, club: club)], start_time: "19:30")
      sign_in coach

      edit_group(duration: 90)

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.reload.duration).to eq(90)
      expect(group.training_classes.map(&:interval).uniq).to eq([ClassInterval.new(1080, 1170)])
    end

    it "refuses a duration that would overlap the Coach's other Classes, lists the clashing dates and changes nothing" do
      # Another group of the Coach starting when this one ends, on its first Tuesday only.
      other = planned_group(players: [create(:player, club: club)], start_time: "19:00")
      other.training_classes.drop(1).each { |c| c.update!(skipped: true) }
      sign_in coach

      expect { edit_group(duration: 90) }.not_to(change { group.reload.attributes })

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}/edit")
      follow_redirect!
      expect(page_props["errors"]["base"].map { |e| e["code"] }).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(["2026-09-08"])
    end

    it "ignores the group's skipped Classes" do
      other = planned_group(players: [create(:player, club: club)], start_time: "19:00")
      other.training_classes.drop(1).each { |c| c.update!(skipped: true) }
      group.training_classes.first.update!(skipped: true)
      sign_in coach

      edit_group(duration: 90)

      expect(group.reload.duration).to eq(90)
    end

    it "refuses a duration that would make a Class overlap another Class of the same group" do
      sign_in coach
      added = group.training_classes.build(date: Date.new(2026, 9, 8), start_time: "19:00",
                                           course_module: group.course_modules.first, kind: :regular)
      added.save_unless_clashing || raise("not added")

      expect { edit_group(duration: 90) }.not_to(change { group.reload.attributes })

      follow_redirect!
      expect(page_props["clashDates"]).to eq(["2026-09-08"])
    end

    it "refuses a duration that would make a moved Class cross midnight" do
      group.training_classes.first.update!(start_time: "23:00")
      sign_in coach

      expect { edit_group(duration: 90) }.not_to(change { group.reload.attributes })

      follow_redirect!
      expect(page_props["errors"]["duration"].map { |e| e["code"] }).to eq(["crosses_midnight"])
    end
  end
end
