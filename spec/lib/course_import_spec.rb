require "rails_helper"

RSpec.describe CourseImport do
  def module_entry(slug, description: "Tema", content: "## Secção\n\n- Item;")
    {
      externalId: slug,
      title: { "pt" => "Mesociclo", "en-US" => "Module" },
      topics: { "pt" => [ "Balão" ], "en-US" => [ "Lob" ] },
      description: { "pt" => description, "en-US" => description },
      content: { "pt" => content, "en-US" => content },
      duration: { "pt" => "2 - 6 semanas", "en-US" => "2 - 6 weeks" }
    }
  end

  def question(correct_index: 1)
    {
      question: { "en-US" => "How many?", "pt" => "Quantos?" },
      answers: { "en-US" => %w[One Two], "pt" => %w[Um Dois] },
      correctIndex: correct_index
    }
  end

  def write(root, path, data)
    root.join(path).dirname.mkpath
    File.write(root.join(path), JSON.generate(data))
  end

  around do |example|
    Dir.mktmpdir do |dir|
      @root = Pathname(dir)
      write(@root, "docs/courses/beginner.json", [ module_entry("module-1") ])
      write(@root, "docs/courses/intermediate.json", [ module_entry("module-8"), module_entry("module-9") ])
      write(@root, "docs/questions/module-1.json", { questions: [ question ] })
      write(@root, "docs/questions/module-9.json", { questions: [ question, question(correct_index: 0) ] })
      write(@root, "docs/questions/module-99.json", { questions: [ question ] })
      write(@root, "docs/questions/unassigned/coaching-tools.json", { questions: [ question ] })
      example.run
    end
  end

  let(:root) { @root }

  it "creates each Course's Modules in order, and the Quizzes that have a questions file" do
    log = described_class.new(root: root).run.log

    expect(CourseModule.ordered.pluck(:slug, :level, :position))
      .to eq([ [ "module-1", "beginner", 1 ], [ "module-8", "intermediate", 1 ], [ "module-9", "intermediate", 2 ] ])
    expect(CourseModule.find_by(slug: "module-8").quiz).to be_nil
    quiz = CourseModule.find_by(slug: "module-9").quiz
    expect(quiz.question_rows).to eq([
      { text_pt: "Quantos?", text_en: "How many?", options_pt: %w[Um Dois], options_en: %w[One Two], correct_index: 1 },
      { text_pt: "Quantos?", text_en: "How many?", options_pt: %w[Um Dois], options_en: %w[One Two], correct_index: 0 }
    ])
    expect(log).to include("Created: module-9", "  Created Quiz: 2 questions")
  end

  it "skips question files with no Module and those under unassigned" do
    log = described_class.new(root: root).run.log

    expect(Quiz.count).to eq(2)
    expect(log).to include("Skipped: docs/questions/module-99.json (no Module module-99)")
    expect(log.join).not_to include("coaching-tools")
  end

  it "changes nothing when run again" do
    described_class.new(root: root).run

    expect { @log = described_class.new(root: root).run.log }
      .not_to(change { [ CourseModule.maximum(:updated_at), QuizQuestion.pluck(:id).sort ] })
    expect(@log).to include("Unchanged: module-1", "  Unchanged Quiz: 1 questions")
  end

  it "updates existing Modules and Quizzes from changed files" do
    described_class.new(root: root).run
    CourseModule.find_by(slug: "module-8").update!(title: "Edited in the admin")
    write(root, "docs/courses/intermediate.json", [ module_entry("module-8", description: "Novo", content: ""), module_entry("module-9") ])
    write(root, "docs/questions/module-1.json", { questions: [ question(correct_index: 0) ] })

    log = described_class.new(root: root).run.log

    placeholder = CourseModule.find_by(slug: "module-8")
    expect([ placeholder.title, placeholder.description, placeholder.content ]).to eq([ "Mesociclo", "Novo", "" ])
    expect(CourseModule.find_by(slug: "module-1").quiz.question_rows.map { |r| r[:correct_index] }).to eq([ 0 ])
    expect(log).to include("Updated: module-8", "  Updated Quiz: 1 questions")
  end

  it "imports the repo's Courses and Quizzes" do
    described_class.new.run

    expect(CourseModule.where(level: :beginner).count).to eq(7)
    expect(CourseModule.where(level: :intermediate).ordered.pluck(:slug)).to eq((8..14).map { |n| "module-#{n}" })
    expect(Quiz.count).to eq(14)
    expect(CourseModule.find_by(slug: "module-13").sections).to be_present
    expect(CourseModule.find_by(slug: "module-8").sections).to be_empty
  end
end
