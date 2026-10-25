# The Level scale, shared by every model with a Level (Course Modules,
# Players, Class Groups, users). The integers are what the database stores:
# never renumber them.
module Level
  VALUES = { beginner: 0, intermediate: 1, advanced: 2 }.freeze
end
