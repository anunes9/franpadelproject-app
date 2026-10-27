require "rails_helper"

RSpec.describe "Exercises of a Class", type: :request do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) do
    create(:course_module, level: :beginner, position: 1, title: "Serve",
                           description: "Starting the point", topics: %w[Grip Toss])
  end
  let!(:volley) { create(:course_module, level: :beginner, position: 2, title: "Volley") }
  let!(:serve_drill) { create(:exercise, course_module: serve, ref: "S-1", title: "Serve drill") }
  let!(:serve_game) { create(:exercise, course_module: serve, ref: "S-2", title: "Serve game") }
  let!(:volley_drill) { create(:exercise, course_module: volley, ref: "V-1", title: "Volley drill") }

  # Once a week on Tuesdays from 8 September 2026: six Serve Classes, then six Volley Classes.
  let(:group) do
    ClassGroup.new(coach: coach, players: create_list(:player, 1, club: club), level: "beginner",
                   starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: ["tuesday"],
                   start_time: "18:00", duration: 60).tap { |g| g.create_with_plan || raise("refused") }
  end
  let(:serve_class) { group.training_classes.first }

  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def class_path(training_class) = "/dashboard/classes/#{training_class.id}"
  def class_exercise_path(training_class, exercise) = "#{class_path(training_class)}/exercises/#{exercise.ref}"

  describe "the Class page" do
    it "shows the Class with its Module's description and topics, no chosen Exercises and its Module's Exercises to pick from" do
      sign_in coach

      get class_path(serve_class)

      expect(response.body).to include(%q("component":"TrainingClasses/Show"))
      expect(page_props["trainingClass"]).to include("date" => "2026-09-08", "startTime" => "18:00", "kind" => "regular")
      expect(page_props["trainingClass"]["module"]).to include(
        "title" => "Serve", "number" => 1, "description" => "Starting the point", "topics" => %w[Grip Toss]
      )
      expect(page_props["classGroup"]).to include("id" => group.id, "duration" => 60, "exercisesPerClass" => 4)
      expect(page_props["classStructure"]).to eq(
        "warmUp" => { "min" => 5, "max" => 5 }, "exercises" => { "count" => 4, "minutes" => 8 },
        "conditioning" => { "min" => 10, "max" => 15 }
      )
      expect(page_props["exercises"]).to eq([])
      expect(page_props["availableExercises"].map { |e| e["ref"] }).to eq(%w[S-1 S-2])
    end
  end

  describe "the Class page's numbers and images" do
    it "numbers the Class in its plan and gives each Exercise its first image" do
      serve_drill.media.attach(io: StringIO.new("pdf"), filename: "notes.pdf", content_type: "application/pdf")
      serve_drill.media.attach(io: StringIO.new("<svg/>"), filename: "diagram.svg", content_type: "image/svg+xml")
      sign_in coach

      get class_path(group.training_classes.third)

      expect(page_props["trainingClass"]["number"]).to eq(3)
      expect(page_props["classCount"]).to eq(12)
      images = page_props["availableExercises"].to_h { |e| [e["ref"], e["image"]] }
      expect(images["S-1"]).to match(%r{\A/rails/active_storage/blobs/redirect/.+/diagram\.svg\?disposition=inline\z})
      expect(images["S-2"]).to be_nil
    end
  end

  describe "picking Exercises" do
    it "adds Exercises of the Class's Module, shown on the Class in the order picked" do
      sign_in coach

      post class_exercise_path(serve_class, serve_game)
      expect(response).to redirect_to(class_path(serve_class))
      post class_exercise_path(serve_class, serve_drill)

      get class_path(serve_class)
      expect(page_props["exercises"].map { |e| e["ref"] }).to eq(%w[S-2 S-1])
      expect(page_props["exercises"].first).to include("title" => "Serve game", "category" => "Technical")
      expect(page_props["availableExercises"]).to eq([])
    end

    it "refuses an Exercise of another Module" do
      sign_in coach

      expect { post class_exercise_path(serve_class, volley_drill) }.not_to change(TrainingClassExercise, :count)
      expect(response).to redirect_to(class_path(serve_class))

      follow_redirect!
      expect(page_props["errors"]["exercise"]).to eq(
        [{ "code" => "other_module", "message" => "must be an Exercise of the Class's Module" }]
      )
      expect(page_props["exercises"]).to eq([])
    end

    it "refuses an Exercise of no Module" do
      loose = create(:exercise, course_module: nil, ref: "L-1")
      sign_in coach

      expect { post class_exercise_path(serve_class, loose) }.not_to change(TrainingClassExercise, :count)
    end

    it "picks an Exercise only once" do
      sign_in coach
      post class_exercise_path(serve_class, serve_drill)

      expect { post class_exercise_path(serve_class, serve_drill) }.not_to change(TrainingClassExercise, :count)

      follow_redirect!
      expect(page_props["errors"]["exercise_id"].map { |e| e["code"] }).to eq(["taken"])
      expect(page_props["exercises"].map { |e| e["ref"] }).to eq(%w[S-1])
    end

    it "404s for an Exercise that does not exist" do
      sign_in coach

      post "#{class_path(serve_class)}/exercises/NOPE"

      expect(response).to have_http_status(:not_found)
    end

    it "picks Exercises per Class" do
      sign_in coach
      post class_exercise_path(serve_class, serve_drill)

      get class_path(group.training_classes.second)

      expect(page_props["exercises"]).to eq([])
      expect(page_props["availableExercises"].map { |e| e["ref"] }).to eq(%w[S-1 S-2])
    end
  end

  describe "the Training Plan" do
    it "is generated with no Exercises and shows those picked on each Class" do
      sign_in coach
      get "/dashboard/class_groups/#{group.id}"
      expect(page_props["classes"].map { |c| c["exercises"] }.uniq).to eq([[]])

      post class_exercise_path(serve_class, serve_game)
      post class_exercise_path(serve_class, serve_drill)
      get "/dashboard/class_groups/#{group.id}"

      expect(page_props["classes"].first["exercises"]).to eq(
        [{ "ref" => "S-2", "title" => "Serve game" }, { "ref" => "S-1", "title" => "Serve drill" }]
      )
      expect(page_props["classes"].second["exercises"]).to eq([])
    end
  end

  describe "a Module with no Exercises" do
    it "shows the Class with nothing to pick" do
      serve.exercises.destroy_all
      sign_in coach

      get class_path(serve_class)

      expect(response).to have_http_status(200)
      expect(page_props["exercises"]).to eq([])
      expect(page_props["availableExercises"]).to eq([])
    end
  end

  describe "access" do
    def manager_of(managed_club)
      create(:user, :club_manager).tap { |manager| create(:club_membership, user: manager, club: managed_club) }
    end

    it "lets a Club Manager of the group's Club see the Class and pick and remove its Exercises" do
      sign_in manager_of(club)

      get class_path(serve_class)
      expect(response).to have_http_status(200)

      post class_exercise_path(serve_class, serve_drill)
      expect(serve_class.exercises).to eq([serve_drill])

      delete class_exercise_path(serve_class, serve_drill)
      expect(serve_class.exercises.reload).to eq([])
    end

    {
      "another Coach of the same Club" => -> { create(:user, :coach, club: club) },
      "a Club Manager of another Club" => -> { manager_of(create(:club)) },
      "an Admin" => -> { create(:user, :admin) }
    }.each do |who, user|
      it "404s for #{who}, who can neither see nor change the Class's Exercises" do
        serve_class.pick_exercise(serve_drill)
        intruder = instance_exec(&user)

        sign_in intruder
        get class_path(serve_class)
        expect(response).to have_http_status(:not_found)

        # A 404 response does not keep the test sign-in, so sign in again.
        sign_in intruder
        expect { post class_exercise_path(serve_class, serve_game) }.not_to change(TrainingClassExercise, :count)
        expect(response).to have_http_status(:not_found)

        sign_in intruder
        expect { delete class_exercise_path(serve_class, serve_drill) }.not_to change(TrainingClassExercise, :count)
        expect(response).to have_http_status(:not_found)
      end
    end

    it "requires authentication" do
      get class_path(serve_class)

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  describe "removing Exercises" do
    it "removes a picked Exercise, which can be picked again" do
      sign_in coach
      post class_exercise_path(serve_class, serve_drill)
      post class_exercise_path(serve_class, serve_game)

      delete class_exercise_path(serve_class, serve_drill)
      expect(response).to redirect_to(class_path(serve_class))

      follow_redirect!
      expect(page_props["exercises"].map { |e| e["ref"] }).to eq(%w[S-2])
      expect(page_props["availableExercises"].map { |e| e["ref"] }).to eq(%w[S-1])
    end

    it "404s for an Exercise not picked for the Class" do
      sign_in coach

      delete class_exercise_path(serve_class, serve_drill)

      expect(response).to have_http_status(:not_found)
    end
  end
end
