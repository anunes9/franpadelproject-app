require "rails_helper"

# The Club overview shows each active Coach of the selected Club with their
# Course progress, so the Club Manager can follow their learning.
RSpec.describe "Coach Course progress on the Club overview", type: :request do
  let(:manager) { create(:user, :club_manager) }
  let(:alpha) { create(:club, name: "Alpha Padel") }
  let(:bravo) { create(:club, name: "Bravo Padel") }
  let!(:carla) { create(:user, :coach, club: alpha, name: "Carla Coach") }
  let!(:diogo) { create(:user, :coach, club: alpha, name: "Diogo Coach") }
  let!(:bruno) { create(:user, :coach, club: bravo, name: "Bruno Coach") }

  let!(:beginner) { Array.new(3) { |i| create(:course_module, level: :beginner, position: i + 1) } }
  let!(:intermediate) { [create(:course_module, level: :intermediate, position: 1)] }

  before do
    create(:club_membership, user: manager, club: alpha)
  end

  def page
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])
  end

  def coach_named(name)
    page["props"]["coaches"].find { |c| c["name"] == name }
  end

  def course(coach, level)
    coach["courseProgress"]["courses"].find { |c| c["level"] == level }
  end

  it "shows each active Coach's per-Course progress after some Module progress" do
    create(:user_module_progress, user: carla, course_module: beginner[0], status: :done, progress: 100)
    create(:user_module_progress, user: carla, course_module: beginner[1], status: :done, progress: 100)
    create(:exercise_completion, user: carla, exercise: create(:exercise, course_module: intermediate[0]))
    create(:exercise, course_module: intermediate[0])
    sign_in manager

    get "/dashboard/clubs/#{alpha.id}"

    carla_row = coach_named("Carla Coach")
    expect(course(carla_row, "beginner")).to eq(
      "level" => "beginner", "modulesDone" => 2, "modulesTotal" => 3, "progress" => 67
    )
    expect(course(carla_row, "intermediate")).to eq(
      "level" => "intermediate", "modulesDone" => 0, "modulesTotal" => 1, "progress" => 50
    )
    expect(carla_row["courseProgress"]["exercisesDone"]).to eq(1)
    expect(course(coach_named("Diogo Coach"), "beginner")).to include("modulesDone" => 0, "progress" => 0)
  end

  it "shows a Planned Course with no Modules, for the page to show as coming soon" do
    sign_in manager

    get "/dashboard/clubs/#{alpha.id}"

    expect(course(coach_named("Carla Coach"), "advanced")).to include("modulesTotal" => 0, "modulesDone" => 0)
  end

  it "never shows Coaches of another Club" do
    sign_in manager

    get "/dashboard/clubs/#{alpha.id}"

    expect(page["props"]["coaches"].map { |c| c["name"] }).to eq(["Carla Coach", "Diogo Coach"])
    expect(response.body).not_to include("Bruno Coach")
  end

  it "does not show a removed Coach" do
    diogo.remove!
    sign_in manager

    get "/dashboard/clubs/#{alpha.id}"

    expect(page["props"]["coaches"].map { |c| c["name"] }).to eq(["Carla Coach"])
  end

  it "shows a Club Manager of two Clubs each Club's Coaches only on that Club's overview" do
    create(:club_membership, user: manager, club: bravo)
    create(:user_module_progress, user: bruno, course_module: beginner[0], status: :done, progress: 100)
    sign_in manager

    get "/dashboard/clubs/#{bravo.id}"

    expect(page["props"]["coaches"].map { |c| c["name"] }).to eq(["Bruno Coach"])
    expect(course(coach_named("Bruno Coach"), "beginner")["modulesDone"]).to eq(1)

    get "/dashboard/clubs/#{alpha.id}"

    expect(page["props"]["coaches"].map { |c| c["name"] }).to eq(["Carla Coach", "Diogo Coach"])
  end

  it "is not shown to Coaches or Admins" do
    [carla, create(:user, :admin)].each do |user|
      sign_in user

      get "/dashboard/clubs/#{alpha.id}"

      expect(response).to have_http_status(:not_found)
      sign_out user
    end
  end
end
