class CourseModule < ApplicationRecord
  include OrganizesAttachments

  enum :level, Level::VALUES

  has_many :exercises, -> { order(:ref) }, dependent: :destroy
  has_one :quiz, dependent: :destroy
  # The admin form always sends a Quiz; only keep a new one that has questions.
  accepts_nested_attributes_for :quiz, reject_if: ->(attrs) { attrs["id"].blank? && attrs["questions_attributes"].blank? }
  has_many_attached :documents
  organizes_attachment :documents, folder: -> { "course_modules/#{slug}/documents" }

  validates :slug, :title, :description, :duration, presence: true
  validates :slug, uniqueness: true

  scope :ordered, -> { order(:level, :position) }

  # A Course's Modules in order. Empty for a Planned Course.
  def self.teaching_for(level)
    where(level: level).order(:position).to_a
  end

  # The Module as a choice when adding a Class to a Training Plan.
  def option_json
    { id: id, number: position, title: title }
  end

  # The Module as a group's page shows it beside its Classes.
  def plan_json
    option_json.merge(slug: slug, description: description, topics: topics)
  end

  # Whether the Module has a Quiz. A Quiz with no questions counts as none.
  def quiz?
    quiz.present? && quiz.questions.any?
  end

  def topics_text
    topics.join(", ")
  end

  def topics_text=(value)
    self.topics = value.to_s.split(",").map(&:strip).reject(&:blank?)
  end

  # Assigning `documents=` directly (has_many_attached's own writer) replaces
  # the whole collection. This virtual attribute appends instead, so
  # uploading a new document in the admin doesn't remove the existing ones.
  def new_documents=(files)
    documents.attach(files) if files.present?
  end

  def sections
    return [] if content.blank?

    content.split(/^## /).reject(&:blank?).map do |chunk|
      heading, *rest = chunk.strip.lines.map(&:strip)
      items = rest.select { |line| line.start_with?("- ") }.map { |line| line.delete_prefix("- ") }
      { heading: heading, items: items }
    end
  end

  # Inline-viewable URLs only (disposition: "inline") -- documents are meant
  # to be viewed in the app, not saved locally by the user.
  def documents_json
    documents.map do |document|
      {
        id: document.id,
        filename: document.filename.to_s,
        contentType: document.content_type,
        url: Rails.application.routes.url_helpers.rails_blob_path(document, disposition: "inline", only_path: true)
      }
    end
  end

  # `state` is this Module's entry from `.states_for`; without one the Module
  # is treated as Locked, so a missing state never opens a Module by accident.
  def as_dashboard_json(state = nil)
    {
      id: slug,
      n: position,
      title: title,
      description: description,
      topics: topics,
      duration: duration,
      level: level.capitalize,
      status: state ? state[:status] : "locked",
      progress: state ? state[:progress] : 0
    }
  end

  def state_for(user)
    self.class.states_for(user, self.class.where(level: level).to_a)[id]
  end

  def locked_for?(user)
    state_for(user)[:status] == "locked"
  end

  # A Client's state for each of `modules`, keyed by id, as
  # { status: "locked" | "available" | "in_progress" | "completed", progress: 0..100 }.
  #
  # All of it is worked out from the Module's current content (ADR 0008):
  # - Completed (Module Completion): a Quiz Pass when the Module has a Quiz,
  #   and an Exercise Completion of every Exercise in it. A Module with
  #   neither is complete for everyone.
  # - Locked: the previous Module in its Course (Level) is not Completed. A
  #   Locked Module is never Completed, even with nothing left to do in it
  #   (a Module with neither Quiz nor Exercises, or Exercises done from the
  #   Exercises pages), so the Course is still worked through in order.
  # - In Progress: at least one Exercise Completion or Quiz Attempt.
  # - Available: otherwise.
  # Progress counts each Exercise as one step and the Quiz as one more.
  def self.states_for(user, modules = ordered.to_a)
    states_by_user([user], modules)[user.id]
  end

  # `.states_for` for several users at once, keyed by user id, in the same
  # number of queries however many users there are.
  def self.states_by_user(users, modules = ordered.to_a)
    ids = modules.map(&:id)
    user_ids = users.map(&:id)
    exercise_counts = Exercise.where(course_module_id: ids).group(:course_module_id).count
    completion_counts = ExerciseCompletion.joins(:exercise)
                                          .where(user_id: user_ids, exercises: { course_module_id: ids })
                                          .group(:user_id, "exercises.course_module_id").count
    with_quiz = QuizQuestion.joins(:quiz).where(quizzes: { course_module_id: ids })
                            .distinct.pluck("quizzes.course_module_id").to_set
    attempts = QuizAttempt.joins(:quiz).where(user_id: user_ids, quizzes: { course_module_id: ids })
    attempted = attempts.distinct.pluck(:user_id, "quizzes.course_module_id").to_set
    passed = attempts.passing.distinct.pluck(:user_id, "quizzes.course_module_id").to_set
    courses = modules.group_by(&:level).values.map { |course_modules| course_modules.sort_by(&:position) }

    user_ids.index_with do |user_id|
      courses.each_with_object({}) do |course_modules, states|
        previous_completed = true
        course_modules.each do |m|
          done = completion_counts.fetch([user_id, m.id], 0)
          quiz = with_quiz.include?(m.id)
          quiz_passed = quiz && passed.include?([user_id, m.id])
          steps = exercise_counts.fetch(m.id, 0) + (quiz ? 1 : 0)
          steps_done = done + (quiz_passed ? 1 : 0)
          is_completed = previous_completed && steps_done == steps

          status =
            if !previous_completed then "locked"
            elsif is_completed then "completed"
            elsif done.positive? || attempted.include?([user_id, m.id]) then "in_progress"
            else "available"
            end
          progress = steps.zero? ? 100 : (steps_done * 100.0 / steps).round

          states[m.id] = { status: status, progress: progress }
          previous_completed = is_completed
        end
      end
    end
  end

  # Each user's Course progress, keyed by user id, as a Club Manager follows
  # their Coaches: for every Course in Level order, the Modules with Module
  # Completion out of the Course's Modules, and progress as the mean of that
  # Course's Modules' progress (the Course home's stats take the mean over
  # all Modules instead). A Planned Course has no Modules, so its
  # modulesTotal is 0. The same number of queries however many users there
  # are.
  def self.progress_for(users)
    modules = ordered.to_a
    states = states_by_user(users, modules)
    exercises_done = ExerciseCompletion.where(user_id: users.map(&:id)).group(:user_id).count
    modules_by_level = modules.group_by(&:level)

    users.to_h do |user|
      courses = Level::VALUES.keys.map(&:to_s).map do |level|
        course_states = modules_by_level.fetch(level, []).map { |m| states[user.id][m.id] }
        { level: level, **completion_of(course_states) }
      end
      [user.id, { courses: courses, exercisesDone: exercises_done.fetch(user.id, 0) }]
    end
  end

  # `modules` and their `states` (from `.states_for`) can be passed in when
  # the caller already has them, as the Course home does to work them out
  # once for both its list and its stats.
  def self.dashboard_list_for(user, modules: ordered.to_a, states: states_for(user, modules))
    modules.map { |m| m.as_dashboard_json(states[m.id]) }
  end

  # averageQuiz has no real tracking yet (Quizzes aren't backed by database
  # models) -- it stays nil until that exists.
  def self.dashboard_stats_for(user, states: states_for(user))
    {
      **completion_of(states.values),
      exercisesDone: ExerciseCompletion.where(user: user).count,
      averageQuiz: nil
    }
  end

  # Of some Modules' states: those with Module Completion out of all, and the
  # mean of their progress (0 for none).
  def self.completion_of(states)
    {
      modulesDone: states.count { |s| s[:status] == "completed" },
      modulesTotal: states.size,
      progress: states.empty? ? 0 : (states.sum { |s| s[:progress] }.to_f / states.size).round
    }
  end
  private_class_method :completion_of

  def self.ransackable_attributes(_auth_object = nil)
    %w[slug title description level position duration created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
