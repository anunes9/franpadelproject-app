# The demo Club shown to prospective clients: a Club Manager, Coaches at
# different points of the Course, a pending Coach invitation, a roster of
# Players, the Club's Break Periods, and Class Groups in progress, finished
# and about to start.
#
# Everything is dated relative to the day it is built, so the demo always
# looks live: Classes before today are done, the first Coach has a Class
# today, and the Break Periods are the coming Christmas, Easter and August.
#
# Building it again keeps the accounts and Players (so sign-ins and links
# stay valid) and rebuilds the Class Groups, Training Plans, Course progress
# and Break Periods from scratch, which resets the demo after a presentation.
# It only ever touches the demo Club and the demo accounts.
class DemoClub
  CLUB_NAME = "Demo Padel Club"
  LOCATION = "Cascais, Portugal"
  INSTAGRAM = "demopadelclub"
  DEFAULT_PASSWORD = "demo-padel-2026"

  MANAGER = { email: "demo.manager@franpadelproject.com", name: "Catarina Mendes" }.freeze

  # modules_done: Modules of the Beginner Course the Coach has completed;
  # exercises_started: Exercise Completions in the Module after those.
  COACHES = [
    { email: "demo.coach@franpadelproject.com", name: "Rui Carvalho", age: 38, hand: :right,
      level: :advanced, modules_done: 4, exercises_started: 6 },
    { email: "demo.coach2@franpadelproject.com", name: "Inês Martins", age: 29, hand: :left,
      level: :intermediate, modules_done: 2, exercises_started: 3 },
    { email: "demo.coach3@franpadelproject.com", name: "Tiago Lopes", age: 25, hand: :right,
      level: :beginner, modules_done: 0, exercises_started: 2 }
  ].freeze

  INVITEE = { email: "beatriz.rocha@example.com", name: "Beatriz Rocha" }.freeze

  PLAYERS = [
    ["Afonso Pereira", :right, :right, :beginner],
    ["Mariana Costa", :left, :right, :beginner],
    ["João Ribeiro", :both, :right, :intermediate],
    ["Leonor Fonseca", :right, :left, :beginner],
    ["Diogo Matos", :left, :right, :beginner],
    ["Carolina Pinto", :right, :right, :intermediate],
    ["Francisco Teixeira", :left, :left, :beginner],
    ["Matilde Sousa", :both, :right, :beginner],
    ["Gonçalo Marques", :right, :right, :intermediate],
    ["Benedita Gomes", :left, :right, :beginner],
    ["Vasco Antunes", :right, :left, :advanced],
    ["Madalena Silva", :both, :right, :beginner],
    ["Duarte Nunes", :left, :right, :intermediate],
    ["Constança Reis", :right, :right, :beginner],
    ["Rodrigo Baptista", :left, :left, :beginner],
    ["Sofia Correia", :right, :right, :intermediate],
    ["Lourenço Dias", :both, :right, :beginner],
    ["Teresa Oliveira", :left, :right, :beginner]
  ].freeze

  # Weekday offsets are days after today's weekday, so each Coach's groups,
  # and every Player's groups, fall on different weekdays or at times that
  # never overlap, whatever day the demo is built on. Player indexes are into
  # PLAYERS. `weeks_ago` (or `weeks_ahead`) places the group's start date.
  GROUPS = [
    { coach: 0, cadence: 2, weekday_offsets: [0, 2], start_time: "18:00", duration: 90,
      weeks_ago: 7, players: [0, 1, 2, 3, 4, 5] },
    { coach: 0, cadence: 1, weekday_offsets: [5], start_time: "10:00", duration: 60,
      weeks_ago: 3, players: [0, 1, 6, 7] },
    { coach: 1, cadence: 2, weekday_offsets: [1, 3], start_time: "19:30", duration: 90,
      weeks_ago: 6, players: [8, 9, 10, 11, 12, 13, 14, 15], skipped_class: 2 },
    { coach: 1, cadence: 2, weekday_offsets: [0, 2], start_time: "17:00", duration: 90,
      weeks_ago: 46, players: [8, 9, 10, 11, 12, 13], finished: true },
    { coach: 2, cadence: 2, weekday_offsets: [0, 4], start_time: "20:00", duration: 60,
      weeks_ahead: 1, players: [10, 11, 12, 16, 17] }
  ].freeze

  UPCOMING_CLASSES_WITH_EXERCISES = 2

  class Error < StandardError; end

  Summary = Data.define(:club, :manager, :coaches, :invitation, :players, :break_periods, :class_groups)

  def self.build(password: nil, today: Date.current)
    new(password: password, today: today).build
  end

  def initialize(password:, today:)
    @password = password.presence || (Rails.env.production? ? nil : DEFAULT_PASSWORD)
    @password_given = password.present?
    @today = today
    raise Error, "Set DEMO_PASSWORD: in production the demo accounts get no default password" if @password.nil?
  end

  def build
    raise Error, "The Beginner Course has no Modules; import them first (rails course_modules:import)" if modules.empty?

    ActiveRecord::Base.transaction do
      @club = find_or_create_club
      @manager = find_or_create_manager
      @coaches = COACHES.map { |attrs| find_or_create_coach(attrs) }
      @players = PLAYERS.map { |attrs| find_or_create_player(*attrs) }

      reset_dynamic_data
      break_periods = create_break_periods
      invitation = find_or_issue_invitation
      @coaches.zip(COACHES).each { |coach, attrs| record_course_progress(coach, attrs) }
      class_groups = GROUPS.map { |attrs| create_class_group(attrs) }

      Summary.new(club: @club, manager: @manager, coaches: @coaches, invitation: invitation,
                  players: @players, break_periods: break_periods, class_groups: class_groups)
    end
  end

  private

  def modules
    @modules ||= CourseModule.teaching_for(:beginner)
  end

  def find_or_create_club
    club = Club.find_or_initialize_by(name: CLUB_NAME)
    club.location = LOCATION
    club.instagram = INSTAGRAM
    club.save!
    club
  end

  def find_or_create_manager
    manager = find_or_initialize_user(MANAGER[:email], role: :club_manager, name: MANAGER[:name])
    manager.club = nil
    manager.save!
    manager.managed_clubs << @club unless manager.managed_clubs.include?(@club)
    manager
  end

  def find_or_create_coach(attrs)
    coach = find_or_initialize_user(attrs[:email], role: :coach, name: attrs[:name])
    coach.assign_attributes(club: @club, age: attrs[:age], hand: attrs[:hand], level: attrs[:level], removed_at: nil)
    coach.save!
    coach
  end

  def find_or_initialize_user(email, role:, name:)
    user = User.find_or_initialize_by(email: email)
    user.password = @password if user.new_record? || @password_given
    user.assign_attributes(role: role, name: name, locale: :pt)
    user
  end

  def find_or_create_player(name, position, hand, level)
    player = Player.find_or_initialize_by(club: @club, name: name)
    player.assign_attributes(position: position, hand: hand, level: level)
    player.save!
    player
  end

  # The demo accounts' groups, progress and the Club's Break Periods are
  # rebuilt on every run; the accounts and Players themselves are kept.
  def reset_dynamic_data
    ClassGroup.where(coach: @coaches).find_each(&:destroy!)
    UserModuleProgress.where(user: @coaches).delete_all
    ExerciseCompletion.where(user: @coaches).delete_all
    @club.break_periods.destroy_all
  end

  def create_break_periods
    [
      ["Natal", upcoming(Date.new(@today.year, 12, 21), 14)],
      ["Páscoa", upcoming_easter_week],
      ["Agosto", upcoming(Date.new(@today.year, 8, 1), 31)]
    ].map do |name, range|
      @club.break_periods.create!(name: name, starts_on: range.first, ends_on: range.last)
    end
  end

  # The yearly span of `days` from `start`, in its first occurrence that has
  # not ended yet.
  def upcoming(start, days)
    start = start.next_year while start + (days - 1) < @today
    start..(start + (days - 1))
  end

  def upcoming_easter_week
    year = @today.year
    range = easter_week(year)
    range = easter_week(year + 1) if range.last < @today
    range
  end

  # The week of Easter Sunday, Monday to Sunday, by the Meeus/Jones/Butcher
  # Gregorian algorithm.
  def easter_week(year)
    a = year % 19
    b, c = year.divmod(100)
    d, e = b.divmod(4)
    f = (b + 8) / 25
    g = (b - f + 1) / 3
    h = ((19 * a) + b - d - g + 15) % 30
    i, k = c.divmod(4)
    l = (32 + (2 * e) + (2 * i) - h - k) % 7
    m = (a + (11 * h) + (22 * l)) / 451
    month, day = ((h + l - (7 * m) + 114)).divmod(31)
    sunday = Date.new(year, month, day + 1)
    (sunday - 6)..sunday
  end

  def find_or_issue_invitation
    pending = CoachInvitation.pending.find_by(club: @club, email: INVITEE[:email])
    return pending if pending

    invitation, _token = CoachInvitation.issue(club: @club, invited_by: @manager, **INVITEE)
    raise Error, "Demo invitation not issued: #{invitation.errors.full_messages.join(', ')}" unless invitation.persisted?

    invitation
  end

  def record_course_progress(coach, attrs)
    done, rest = modules.partition.with_index { |_module, index| index < attrs[:modules_done] }
    done.each do |course_module|
      UserModuleProgress.create!(user: coach, course_module: course_module, status: :done, progress: 100)
      course_module.exercises.each { |exercise| ExerciseCompletion.create!(user: coach, exercise: exercise) }
    end

    current = rest.first
    return unless current

    exercises = current.exercises.first(attrs[:exercises_started])
    exercises.each { |exercise| ExerciseCompletion.create!(user: coach, exercise: exercise) }
    total = current.exercises.size
    progress = total.zero? ? 0 : (exercises.size * 100.0 / total).round
    UserModuleProgress.create!(user: coach, course_module: current, status: :current, progress: progress)
  end

  def create_class_group(attrs)
    starts_on = attrs[:weeks_ago] ? @today - attrs[:weeks_ago].weeks : @today + attrs[:weeks_ahead].weeks
    group = ClassGroup.new(
      coach: @coaches[attrs[:coach]], level: :beginner, starts_on: starts_on,
      cadence: attrs[:cadence], weekdays: attrs[:weekday_offsets].map { |offset| weekday(offset) },
      start_time: attrs[:start_time], duration: attrs[:duration],
      players: @players.values_at(*attrs[:players])
    )
    unless group.create_with_plan
      clashes = group.clashing_dates.presence && " (clashing dates: #{group.clashing_dates.join(', ')})"
      raise Error, "Demo Class Group not created: #{group.errors.full_messages.join(', ')}#{clashes}"
    end

    fill_in_plan(group, attrs)
    group
  end

  # Today's weekday plus `offset` days, as the generator names it.
  def weekday(offset)
    TrainingPlanGenerator::WEEKDAYS[(@today.cwday - 1 + offset) % 7].to_s
  end

  # Marks past Classes done (every Class, for a finished group), skips the
  # one asked for, and picks Exercises for the done Classes and the next few.
  def fill_in_plan(group, attrs)
    classes = group.training_classes.to_a
    classes[attrs[:skipped_class]].update!(skipped: true) if attrs[:skipped_class]
    held = classes.reject(&:skipped?)

    past, upcoming = held.partition { |training_class| attrs[:finished] || training_class.date < @today }
    past.each { |training_class| training_class.update!(done: true) }

    with_exercises = past + upcoming.first(UPCOMING_CLASSES_WITH_EXERCISES)
    with_exercises.each_with_index { |training_class, index| pick_exercises(training_class, index) }
  end

  def pick_exercises(training_class, index)
    exercises = training_class.course_module.exercises.to_a
    return if exercises.empty?

    count = ClassStructure.exercises_for(training_class.duration)
    exercises.rotate(index * count).first(count).each do |exercise|
      training_class.pick_exercise(exercise)
    end
  end
end
