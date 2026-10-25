require "rails_helper"

RSpec.describe TrainingPlanGenerator do
  let(:modules) { build_stubbed_list(:course_module, 3) }
  let(:start_date) { Date.new(2026, 9, 7) } # a Monday

  def generate(**overrides)
    described_class.call(**{
      modules: modules, cadence: 1, weekdays: [:monday], start_time: "18:00",
      duration: 60, start_date: start_date, break_periods: []
    }.merge(overrides))
  end

  describe "once a week" do
    it "gives each Module 6 weekly Classes in Course order" do
      plan = generate

      expect(plan.size).to eq(18)
      expect(plan.map(&:course_module).uniq).to eq(modules)
      expect(plan.first(6).map(&:date)).to eq((0..5).map { |w| start_date + w * 7 })
      expect(plan.map(&:date)).to eq(plan.map(&:date).sort)
    end

    it "makes the 6th Class of each Module the Assessment Class" do
      plan = generate

      modules.each do |mod|
        classes = plan.select { |c| c.course_module == mod }
        expect(classes.map(&:type)).to eq(%i[regular regular regular regular regular assessment])
      end
    end

    it "carries start time and duration on every Class" do
      expect(generate(duration: 90).map(&:duration).uniq).to eq([90])
      expect(generate.map(&:start_time).uniq).to eq(["18:00"])
    end
  end

  describe "twice a week" do
    let(:plan) { generate(cadence: 2, weekdays: %i[thursday monday]) }

    it "gives each Module 4 weeks of 2 Classes, in weekday order" do
      expect(plan.size).to eq(24)
      first_module = plan.first(8)
      expect(first_module.map(&:date)).to eq(
        (0..3).flat_map { |w| [start_date + w * 7, start_date + w * 7 + 3] }
      )
    end

    it "makes only the last Class of the 4th week the Assessment Class" do
      first_module = plan.first(8)
      expect(first_module.map(&:type)).to eq(%i[regular] * 7 + %i[assessment])
    end
  end

  describe "first Class" do
    it "is on the start date when it is a chosen weekday" do
      expect(generate.first.date).to eq(start_date)
    end

    it "is on the first chosen weekday after the start date" do
      plan = generate(weekdays: [:wednesday], start_date: start_date + 1)
      expect(plan.first.date).to eq(Date.new(2026, 9, 9))
    end

    it "rolls into the next week when no chosen weekday is left in the start week" do
      plan = generate(weekdays: [:monday], start_date: start_date + 1)
      expect(plan.first.date).to eq(Date.new(2026, 9, 14))
      expect(plan.size).to eq(18)
    end

    it "counts a partial first week as a week of the first Module" do
      plan = generate(cadence: 2, weekdays: %i[monday thursday], start_date: start_date + 1)
      expect(plan.first.date).to eq(Date.new(2026, 9, 10))
      expect(plan.first(7).last.type).to eq(:assessment)
    end
  end

  describe "Break Periods" do
    it "skips weeks overlapping a Break Period without counting them" do
      break_period = (Date.new(2026, 9, 16)..Date.new(2026, 9, 18)) # inside week of Sep 14
      plan = generate(break_periods: [break_period])
      dates = plan.map(&:date)

      expect(dates).not_to include(Date.new(2026, 9, 14))
      expect(plan.size).to eq(18)
      expect(dates.first(3)).to eq([start_date, start_date + 14, start_date + 21])
      expect(plan.first(6).last.type).to eq(:assessment)
    end

    it "skips a week touched by only the last day of a Break Period" do
      plan = generate(break_periods: [Date.new(2026, 9, 1)..Date.new(2026, 9, 7)])
      expect(plan.first.date).to eq(Date.new(2026, 9, 14))
    end

    it "skips several consecutive weeks" do
      plan = generate(break_periods: [Date.new(2026, 9, 14)..Date.new(2026, 9, 27)])
      expect(plan.map(&:date)).not_to include(Date.new(2026, 9, 14), Date.new(2026, 9, 21))
      expect(plan.size).to eq(18)
    end
  end

  describe "the plan end" do
    it "stops after the last Module's Assessment Class" do
      plan = generate(modules: modules.first(1))
      expect(plan.last.type).to eq(:assessment)
      expect(plan.size).to eq(6)
    end
  end

  describe "continuing a Module already started" do
    it "generates only the first Module's remaining Classes, ending with its Assessment Class" do
      plan = generate(done_in_first_module: 4)

      first_module = plan.select { |c| c.course_module == modules.first }
      expect(first_module.map(&:date)).to eq([start_date, start_date + 7])
      expect(first_module.map(&:type)).to eq(%i[regular assessment])
      expect(plan.size).to eq(2 + 12)
    end

    it "counts in Classes at twice a week, and starts later Modules in the next week" do
      # 8 Classes in the first Module, 5 done: Mon, Thu, Mon remain.
      plan = generate(cadence: 2, weekdays: %i[monday thursday], done_in_first_module: 5)

      first_module = plan.select { |c| c.course_module == modules.first }
      expect(first_module.map(&:date)).to eq([start_date, start_date + 3, start_date + 7])
      expect(first_module.map(&:type)).to eq(%i[regular regular assessment])
      second_module = plan.select { |c| c.course_module == modules.second }
      expect(second_module.first.date).to eq(start_date + 14)
      expect(second_module.size).to eq(8)
    end

    it "still generates the Assessment Class when the Module's Classes are all done" do
      plan = generate(modules: modules.first(1), done_in_first_module: 9)

      expect(plan.map(&:type)).to eq(%i[assessment])
      expect(plan.first.date).to eq(start_date)
    end

    it "skips Break Periods without counting them" do
      plan = generate(modules: modules.first(1), done_in_first_module: 3,
                      break_periods: [Date.new(2026, 9, 14)..Date.new(2026, 9, 20)])

      expect(plan.map(&:date)).to eq([start_date, start_date + 14, start_date + 21])
    end
  end

  it "ignores the Module's duration text and assigns no Exercises" do
    mod = build_stubbed(:course_module, duration: "10 - 12 weeks")
    plan = generate(modules: [mod])
    expect(plan.size).to eq(6)
    expect(plan.first).not_to respond_to(:exercises)
  end

  describe "refusals" do
    it "refuses a Course without teaching Modules" do
      expect { generate(modules: []) }.to raise_error(TrainingPlanGenerator::NoTeachingModules)
    end

    it "refuses a cadence that does not match the chosen weekdays" do
      expect { generate(cadence: 2, weekdays: [:monday]) }.to raise_error(ArgumentError)
    end

    it "refuses unsupported cadence and duration" do
      expect { generate(cadence: 3, weekdays: %i[monday tuesday wednesday]) }.to raise_error(ArgumentError)
      expect { generate(duration: 75) }.to raise_error(ArgumentError)
    end

    it "refuses a negative count of Classes already done" do
      expect { generate(done_in_first_module: -1) }.to raise_error(ArgumentError)
    end
  end
end

RSpec.describe CourseModule, ".teaching_for" do
  it "returns a Course's Modules in order" do
    other = create(:course_module, level: :intermediate, position: 1)
    a = create(:course_module, level: :beginner, position: 2)
    b = create(:course_module, level: :beginner, position: 1)

    expect(described_class.teaching_for(:beginner)).to eq([b, a])
    expect(described_class.teaching_for(:beginner)).not_to include(other)
  end

  it "is empty for a Planned Course" do
    expect(described_class.teaching_for(:intermediate)).to be_empty
  end
end
