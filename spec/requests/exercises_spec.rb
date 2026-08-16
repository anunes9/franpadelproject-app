require "rails_helper"

RSpec.describe "Exercises", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the exercises index" do
    get "/dashboard/exercises"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Index"')
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
