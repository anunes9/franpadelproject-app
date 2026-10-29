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

  # A Module with content to complete: one Exercise, and a one-question Quiz
  # when `quiz` is set (its correct answer is the second option).
  def module_with(position:, level: :beginner, exercises: 1, quiz: false)
    course_module = create(:course_module, level: level, position: position)
    create_list(:exercise, exercises, course_module: course_module)
    create(:quiz_question, quiz: create(:quiz, course_module: course_module), correct_index: 1) if quiz
    course_module
  end

  def attempt(user, course_module, right:)
    answers = course_module.quiz.questions.to_h { |q| [ q.id, right ? q.correct_index : 0 ] }
    QuizAttempt.create!(user: user, quiz: course_module.quiz, answers: answers)
  end

  def do_exercises(user, course_module, count = course_module.exercises.size)
    course_module.exercises.first(count).each { |exercise| create(:exercise_completion, user: user, exercise: exercise) }
  end

  describe ".states_for" do
    let(:user) { create(:user) }

    it "makes the first Module of a Course available to a brand-new Client" do
      first = module_with(position: 1)
      second = module_with(position: 2)

      states = CourseModule.states_for(user)

      expect(states[first.id]).to eq(status: "available", progress: 0)
      expect(states[second.id]).to eq(status: "locked", progress: 0)
    end

    it "completes a Module once every Exercise is done and its Quiz passed, unlocking the next" do
      first = module_with(position: 1, quiz: true)
      second = module_with(position: 2)
      third = module_with(position: 3)
      do_exercises(user, first)
      attempt(user, first, right: true)

      states = CourseModule.states_for(user)

      expect(states[first.id]).to eq(status: "completed", progress: 100)
      expect(states[second.id][:status]).to eq("available")
      expect(states[third.id][:status]).to eq("locked")
    end

    it "keeps a Module in progress while its Quiz is not passed, counting the Quiz as one step" do
      first = module_with(position: 1, quiz: true)
      second = module_with(position: 2)
      do_exercises(user, first)
      attempt(user, first, right: false)

      states = CourseModule.states_for(user)

      expect(states[first.id]).to eq(status: "in_progress", progress: 50)
      expect(states[second.id][:status]).to eq("locked")
    end

    it "keeps a Module in progress while an Exercise is left, even with the Quiz passed" do
      first = module_with(position: 1, exercises: 3, quiz: true)
      do_exercises(user, first, 2)
      attempt(user, first, right: true)

      expect(CourseModule.states_for(user)[first.id]).to eq(status: "in_progress", progress: 75)
    end

    it "takes a Module with only a Quiz from 0% in progress to 100% completed when it is passed" do
      quiz_only = module_with(position: 1, exercises: 0, quiz: true)
      attempt(user, quiz_only, right: false)
      expect(CourseModule.states_for(user)[quiz_only.id]).to eq(status: "in_progress", progress: 0)

      attempt(user, quiz_only, right: true)
      expect(CourseModule.states_for(user)[quiz_only.id]).to eq(status: "completed", progress: 100)
    end

    it "keeps a Quiz Pass whatever later attempts score" do
      quiz_only = module_with(position: 1, exercises: 0, quiz: true)
      attempt(user, quiz_only, right: true)
      attempt(user, quiz_only, right: false)

      expect(CourseModule.states_for(user)[quiz_only.id][:status]).to eq("completed")
    end

    it "completes a Module with neither a Quiz nor Exercises for everyone" do
      empty = module_with(position: 1, exercises: 0)
      second = module_with(position: 2)

      states = CourseModule.states_for(user)

      expect(states[empty.id]).to eq(status: "completed", progress: 100)
      expect(states[second.id][:status]).to eq("available")
    end

    it "keeps a Module Locked behind an incomplete one, even with nothing left to do in it" do
      first = module_with(position: 1)
      empty = module_with(position: 2, exercises: 0)
      ahead = module_with(position: 3)
      do_exercises(user, ahead)

      states = CourseModule.states_for(user)

      expect(states[empty.id]).to eq(status: "locked", progress: 100)
      expect(states[ahead.id]).to eq(status: "locked", progress: 100)

      do_exercises(user, first)
      expect(CourseModule.states_for(user).values.map { |s| s[:status] }.uniq).to eq(["completed"])
    end

    it "counts a Quiz with no questions as no Quiz" do
      first = module_with(position: 1)
      create(:quiz, course_module: first)
      do_exercises(user, first)

      expect(CourseModule.states_for(user)[first.id]).to eq(status: "completed", progress: 100)
    end

    it "follows the Module's current content, so a new Exercise takes Module Completion away" do
      first = module_with(position: 1)
      second = module_with(position: 2)
      do_exercises(user, first)
      expect(CourseModule.states_for(user)[first.id][:status]).to eq("completed")

      create(:exercise, course_module: first)

      states = CourseModule.states_for(user)
      expect(states[first.id]).to eq(status: "in_progress", progress: 50)
      expect(states[second.id][:status]).to eq("locked")
    end

    it "locks each Course independently, so every Course's first Module is open" do
      module_with(level: :beginner, position: 1)
      intermediate_first = module_with(level: :intermediate, position: 1)

      expect(CourseModule.states_for(user)[intermediate_first.id][:status]).to eq("available")
    end

    it "marks a Module in progress with the share of its Exercises completed" do
      course_module = module_with(position: 1, exercises: 2)
      do_exercises(user, course_module, 1)

      expect(CourseModule.states_for(user)[course_module.id]).to eq(status: "in_progress", progress: 50)
    end

    it "marks a Module in progress after a Quiz Attempt alone" do
      course_module = module_with(position: 1, quiz: true)
      attempt(user, course_module, right: false)

      expect(CourseModule.states_for(user)[course_module.id]).to eq(status: "in_progress", progress: 0)
    end

    it "ignores other Clients' Exercise Completions and Quiz Attempts" do
      first = module_with(position: 1, quiz: true)
      second = module_with(position: 2)
      other = create(:user)
      do_exercises(other, first)
      attempt(other, first, right: true)

      states = CourseModule.states_for(user)

      expect(states[first.id]).to eq(status: "available", progress: 0)
      expect(states[second.id][:status]).to eq("locked")
    end
  end

  describe ".dashboard_list_for" do
    it "returns every module with the given user's state merged in" do
      user = create(:user)
      done_module = module_with(position: 1)
      done_module.update!(slug: "module-1")
      module_with(position: 2).update!(slug: "module-2")
      module_with(position: 3).update!(slug: "module-3")
      do_exercises(user, done_module)

      list = CourseModule.dashboard_list_for(user)

      expect(list.find { |m| m[:id] == "module-1" }).to include(status: "completed", progress: 100)
      expect(list.find { |m| m[:id] == "module-2" }).to include(status: "available", progress: 0)
      expect(list.find { |m| m[:id] == "module-3" }).to include(status: "locked", progress: 0)
    end
  end

  describe ".dashboard_stats_for" do
    it "counts completed Modules and the Client's real Exercise Completions" do
      user = create(:user)
      first = module_with(position: 1)
      module_with(position: 2)
      do_exercises(user, first)

      expect(CourseModule.dashboard_stats_for(user)).to include(
        progress: 50, modulesDone: 1, modulesTotal: 2, exercisesDone: 1
      )
    end
  end

  describe ".progress_for" do
    let(:ana) { create(:user, name: "Ana") }
    let(:bruno) { create(:user, name: "Bruno") }

    it "gives each user's Module Completions and progress per Course, with a Planned Course empty" do
      b1 = module_with(level: :beginner, position: 1)
      b2 = module_with(level: :beginner, position: 2, exercises: 2)
      module_with(level: :beginner, position: 3)
      i1 = module_with(level: :intermediate, position: 1)
      do_exercises(ana, b1)
      do_exercises(ana, b2, 1)
      do_exercises(bruno, i1)

      progress = CourseModule.progress_for([ana, bruno])

      expect(progress[ana.id]).to eq(
        courses: [
          { level: "beginner", modulesDone: 1, modulesTotal: 3, progress: 50 },
          { level: "intermediate", modulesDone: 0, modulesTotal: 1, progress: 0 },
          { level: "advanced", modulesDone: 0, modulesTotal: 0, progress: 0 }
        ],
        exercisesDone: 2
      )
      expect(progress[bruno.id][:courses].map { |c| c[:modulesDone] }).to eq([0, 1, 0])
      expect(progress[bruno.id][:exercisesDone]).to eq(1)
    end

    it "gives each user the same numbers as asking for that user alone" do
      first = module_with(position: 1, quiz: true)
      second = module_with(position: 2)
      do_exercises(ana, first)
      attempt(ana, first, right: true)
      do_exercises(bruno, second)
      attempt(bruno, first, right: false)

      batch = CourseModule.progress_for([ana, bruno])

      [ana, bruno].each do |user|
        expect(batch[user.id]).to eq(CourseModule.progress_for([user])[user.id])
        stats = CourseModule.dashboard_stats_for(user)
        expect(batch[user.id][:courses].sum { |c| c[:modulesDone] }).to eq(stats[:modulesDone])
        expect(batch[user.id][:exercisesDone]).to eq(stats[:exercisesDone])
      end
    end

    it "takes no more queries for two users than for one" do
      create(:course_module, position: 1)
      create(:exercise_completion, user: ana, exercise: create(:exercise))
      count_queries = lambda do |users|
        n = 0
        counter = ->(*, payload) { n += 1 unless payload[:name] == "SCHEMA" || payload[:cached] }
        ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
          CourseModule.progress_for(users)
        end
        n
      end

      one = count_queries.call([ana])

      expect(count_queries.call([ana, bruno])).to eq(one)
    end
  end
end
