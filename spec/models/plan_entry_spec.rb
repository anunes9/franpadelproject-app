require "rails_helper"

RSpec.describe PlanEntry, type: :model do
  it "allows the same exercise on different days" do
    user = create(:user)
    exercise = create(:exercise)
    create(:plan_entry, user: user, plannable: exercise, day: :monday)

    entry = build(:plan_entry, user: user, plannable: exercise, day: :tuesday)
    expect(entry).to be_valid
  end

  it "rejects the same item twice on one day for one user" do
    user = create(:user)
    exercise = create(:exercise)
    create(:plan_entry, user: user, plannable: exercise, day: :monday)

    entry = build(:plan_entry, user: user, plannable: exercise, day: :monday)
    expect(entry).not_to be_valid
  end

  it "holds modules as well as exercises" do
    entry = create(:plan_entry, plannable: create(:course_module, slug: "module-1", title: "Module 1"))

    expect(entry.as_dashboard_json).to include(kind: "module", key: "module-1", href: "/dashboard/courses/module-1")
  end

  describe ".week_json_for" do
    it "groups a user's entries by day name in position order" do
      user = create(:user)
      first = create(:exercise, ref: "EX-1", title: "First")
      second = create(:exercise, ref: "EX-2", title: "Second")
      create(:plan_entry, user: user, plannable: second, day: :wednesday, position: 2)
      create(:plan_entry, user: user, plannable: first, day: :wednesday, position: 1)
      create(:plan_entry, plannable: first, day: :wednesday) # another user

      week = PlanEntry.week_json_for(user)

      expect(week.keys).to eq(PlanEntry::DAYS)
      expect(week["Wednesday"].map { |e| e[:key] }).to eq(%w[EX-1 EX-2])
      expect(week["Monday"]).to eq([])
    end
  end
end
