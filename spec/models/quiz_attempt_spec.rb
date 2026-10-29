require "rails_helper"

RSpec.describe QuizAttempt, type: :model do
  let(:user) { create(:user) }
  let(:quiz) { create(:quiz) }
  let!(:questions) { Array.new(5) { |i| create(:quiz_question, quiz: quiz, position: i + 1, correct_index: 1) } }

  def answers(right:)
    questions.each_with_index.to_h { |q, i| [ q.id, i < right ? 1 : 0 ] }
  end

  it "scores the percentage of questions answered correctly" do
    attempt = described_class.create!(user: user, quiz: quiz, answers: answers(right: 3))

    expect(attempt.score).to eq(60)
    expect(attempt.correct_count).to eq(3)
    expect(attempt.wrong_question_ids).to eq(questions.last(2).map(&:id))
  end

  it "is a pass at 80% or more" do
    expect(described_class.create!(user: user, quiz: quiz, answers: answers(right: 4))).to be_passed
    expect(described_class.create!(user: user, quiz: quiz, answers: answers(right: 3))).not_to be_passed
  end

  it "rounds the score down, so it never reaches 80% without the answers for it" do
    small = create(:quiz)
    three = Array.new(3) { |i| create(:quiz_question, quiz: small, position: i + 1, correct_index: 1) }
    attempt = described_class.create!(user: user, quiz: small, answers: three.each_with_index.to_h { |q, i| [ q.id, i < 2 ? 1 : 0 ] })

    expect(attempt.score).to eq(66)
  end

  it "accepts answers sent as strings, as a form posts them" do
    attempt = described_class.create!(user: user, quiz: quiz, answers: answers(right: 5).transform_values(&:to_s))

    expect(attempt.score).to eq(100)
  end

  it "refuses an attempt that leaves a question unanswered or picks an option that isn't there" do
    expect(described_class.new(user: user, quiz: quiz, answers: answers(right: 5).except(questions.first.id))).not_to be_valid
    expect(described_class.new(user: user, quiz: quiz, answers: answers(right: 5).merge(questions.first.id => 3))).not_to be_valid
    expect(described_class.new(user: user, quiz: quiz, answers: answers(right: 5).merge("unknown" => 0))).not_to be_valid
  end

  it "keeps its score when the Quiz's questions are edited later" do
    attempt = described_class.create!(user: user, quiz: quiz, answers: answers(right: 5))
    questions.each { |q| q.update!(correct_index: 0) }

    expect(attempt.reload.score).to eq(100)
    expect(described_class.passing).to include(attempt)
  end
end
