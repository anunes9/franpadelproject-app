require "rails_helper"

# A finished Class Group stays as history, and its Coach can start the next
# Level's group from it; see docs/adr/0007-finished-class-groups.md.
RSpec.describe "Finished Class Groups", type: :request do
  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:coach) { create(:user, :coach, club: club, name: "Fran") }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }
  let(:players) { create_list(:player, 2, club: club) }
  let(:manager) { create(:user, :club_manager).tap { |m| create(:club_membership, user: m, club: club) } }

  # Tuesdays at 18:00 from 8 September 2026: six Classes of one Module.
  def planned_group(coach: self.coach, players: self.players, level: "beginner", weekdays: ["tuesday"])
    group = ClassGroup.new(coach: coach, players: players, level: level, starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: weekdays, start_time: "18:00", duration: 60)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  def finish(group)
    group.training_classes.each { |c| c.update!(done: true) }
    group
  end

  let(:finished_group) { finish(planned_group) }

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  describe "a finished group's history" do
    it "stays fully viewable with its plan, done Classes and their Exercises, marked finished" do
      first_class = finished_group.training_classes.first
      first_class.pick_exercise(create(:exercise, course_module: serve, title: "Lob"))
      sign_in coach

      get "/dashboard/class_groups/#{finished_group.id}"

      expect(response).to have_http_status(200)
      expect(page_props["classGroup"]).to include("id" => finished_group.id, "finished" => true)
      expect(page_props["classes"].size).to eq(6)
      expect(page_props["classes"]).to all(include("done" => true))
      expect(page_props["classes"].first["exercises"]).to eq([{ "ref" => first_class.exercises.first.ref, "title" => "Lob" }])
    end

    it "is not locked: marking a Class undone makes the group unfinished again" do
      sign_in coach

      patch "/dashboard/classes/#{finished_group.training_classes.last.id}/undone"
      follow_redirect!

      expect(page_props["classGroup"]["finished"]).to be(false)
      expect(page_props["nextLevel"]).to be_nil
    end

    it "is viewable by a Club Manager of the Club, marked finished" do
      sign_in manager

      get "/dashboard/class_groups/#{finished_group.id}"

      expect(response).to have_http_status(200)
      expect(page_props["classGroup"]["finished"]).to be(true)
    end

    it "is not finished while Classes are left to teach" do
      sign_in coach

      get "/dashboard/class_groups/#{planned_group.id}"

      expect(page_props["classGroup"]["finished"]).to be(false)
    end
  end

  describe "the Coach's Class Groups list" do
    it "splits current groups from finished ones, kept as history" do
      current = planned_group(players: create_list(:player, 1, club: club), weekdays: ["thursday"])
      finished_group
      sign_in coach

      get "/dashboard/class_groups"

      expect(page_props["classGroups"].map { |g| g["id"] }).to eq([current.id])
      expect(page_props["finishedGroups"].map { |g| g["id"] }).to eq([finished_group.id])
      expect(page_props["finishedGroups"].first).to include("finished" => true)
    end
  end

  describe "the Club overview" do
    it "marks the finished groups for the Club Manager" do
      current = planned_group(players: create_list(:player, 1, club: club), weekdays: ["thursday"])
      finished_group
      sign_in manager

      get "/dashboard/clubs/#{club.id}"

      finished = page_props["classGroups"].to_h { |g| [g["id"], g["finished"]] }
      expect(finished).to eq(current.id => false, finished_group.id => true)
    end
  end

  describe "the copy action on a finished group's page" do
    it "offers its owning Coach the next Level" do
      sign_in coach

      get "/dashboard/class_groups/#{finished_group.id}"

      expect(page_props["nextLevel"]).to eq("intermediate")
    end

    it "is not offered to a Club Manager, who does not create groups" do
      sign_in manager

      get "/dashboard/class_groups/#{finished_group.id}"

      expect(page_props["nextLevel"]).to be_nil
    end

    it "is not offered for an Advanced group, which has no next Level" do
      create(:course_module, level: :advanced, position: 1)
      advanced = finish(planned_group(level: "advanced", weekdays: ["thursday"]))
      sign_in coach

      get "/dashboard/class_groups/#{advanced.id}"

      expect(page_props["nextLevel"]).to be_nil
    end
  end

  describe "starting the next Level's group" do
    def start_copy(group)
      get "/dashboard/class_groups/new", params: { from: group.id }
    end

    it "opens the create form pre-filled with the next Level and the finished group's Players" do
      sign_in coach

      start_copy(finished_group)

      expect(response).to have_http_status(200)
      expect(response.body).to include(%q("component":"ClassGroups/Form"))
      expect(page_props["copy"]).to eq(
        "from" => { "id" => finished_group.id, "level" => "beginner" },
        "level" => "intermediate",
        "playerIds" => players.sort_by(&:name).map(&:id)
      )
    end

    it "pre-fills only the Players still in the Coach's Club" do
      finished_group
      players.first.update!(club: create(:club))
      sign_in coach

      start_copy(finished_group)

      expect(page_props["copy"]["playerIds"]).to eq([players.last.id])
    end

    it "404s for a group that is not finished" do
      sign_in coach

      start_copy(planned_group)

      expect(response).to have_http_status(:not_found)
    end

    it "404s for an Advanced group" do
      create(:course_module, level: :advanced, position: 1)
      advanced = finish(planned_group(level: "advanced", weekdays: ["thursday"]))
      sign_in coach

      start_copy(advanced)

      expect(response).to have_http_status(:not_found)
    end

    it "404s for another Coach's group, even in the same Club" do
      sign_in create(:user, :coach, club: club)

      start_copy(finished_group)

      expect(response).to have_http_status(:not_found)
    end

    it "404s for a Club Manager of the Club" do
      sign_in manager

      start_copy(finished_group)

      expect(response).to have_http_status(:not_found)
    end

    it "404s for an Admin" do
      sign_in create(:user, :admin)

      start_copy(finished_group)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "creating the next Level's group" do
    # Starts on Monday 7 June 2027, with Classes on Tuesdays.
    let(:copy_params) do
      {
        level: "intermediate", starts_on: "2027-06-07", cadence: 1, weekdays: ["tuesday"],
        start_time: "18:00", duration: 60, player_ids: players.map(&:id),
        previous_class_group_id: finished_group.id
      }
    end

    before { finished_group }

    def create_group(params = copy_params)
      post "/dashboard/class_groups", params: { class_group: params }
    end

    it "creates it through normal creation, linked to the group it continues" do
      create(:course_module, level: :intermediate, position: 1, title: "Bandeja")
      sign_in coach

      expect { create_group }.to change(ClassGroup, :count).by(1)

      group = ClassGroup.order(:created_at).last
      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(page_props["classGroup"]).to include("level" => "intermediate", "finished" => false)
      expect(page_props["classGroup"]["previousGroup"]).to eq("id" => finished_group.id, "level" => "beginner")
      expect(page_props["classes"].first["module"]).to include("title" => "Bandeja")
    end

    it "is refused while the next Level's Course has no Modules" do
      sign_in coach

      expect { create_group }.not_to change(ClassGroup, :count)

      expect(response).to redirect_to("/dashboard/class_groups/new?from=#{finished_group.id}")
      follow_redirect!
      expect(page_props["errors"]["level"].map { |e| e["code"] }).to eq(["no_modules"])
      expect(page_props["copy"]["from"]["id"]).to eq(finished_group.id)
    end

    it "is refused when its Classes would clash, listing the clashing dates" do
      create(:course_module, level: :intermediate, position: 1)
      other = create(:user, :coach, club: club)
      ClassGroup.new(coach: other, players: [players.first], level: "beginner", starts_on: Date.new(2027, 6, 7),
                     cadence: 1, weekdays: ["tuesday"], start_time: "18:30", duration: 60).create_with_plan ||
        raise("refused")
      sign_in coach

      expect { create_group }.not_to change(ClassGroup, :count)

      follow_redirect!
      expect(page_props["clashDates"].first).to eq("2027-06-08")
    end

    it "404s when the group it continues is not visible to the Coach" do
      create(:course_module, level: :intermediate, position: 1)
      sign_in create(:user, :coach, club: club)

      expect { create_group(copy_params.merge(player_ids: [create(:player, club: club).id])) }
        .not_to change(ClassGroup, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "shows no link once the group it continues is no longer visible" do
      create(:course_module, level: :intermediate, position: 1)
      sign_in coach
      create_group
      group = ClassGroup.order(:created_at).last
      finished_group.update_columns(coach_id: create(:user, :coach, club: club).id)

      get "/dashboard/class_groups/#{group.id}"

      expect(page_props["classGroup"]["previousGroup"]).to be_nil
    end
  end
end
