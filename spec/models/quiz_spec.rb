require "rails_helper"

RSpec.describe Quiz, type: :model do
  let(:row) do
    { text_pt: "Pergunta", text_en: "Question", options_pt: %w[Sim Não], options_en: %w[Yes No], correct_index: 0 }
  end

  it "allows at most one Quiz per Module" do
    course_module = create(:course_module)
    create(:quiz, course_module: course_module)

    expect(build(:quiz, course_module: course_module)).not_to be_valid
  end

  it "keeps its questions in position order" do
    quiz = create(:quiz)
    create(:quiz_question, quiz: quiz, position: 2, text_en: "Second")
    create(:quiz_question, quiz: quiz, position: 1, text_en: "First")

    expect(quiz.questions.map(&:text_en)).to eq(%w[First Second])
  end

  describe "#replace_questions!" do
    it "saves a new Quiz with the rows as its questions, numbered from 1" do
      quiz = create(:course_module).build_quiz

      expect(quiz.replace_questions!([ row, row.merge(text_en: "Other") ])).to be(true)
      expect(quiz.reload.questions.map(&:position)).to eq([ 1, 2 ])
      expect(quiz.question_rows.last).to eq(row.merge(text_en: "Other"))
    end

    it "changes nothing when the rows already match" do
      quiz = create(:course_module).build_quiz
      quiz.replace_questions!([ row ])

      expect { expect(quiz.replace_questions!([ row ])).to be(false) }
        .not_to(change { quiz.questions.reload.pluck(:id) })
    end

    it "replaces the questions when the rows differ" do
      quiz = create(:course_module).build_quiz
      quiz.replace_questions!([ row, row ])

      expect(quiz.replace_questions!([ row.merge(correct_index: 1) ])).to be(true)
      expect(quiz.question_rows).to eq([ row.merge(correct_index: 1) ])
    end
  end

  describe "CourseModule#quiz?" do
    it "is false without a Quiz or with a Quiz that has no questions" do
      course_module = create(:course_module)
      expect(course_module.quiz?).to be(false)

      create(:quiz, course_module: course_module)
      expect(course_module.reload.quiz?).to be(false)
    end

    it "is true once the Quiz has a question" do
      quiz = create(:quiz)
      create(:quiz_question, quiz: quiz)

      expect(quiz.course_module.reload.quiz?).to be(true)
    end
  end
end
