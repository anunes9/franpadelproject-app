class CourseModule < ApplicationRecord
  include OrganizesAttachments

  enum :level, Level::VALUES

  has_many :user_module_progresses, dependent: :destroy
  has_many :exercises, -> { order(:ref) }, dependent: :destroy
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

  def complete_for!(user)
    transaction do
      progress = UserModuleProgress.find_or_initialize_by(user: user, course_module: self)
      progress.update!(status: :done, progress: 100)

      next_module = self.class.where(level: level).where("position > ?", position).order(:position).first
      if next_module
        next_progress = UserModuleProgress.find_or_initialize_by(user: user, course_module: next_module)
        next_progress.update!(status: :current) if next_progress.locked?
      end
    end
  end

  # A Client's state for each of `modules`, keyed by id, as
  # { status: "locked" | "available" | "in_progress" | "completed", progress: 0..100 }.
  #
  # Module Completion is still the manual "mark as done" (a done
  # UserModuleProgress row). Everything else is derived: a Module is Locked
  # unless it's first in its Course (Level) or the previous one is completed,
  # and In Progress once the Client has an Exercise Completion in it. Progress
  # is the share of the Module's Exercises completed.
  def self.states_for(user, modules = ordered.to_a)
    states_by_user([user], modules)[user.id]
  end

  # `.states_for` for several users at once, keyed by user id, in the same
  # number of queries however many users there are.
  def self.states_by_user(users, modules = ordered.to_a)
    ids = modules.map(&:id)
    user_ids = users.map(&:id)
    completed = UserModuleProgress.done.where(user_id: user_ids, course_module_id: ids)
                                  .pluck(:user_id, :course_module_id).to_set
    exercise_counts = Exercise.where(course_module_id: ids).group(:course_module_id).count
    completion_counts = ExerciseCompletion.joins(:exercise)
                                          .where(user_id: user_ids, exercises: { course_module_id: ids })
                                          .group(:user_id, "exercises.course_module_id").count
    courses = modules.group_by(&:level).values.map { |course_modules| course_modules.sort_by(&:position) }

    user_ids.index_with do |user_id|
      courses.each_with_object({}) do |course_modules, states|
        previous_completed = true
        course_modules.each do |m|
          is_completed = completed.include?([user_id, m.id])
          done = completion_counts.fetch([user_id, m.id], 0)
          total = exercise_counts.fetch(m.id, 0)

          status =
            if is_completed then "completed"
            elsif !previous_completed then "locked"
            elsif done.positive? then "in_progress"
            else "available"
            end
          progress = is_completed ? 100 : (total.zero? ? 0 : (done * 100.0 / total).round)

          states[m.id] = { status: status, progress: progress }
          previous_completed = is_completed
        end
      end
    end
  end

  # Each user's Course progress, keyed by user id, as a Club Manager follows
  # their Coaches: for every Course in Level order, the Modules with Module
  # Completion out of the Course's Modules, and progress computed as the
  # Course home does (the mean of its Modules' progress). A Planned Course has
  # no Modules, so its modulesTotal is 0. The same number of queries however
  # many users there are.
  def self.progress_for(users)
    modules = ordered.to_a
    states = states_by_user(users, modules)
    exercises_done = ExerciseCompletion.where(user_id: users.map(&:id)).group(:user_id).count
    modules_by_level = modules.group_by(&:level)

    users.to_h do |user|
      courses = Level::VALUES.keys.map(&:to_s).map do |level|
        course_states = modules_by_level.fetch(level, []).map { |m| states[user.id][m.id] }
        {
          level: level,
          modulesDone: course_states.count { |s| s[:status] == "completed" },
          modulesTotal: course_states.size,
          progress: course_states.empty? ? 0 : (course_states.sum { |s| s[:progress] }.to_f / course_states.size).round
        }
      end
      [user.id, { courses: courses, exercisesDone: exercises_done.fetch(user.id, 0) }]
    end
  end

  # One user's entry from `.progress_for`.
  def self.course_progress_for(user)
    progress_for([user])[user.id]
  end

  def self.dashboard_list_for(user)
    modules = ordered.to_a
    states = states_for(user, modules)
    modules.map { |m| m.as_dashboard_json(states[m.id]) }
  end

  # averageQuiz has no real tracking yet (Quizzes aren't backed by database
  # models) -- it stays nil until that exists.
  def self.dashboard_stats_for(user)
    states = states_for(user).values

    {
      progress: states.empty? ? 0 : (states.sum { |s| s[:progress] }.to_f / states.size).round,
      modulesDone: states.count { |s| s[:status] == "completed" },
      modulesTotal: states.size,
      exercisesDone: ExerciseCompletion.where(user: user).count,
      averageQuiz: nil
    }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[slug title description level position duration created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
