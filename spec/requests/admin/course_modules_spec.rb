require "rails_helper"

RSpec.describe "Admin course modules management", type: :request do
  let(:admin) { create(:user, role: :admin) }

  before { sign_in admin }

  it "lists course modules" do
    create(:course_module, title: "Special Module")
    get "/admin/course_modules"
    expect(response).to have_http_status(200)
    expect(response.body).to include("Special Module")
  end

  it "filters course modules by level" do
    create(:course_module, title: "Intermediate One", level: :intermediate)
    get "/admin/course_modules", params: { q: { level_eq: CourseModule.levels["intermediate"] } }
    expect(response).to have_http_status(200)
    expect(response.body).to include("Intermediate One")
  end

  it "creates a course module with comma-separated topics" do
    expect {
      post "/admin/course_modules", params: {
        course_module: {
          slug: "module-9", level: "beginner", position: 9, title: "Module 9",
          description: "Desc", duration: "2 weeks", topics_text: "Serve, Return",
          content: "## H\n\n- item;"
        }
      }
    }.to change(CourseModule, :count).by(1)

    created = CourseModule.find_by(slug: "module-9")
    expect(created.topics).to eq(%w[Serve Return])
  end

  it "updates a course module's topics" do
    target = create(:course_module, topics: ["Old"])
    patch "/admin/course_modules/#{target.id}", params: {
      course_module: { topics_text: "New, Fresh" }
    }
    expect(target.reload.topics).to eq(%w[New Fresh])
  end

  it "deletes a course module" do
    target = create(:course_module)
    expect { delete "/admin/course_modules/#{target.id}" }.to change(CourseModule, :count).by(-1)
  end

  it "uploads a document" do
    target = create(:course_module)
    file = fixture_file_upload(Rails.root.join("spec/fixtures/files/sample.pdf"), "application/pdf")

    patch "/admin/course_modules/#{target.id}", params: { course_module: { new_documents: [file] } }

    expect(target.reload.documents.count).to eq(1)
    expect(target.documents.first.filename.to_s).to eq("sample.pdf")
  end

  it "keeps existing documents when uploading another one" do
    target = create(:course_module)
    target.documents.attach(io: StringIO.new("pdf"), filename: "old.pdf", content_type: "application/pdf")
    file = fixture_file_upload(Rails.root.join("spec/fixtures/files/sample.pdf"), "application/pdf")

    patch "/admin/course_modules/#{target.id}", params: { course_module: { new_documents: [file] } }

    expect(target.reload.documents.count).to eq(2)
    expect(target.documents.map { |d| d.filename.to_s }).to contain_exactly("old.pdf", "sample.pdf")
  end

  it "removes a document" do
    target = create(:course_module)
    target.documents.attach(io: StringIO.new("pdf"), filename: "old.pdf", content_type: "application/pdf")
    document = target.documents.first

    delete "/admin/course_modules/#{target.id}/remove_document", params: { document_id: document.id }

    expect(target.reload.documents.count).to eq(0)
  end

  describe "the Quiz" do
    let(:question_params) do
      { text_pt: "Quantos serviços?", text_en: "How many services?",
        options_pt_text: "Um\nDois", options_en_text: "One\nTwo", correct_index: "1" }
    end

    it "shows each question with its options and the correct one marked" do
      quiz = create(:quiz)
      create(:quiz_question, quiz: quiz, text_pt: "Quantos?", options_pt: %w[Um Dois], options_en: %w[One Two], correct_index: 1)

      get "/admin/course_modules/#{quiz.course_module.id}"

      expect(response.body).to include("Quiz (1 questions)", "Quantos?", "Dois / Two ✓")
    end

    it "renders the edit form with the question editor" do
      quiz = create(:quiz)
      create(:quiz_question, quiz: quiz)

      get "/admin/course_modules/#{quiz.course_module.id}/edit"

      expect(response).to have_http_status(200)
      expect(response.body).to include("Add question", "Options (PT)", "Correct option")
    end

    it "adds a Quiz with questions to a Module that has none" do
      target = create(:course_module)

      patch "/admin/course_modules/#{target.id}", params: {
        course_module: { quiz_attributes: { questions_attributes: { "0" => question_params } } }
      }

      expect(target.reload.quiz.question_rows).to eq([
        { text_pt: "Quantos serviços?", text_en: "How many services?",
          options_pt: %w[Um Dois], options_en: %w[One Two], correct_index: 1 }
      ])
    end

    it "does not create an empty Quiz when the Module is saved without questions" do
      target = create(:course_module)

      patch "/admin/course_modules/#{target.id}", params: { course_module: { title: "Renamed", quiz_attributes: {} } }

      expect(target.reload.title).to eq("Renamed")
      expect(target.quiz).to be_nil
    end

    it "edits and removes questions" do
      quiz = create(:quiz)
      kept = create(:quiz_question, quiz: quiz, position: 1)
      removed = create(:quiz_question, quiz: quiz, position: 2)

      patch "/admin/course_modules/#{quiz.course_module.id}", params: {
        course_module: { quiz_attributes: { id: quiz.id, questions_attributes: {
          "0" => { id: kept.id, text_en: "Reworded", correct_index: "0" },
          "1" => { id: removed.id, _destroy: "1" }
        } } }
      }

      expect(quiz.reload.questions.map { |q| [ q.text_en, q.correct_index ] }).to eq([ [ "Reworded", 0 ] ])
    end

    it "refuses a question whose languages have different numbers of options" do
      target = create(:course_module)

      patch "/admin/course_modules/#{target.id}", params: {
        course_module: { quiz_attributes: { questions_attributes: {
          "0" => question_params.merge(options_en_text: "One\nTwo\nThree")
        } } }
      }

      expect(response.body).to include("must have as many options as Portuguese (2)")
      expect(Nokogiri::HTML(response.body).at_css("li.error textarea[name*='[options_en_text]']")).to be_present
      expect(target.reload.quiz).to be_nil
    end
  end
end
