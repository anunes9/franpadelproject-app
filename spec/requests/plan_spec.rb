require "rails_helper"

RSpec.describe "Plan", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  def inertia_props(response)
    json = response.body[/<script data-page="app" type="application\/json">(.+?)<\/script>/m, 1]
    JSON.parse(json)["props"]
  end

  it "renders the weekly plan page with the user's entries" do
    exercise = create(:exercise, ref: "EX-01", title: "Serve")
    create(:plan_entry, user: user, plannable: exercise, day: :monday)

    get "/dashboard/plan"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Plan/Index"')
    props = inertia_props(response)
    expect(props["plan"]["Monday"].map { |e| e["key"] }).to eq(["EX-01"])
    expect(props["plan"]["Tuesday"]).to eq([])
    expect(props["modules"].first).to include("id", "title", "description")
  end

  describe "POST /dashboard/plan/entries" do
    it "adds an exercise to a day and redirects to the plan" do
      exercise = create(:exercise, ref: "exercise-1.6")

      post "/dashboard/plan/entries", params: { day: "Tuesday", kind: "exercise", key: "exercise-1.6" }

      expect(response).to redirect_to("/dashboard/plan")
      entry = user.plan_entries.sole
      expect(entry.plannable).to eq(exercise)
      expect(entry.day).to eq("tuesday")
    end

    it "adds a module to a day" do
      course_module = create(:course_module, slug: "module-2")

      post "/dashboard/plan/entries", params: { day: "Friday", kind: "module", key: "module-2" }

      expect(user.plan_entries.sole.plannable).to eq(course_module)
    end

    it "appends after existing entries on that day" do
      create(:plan_entry, user: user, day: :monday, position: 3)
      create(:exercise, ref: "EX-NEW")

      post "/dashboard/plan/entries", params: { day: "Monday", kind: "exercise", key: "EX-NEW" }

      expect(user.plan_entries.find_by(day: :monday, position: 4)).to be_present
    end

    it "is idempotent for an item already on that day" do
      exercise = create(:exercise, ref: "EX-01")
      create(:plan_entry, user: user, plannable: exercise, day: :monday)

      post "/dashboard/plan/entries", params: { day: "Monday", kind: "exercise", key: "EX-01" }

      expect(response).to redirect_to("/dashboard/plan")
      expect(user.plan_entries.count).to eq(1)
    end

    it "rejects an unknown day or item" do
      create(:exercise, ref: "EX-01")

      post "/dashboard/plan/entries", params: { day: "Funday", kind: "exercise", key: "EX-01" }
      expect(response).to have_http_status(:unprocessable_content)

      post "/dashboard/plan/entries", params: { day: "Monday", kind: "exercise", key: "nope" }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /dashboard/plan/entries/:id" do
    it "removes the user's own entry" do
      entry = create(:plan_entry, user: user)

      delete "/dashboard/plan/entries/#{entry.id}"

      expect(response).to redirect_to("/dashboard/plan")
      expect(PlanEntry.exists?(entry.id)).to be false
    end

    it "404s for another user's entry" do
      entry = create(:plan_entry)

      delete "/dashboard/plan/entries/#{entry.id}"

      expect(response).to have_http_status(:not_found)
      expect(PlanEntry.exists?(entry.id)).to be true
    end
  end
end
