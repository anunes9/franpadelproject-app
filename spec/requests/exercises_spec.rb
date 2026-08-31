require "rails_helper"

RSpec.describe "Exercises", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  def inertia_props(response)
    json = response.body[/<script data-page="app" type="application\/json">(.+?)<\/script>/m, 1]
    JSON.parse(json)["props"]
  end

  it "renders the exercises index" do
    get "/dashboard/exercises"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Index"')
  end

  describe "GET /dashboard/exercises pagination and filters" do
    it "paginates exercises 12 per page" do
      13.times { |n| create(:exercise, ref: "EX-#{n.to_s.rjust(2, '0')}") }

      get "/dashboard/exercises"

      props = inertia_props(response)
      expect(props["exercises"].length).to eq(12)
      expect(props["pagination"]).to eq({ "page" => 1, "pages" => 2, "count" => 13 })
    end

    it "returns the remaining exercises on page 2" do
      13.times { |n| create(:exercise, ref: "EX-#{n.to_s.rjust(2, '0')}") }

      get "/dashboard/exercises", params: { page: 2 }

      props = inertia_props(response)
      expect(props["exercises"].length).to eq(1)
      expect(props["pagination"]["page"]).to eq(2)
    end

    it "filters by module slug" do
      module_a = create(:course_module, slug: "module-a")
      module_b = create(:course_module, slug: "module-b")
      create(:exercise, ref: "EX-A", course_module: module_a)
      create(:exercise, ref: "EX-B", course_module: module_b)

      get "/dashboard/exercises", params: { module: "module-a" }

      props = inertia_props(response)
      expect(props["exercises"].map { |e| e["ref"] }).to eq(["EX-A"])
      expect(props["pagination"]["count"]).to eq(1)
    end

    it "filters by category across all pages, not just the current page" do
      13.times { |n| create(:exercise, ref: "TECH-#{n}", category: :technical) }
      create(:exercise, ref: "TACT-01", category: :tactical)

      get "/dashboard/exercises", params: { category: "Tactical" }

      props = inertia_props(response)
      expect(props["exercises"].map { |e| e["ref"] }).to eq(["TACT-01"])
      expect(props["pagination"]["count"]).to eq(1)
    end

    it "exposes the list of modules for the filter" do
      create(:course_module, slug: "module-a", title: "Module A")

      get "/dashboard/exercises"

      props = inertia_props(response)
      expect(props["modules"]).to include({ "id" => "module-a", "title" => "Module A" })
    end
  end

  it "renders an exercise detail page" do
    create(:exercise, ref: "EX-01")

    get "/dashboard/exercises/EX-01"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Show"')
  end

  it "renders a detail page for a real-world dotted ref (e.g. exercise-1.20)" do
    create(:exercise, ref: "exercise-1.20")

    get "/dashboard/exercises/exercise-1.20"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Show"')
    expect(response.body).to include('"ref":"exercise-1.20"')
  end

  it "404s for an unknown exercise ref" do
    get "/dashboard/exercises/nope"
    expect(response).to have_http_status(:not_found)
  end

  describe "PATCH /dashboard/exercises/:ref/complete" do
    it "marks the exercise complete for the current user and redirects back to it" do
      exercise = create(:exercise, ref: "EX-01")

      patch "/dashboard/exercises/EX-01/complete"

      expect(response).to redirect_to("/dashboard/exercises/EX-01")
      expect(ExerciseCompletion.exists?(user: user, exercise: exercise)).to be true
    end

    it "works for a dotted ref (e.g. exercise-1.20)" do
      exercise = create(:exercise, ref: "exercise-1.20")

      patch "/dashboard/exercises/exercise-1.20/complete"

      expect(response).to redirect_to("/dashboard/exercises/exercise-1.20")
      expect(ExerciseCompletion.exists?(user: user, exercise: exercise)).to be true
    end

    it "404s for an unknown exercise ref" do
      patch "/dashboard/exercises/nope/complete"
      expect(response).to have_http_status(:not_found)
    end
  end
end
