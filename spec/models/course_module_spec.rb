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
    it "defaults status and progress to locked/0 when no state is given" do
      course_module = build(:course_module, slug: "module-1", position: 1, level: :beginner)

      expect(course_module.as_dashboard_json).to include(
        id: "module-1", n: 1, level: "Beginner", status: "locked", progress: 0
      )
    end

    it "uses the given state's status and progress" do
      course_module = build(:course_module)

      expect(course_module.as_dashboard_json({ status: "in_progress", progress: 50 }))
        .to include(status: "in_progress", progress: 50)
    end
  end

  describe "#documents_json" do
    it "returns an empty array when no documents are attached" do
      expect(create(:course_module).documents_json).to eq([])
    end

    it "returns each attached document's filename, content type, and an inline-disposition url" do
      course_module = create(:course_module)
      course_module.documents.attach(
        io: StringIO.new("pdf content"), filename: "slides.pdf", content_type: "application/pdf"
      )

      json = course_module.documents_json

      expect(json.size).to eq(1)
      expect(json.first).to include(filename: "slides.pdf", contentType: "application/pdf")
      expect(json.first[:url]).to include("disposition=inline")
    end
  end

  describe "organized document storage" do
    it "stores a document under course_modules/{slug}/documents/{filename}" do
      course_module = create(:course_module, slug: "beginner-101")
      course_module.documents.attach(io: StringIO.new("pdf"), filename: "syllabus.pdf", content_type: "application/pdf")

      expect(course_module.documents.first.blob.key).to eq("course_modules/beginner-101/documents/syllabus.pdf")
    end

    it "suffixes the key when two documents share the same filename" do
      course_module = create(:course_module, slug: "beginner-101")
      course_module.documents.attach(io: StringIO.new("pdf one"), filename: "syllabus.pdf", content_type: "application/pdf")
      course_module.documents.attach(io: StringIO.new("pdf two"), filename: "syllabus.pdf", content_type: "application/pdf")

      keys = course_module.documents.map { |document| document.blob.key }
      expect(keys).to contain_exactly(
        "course_modules/beginner-101/documents/syllabus.pdf",
        "course_modules/beginner-101/documents/syllabus-2.pdf"
      )
    end

    it "organizes documents attached through the new_documents= writer used by the admin form" do
      course_module = create(:course_module, slug: "beginner-101")

      course_module.new_documents = [{ io: StringIO.new("pdf"), filename: "handout.pdf", content_type: "application/pdf" }]

      expect(course_module.documents.first.blob.key).to eq("course_modules/beginner-101/documents/handout.pdf")
    end
  end

  describe "#complete_for!" do
    it "marks the module done and full progress for the user" do
      user = create(:user)
      course_module = create(:course_module)

      course_module.complete_for!(user)

      progress = UserModuleProgress.find_by(user: user, course_module: course_module)
      expect(progress).to have_attributes(status: "done", progress: 100)
    end

    it "updates the existing progress row instead of duplicating it" do
      user = create(:user)
      course_module = create(:course_module)
      create(:user_module_progress, user: user, course_module: course_module, status: :current, progress: 40)

      course_module.complete_for!(user)

      expect(UserModuleProgress.where(user: user, course_module: course_module).count).to eq(1)
    end

    it "unlocks the next module in position order for that user" do
      user = create(:user)
      first = create(:course_module, position: 1)
      second = create(:course_module, position: 2)

      first.complete_for!(user)

      next_progress = UserModuleProgress.find_by(user: user, course_module: second)
      expect(next_progress).to have_attributes(status: "current", progress: 0)
    end

    it "does not downgrade the next module if it's already current or done" do
      user = create(:user)
      first = create(:course_module, position: 1)
      second = create(:course_module, position: 2)
      create(:user_module_progress, user: user, course_module: second, status: :done, progress: 100)

      first.complete_for!(user)

      next_progress = UserModuleProgress.find_by(user: user, course_module: second)
      expect(next_progress).to have_attributes(status: "done", progress: 100)
    end

    it "does nothing to other users' progress" do
      user = create(:user)
      other_user = create(:user)
      course_module = create(:course_module)

      course_module.complete_for!(user)

      expect(UserModuleProgress.find_by(user: other_user, course_module: course_module)).to be_nil
    end
  end

  describe ".states_for" do
    let(:user) { create(:user) }

    it "makes the first Module of a Course available to a brand-new Client" do
      first = create(:course_module, position: 1)
      second = create(:course_module, position: 2)

      states = CourseModule.states_for(user)

      expect(states[first.id]).to eq(status: "available", progress: 0)
      expect(states[second.id]).to eq(status: "locked", progress: 0)
    end

    it "unlocks the next Module once the previous one is completed" do
      first = create(:course_module, position: 1)
      second = create(:course_module, position: 2)
      third = create(:course_module, position: 3)
      create(:user_module_progress, user: user, course_module: first, status: :done, progress: 100)

      states = CourseModule.states_for(user)

      expect(states[first.id]).to eq(status: "completed", progress: 100)
      expect(states[second.id][:status]).to eq("available")
      expect(states[third.id][:status]).to eq("locked")
    end

    it "locks each Course independently, so every Course's first Module is open" do
      create(:course_module, level: :beginner, position: 1)
      intermediate_first = create(:course_module, level: :intermediate, position: 1)

      expect(CourseModule.states_for(user)[intermediate_first.id][:status]).to eq("available")
    end

    it "marks a Module in progress with the share of its Exercises completed" do
      course_module = create(:course_module, position: 1)
      done = create(:exercise, course_module: course_module)
      create(:exercise, course_module: course_module)
      create(:exercise_completion, user: user, exercise: done)

      expect(CourseModule.states_for(user)[course_module.id]).to eq(status: "in_progress", progress: 50)
    end

    it "ignores a stale 'current' progress row and other Clients' completions" do
      first = create(:course_module, position: 1)
      second = create(:course_module, position: 2)
      create(:user_module_progress, user: user, course_module: second, status: :current, progress: 40)
      create(:user_module_progress, user: create(:user), course_module: first, status: :done, progress: 100)

      states = CourseModule.states_for(user)

      expect(states[first.id][:status]).to eq("available")
      expect(states[second.id][:status]).to eq("locked")
    end
  end

  describe ".plan_options" do
    it "returns just each Module's slug, title, description and topics, in order" do
      create(:course_module, slug: "second", position: 2, title: "M2", description: "Two", topics: ["B"])
      create(:course_module, slug: "first", position: 1, title: "M1", description: "One", topics: ["A"])

      expect(CourseModule.plan_options).to eq([
        { id: "first", title: "M1", description: "One", topics: ["A"] },
        { id: "second", title: "M2", description: "Two", topics: ["B"] }
      ])
    end
  end

  describe ".dashboard_list_for" do
    it "returns every module with the given user's state merged in" do
      user = create(:user)
      done_module = create(:course_module, slug: "module-1", position: 1)
      create(:course_module, slug: "module-2", position: 2)
      create(:course_module, slug: "module-3", position: 3)
      create(:user_module_progress, user: user, course_module: done_module, status: :done, progress: 100)

      list = CourseModule.dashboard_list_for(user)

      expect(list.find { |m| m[:id] == "module-1" }).to include(status: "completed", progress: 100)
      expect(list.find { |m| m[:id] == "module-2" }).to include(status: "available", progress: 0)
      expect(list.find { |m| m[:id] == "module-3" }).to include(status: "locked", progress: 0)
    end
  end

  describe ".dashboard_stats_for" do
    it "counts completed Modules and the Client's real Exercise Completions" do
      user = create(:user)
      first = create(:course_module, position: 1)
      create(:course_module, position: 2)
      create(:user_module_progress, user: user, course_module: first, status: :done, progress: 100)
      create(:exercise_completion, user: user, exercise: create(:exercise, course_module: first))

      expect(CourseModule.dashboard_stats_for(user)).to include(
        progress: 50, modulesDone: 1, modulesTotal: 2, exercisesDone: 1
      )
    end
  end
end
