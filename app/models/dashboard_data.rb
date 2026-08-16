module DashboardData
  QUIZ = [
    { q: "On the 1st service, what mind-set should the player adopt?", options: ["Assume greater risk in the execution", "Reduce the risk in the execution", "Keep the same risk as the 2nd service"], correct: 0 },
    { q: "The slice effect on the serve requires the elbow at…", options: ["An angle greater than 90º relative to the shoulder", "An angle below the shoulder line", "Full extension directly overhead"], correct: 0 },
    { q: "Dynamic balance means the body is launched…", options: ["Before the ball is struck", "After the ball is struck", "Only on the second serve"], correct: 1 },
    { q: "Placing the return near the \"T\" line…", options: ["Enhances mobility from the corner to the \"T\" line", "Camouflages the lack of mobility from the corner to the \"T\" line", "Is reserved for flat serves"], correct: 1 }
  ].freeze

  DAYS = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze

  DEFAULT_PLAN = {
    "Monday" => ["exercise-1.0"], "Tuesday" => [], "Wednesday" => ["exercise-2.0"],
    "Thursday" => ["exercise-5.0"], "Friday" => [], "Saturday" => [], "Sunday" => []
  }.freeze
end
