require "rails_helper"

RSpec.describe "Admin exercises management", type: :request do
  let(:admin) { create(:user, role: :admin) }

  before { sign_in admin }

  it "lists exercises" do
    create(:exercise, title: "Special Exercise")
    get "/admin/exercises"
    expect(response).to have_http_status(200)
    expect(response.body).to include("Special Exercise")
  end

  it "filters exercises by category" do
    create(:exercise, title: "Tactical One", category: :tactical)
    get "/admin/exercises", params: { q: { category_eq: Exercise.categories["tactical"] } }
    expect(response).to have_http_status(200)
    expect(response.body).to include("Tactical One")
  end

  it "creates an exercise for a course module" do
    course_module = create(:course_module)

    expect {
      post "/admin/exercises", params: {
        exercise: {
          course_module_id: course_module.id, ref: "exercise-9.0", title: "New Exercise",
          category: "technical", duration: "10 min", description: "Desc", content: "Objetivo: ..."
        }
      }
    }.to change(Exercise, :count).by(1)

    created = Exercise.find_by(ref: "exercise-9.0")
    expect(created.course_module).to eq(course_module)
  end

  it "updates an exercise's title" do
    target = create(:exercise, title: "Old Title")
    patch "/admin/exercises/#{target.id}", params: { exercise: { title: "New Title" } }
    expect(target.reload.title).to eq("New Title")
  end

  it "deletes an exercise" do
    target = create(:exercise)
    expect { delete "/admin/exercises/#{target.id}" }.to change(Exercise, :count).by(-1)
  end

  it "uploads a media file" do
    target = create(:exercise)
    file = fixture_file_upload(Rails.root.join("spec/fixtures/files/sample.pdf"), "application/pdf")

    patch "/admin/exercises/#{target.id}", params: { exercise: { new_media: [file] } }

    expect(target.reload.media.count).to eq(1)
    expect(target.media.first.filename.to_s).to eq("sample.pdf")
  end

  it "keeps existing media when uploading another file" do
    target = create(:exercise)
    target.media.attach(io: StringIO.new("img"), filename: "old.jpg", content_type: "image/jpeg")
    file = fixture_file_upload(Rails.root.join("spec/fixtures/files/sample.pdf"), "application/pdf")

    patch "/admin/exercises/#{target.id}", params: { exercise: { new_media: [file] } }

    expect(target.reload.media.count).to eq(2)
    expect(target.media.map { |m| m.filename.to_s }).to contain_exactly("old.jpg", "sample.pdf")
  end

  it "removes a media file" do
    target = create(:exercise)
    target.media.attach(io: StringIO.new("img"), filename: "old.jpg", content_type: "image/jpeg")
    file = target.media.first

    delete "/admin/exercises/#{target.id}/remove_media", params: { media_id: file.id }

    expect(target.reload.media.count).to eq(0)
  end
end
