require "rails_helper"

RSpec.describe "Evaluating Players in an Assessment Class", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve", strokes: %w[serve return]) }
  let(:ana) { create(:player, club: club, name: "Ana") }
  let(:bia) { create(:player, club: club, name: "Bia") }

  # Tuesdays at 18:00, from Tuesday 8 September 2026: 6 Classes, the last
  # (13 October) the Assessment Class.
  let(:group) { planned_group(coach: coach, players: [ana, bia]) }
  let(:assessment) { group.training_classes.find(&:assessment?) }
  let(:regular) { group.training_classes.first }
  let(:assessment_day) { Date.new(2026, 10, 13) }

  def planned_group(coach:, players:)
    group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: ["tuesday"], start_time: "18:00", duration: 60)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])
  end

  def form_path(training_class, player) = "/dashboard/classes/#{training_class.id}/evaluations/#{player.id}"

  def record(training_class, player, ratings: [], comment: nil, next_player: nil)
    put form_path(training_class, player), params: {
      evaluation: { comment: comment, ratings: ratings }, next_player_id: next_player&.id
    }
  end

  def area(key, value, comment = nil) = { kind: "area", key: key, value: value, comment: comment }
  def stroke(key, value, comment = nil) = { kind: "stroke", key: key, value: value, comment: comment }

  def errors_after_redirect
    follow_redirect!
    page_props["props"]["errors"]
  end

  around { |example| travel_to(assessment_day.in_time_zone("Europe/Lisbon").change(hour: 19)) { example.run } }

  it "records a Player's Ratings and comments, and marks the Assessment Class done" do
    sign_in coach

    record(assessment, ana, comment: "Good Module", ratings: [area("technique", 4, "Clean swing"), stroke("serve", 2)])

    expect(response).to redirect_to("/dashboard/classes/#{assessment.id}#evaluations")
    evaluation = assessment.evaluations.find_by!(player: ana)
    expect(evaluation).to have_attributes(comment: "Good Module", coach: coach)
    expect(evaluation.ratings.map { |r| [r.item_kind, r.item_key, r.value, r.comment] })
      .to contain_exactly(["area", "technique", 4, "Clean swing"], ["stroke", "serve", 2, nil])
    expect(assessment.reload).to be_done
  end

  it "saves the whole Evaluation as sent, so a left-out item is unrated" do
    sign_in coach
    record(assessment, ana, ratings: [area("technique", 4), area("mental", 3)])

    record(assessment, ana, ratings: [area("technique", 5), area("mental", "")])

    expect(assessment.evaluations.find_by!(player: ana).ratings.pluck(:item_key, :value)).to eq([["technique", 5]])
  end

  it "removes an Evaluation left with no Rating and no comment" do
    sign_in coach
    record(assessment, ana, ratings: [area("technique", 4)])

    record(assessment, ana, ratings: [])

    expect(assessment.evaluations).to be_empty
  end

  it "goes on to the next Player when asked" do
    sign_in coach

    record(assessment, ana, ratings: [area("technique", 4)], next_player: bia)

    expect(response).to redirect_to(form_path(assessment, bia))
  end

  it "shows the form with the Module's Strokes, the Evaluation so far and the Ratings from earlier Classes" do
    sign_in coach
    record(assessment, ana, ratings: [area("technique", 3), stroke("bandeja", 4)])

    get form_path(assessment, ana)

    page = page_props
    expect(page["component"]).to eq("Evaluations/Edit")
    props = page["props"]
    expect(props["trainingClass"]["module"]).to include("strokes" => %w[serve return])
    expect(props["evaluation"]["ratings"]).to include(include("kind" => "stroke", "key" => "bandeja", "value" => 4))
    expect(props["roster"]).to eq([
      { "id" => ana.id, "name" => "Ana", "status" => "partial" },
      { "id" => bia.id, "name" => "Bia", "status" => "none" }
    ])
    expect(props["previousRatings"]).to eq({})
  end

  it "counts a Player evaluated once every Profile Area and every Module Stroke is rated" do
    sign_in coach
    ratings = ProfileArea::KEYS.map { |key| area(key, 3) } + [stroke("serve", 3), stroke("return", 3)]

    record(assessment, ana, ratings: ratings)
    get "/dashboard/classes/#{assessment.id}"

    expect(page_props["props"]["evaluations"]).to include(
      "refusal" => nil, "canRecord" => true,
      "players" => [{ "id" => ana.id, "name" => "Ana", "status" => "evaluated" },
                    { "id" => bia.id, "name" => "Bia", "status" => "none" }]
    )
  end

  it "shows no Evaluations on a regular Class" do
    sign_in coach

    get "/dashboard/classes/#{regular.id}"

    expect(page_props["props"]["evaluations"]).to be_nil
  end

  describe "refusals" do
    before { sign_in coach }

    it "refuses a regular Class" do
      record(regular, ana, ratings: [area("technique", 4)])

      expect(errors_after_redirect["base"]).to include(include("code" => "not_assessment"))
      expect(regular.evaluations).to be_empty
    end

    it "refuses before the Class's date, and the form sends the Coach back to the Class" do
      travel(-1.day)

      record(assessment, ana, ratings: [area("technique", 4)])
      expect(errors_after_redirect["base"]).to include(include("code" => "not_yet"))
      expect(Evaluation.count).to eq(0)

      get form_path(assessment, ana)
      expect(response).to redirect_to("/dashboard/classes/#{assessment.id}")
    end

    it "refuses a skipped Class" do
      assessment.update!(skipped: true)

      record(assessment, ana, ratings: [area("technique", 4)])

      expect(errors_after_redirect["base"]).to include(include("code" => "skipped"))
    end

    it "refuses a Player outside the group" do
      outsider = create(:player, club: club)

      record(assessment, outsider, ratings: [area("technique", 4)])

      expect(Evaluation.count).to eq(0)
    end

    it "refuses an unknown item or a value outside 1 to 5, changing nothing" do
      record(assessment, ana, ratings: [area("technique", 4)])

      record(assessment, ana, ratings: [area("technique", 2), stroke("tweener", 3)])
      record(assessment, ana, ratings: [area("technique", 6)])

      expect(assessment.evaluations.find_by!(player: ana).ratings.pluck(:item_key, :value)).to eq([["technique", 4]])
    end
  end

  describe "the Assessment Class while it has Evaluations" do
    before do
      sign_in coach
      record(assessment, ana, ratings: [area("technique", 4)])
    end

    it "cannot be marked undone or skipped" do
      patch "/dashboard/classes/#{assessment.id}/undone"
      expect(errors_after_redirect["done"]).to include(include("code" => "evaluated"))

      patch "/dashboard/classes/#{assessment.id}/skip"
      expect(assessment.reload).to have_attributes(done: true, skipped: false)
    end

    it "is kept, with its Evaluations, when the plan is regenerated" do
      group.regenerate_plan(today: assessment_day + 1)

      expect(assessment.reload.evaluations.count).to eq(1)
    end
  end

  describe "who records" do
    it "is a 404 for a Club Manager of the group's Club, who reads the Class but records nothing" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      sign_in manager

      get "/dashboard/classes/#{assessment.id}"
      expect(page_props["props"]["evaluations"]).to include("canRecord" => false)

      get form_path(assessment, ana)
      expect(response).to have_http_status(:not_found)
      record(assessment, ana, ratings: [area("technique", 4)])
      expect(response).to have_http_status(:not_found)
    end

    it "is a 404 for another Coach" do
      sign_in create(:user, :coach, club: club)

      record(assessment, ana, ratings: [area("technique", 4)])

      expect(response).to have_http_status(:not_found)
      expect(Evaluation.count).to eq(0)
    end
  end
end
