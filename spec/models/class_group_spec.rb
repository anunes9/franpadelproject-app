require "rails_helper"

RSpec.describe ClassGroup do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }

  # Tuesdays at 18:00 from 8 September 2026: six Classes of one Module. Each
  # group gets its own Coach and Players, so their Classes never clash.
  def planned_group(cadence: 1, weekdays: ["tuesday"], duration: 60)
    coach = create(:user, :coach, club: club)
    group = ClassGroup.new(coach: coach, players: create_list(:player, 2, club: club), level: "beginner",
                           starts_on: Date.new(2026, 9, 7), cadence: cadence, weekdays: weekdays,
                           start_time: "18:00", duration: duration)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  def finish(group)
    group.training_classes.each { |c| c.update!(done: true) }
    group
  end

  describe "#create_with_plan" do
    it "spans the Module over weeks set by the cadence, whatever the Class duration" do
      expect(planned_group.training_classes.size).to eq(6)
      expect(planned_group(duration: 90).training_classes.size).to eq(6)
      expect(planned_group(cadence: 2, weekdays: %w[tuesday thursday]).training_classes.size).to eq(8)
      expect(planned_group(cadence: 2, weekdays: %w[tuesday thursday], duration: 90).training_classes.size).to eq(8)
    end
  end

  describe "#finished?" do
    it "is not finished without Classes" do
      group = planned_group
      group.training_classes.destroy_all

      expect(group.reload).not_to be_finished
    end

    it "is finished when every Class is done" do
      expect(finish(planned_group).reload).to be_finished
    end

    it "is finished when every Class is done or skipped" do
      group = planned_group
      group.training_classes.first.update!(skipped: true)
      group.training_classes.drop(1).each { |c| c.update!(done: true) }

      expect(group.reload).to be_finished
    end

    it "is not finished while one Class is neither done nor skipped" do
      group = planned_group
      group.training_classes.drop(1).each { |c| c.update!(done: true) }

      expect(group.reload).not_to be_finished
    end

    it "is not finished when every Class is skipped, as nothing was taught" do
      group = planned_group
      group.training_classes.each { |c| c.update!(skipped: true) }

      expect(group.reload).not_to be_finished
    end

    it "is unfinished again when a done Class is marked undone" do
      group = finish(planned_group)
      group.training_classes.last.update!(done: false)

      expect(group.reload).not_to be_finished
    end
  end

  describe ".finished and .unfinished" do
    it "split groups into finished and unfinished, agreeing with #finished?" do
      finished = finish(planned_group)
      half_done = planned_group
      half_done.training_classes.first.update!(done: true)
      fresh = planned_group
      empty = planned_group.tap { |g| g.training_classes.destroy_all }

      expect(ClassGroup.finished).to contain_exactly(finished)
      expect(ClassGroup.unfinished).to contain_exactly(half_done, fresh, empty)
    end

    it "reads finished from the list query without asking again" do
      finish(planned_group)
      planned_group

      groups = ClassGroup.with_finished.order(:created_at).to_a
      expect(groups.map(&:finished?)).to eq([true, false])
    end
  end

  describe "#next_level" do
    it "is the next Level of the Course order, and none after Advanced" do
      expect(ClassGroup.new(level: "beginner").next_level).to eq("intermediate")
      expect(ClassGroup.new(level: "intermediate").next_level).to eq("advanced")
      expect(ClassGroup.new(level: "advanced").next_level).to be_nil
    end
  end

  describe "#name" do
    it "is optional, stripped, and blank is no name" do
      group = planned_group

      group.update!(name: "  Fim de tarde  ")
      expect(group.reload.name).to eq("Fim de tarde")

      group.update!(name: "   ")
      expect(group.reload.name).to be_nil
    end

    it "has at most 60 characters" do
      group = planned_group

      expect(group.update(name: "a" * 61)).to be(false)
      expect(group.errors.details[:name]).to include(error: :too_long, count: 60)
      expect(group.update(name: "a" * 60)).to be(true)
    end
  end

  describe "#progress_json" do
    let!(:volley) { create(:course_module, level: :beginner, position: 2, title: "Volley") }

    it "counts each Module's done and planned Classes, leaving skipped ones out" do
      group = planned_group
      classes = group.training_classes.to_a
      classes.first(6).each { |c| c.update!(done: true) }
      classes[6].update!(done: true)
      classes[7].update!(skipped: true)

      progress = group.reload.progress_json(today: Date.new(2026, 9, 1))

      expect(progress[:modules]).to eq([{ number: 1, done: 6, total: 6 }, { number: 2, done: 1, total: 5 }])
      expect(progress).to include(currentModule: 2, done: 7, total: 11)
    end

    it "names the next Class to teach from today, numbered in the whole plan, skipped ones included" do
      group = planned_group
      classes = group.training_classes.to_a
      classes[0].update!(done: true)
      classes[1].update!(skipped: true)

      # 8 September is the first Class; from the 9th the next is the third.
      progress = group.reload.progress_json(today: Date.new(2026, 9, 9))

      expect(progress[:nextClass]).to eq(id: classes[2].id, date: "2026-09-22", startTime: "18:00", number: 3)
    end

    it "has no next Class once every Class is done or skipped" do
      group = finish(planned_group)

      expect(group.reload.progress_json(today: Date.new(2026, 9, 1))).to include(nextClass: nil, currentModule: nil)
    end
  end
end
