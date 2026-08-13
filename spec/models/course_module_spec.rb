require "rails_helper"

RSpec.describe CourseModule, type: :model do
  it "is valid with slug, level, position, title, description, and duration" do
    expect(build(:course_module)).to be_valid
  end

  it "requires a slug" do
    expect(build(:course_module, slug: nil)).not_to be_valid
  end

  it "requires a unique slug" do
    create(:course_module, slug: "module-1")
    expect(build(:course_module, slug: "module-1")).not_to be_valid
  end

  it "requires a title" do
    expect(build(:course_module, title: nil)).not_to be_valid
  end

  it "requires a description" do
    expect(build(:course_module, description: nil)).not_to be_valid
  end

  it "requires a duration" do
    expect(build(:course_module, duration: nil)).not_to be_valid
  end

  it "defines the expected level values" do
    expect(CourseModule.levels.keys).to match_array(%w[beginner intermediate advanced])
  end

  it "orders by level then position" do
    third = create(:course_module, slug: "c", position: 3)
    first = create(:course_module, slug: "a", position: 1)
    second = create(:course_module, slug: "b", position: 2)

    expect(CourseModule.ordered.to_a).to eq([first, second, third])
  end

  describe "#topics_text" do
    it "joins topics into a comma-separated string" do
      expect(build(:course_module, topics: ["Serve", "Return"]).topics_text).to eq("Serve, Return")
    end

    it "splits a comma-separated string back into topics" do
      course_module = build(:course_module)
      course_module.topics_text = "Serve,  Return , Volley"
      expect(course_module.topics).to eq(%w[Serve Return Volley])
    end
  end

  describe "#sections" do
    it "parses markdown headings and bullet items into sections" do
      course_module = build(:course_module, content: "## First\n\n- One;\n- Two;\n\n## Second\n\n- Three;")

      expect(course_module.sections).to eq([
        { heading: "First", items: ["One;", "Two;"] },
        { heading: "Second", items: ["Three;"] }
      ])
    end

    it "returns an empty array when content is blank" do
      expect(build(:course_module, content: nil).sections).to eq([])
    end
  end

  describe "#as_dashboard_json" do
    it "defaults status and progress to locked/0 when no progress row is given" do
      course_module = build(:course_module, slug: "module-1", position: 1, level: :beginner)

      expect(course_module.as_dashboard_json).to include(
        id: "module-1", n: 1, level: "Beginner", status: "locked", progress: 0
      )
    end

    it "uses the given progress row's status and progress" do
      course_module = create(:course_module)
      progress = create(:user_module_progress, course_module: course_module, status: :done, progress: 100)

      expect(course_module.as_dashboard_json(progress)).to include(status: "done", progress: 100)
    end
  end

  describe ".dashboard_list_for" do
    it "returns every module with the given user's progress merged in" do
      user = create(:user)
      done_module = create(:course_module, slug: "module-1", position: 1)
      locked_module = create(:course_module, slug: "module-2", position: 2)
      create(:user_module_progress, user: user, course_module: done_module, status: :done, progress: 100)

      list = CourseModule.dashboard_list_for(user)

      expect(list.find { |m| m[:id] == "module-1" }).to include(status: "done", progress: 100)
      expect(list.find { |m| m[:id] == "module-2" }).to include(status: "locked", progress: 0)
    end
  end
end
