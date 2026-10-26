require "rails_helper"

# A Club Manager reassigns a Class Group to another Coach of the group's Club
# (docs/adr/0006-manager-oversight.md).
RSpec.describe "Reassigning a Class Group", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:coach) { create(:user, :coach, club: club, name: "Fran") }
  let(:new_coach) { create(:user, :coach, club: club, name: "Rita") }
  let(:manager) { create(:user, :club_manager).tap { |m| create(:club_membership, user: m, club: club) } }

  # Before the group's first Class, unless a test says otherwise.
  before { travel_to(Time.utc(2026, 9, 1, 12)) }

  before do
    create(:course_module, level: :beginner, position: 1, title: "Serve")
    create(:course_module, level: :beginner, position: 2, title: "Volley")
  end

  # A group planned on Tuesdays at 18:00 for an hour, from 8 September 2026.
  def planned_group(coach: self.coach, start_time: "18:00")
    group = ClassGroup.new(coach: coach, players: create_list(:player, 2, club: coach.club), level: "beginner",
                           starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: ["tuesday"],
                           start_time: start_time, duration: 60)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  let(:group) { planned_group }

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def reassign(coach_id, group: self.group)
    patch "/dashboard/class_groups/#{group.id}/reassignment", params: { coach_id: coach_id }, as: :json
  end

  def error_codes(field)
    page_props["errors"][field].map { |e| e["code"] }
  end

  it "lets a Club Manager reassign a group to another Coach of the Club, keeping its plan" do
    plan = group.training_classes.map(&:plan_json)
    sign_in manager

    reassign(new_coach.id)

    expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
    expect(group.reload.coach).to eq(new_coach)
    expect(group.training_classes.reload.map(&:plan_json)).to eq(plan)
    follow_redirect!
    expect(page_props["classGroup"]["coach"]).to eq("Rita")
  end

  it "shows a Club Manager the Club's other Coaches to reassign to, on the group's page" do
    new_coach
    other = create(:user, :coach, club: club, name: "Ana")
    create(:user, :coach) # of another Club
    create(:user, :coach, club: club, name: "Bea", removed_at: 1.day.ago)
    sign_in manager

    get "/dashboard/class_groups/#{group.id}"

    expect(page_props["coachOptions"]).to eq([{ "id" => other.id, "name" => "Ana" },
                                              { "id" => new_coach.id, "name" => "Rita" }])
  end

  it "shows a Coach no Coaches to reassign to" do
    sign_in coach

    get "/dashboard/class_groups/#{group.id}"

    expect(page_props["coachOptions"]).to eq([])
  end

  describe "refusals, which change nothing" do
    before { sign_in manager }

    it "refuses a Coach of another Club" do
      reassign(create(:user, :coach).id)

      expect(group.reload.coach).to eq(coach)
      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      follow_redirect!
      expect(error_codes("coach")).to eq(["other_club"])
      expect(page_props["refusedEdit"]).to eq("reassignment")
    end

    it "refuses a removed Coach of the Club" do
      new_coach.remove!

      reassign(new_coach.id)

      expect(group.reload.coach).to eq(coach)
      follow_redirect!
      expect(error_codes("coach")).to eq(["removed"])
    end

    # A Coach removed between the first check and the lock: the check under
    # the lock sees it.
    it "refuses a Coach removed while the reassignment waits for its lock" do
      allow(ClassClash).to receive(:lock).and_wrap_original do |original, **args|
        args[:coach].class.where(id: args[:coach].id).update_all(removed_at: Time.current)
        original.call(**args)
      end

      reassign(new_coach.id)

      expect(group.reload.coach).to eq(coach)
      follow_redirect!
      expect(error_codes("coach")).to eq(["removed"])
    end

    it "refuses someone who is not a Coach" do
      reassign(manager.id)

      expect(group.reload.coach).to eq(coach)
      follow_redirect!
      expect(error_codes("coach")).to eq(["not_a_coach"])
    end

    it "refuses a missing Coach" do
      reassign(SecureRandom.uuid)

      expect(group.reload.coach).to eq(coach)
      follow_redirect!
      expect(error_codes("coach")).to eq(["blank"])
    end

    it "refuses a Coach who would be double-booked, with the clashing dates" do
      # The new Coach teaches at 18:30 on the group's first two Tuesdays only.
      planned_group(coach: new_coach, start_time: "18:30").training_classes.drop(2).each do |c|
        c.update!(skipped: true)
      end
      group

      expect { reassign(new_coach.id) }.not_to(change { group.reload.coach })

      follow_redirect!
      expect(error_codes("base")).to eq(["clash"])
      expect(page_props["clashDates"]).to eq(%w[2026-09-08 2026-09-15])
    end

    it "checks only the group's Classes from today on that are neither done nor skipped" do
      planned_group(coach: new_coach, start_time: "18:30").training_classes.drop(3).each do |c|
        c.update!(skipped: true)
      end # 8, 15 and 22 Sep only
      group.training_classes.second.update!(done: true) # 15 Sep
      group.training_classes.third.update!(skipped: true) # 22 Sep

      travel_to(Time.utc(2026, 9, 10, 12))
      reassign(new_coach.id)

      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.reload.coach).to eq(new_coach)
    end
  end

  describe "who can reassign" do
    {
      "the group's Coach" => -> { coach },
      "another Coach of the Club" => -> { new_coach },
      "a Club Manager of another Club" => lambda {
        create(:user, :club_manager).tap { |m| create(:club_membership, user: m, club: create(:club)) }
      },
      "an Admin" => -> { create(:user, :admin) }
    }.each do |who, user|
      it "404s for #{who}" do
        target = new_coach
        sign_in instance_exec(&user)

        expect { reassign(target.id) }.not_to(change { group.reload.coach })
        expect(response).to have_http_status(:not_found)
      end
    end

    it "requires authentication" do
      patch "/dashboard/class_groups/#{group.id}/reassignment", params: { coach_id: new_coach.id }

      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
