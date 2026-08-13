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
end
