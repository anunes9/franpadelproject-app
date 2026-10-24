require "rails_helper"

RSpec.describe "db/seeds.rb" do
  before do
    load Rails.root.join("db/seeds.rb")
  end

  it "creates the 8 beginner course modules from the pt content export" do
    expect(CourseModule.count).to eq(8)

    module_one = CourseModule.find_by(slug: "module-1")
    expect(module_one.title).to eq("Mesociclo 1")
    expect(module_one.level).to eq("beginner")
    expect(module_one.position).to eq(1)
    expect(module_one.sections).not_to be_empty
  end

  it "creates progress rows for every seed user matching today's hardcoded values" do
    expect(UserModuleProgress.count).to eq(User.count * 8)

    coach = User.find_by(email: "coach@example.com")
    module_three = CourseModule.find_by(slug: "module-3")
    progress = UserModuleProgress.find_by(user: coach, course_module: module_three)

    expect(progress.status).to eq("current")
    expect(progress.progress).to eq(40)
  end

  it "creates one club matching today's hardcoded values" do
    expect(Club.count).to eq(1)
    expect(Club.first.name).to eq("Padel Clube Lisboa")
  end

  it "seeds an admin, a club manager linked to the club, and no Weekly Plan data" do
    manager = User.find_by(email: "manager@example.com")

    expect(User.find_by(email: "admin@example.com")).to be_admin
    expect(manager).to be_club_manager
    expect(manager.managed_clubs).to eq([Club.first])
    expect(ActiveRecord::Base.connection.table_exists?(:plan_entries)).to be false
  end

  it "gives the coach user a real name, age, level, hand, and club" do
    coach = User.find_by(email: "coach@example.com")

    expect(coach.name).to eq("Miguel Santos")
    expect(coach.age).to eq(34)
    expect(coach.level).to eq("beginner")
    expect(coach.hand).to eq("right")
    expect(coach.club.name).to eq("Padel Clube Lisboa")
  end
end
