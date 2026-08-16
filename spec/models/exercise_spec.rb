require "rails_helper"

RSpec.describe Exercise, type: :model do
  it "is valid with a course module, ref, title, and description" do
    expect(build(:exercise)).to be_valid
  end

  it "requires a ref" do
    expect(build(:exercise, ref: nil)).not_to be_valid
  end

  it "requires a unique ref" do
    create(:exercise, ref: "EX-01")
    expect(build(:exercise, ref: "EX-01")).not_to be_valid
  end

  it "requires a title" do
    expect(build(:exercise, title: nil)).not_to be_valid
  end

  it "allows a blank duration (not curated from the source data yet)" do
    expect(build(:exercise, duration: nil)).to be_valid
  end

  it "allows a blank category (not curated from the source data yet)" do
    expect(build(:exercise, category: nil)).to be_valid
  end

  it "requires a description" do
    expect(build(:exercise, description: nil)).not_to be_valid
  end

  it "defines the expected category values" do
    expect(Exercise.categories.keys).to match_array(%w[technical tactical])
  end

  it "orders by ref" do
    third = create(:exercise, ref: "EX-03")
    first = create(:exercise, ref: "EX-01")
    second = create(:exercise, ref: "EX-02")

    expect(Exercise.ordered.to_a).to eq([first, second, third])
  end

  describe "#media_json" do
    it "returns an empty array when no media is attached" do
      expect(create(:exercise).media_json).to eq([])
    end

    it "returns each attached file's filename, content type, and an inline-disposition url" do
      exercise = create(:exercise)
      exercise.media.attach(io: StringIO.new("video content"), filename: "drill.mp4", content_type: "video/mp4")

      json = exercise.media_json

      expect(json.size).to eq(1)
      expect(json.first).to include(filename: "drill.mp4", contentType: "video/mp4")
      expect(json.first[:url]).to include("disposition=inline")
    end
  end

  describe "organized media storage" do
    it "stores media under exercises/{ref}/media/{filename}" do
      exercise = create(:exercise, ref: "EX-10")
      exercise.media.attach(io: StringIO.new("gif"), filename: "drill.gif", content_type: "image/gif")

      expect(exercise.media.first.blob.key).to eq("exercises/EX-10/media/drill.gif")
    end

    it "organizes media attached through the new_media= writer used by the admin form" do
      exercise = create(:exercise, ref: "EX-11")

      exercise.new_media = [{ io: StringIO.new("img"), filename: "photo.jpg", content_type: "image/jpeg" }]

      expect(exercise.media.first.blob.key).to eq("exercises/EX-11/media/photo.jpg")
    end
  end

  describe "#completed_for?" do
    it "is false when the user has no completion row" do
      expect(create(:exercise).completed_for?(create(:user))).to be false
    end

    it "is true when the user has a completion row" do
      exercise = create(:exercise)
      user = create(:user)
      create(:exercise_completion, user: user, exercise: exercise)

      expect(exercise.completed_for?(user)).to be true
    end
  end

  describe "#as_dashboard_json" do
    it "defaults completed to false when no user is given" do
      exercise = build(:exercise, ref: "EX-01", category: :tactical)
      course_module = exercise.course_module

      expect(exercise.as_dashboard_json).to eq(
        ref: "EX-01",
        title: exercise.title,
        category: "Tactical",
        duration: exercise.duration,
        description: exercise.description,
        content: exercise.content,
        media: [],
        moduleId: course_module.slug,
        completed: false
      )
    end

    it "leaves category and duration nil when not curated yet" do
      exercise = build(:exercise, category: nil, duration: nil)

      expect(exercise.as_dashboard_json).to include(category: nil, duration: nil)
    end

    it "reflects the given user's completion status" do
      exercise = create(:exercise)
      user = create(:user)
      create(:exercise_completion, user: user, exercise: exercise)

      expect(exercise.as_dashboard_json(user)).to include(completed: true)
    end
  end
end
