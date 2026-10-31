class Exercise < ApplicationRecord
  include OrganizesAttachments

  enum :category, { technical: 0, tactical: 1 }

  belongs_to :course_module, optional: true
  has_many :exercise_completions, dependent: :destroy
  # Its official Board, authored by Admins, which replaces its first image as
  # its court diagram wherever that is shown.
  has_one :board, as: :boardable, dependent: :destroy
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

  # The Exercise as a Class's page lists it, picked or available to pick,
  # with its court diagram: its Board's document when it has one, and its
  # first image. Load it .with_attached_media.includes(:board).
  def as_class_json
    {
      ref: ref, title: title, category: category&.capitalize, duration: duration, image: image_url,
      board: board&.document
    }
  end

  # Its first image's URL, or nil.
  def image_url
    image = media.find { |file| file.content_type.to_s.start_with?("image/") }
    image && Rails.application.routes.url_helpers.rails_blob_path(image, disposition: "inline", only_path: true)
  end

  # `completed` lets a caller that already knows the answer (see
  # .dashboard_list) skip the per-Exercise query.
  def as_dashboard_json(user = nil, completed: nil)
    as_class_json.merge(
      description: description,
      content: content,
      media: media_json,
      moduleId: course_module&.slug,
      completed: completed.nil? ? (user ? completed_for?(user) : false) : completed
    )
  end

  # Serializes many Exercises in a fixed number of queries, however many there
  # are: Modules and media are preloaded and the Client's Exercise Completions
  # are fetched once.
  def self.dashboard_list(scope, user)
    exercises = scope.includes(:course_module, :board).with_attached_media.to_a
    completed_ids = ExerciseCompletion.where(user: user, exercise_id: exercises.map(&:id)).pluck(:exercise_id).to_set
    exercises.map { |e| e.as_dashboard_json(user, completed: completed_ids.include?(e.id)) }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[ref title category duration content course_module_id created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[course_module]
  end
end
