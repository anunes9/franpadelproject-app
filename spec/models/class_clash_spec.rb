require "rails_helper"

RSpec.describe ClassClash, type: :model do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let(:player) { create(:player, club: club) }
  let(:tuesday) { Date.new(2026, 9, 8) }

  before { create(:course_module, level: :beginner, position: 1) }

  # A Class someone wants to plan, as the Training Plan generator plans it.
  def slot(date, start_time, duration)
    TrainingPlanGenerator::PlannedClass.new(date: date, start_time: start_time, duration: duration,
                                            course_module: nil, type: :regular)
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

    it "can leave out only the Classes being replaced, so the group's other Classes still count" do
      group = planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60)
      first, second = group.training_classes.first(2)
      candidates = [slot(first.date, "18:00", 60), slot(second.date, "18:00", 60)]

      expect(described_class.new(coach: coach, players: [player], replacing: [second.id]).dates(candidates))
        .to eq([first.date])
    end
  end

  describe "edited Classes" do
    let!(:group) { planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60) }
    let(:first_class) { group.training_classes.first }

    it "ignores a skipped Class, which no longer takes up its time" do
      first_class.update!(skipped: true)

      expect(clashing_dates([slot(tuesday, "18:00", 60)])).to eq([])
    end

    it "does not clash a Class being moved with itself" do
      first_class.start_time = "18:30"

      expect(clashing_dates([first_class])).to eq([])
    end

    it "clashes a moved Class with another Class of its own group" do
      first_class.date = tuesday + 7

      expect(clashing_dates([first_class])).to eq([tuesday + 7])
    end

    # A group's new duration applies to all its Classes at once.
    it "checks a group's Classes with its new duration, without clashing them with their old times" do
      group.duration = 90

      expect(clashing_dates(group.training_classes.to_a)).to eq([])
    end

    it "clashes the Classes being checked with each other" do
      added = group.training_classes.create!(date: tuesday, start_time: "19:00", kind: :regular,
                                             course_module: group.course_modules.first)
      group.duration = 90

      expect(clashing_dates(group.training_classes.to_a)).to eq([tuesday])
      expect(clashing_dates([added])).to eq([])
    end
  end

  it "lists each clashing date once, in order" do
    planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60)
    later = slot(tuesday + 7, "18:00", 60)

    expect(clashing_dates([later, slot(tuesday, "18:00", 60), later])).to eq([tuesday, tuesday + 7])
  end

  # Class times are wall-clock times at the Club: the app's time zone, which
  # is unset (UTC), must not shift them.
  describe "time zones" do
    %w[Europe/Lisbon Asia/Tokyo America/New_York].each do |zone|
      it "keeps a group's start time and clashes as planned under #{zone}" do
        group = Time.use_zone(zone) do
          planned_group(coach: coach, players: [player], start_time: "18:00", duration: 60)
        end

        Time.use_zone(zone) do
          expect(ClassGroup.find(group.id).start_time_text).to eq("18:00")
          expect(group.training_classes.reload.first.plan_json[:startTime]).to eq("18:00")
          expect(clashing_dates([slot(tuesday, "18:30", 60)])).to eq([tuesday])
          expect(clashing_dates([slot(tuesday, "19:00", 60)])).to eq([])
        end
        expect(clashing_dates([slot(tuesday, "17:30", 60)])).to eq([tuesday])
        expect(clashing_dates([slot(tuesday, "17:00", 60)])).to eq([])
      end
    end
  end
end
