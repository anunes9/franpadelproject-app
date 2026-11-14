require "rails_helper"

RSpec.describe PerformanceProfile do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let(:player) { create(:player, club: club) }
  let(:group) do
    ClassGroup.create!(coach: coach, players: [player], level: "beginner", starts_on: Date.new(2026, 9, 7),
                       cadence: 1, weekdays: ["tuesday"], start_time: "18:00", duration: 60)
  end
  let(:course_module) { create(:course_module, level: :beginner) }

  # An Evaluation on `date` with `ratings` as { "area:technique" => 3 }.
  def evaluated(date, ratings, comment: nil)
    training_class = group.training_classes.create!(course_module: course_module, date: date, start_time: "18:00",
                                                    kind: :assessment, done: true)
    evaluation = Evaluation.create!(training_class: training_class, player: player, coach: coach, comment: comment)
    ratings.each do |id, value|
      kind, key = id.split(":")
      evaluation.ratings.create!(item_kind: kind, item_key: key, value: value)
    end
    evaluation
  end

  def item(profile, kind, key) = profile.as_json[kind == "area" ? :areas : :strokes].find { |i| i[:key] == key }

  it "takes each item's latest Rating by Class date, with its trend against the one before" do
    evaluated(Date.new(2026, 11, 10), { "area:technique" => 4, "stroke:serve" => 2 })
    evaluated(Date.new(2026, 10, 13), { "area:technique" => 2, "area:mental" => 3, "stroke:serve" => 2 })

    profile = described_class.new(player)

    expect(item(profile, "area", "technique")).to include(value: 4, previous: 2, trend: "up")
    expect(item(profile, "area", "mental")).to include(value: 3, previous: nil, trend: nil)
    expect(item(profile, "stroke", "serve")).to include(value: 2, trend: "same")
  end

  it "lists every Profile Area, unrated ones with no value, and only the Strokes ever rated" do
    evaluated(Date.new(2026, 10, 13), { "stroke:bandeja" => 3 })

    json = described_class.new(player).as_json

    expect(json[:areas].pluck(:key)).to eq(ProfileArea::KEYS)
    expect(json[:areas].pluck(:value)).to all(be_nil)
    expect(json[:strokes].pluck(:key)).to eq(["bandeja"])
  end

  it "lists the items to improve, latest Rating 1 or 2, lowest first and Areas before Strokes" do
    evaluated(Date.new(2026, 10, 13), { "area:physical" => 2, "area:mental" => 1, "stroke:lob" => 1,
                                        "stroke:serve" => 3, "area:attitude" => 5 })

    to_improve = described_class.new(player).as_json[:toImprove]

    expect(to_improve.map { |i| [i[:kind], i[:key]] })
      .to eq([%w[area mental], %w[stroke lob], %w[area physical]])
  end

  it "shows the history newest first, with the Module, Coach, comments and Ratings" do
    older = evaluated(Date.new(2026, 10, 13), { "area:technique" => 2 }, comment: "First")
    newer = evaluated(Date.new(2026, 11, 10), { "area:technique" => 3 })

    history = described_class.new(player).as_json[:history]

    expect(history.pluck(:id)).to eq([newer.id, older.id])
    expect(history.last).to include(date: "2026-10-13", coach: coach.name, comment: "First",
                                    ratings: [{ kind: "area", key: "technique", value: 2, comment: nil }])
  end
end
