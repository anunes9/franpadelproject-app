require "rails_helper"

RSpec.describe ClassClash, type: :model do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let(:player) { create(:player, club: club) }
  let(:tuesday) { Date.new(2026, 9, 8) }

  before { create(:course_module, level: :beginner, position: 1) }

  # A Class someone wants to plan: anything with a date, start time and duration.
  def slot(date, start_time, duration)
    Struct.new(:date, :start_time, :duration).new(date, start_time, duration)
  end

  # A group whose plan has a Class on Tuesday 8 September 2026.
  def planned_group(coach:, players:, start_time:, duration:)
    group = ClassGroup.new(coach: coach, players: players, level: "beginner", starts_on: tuesday,
                           cadence: 1, weekdays: ["tuesday"], start_time: start_time, duration: duration)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  def clashing_dates(candidates, coach: self.coach, players: [], ignoring: nil)
    described_class.new(coach: coach, players: players, ignoring: ignoring).dates(candidates)
  end

  describe "comparing time intervals" do
    before { planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60) }

    it "clashes when a later Class starts before the first one ends" do
      expect(clashing_dates([slot(tuesday, "18:30", 90)])).to eq([tuesday])
    end

    it "clashes when an earlier Class runs into the first one" do
      expect(clashing_dates([slot(tuesday, "17:00", 90)])).to eq([tuesday])
    end

    it "clashes with a Class inside the first one" do
      expect(clashing_dates([slot(tuesday, "18:15", 30)])).to eq([tuesday])
    end

    it "does not clash with a Class starting when the first one ends" do
      expect(clashing_dates([slot(tuesday, "19:00", 60)])).to eq([])
    end

    it "does not clash with a Class ending when the first one starts" do
      expect(clashing_dates([slot(tuesday, "16:30", 90)])).to eq([])
    end

    it "does not clash on another date" do
      expect(clashing_dates([slot(tuesday + 1, "18:00", 60)])).to eq([])
    end
  end

  describe "whose Classes count" do
    let(:other_coach) { create(:user, :coach, club: club) }

    it "checks a Player's Classes in other Coaches' groups" do
      planned_group(coach: other_coach, players: [player], start_time: "18:00", duration: 60)

      expect(clashing_dates([slot(tuesday, "18:00", 60)], players: [player])).to eq([tuesday])
    end

    it "ignores Classes of groups that share neither the Coach nor a Player" do
      planned_group(coach: other_coach, players: [create(:player, club: club)], start_time: "18:00", duration: 60)

      expect(clashing_dates([slot(tuesday, "18:00", 60)], players: [player])).to eq([])
    end

    it "can leave out one group's own Classes, for edits that replace them" do
      group = planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60)

      expect(clashing_dates([slot(tuesday, "18:00", 60)], players: [player], ignoring: group)).to eq([])
    end
  end

  it "lists each clashing date once, in order" do
    planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60)
    later = slot(tuesday + 7, "18:00", 60)

    expect(clashing_dates([later, slot(tuesday, "18:00", 60), later])).to eq([tuesday, tuesday + 7])
  end
end
