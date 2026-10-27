require "rails_helper"
require "rake"

RSpec.describe "demo:club rake task" do
  include ActiveSupport::Testing::TimeHelpers

  before(:all) do
    Rails.application.load_tasks
  end

  before do
    Rake::Task["demo:club"].reenable
    7.times do |index|
      course_module = create(:course_module, slug: "module-#{index + 1}", position: index + 1, level: :beginner)
      6.times { create(:exercise, course_module: course_module) }
    end
  end

  around do |example|
    original_password = ENV["DEMO_PASSWORD"]
    ENV["DEMO_PASSWORD"] = "demo-secret"
    travel_to(Time.utc(2026, 10, 26, 9)) { example.run }
    ENV["DEMO_PASSWORD"] = original_password
  end

  # Runs the task and returns what it printed.
  def run_task
    Rake::Task["demo:club"].reenable
    printed = StringIO.new
    $stdout = printed
    Rake::Task["demo:club"].invoke
    printed.string
  ensure
    $stdout = STDOUT
  end

  let(:club) { Club.find_by!(name: DemoClub::CLUB_NAME) }
  let(:first_coach) { User.find_by!(email: DemoClub::COACHES.first[:email]) }

  it "creates the Club with its Manager, Coaches, pending invitation, Players and Break Periods" do
    expect(run_task).to match(/Demo Club ready/)

    manager = User.find_by!(email: DemoClub::MANAGER[:email])
    expect(manager).to be_club_manager
    expect(manager.managed_clubs).to eq([club])
    expect(manager.valid_password?("demo-secret")).to be true

    expect(club.coaches.count).to eq(3)
    expect(club.coaches).to all(have_attributes(club: club, locale: "pt"))
    expect(club.coach_invitations.pending.pluck(:email)).to eq([DemoClub::INVITEE[:email]])
    expect(club.players.count).to eq(DemoClub::PLAYERS.size)
    expect(club.break_periods.chronological.map(&:name)).to eq(%w[Natal Páscoa Agosto])
    expect(club.break_periods.chronological.map(&:starts_on))
      .to eq([Date.new(2026, 12, 21), Date.new(2027, 3, 22), Date.new(2027, 8, 1)])
  end

  it "builds Class Groups in progress, finished and about to start, dated from today" do
    run_task

    groups = ClassGroup.of_clubs(club).with_finished.order(:starts_on).to_a
    expect(groups.size).to eq(DemoClub::GROUPS.size)
    expect(groups.count(&:finished?)).to eq(1)
    expect(groups).to all(have_attributes(level: "beginner"))
    expect(groups.sum { |group| group.training_classes.size }).to be > 100

    finished = groups.find(&:finished?)
    expect(finished.training_classes).to all(be_done)

    current = groups.reject(&:finished?)
    past, upcoming = current.flat_map(&:training_classes).reject(&:skipped?).partition { |c| c.date < Date.current }
    expect(past).to all(be_done)
    expect(upcoming).to all(have_attributes(done: false))
    expect(current.flat_map(&:training_classes).count(&:skipped?)).to eq(1)
    expect(past.map(&:exercises)).to all(be_present)
    # As many Exercises as the Class duration sets: 4 for 1h, 5 for 1h30.
    expect(past.map { |c| [c.duration, c.exercises.size] }.uniq).to contain_exactly([60, 4], [90, 5])

    expect(TrainingClass.taught_on(Date.current, coach: first_coach).count).to eq(1)
    expect(ClassGroup.where(coach: first_coach).order(:starts_on).first.starts_on).to eq(Date.new(2026, 9, 7))
  end

  it "records each Coach's Course progress" do
    run_task

    states = CourseModule.states_for(first_coach).values
    expect(states.count { |state| state[:status] == "completed" }).to eq(4)
    expect(states.count { |state| state[:status] == "in_progress" }).to eq(1)

    newest = User.find_by!(email: DemoClub::COACHES.last[:email])
    newest_states = CourseModule.states_for(newest).values
    expect(newest_states.first[:status]).to eq("in_progress")
    expect(newest_states.count { |state| state[:status] == "locked" }).to eq(6)
  end

  it "keeps the accounts and Players and rebuilds the rest when run again" do
    run_task
    manager_id = User.find_by!(email: DemoClub::MANAGER[:email]).id
    player_ids = club.players.pluck(:id).sort
    first_group_ids = ClassGroup.of_clubs(club).pluck(:id)

    expect { run_task }.not_to(change { [User.count, Player.count, Club.count, ClassGroup.count, BreakPeriod.count] })

    expect(User.find_by!(email: DemoClub::MANAGER[:email]).id).to eq(manager_id)
    expect(club.players.pluck(:id).sort).to eq(player_ids)
    expect(ClassGroup.of_clubs(club).pluck(:id)).not_to include(*first_group_ids)
    expect(club.coach_invitations.pending.count).to eq(1)
  end

  it "refuses to give the demo accounts a default password in production" do
    allow(Rails.env).to receive(:production?).and_return(true)

    expect { DemoClub.build(password: nil) }.to raise_error(DemoClub::Error, /DEMO_PASSWORD/)
  end
end
