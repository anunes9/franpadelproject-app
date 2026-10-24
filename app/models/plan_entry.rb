# One item on a user's weekly plan: an exercise or a module on a given
# weekday. The plan is a recurring week (Monday to Sunday), not a dated
# calendar.
class PlanEntry < ApplicationRecord
  DAYS = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze

  enum :day, DAYS.each_with_index.to_h { |name, index| [name.downcase.to_sym, index] }

  belongs_to :user
  belongs_to :plannable, polymorphic: true

  validates :plannable_id, uniqueness: { scope: [:user_id, :day, :plannable_type] }

  scope :ordered, -> { order(:day, :position, :created_at) }

  # Resolves the `kind` + `key` pair the frontend sends ("exercise" + ref, or
  # "module" + slug). Returns nil for anything else.
  def self.find_plannable(kind, key)
    case kind
    when "exercise" then Exercise.find_by(ref: key)
    when "module" then CourseModule.find_by(slug: key)
    end
  end

  # { "Monday" => [entry json, ...], ..., "Sunday" => [] }
  def self.week_json_for(user)
    week = DAYS.to_h { |name| [name, []] }
    user.plan_entries.ordered.includes(:plannable).each do |entry|
      week[DAYS[days[entry.day]]] << entry.as_dashboard_json
    end
    week
  end

  def as_dashboard_json
    case plannable
    when Exercise
      {
        id: id,
        kind: "exercise",
        key: plannable.ref,
        title: plannable.title,
        detail: plannable.category&.capitalize,
        href: "/dashboard/exercises/#{plannable.ref}"
      }
    when CourseModule
      {
        id: id,
        kind: "module",
        key: plannable.slug,
        title: plannable.title,
        detail: plannable.description,
        href: "/dashboard/courses/#{plannable.slug}"
      }
    end
  end
end
