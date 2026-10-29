require "rails_helper"

RSpec.describe "db/seeds.rb" do
  before do
    load Rails.root.join("db/seeds.rb")
  end

  it "creates the 7 beginner and 7 intermediate course modules, with their quizzes, from the pt content export" do
    expect(CourseModule.where(level: :beginner).count).to eq(7)
    expect(CourseModule.where(level: :intermediate).count).to eq(7)
    expect(Quiz.count).to eq(14)

    module_one = CourseModule.find_by(slug: "module-1")
    expect(module_one.title).to eq("Mesociclo 1")
    expect(module_one.level).to eq("beginner")
    expect(module_one.position).to eq(1)
    expect(module_one.sections).not_to be_empty
  end

  it "gives every seed user Module Completion of the first two Beginner Modules and the third In Progress" do
    User.find_each do |user|
      states = CourseModule.states_for(user, CourseModule.teaching_for(:beginner))
      expect(states.values.map { |state| state[:status] }).to eq(%w[completed completed in_progress] + %w[locked] * 4)
    end

    expect(QuizAttempt.passing.count).to eq(User.count * 2)
  end

  it "is safe to run again" do
    expect { load Rails.root.join("db/seeds.rb") }.not_to(change { [ExerciseCompletion.count, QuizAttempt.count] })
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
