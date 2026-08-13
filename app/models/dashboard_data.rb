module DashboardData
  MODULE_1_SECTIONS = [
    {
      heading: "1st Service",
      items: [
        "Mind-Set: the player must assume greater risk in their execution;",
        "Application of slice effect - elevation of the elbow with an angle greater than 90º relative to the shoulder;"
      ]
    },
    {
      heading: "2nd Service",
      items: [
        "Mind-Set: The player must reduce risk in their execution;",
        "Application of flat effect;"
      ]
    },
    {
      heading: "Dynamic Balance",
      items: [
        "Body launch after ball execution;",
        "Avoid launching the body before execution;",
        "Rotation around the body's own axis;"
      ]
    },
    {
      heading: "Trajectories",
      items: [
        "Inside-out: the twisting of the forearm and wrist promotes the racket's entry from inside to outside the ball;",
        "Outside-in: the twisting of the forearm and wrist promotes the racket's entry from outside to inside;"
      ]
    },
    {
      heading: "Launch",
      items: [
        "Static - characterized by launching the ball against the ground to avoid a bounce higher than waist height;",
        "Dynamic - characterized by launching the ball in the air to enhance a descending technical movement pattern;"
      ]
    },
    {
      heading: "Service return",
      items: [
        "Lateral glass placement - enhances greater mobility from the corner to the \"T\" line;",
        "Placement near the \"T\" line - camouflages the lack of mobility from the corner to the \"T\" line;"
      ]
    },
    {
      heading: "1st Volley",
      items: [
        "1st Service - The mindset promotes a more moderate approach (sector 1 or 2) and theoretically, the execution speed should be between 3 to 4 considering the quality of the return, supposedly more defensive.",
        "2nd Service - The mindset promotes a more aggressive approach (sector 2) and theoretically, the execution speed should be between 2 to 3 considering the quality of the return, supposedly more offensive."
      ]
    }
  ].freeze

  MODULES = [
    { id: "module-1", n: 1, title: "Module 1", description: "Game Initiation Model", topics: ["Service", "Return", "1st Volley"], duration: "2 – 4 weeks", level: "Beginner", status: "done", progress: 100, sections: MODULE_1_SECTIONS },
    { id: "module-2", n: 2, title: "Module 2", description: "Five in Line Concept: Posture, Preparation, Mobility, Stability and Impact Point", topics: ["Posture", "Preparation", "Mobility", "Stability", "Execution"], duration: "2 – 4 weeks", level: "Beginner", status: "done", progress: 100 },
    { id: "module-3", n: 3, title: "Module 3", description: "Cross-cutting Concepts for Aerial and Ground Game", topics: ["Forehand", "Backhand", "Volley"], duration: "2 – 4 weeks", level: "Beginner", status: "current", progress: 40 },
    { id: "module-4", n: 4, title: "Module 4", description: "The concept of Defense, Counter-attack and Attack", topics: ["Defense", "Counter-attack", "Attack", "Technical preparation", "Racket handling"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-5", n: 5, title: "Module 5", description: "Positive-positive, Positive, neutral, negative or negative-negative", topics: ["Glass Exit"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-6", n: 6, title: "Module 6", description: "Technical approach to aerial movements: Traditional Smashes and Viper", topics: ["Traditional Smash", "Viper", "Net"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-7", n: 7, title: "Module 7", description: "Conceptual definition underlying the numerology of glasses and net sectors", topics: ["Glasses", "Speedometer"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-8", n: 8, title: "Module 8", description: "Coaching Tools", topics: ["Observation Method", "Types of Feedback", "\"Student\" Model", "Types of Ball Throws"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 }
  ].freeze

  EXERCISES = [
    { ref: "EX-01", title: "Slice serve, elbow above 90º", category: "Technical", media: "VIDEO", moduleId: "module-1", duration: "8 – 10 min", description: "Ten serves per side focusing on elbow elevation above 90º relative to the shoulder, with a static ball launch that keeps the bounce below waist height." },
    { ref: "EX-02", title: "Static vs dynamic ball launch", category: "Technical", media: "GIF", moduleId: "module-1", duration: "6 min", description: "Alternate static and dynamic launches in sets of five, checking that the body is only launched after the ball is struck." },
    { ref: "EX-03", title: "Return from the lateral glass", category: "Tactical", media: "VIDEO", moduleId: "module-1", duration: "12 min", description: "Start in the corner, read the serve, and recover to the \"T\" line after every return." },
    { ref: "EX-04", title: "1st volley to sector 2", category: "Tactical", media: "IMAGE", moduleId: "module-1", duration: "10 min", description: "Approach after serve and place the first volley in sector 2 at execution speed 3." },
    { ref: "EX-05", title: "Pivot step, both sides", category: "Technical", media: "GIF", moduleId: "module-2", duration: "5 min", description: "Shoulder rotation, waist and hip unlocking, five reps each side without hitting a ball." },
    { ref: "EX-06", title: "Traffic light stop drill", category: "Technical", media: "VIDEO", moduleId: "module-2", duration: "8 min", description: "Green, yellow, red stopping cues before contact, run as a shadow drill across the court." },
    { ref: "EX-07", title: "Speedometer 1 to 5 ladder", category: "Tactical", media: "IMAGE", moduleId: "module-3", duration: "12 min", description: "Hit the same shot at each of the five categorised speeds and note where control breaks down." },
    { ref: "EX-08", title: "Glass exit, dominant side", category: "Tactical", media: "VIDEO", moduleId: "module-5", duration: "10 min", description: "Read the parabola, wait for the inflection point, and exit with a rectilinear counter-attack pattern." }
  ].freeze

  QUIZ = [
    { q: "On the 1st service, what mind-set should the player adopt?", options: ["Assume greater risk in the execution", "Reduce the risk in the execution", "Keep the same risk as the 2nd service"], correct: 0 },
    { q: "The slice effect on the serve requires the elbow at…", options: ["An angle greater than 90º relative to the shoulder", "An angle below the shoulder line", "Full extension directly overhead"], correct: 0 },
    { q: "Dynamic balance means the body is launched…", options: ["Before the ball is struck", "After the ball is struck", "Only on the second serve"], correct: 1 },
    { q: "Placing the return near the \"T\" line…", options: ["Enhances mobility from the corner to the \"T\" line", "Camouflages the lack of mobility from the corner to the \"T\" line", "Is reserved for flat serves"], correct: 1 }
  ].freeze

  DAYS = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze

  SHORT_DAY = {
    "Monday" => "MON", "Tuesday" => "TUE", "Wednesday" => "WED",
    "Thursday" => "THU", "Friday" => "FRI", "Saturday" => "SAT", "Sunday" => "SUN"
  }.freeze

  DEFAULT_PLAN = {
    "Monday" => ["EX-01"], "Tuesday" => [], "Wednesday" => ["EX-06"],
    "Thursday" => ["EX-08"], "Friday" => [], "Saturday" => [], "Sunday" => []
  }.freeze

  COURSE_STATS = {
    progress: 31, modulesDone: 2, modulesTotal: 8, exercisesDone: 14, averageQuiz: 86
  }.freeze

  def self.find_module(id)
    MODULES.find { |m| m[:id] == id }
  end

  def self.find_exercise(ref)
    EXERCISES.find { |e| e[:ref] == ref }
  end
end
