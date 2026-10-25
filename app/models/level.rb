# The Level scale, shared by every model with a Level (Course Modules,
# Players, Class Groups, users). The integers are what the database stores:
# never renumber them.
module Level
  VALUES = { beginner: 0, intermediate: 1, advanced: 2 }.freeze

  # The Level after `level` in Course order ("beginner" -> "intermediate"),
  # or nil after the last one.
  def self.next(level)
    keys = VALUES.keys.map(&:to_s)
    index = keys.index(level.to_s)
    keys[index + 1] if index
  end
end
