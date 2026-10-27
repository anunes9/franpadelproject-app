require "rails_helper"

RSpec.describe TrainingClass do
  let(:club) { create(:club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }

  # Six Classes of one Module from 8 September 2026, once a week at `start_time`.
  def planned_group(coach:, weekdays: ["tuesday"], start_time: "18:00")
    group = ClassGroup.new(coach: coach, players: create_list(:player, 2, club: club), level: "beginner",
                           starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: weekdays,
                           start_time: start_time, duration: 60)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  describe ".numbered" do
    it "numbers each group's Classes in plan order, whatever the filter" do
      coach = create(:user, :coach, club: club)
      first = planned_group(coach: coach)
      second = planned_group(coach: coach, weekdays: ["thursday"])

      third_of_first = described_class.numbered.where(class_group: first).find_by(date: Date.new(2026, 9, 22))
      later = described_class.numbered.where(class_group: second).where(date: Date.new(2026, 10, 1)..)

      expect(third_of_first.plan_number).to eq(3)
      expect(later.order(:date).map(&:plan_number)).to eq([4, 5, 6])
    end

    it "agrees with #number_in_plan, counting skipped Classes" do
      group = planned_group(coach: create(:user, :coach, club: club))
      group.training_classes.second.update!(skipped: true)
      fourth = group.training_classes.fourth

      expect(fourth.number_in_plan).to eq(4)
      expect(described_class.numbered.find(fourth.id).plan_number).to eq(4)
    end
  end

  describe ".week_of" do
    it "lists the Coach's Classes of the week across groups, by date and time, numbered, without skipped ones" do
      coach = create(:user, :coach, club: club)
      tuesdays = planned_group(coach: coach)
      thursdays = planned_group(coach: coach, weekdays: ["thursday"], start_time: "10:00")
      other = planned_group(coach: create(:user, :coach, club: club))
      week = Date.new(2026, 9, 14)..Date.new(2026, 9, 20)
      thursdays.training_classes.find_by(date: Date.new(2026, 9, 17)).update!(skipped: true)

      listed = described_class.week_of(coach: coach, dates: week).map(&:week_json)

      expect(listed).to eq([
        { id: tuesdays.training_classes.second.id, date: "2026-09-15", startTime: "18:00", duration: 60,
          kind: "regular", done: false, number: 2, moduleNumber: 1,
          group: { id: tuesdays.id, name: nil, level: "beginner" } }
      ])
      expect(described_class.week_of(coach: coach, dates: week).map(&:class_group_id)).not_to include(other.id)
    end
  end
end
