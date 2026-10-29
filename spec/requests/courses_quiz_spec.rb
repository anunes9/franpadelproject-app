require "rails_helper"

RSpec.describe "Courses::Quiz", type: :request do
  let(:user) { create(:user) }
  let(:course_module) { create(:course_module, slug: "module-1", position: 1) }
  let(:quiz) { create(:quiz, course_module: course_module) }
  let!(:questions) do
    Array.new(5) do |i|
      create(:quiz_question, quiz: quiz, position: i + 1, text_pt: "Pergunta #{i + 1}", text_en: "Question #{i + 1}",
                             options_pt: %w[Um Dois Três], options_en: %w[One Two Three], correct_index: 1)
    end
  end

  before { sign_in user }

  def page
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])
  end

  def answers(right:)
    questions.each_with_index.to_h { |q, i| [ q.id, i < right ? 1 : 0 ] }
  end

  def submit(answers)
    post "/dashboard/courses/module-1/quiz/attempts", params: { answers: answers }
  end

  describe "GET /dashboard/courses/:id/quiz" do
    it "renders every question in order, in the Client's language, without the answers" do
      get "/dashboard/courses/module-1/quiz"

      expect(page["component"]).to eq("Courses/Quiz")
      expect(page["props"]["questions"]).to eq(questions.map { |q| { "id" => q.id, "text" => q.text_pt, "options" => %w[Um Dois Três] } })
      expect(page["props"]["result"]).to be_nil
      expect(response.body).not_to include("correct_index", "correctIndex")
    end

    it "shows the Quiz in English to an English-speaking Client" do
      user.update!(locale: :en)

      get "/dashboard/courses/module-1/quiz"

      expect(page["props"]["questions"].first).to include("text" => "Question 1", "options" => %w[One Two Three])
    end

    it "redirects a Locked Module's quiz back to the courses index" do
      create(:course_module, slug: "module-2", position: 2)

      get "/dashboard/courses/module-2/quiz"
      expect(response).to redirect_to("/dashboard/courses")
    end

    it "404s for a Module with no Quiz, or one with no questions" do
      create(:course_module, slug: "module-0", level: :intermediate, position: 1)
      get "/dashboard/courses/module-0/quiz"
      expect(response).to have_http_status(:not_found)

      questions.each(&:destroy!)
      get "/dashboard/courses/module-1/quiz"
      expect(response).to have_http_status(:not_found)
    end

    it "404s for an unknown module id" do
      get "/dashboard/courses/nope/quiz"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /dashboard/courses/:id/quiz/attempts" do
    it "scores and records the attempt, then shows its result once on the Quiz page" do
      expect { submit(answers(right: 4)) }.to change(user.quiz_attempts, :count).by(1)
      expect(response).to redirect_to("/dashboard/courses/module-1/quiz")
      expect(user.quiz_attempts.last.score).to eq(80)

      follow_redirect!
      expect(page["props"]["result"]).to eq(
        "score" => 80, "passed" => true, "correct" => 4, "total" => 5,
        "answers" => answers(right: 4).transform_values(&:to_i),
        "wrongQuestionIds" => [ questions.last.id ]
      )

      get "/dashboard/courses/module-1/quiz"
      expect(page["props"]["result"]).to be_nil
    end

    it "reports a score below 80% as not passed" do
      submit(answers(right: 3))
      follow_redirect!

      expect(page["props"]["result"]).to include("score" => 60, "passed" => false)
      expect(page["props"]["result"]["wrongQuestionIds"]).to eq(questions.last(2).map(&:id))
    end

    it "never sends the correct answers with the result" do
      submit(answers(right: 0))
      follow_redirect!

      expect(page["props"]["result"].keys).to contain_exactly("score", "passed", "correct", "total", "answers", "wrongQuestionIds")
      expect(response.body).not_to include("correct_index", "correctIndex")
    end

    it "lets a Client retake the Quiz as often as they like" do
      3.times { submit(answers(right: 2)) }

      expect(user.quiz_attempts.count).to eq(3)
    end

    it "refuses a submission that leaves a question unanswered" do
      expect { submit(answers(right: 5).except(questions.first.id)) }.not_to change(QuizAttempt, :count)
      expect(response).to redirect_to("/dashboard/courses/module-1/quiz")

      follow_redirect!
      expect(page["props"]["errors"]).to eq("answers" => "incomplete")
      expect(page["props"]["result"]).to be_nil
    end

    it "refuses a submission with no answers at all" do
      expect { post "/dashboard/courses/module-1/quiz/attempts" }.not_to change(QuizAttempt, :count)
    end

    it "redirects a Locked Module back to the courses index without recording anything" do
      locked = create(:course_module, slug: "module-2", position: 2)
      create(:quiz_question, quiz: create(:quiz, course_module: locked))

      expect { post "/dashboard/courses/module-2/quiz/attempts", params: { answers: {} } }.not_to change(QuizAttempt, :count)
      expect(response).to redirect_to("/dashboard/courses")
    end

    it "404s for a Module with no Quiz" do
      create(:course_module, slug: "module-0", level: :intermediate, position: 1)

      post "/dashboard/courses/module-0/quiz/attempts", params: { answers: {} }
      expect(response).to have_http_status(:not_found)
    end
  end
end
