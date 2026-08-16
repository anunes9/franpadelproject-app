class CourseModule < ApplicationRecord
  include OrganizesAttachments

  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }

  has_many :user_module_progresses, dependent: :destroy
  has_many :exercises, -> { order(:ref) }, dependent: :destroy
  has_many_attached :documents
  organizes_attachment :documents, folder: -> { "course_modules/#{slug}/documents" }

  validates :slug, :title, :description, :duration, presence: true
  validates :slug, uniqueness: true

  scope :ordered, -> { order(:level, :position) }

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

  def as_dashboard_json(progress = nil)
    {
      id: slug,
      n: position,
      title: title,
      description: description,
      topics: topics,
      duration: duration,
      level: level.capitalize,
      status: progress&.status || "locked",
      progress: progress&.progress || 0
    }
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

  def self.dashboard_list_for(user)
    modules = ordered.to_a
    progresses = UserModuleProgress.where(user: user, course_module_id: modules.map(&:id))
                                    .index_by(&:course_module_id)
    modules.map { |m| m.as_dashboard_json(progresses[m.id]) }
  end

  # exercisesDone/averageQuiz have no real tracking yet (exercises and quizzes
  # aren't backed by database models) -- they stay at 0/nil until that exists.
  def self.dashboard_stats_for(user)
    modules_total = count
    progresses = UserModuleProgress.where(user: user, course_module_id: pluck(:id))

    {
      progress: modules_total.zero? ? 0 : (progresses.sum(:progress).to_f / modules_total).round,
      modulesDone: progresses.done.count,
      modulesTotal: modules_total,
      exercisesDone: 0,
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
