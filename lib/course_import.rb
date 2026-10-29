# Imports each Course's Modules from docs/courses/<level>.json and their
# Quizzes from docs/questions/<module-slug>.json.
#
# Modules are matched by slug and updated with the fields that come from the
# JSON, so running it again picks up changes to the files, and overwrites any
# admin edits to those fields. A Quiz's questions are replaced only when they
# differ from the file. Files under docs/questions/unassigned, and question
# files with no Module, are skipped. Running it twice changes nothing the
# second time.
class CourseImport
  COURSES = {
    beginner: "docs/courses/beginner.json",
    intermediate: "docs/courses/intermediate.json"
  }.freeze
  QUESTIONS = "docs/questions"

  attr_reader :log

  def initialize(root: Rails.root)
    @root = Pathname(root)
    @log = []
  end

  def run
    slugs = COURSES.flat_map do |level, path|
      JSON.parse(@root.join(path).read).each_with_index.map do |entry, index|
        course_module = import_module(level, entry, index + 1)
        import_quiz(course_module)
        course_module.slug
      end
    end

    @root.join(QUESTIONS).glob("*.json").each do |file|
      log << "Skipped: #{file.relative_path_from(@root)} (no Module #{file.basename('.json')})" unless slugs.include?(file.basename(".json").to_s)
    end
    self
  end

  private

  def import_module(level, entry, position)
    course_module = CourseModule.find_or_initialize_by(slug: entry["externalId"])
    course_module.assign_attributes(
      level: level,
      position: position,
      title: entry["title"]["pt"],
      description: entry["description"]["pt"],
      topics: entry["topics"]["pt"],
      duration: entry["duration"]["pt"],
      content: entry["content"]["pt"]
    )
    status = course_module.new_record? ? "Created" : (course_module.changed? ? "Updated" : "Unchanged")
    course_module.save!
    log << "#{status}: #{course_module.slug}"
    course_module
  end

  def import_quiz(course_module)
    file = @root.join(QUESTIONS, "#{course_module.slug}.json")
    return unless file.exist?

    rows = JSON.parse(file.read).fetch("questions").map do |q|
      {
        text_pt: q["question"]["pt"], text_en: q["question"]["en-US"],
        options_pt: q["answers"]["pt"], options_en: q["answers"]["en-US"],
        correct_index: q["correctIndex"]
      }
    end
    quiz = course_module.quiz || course_module.build_quiz
    status = quiz.new_record? ? "Created" : "Updated"
    status = "Unchanged" unless quiz.replace_questions!(rows)
    log << "  #{status} Quiz: #{rows.size} questions"
  end
end
