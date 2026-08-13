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
end
