# The checks a Board's document passes before it is saved, mirroring its
# shape in app/frontend/board/document.ts (docs/specs/Boards.md, "Document
# shape"). Coordinates are metres: pieces stand on the 20 × 10 m court, and
# markings may reach a little past the walls, into the label margin.
#
#   BoardDocument.problems(document) # => [] when valid
#
# The problems are for developers and logs; a Client only learns that the
# Board couldn't be saved.
class BoardDocument
  VERSION = 1
  MAX_BYTES = 256.kilobytes
  MAX_STEPS = 40
  MAX_PIECES = 40
  MAX_MARKS = 200
  MAX_INK_POINTS = 2_000
  MAX_CAPTION = 140
  MAX_TEXT = 40

  VIEWS = %w[full half].freeze
  LABELS = %w[sectors glass none].freeze
  PLAYER_LABELS = %w[A B C D].freeze
  ZONE_FILLS = %w[striped outline].freeze
  GLASS_NUMBERS = { "back" => [1, 2, 3], "side" => [1, 2] }.freeze

  COURT_X = 0.0..20.0
  COURT_Y = 0.0..10.0
  VIEW_X = -0.7..20.7
  VIEW_Y = -0.7..10.7

  def self.problems(document)
    new(document).problems
  end

  def self.too_large?(document)
    document.to_json.bytesize > MAX_BYTES
  end

  def initialize(document)
    @document = document
    @problems = []
  end

  def problems
    check_document
    @problems
  end

  private

  def problem(message)
    @problems << message
    false
  end

  def check_document
    return problem("not an object") unless @document.is_a?(Hash)
    return problem("unknown version") unless @document["version"] == VERSION

    problem("unknown view") unless VIEWS.include?(@document["view"])
    problem("unknown labels") unless LABELS.include?(@document["labels"])
    piece_ids = check_pieces(@document["pieces"])
    check_steps(@document["steps"], piece_ids) if piece_ids
  end

  # The pieces' ids, or nil when they can't be read.
  def check_pieces(pieces)
    return problem("pieces is not a list") || nil unless pieces.is_a?(Array)
    return problem("too many pieces") || nil if pieces.size > MAX_PIECES

    pieces.each { |piece| check_piece(piece) }
    ids = pieces.map { |piece| piece.is_a?(Hash) ? piece["id"] : nil }
    problem("piece ids are not unique") unless ids.uniq.size == ids.size
    labels = pieces.filter_map { |piece| piece["label"] if piece.is_a?(Hash) && piece["kind"] == "player" }
    problem("a player letter is used twice") unless labels.uniq.size == labels.size
    %w[coach ball].each do |kind|
      problem("more than one #{kind}") if pieces.count { |piece| piece.is_a?(Hash) && piece["kind"] == kind } > 1
    end
    ids
  end

  def check_piece(piece)
    return problem("a piece is not an object") unless piece.is_a?(Hash) && id?(piece["id"])

    case piece["kind"]
    when "player"
      problem("unknown player letter") unless PLAYER_LABELS.include?(piece["label"])
    when "coach", "ball", "cone"
      nil
    else
      problem("unknown piece kind")
    end
  end

  def check_steps(steps, piece_ids)
    return problem("steps is not a list") unless steps.is_a?(Array)
    return problem("no steps") if steps.empty?
    return problem("too many steps") if steps.size > MAX_STEPS

    steps.each { |step| check_step(step, piece_ids) }
  end

  # Every piece stands somewhere on the court in every Step.
  def check_step(step, piece_ids)
    return problem("a step is not an object") unless step.is_a?(Hash)

    caption = step["caption"]
    problem("bad caption") unless caption.is_a?(String) && caption.length <= MAX_CAPTION
    positions = step["positions"]
    if positions.is_a?(Hash) && positions.keys.sort == piece_ids.sort
      positions.each_value { |at| problem("a piece is off the court") unless point?(at, COURT_X, COURT_Y) }
    else
      problem("positions don't match the pieces")
    end
    marks = step["marks"]
    return problem("marks is not a list") unless marks.is_a?(Array)
    return problem("too many marks") if marks.size > MAX_MARKS

    marks.each { |mark| check_mark(mark) }
    ids = marks.map { |mark| mark.is_a?(Hash) ? mark["id"] : nil }
    problem("mark ids are not unique") unless ids.uniq.size == ids.size
  end

  def check_mark(mark)
    return problem("a mark is not an object") unless mark.is_a?(Hash) && id?(mark["id"])

    case mark["kind"]
    when "ballPath" then check_ball_path(mark)
    when "arrow"
      problem("bad arrow") unless point?(mark["from"]) && point?(mark["to"])
    when "zone" then check_zone(mark)
    when "text"
      text = mark["text"]
      problem("bad text") unless point?(mark) && text.is_a?(String) && text.strip.present? && text.length <= MAX_TEXT
    when "ink"
      points = mark["points"]
      valid = points.is_a?(Array) && points.size.between?(2, MAX_INK_POINTS) &&
              points.all? { |p| p.is_a?(Array) && p.size == 2 && number?(p[0], VIEW_X) && number?(p[1], VIEW_Y) }
      problem("bad ink") unless valid
    else
      problem("unknown mark kind")
    end
  end

  def check_ball_path(mark)
    points = mark["points"]
    return problem("bad ball path") unless points.is_a?(Array) && points.size.between?(2, 20)

    points.each do |p|
      problem("bad ball path point") unless point?(p)
      glass = p.is_a?(Hash) ? p["glass"] : nil
      next if glass.nil?

      problem("unknown glass panel") unless glass.is_a?(Hash) && GLASS_NUMBERS[glass["wall"]]&.include?(glass["number"])
    end
  end

  def check_zone(mark)
    problem("unknown zone fill") unless ZONE_FILLS.include?(mark["fill"])
    case mark["shape"]
    when "rect"
      valid = point?(mark) && number?(mark["w"], 0.0..21.4) && number?(mark["h"], 0.0..11.4)
      problem("bad rectangle zone") unless valid
    when "circle"
      valid = number?(mark["cx"], VIEW_X) && number?(mark["cy"], VIEW_Y) && number?(mark["r"], 0.0..12.0)
      problem("bad circle zone") unless valid
    else
      problem("unknown zone shape")
    end
  end

  def id?(value)
    value.is_a?(String) && value.match?(/\A[\w-]{1,40}\z/)
  end

  def number?(value, range)
    value.is_a?(Numeric) && value.finite? && range.cover?(value)
  end

  def point?(value, x_range = VIEW_X, y_range = VIEW_Y)
    value.is_a?(Hash) && number?(value["x"], x_range) && number?(value["y"], y_range)
  end
end
