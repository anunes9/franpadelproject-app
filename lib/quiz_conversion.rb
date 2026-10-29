# Converts the academy's quiz Word documents into one JSON file per Module,
# with PT and EN markdown copies for checking (see docs/specs/Quizzes.md).
#
# Each mesocycle has a PT_module_<n>.docx and an ENG_module_<n>.docx. The two
# are paired question by question, and must agree on the number of questions,
# the number of options and which option is correct. Any disagreement, or a
# question without exactly one correct option, is listed and nothing is written.
class QuizConversion
  FILE_NAME = /\A(PT|ENG)_module_(\d+)\.docx\z/
  MIN_OPTIONS = 2
  MAX_OPTIONS = 4

  attr_reader :errors, :quizzes

  def initialize(source_dir)
    @source_dir = Pathname(source_dir)
    @errors = []
    @quizzes = {}
  end

  # Mesocycle 8, "Coaching Tools", is not a Module. Intermediate Modules are
  # numbered one behind their mesocycles because of it (ADR 0009).
  def self.slug_for(mesocycle)
    case mesocycle
    when 1..7 then "module-#{mesocycle}"
    when 8 then "unassigned/coaching-tools"
    else "module-#{mesocycle - 1}"
    end
  end

  def run
    documents.each do |mesocycle, files|
      pt, en = files.values_at("PT", "ENG")
      next errors << "Mesocycle #{mesocycle}: missing #{pt ? 'ENG' : 'PT'} document" unless pt && en

      quiz = pair(mesocycle, QuizDocument.new(pt), QuizDocument.new(en))
      quizzes[self.class.slug_for(mesocycle)] = quiz if quiz
    end
    errors.empty?
  end

  def write(out_dir)
    out_dir = Pathname(out_dir)
    quizzes.each do |slug, quiz|
      path = out_dir.join(slug)
      path.dirname.mkpath
      File.write("#{path}.json", JSON.pretty_generate(quiz) + "\n")
      File.write("#{path}.pt.md", markdown(quiz, "pt", "Questão", "Resposta Correta"))
      File.write("#{path}.en.md", markdown(quiz, "en-US", "Question", "Correct Answer"))
    end
  end

  private

  def documents
    @source_dir.glob("**/*.docx").each_with_object({}) do |path, docs|
      next unless (match = FILE_NAME.match(path.basename.to_s))

      (docs[match[2].to_i] ||= {})[match[1]] = path
    end.sort.to_h
  end

  def pair(mesocycle, pt, en)
    found = []
    if pt.questions.size != en.questions.size
      found << "PT has #{pt.questions.size} questions, ENG has #{en.questions.size}"
    end

    questions = pt.questions.zip(en.questions).each_with_index.filter_map do |(p, e), i|
      next unless e

      problems = question_problems(p, e)
      found.concat(problems.map { |problem| "question #{i + 1}: #{problem}" })
      next if problems.any?

      {
        question: { "en-US" => e.text, "pt" => p.text },
        answers: { "en-US" => e.options, "pt" => p.options },
        correctIndex: p.correct_index
      }
    end

    errors.concat(found.map { |f| "Mesocycle #{mesocycle}: #{f}" })
    return if found.any?

    { title: { "en-US" => en.title, "pt" => pt.title }, questions: questions }
  end

  def question_problems(pt, en)
    problems = []
    if pt.options.size != en.options.size
      problems << "PT has #{pt.options.size} options, ENG has #{en.options.size}"
    elsif !pt.options.size.between?(MIN_OPTIONS, MAX_OPTIONS)
      problems << "#{pt.options.size} options, expected #{MIN_OPTIONS}-#{MAX_OPTIONS}"
    end
    { "PT" => pt, "ENG" => en }.each do |lang, q|
      bold = q.bold.count(true)
      problems << "#{lang} has #{bold} bold options, expected 1 (\"#{q.text.truncate(60)}\")" if bold != 1
    end
    if problems.empty? && pt.correct_index != en.correct_index
      problems << "PT marks option #{letter(pt.correct_index)}, ENG marks #{letter(en.correct_index)}"
    end
    problems
  end

  def markdown(quiz, locale, question_label, answer_label)
    lines = [ "# #{quiz[:title][locale]}", "" ]
    quiz[:questions].each.with_index(1) do |q, n|
      lines << "## #{question_label} #{n}" << "" << "**#{q[:question][locale]}**" << ""
      q[:answers][locale].each_with_index { |a, i| lines << "- #{letter(i)}) #{a}" }
      lines << "" << "**#{answer_label}: #{letter(q[:correctIndex])}**" << ""
    end
    lines.join("\n")
  end

  def letter(index)
    ("A".ord + index).chr
  end
end
