# One question of a Quiz. Both languages always have the same options in the
# same order, so one correct index serves both.
class QuizQuestion < ApplicationRecord
  MIN_OPTIONS = 2
  MAX_OPTIONS = 4

  belongs_to :quiz, inverse_of: :questions

  before_validation :default_position

  validates :text_pt, :text_en, presence: true
  validates :position, numericality: { only_integer: true, greater_than: 0 }
  validates :correct_index, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :options_match
  validate :correct_index_in_range
  after_validation :show_option_errors_on_text_fields

  # The question as a docs/questions/<slug>.json row, without its position.
  def row
    {
      text_pt: text_pt, text_en: text_en,
      options_pt: options_pt, options_en: options_en,
      correct_index: correct_index
    }
  end

  # The question as a Client takes it, in their language ("pt" or "en"),
  # without the correct answer.
  def quiz_json(locale)
    en = locale.to_s == "en"
    { id: id, text: en ? text_en : text_pt, options: en ? options_en : options_pt }
  end

  # The admin edits each language's options as one option per line.
  def options_pt_text
    options_pt.join("\n")
  end

  def options_en_text
    options_en.join("\n")
  end

  def options_pt_text=(value)
    self.options_pt = lines(value)
  end

  def options_en_text=(value)
    self.options_en = lines(value)
  end

  private

  def lines(value)
    value.to_s.lines.map(&:strip).reject(&:blank?)
  end

  def default_position
    self.position ||= (quiz&.questions&.map(&:position)&.compact&.max || 0) + 1
  end

  def options_match
    invalid = { options_pt: options_pt, options_en: options_en }.reject do |_, options|
      options.is_a?(Array) && options.size.between?(MIN_OPTIONS, MAX_OPTIONS) && options.all?(&:present?)
    end
    invalid.each_key { |attr| errors.add(attr, "must have #{MIN_OPTIONS} to #{MAX_OPTIONS} options") }
    return if invalid.any? || options_pt.size == options_en.size

    errors.add(:options_en, "must have as many options as Portuguese (#{options_pt.size})")
  end

  # The admin edits options through the *_text fields, so their errors show
  # there too, next to the question they belong to.
  def show_option_errors_on_text_fields
    %i[options_pt options_en].each do |attr|
      errors[attr].each { |message| errors.add(:"#{attr}_text", message) }
    end
  end

  def correct_index_in_range
    return if correct_index.nil? || !options_pt.is_a?(Array) || correct_index < options_pt.size

    errors.add(:correct_index, "must be one of the options")
  end
end
