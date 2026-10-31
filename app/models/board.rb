# A saved Board (Quadro): an interactive padel court with pieces and markings
# in Steps, used to explain an Exercise or a tactic (docs/specs/Boards.md).
#
# A Board is scratch until a Coach saves it (ADR 0010); a saved one belongs to
# that Coach's library and nobody else sees it. Exercise Boards, authored by
# Admins, come later and will add Exercise to the boardable types.
class Board < ApplicationRecord
  BOARDABLE_TYPES = %w[User].freeze
  MAX_TITLE = 80

  belongs_to :boardable, polymorphic: true

  validates :boardable_type, inclusion: { in: BOARDABLE_TYPES }
  validates :title, presence: true, length: { maximum: MAX_TITLE }
  validate :document_is_a_board

  normalizes :title, with: ->(title) { title.squish }

  scope :recent, -> { order(updated_at: :desc) }

  # A Board in its Coach's library: enough to draw its first Step as a thumbnail.
  def list_json
    { id: id, title: title, updatedAt: updated_at.iso8601, document: document }
  end

  # A Board opened to explain on and edit.
  def editor_json
    { id: id, title: title, updatedAt: updated_at.iso8601, document: document }
  end

  private

  def document_is_a_board
    if BoardDocument.too_large?(document)
      errors.add(:document, :too_large)
    elsif (problems = BoardDocument.problems(document)).any?
      errors.add(:document, :invalid, message: problems.first(3).join("; "))
    end
  end
end
