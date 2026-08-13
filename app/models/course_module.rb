class CourseModule < ApplicationRecord
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }

  has_many :user_module_progresses, dependent: :destroy
  has_many_attached :documents

  validates :slug, :title, :description, :duration, presence: true
  validates :slug, uniqueness: true

  scope :ordered, -> { order(:level, :position) }

  def topics_text
    topics.join(", ")
  end

  def topics_text=(value)
    self.topics = value.to_s.split(",").map(&:strip).reject(&:blank?)
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

  def self.dashboard_list_for(user)
    modules = ordered.to_a
    progresses = UserModuleProgress.where(user: user, course_module_id: modules.map(&:id))
                                    .index_by(&:course_module_id)
    modules.map { |m| m.as_dashboard_json(progresses[m.id]) }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[slug title description level position duration created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end
end
