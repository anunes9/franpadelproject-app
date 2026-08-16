class Exercise < ApplicationRecord
  include OrganizesAttachments

  enum :category, { technical: 0, tactical: 1 }

  belongs_to :course_module
  has_many :exercise_completions, dependent: :destroy
  has_many_attached :media
  organizes_attachment :media, folder: -> { "exercises/#{ref}/media" }

  validates :ref, :title, :description, presence: true
  validates :ref, uniqueness: true

  scope :ordered, -> { order(:ref) }

  # Assigning `media=` directly (has_many_attached's own writer) replaces the
  # whole collection. This virtual attribute appends instead, so uploading a
  # new file in the admin doesn't remove the existing ones.
  def new_media=(files)
    media.attach(files) if files.present?
  end

  def media_json
    media.map do |file|
      {
        id: file.id,
        filename: file.filename.to_s,
        contentType: file.content_type,
        url: Rails.application.routes.url_helpers.rails_blob_path(file, disposition: "inline", only_path: true)
      }
    end
  end

  def completed_for?(user)
    exercise_completions.exists?(user: user)
  end

  def as_dashboard_json(user = nil)
    {
      ref: ref,
      title: title,
      category: category&.capitalize,
      duration: duration,
      description: description,
      content: content,
      media: media_json,
      moduleId: course_module.slug,
      completed: user ? completed_for?(user) : false
    }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[ref title category duration content course_module_id created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[course_module]
  end
end
