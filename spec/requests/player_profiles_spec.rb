require "rails_helper"

RSpec.describe "A Player's Performance Profile", type: :request do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let(:player) { create(:player, club: club, name: "Ana") }
  let!(:course_module) { create(:course_module, level: :beginner, position: 1) }
  let!(:group) do
    group = ClassGroup.new(coach: coach, players: [player], level: "beginner", starts_on: Date.new(2026, 9, 7),
                           cadence: 1, weekdays: ["tuesday"], start_time: "18:00", duration: 60)
    group.create_with_plan || raise("refused")
    group
  end

  before do
    assessment = group.training_classes.find(&:assessment?)
    evaluation = Evaluation.create!(training_class: assessment, player: player, coach: coach)
    evaluation.ratings.create!(item_kind: :area, item_key: "technique", value: 2)
  end

  def page
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])
  end

  it "shows the group's Coach the Player's Profile" do
    sign_in coach

    get "/dashboard/players/#{player.id}"

    expect(page["component"]).to eq("Players/Show")
    props = page["props"]
    expect(props["player"]).to include("name" => "Ana")
    expect(props["profile"]["toImprove"]).to eq([
      { "kind" => "area", "key" => "technique", "value" => 2, "previous" => nil, "trend" => nil }
    ])
    expect(props["profile"]["history"].size).to eq(1)
  end

  it "shows a Club Manager of the Player's Club the Profile" do
    manager = create(:user, :club_manager)
    create(:club_membership, user: manager, club: club)
    sign_in manager

    get "/dashboard/players/#{player.id}"

    expect(response).to have_http_status(:ok)
  end

  it "is a 404 for a Coach of the Club who does not have the Player in a group" do
    sign_in create(:user, :coach, club: club)

    get "/dashboard/players/#{player.id}"

    expect(response).to have_http_status(:not_found)
  end

  it "is a 404 for a Club Manager of another Club" do
    manager = create(:user, :club_manager)
    create(:club_membership, user: manager, club: create(:club))
    sign_in manager

    get "/dashboard/players/#{player.id}"

    expect(response).to have_http_status(:not_found)
  end
end
