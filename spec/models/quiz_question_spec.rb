require "rails_helper"

RSpec.describe QuizQuestion, type: :model do
  it "is valid with text, matching options and a correct index in both languages" do
    expect(build(:quiz_question)).to be_valid
  end

  it "needs the question in both languages" do
    expect(build(:quiz_question, text_pt: "")).not_to be_valid
    expect(build(:quiz_question, text_en: "")).not_to be_valid
  end

  it "needs 2 to 4 options, none blank" do
    expect(build(:quiz_question, options_pt: %w[Sim], options_en: %w[Yes], correct_index: 0)).not_to be_valid
    expect(build(:quiz_question, options_pt: %w[a b c d e], options_en: %w[a b c d e])).not_to be_valid
    expect(build(:quiz_question, options_pt: [ "Sim", "" ], options_en: %w[Yes No], correct_index: 0)).not_to be_valid
    expect(build(:quiz_question, options_pt: %w[Sim Não], options_en: %w[Yes No], correct_index: 0)).to be_valid
  end

  it "needs the same number of options in each language" do
    question = build(:quiz_question, options_pt: %w[1 2 3], options_en: %w[1 2])

    expect(question).not_to be_valid
    expect(question.errors[:options_en]).to include("must have as many options as Portuguese (3)")
  end

  it "needs the correct index to be one of the options" do
    expect(build(:quiz_question, correct_index: 3)).not_to be_valid
    expect(build(:quiz_question, correct_index: -1)).not_to be_valid
    expect(build(:quiz_question, correct_index: 2)).to be_valid
  end

  it "edits options as one per line, ignoring blank lines and spaces" do
    question = build(:quiz_question)
    question.options_pt_text = " Um \n\nDois\r\nTrês\n"

    expect(question.options_pt).to eq(%w[Um Dois Três])
    expect(question.options_pt_text).to eq("Um\nDois\nTrês")
  end

  it "goes after the Quiz's last question when no position is given" do
    quiz = create(:quiz)
    create(:quiz_question, quiz: quiz, position: 4)

    expect(create(:quiz_question, quiz: quiz, position: nil).position).to eq(5)
  end
end
