require "rails_helper"

# A Club Manager sees and edits every Class Group and Player of each Club they
# are linked to, and nothing of any other Club.
RSpec.describe "Club Manager oversight across Clubs", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:lisboa) { create(:club, name: "Padel Clube Lisboa") }
  let(:porto) { create(:club, name: "Padel Clube Porto") }
  let(:manager) do
    create(:user, :club_manager).tap do |m|
      create(:club_membership, user: m, club: lisboa)
      create(:club_membership, user: m, club: porto)
    end
  end
  let(:outsider) do
    create(:user, :club_manager).tap { |m| create(:club_membership, user: m, club: create(:club)) }
  end

  before do
    travel_to(Time.utc(2026, 9, 1, 12))
    create(:course_module, level: :beginner, position: 1, title: "Serve")
  end

  def planned_group(club)
    group = ClassGroup.new(coach: create(:user, :coach, club: club), players: create_list(:player, 2, club: club),
                           level: "beginner", starts_on: Date.new(2026, 9, 7), cadence: 1,
                           weekdays: ["tuesday"], start_time: "18:00", duration: 60)
    group.create_with_plan || raise("refused: #{group.errors.full_messages}")
    group
  end

  let!(:lisboa_group) { planned_group(lisboa) }
  let!(:porto_group) { planned_group(porto) }

  it "lets a Manager of two Clubs view and edit the Class Groups of both" do
    sign_in manager

    [lisboa_group, porto_group].each do |group|
      get "/dashboard/class_groups/#{group.id}"
      expect(response).to have_http_status(200)

      kept = group.players.first
      patch "/dashboard/class_groups/#{group.id}", params: { class_group: { player_ids: [kept.id] } }, as: :json
      expect(response).to redirect_to("/dashboard/class_groups/#{group.id}")
      expect(group.players.reload).to eq([kept])
    end
  end

  it "lets a Manager of two Clubs edit the Players of both" do
    sign_in manager

    [lisboa, porto].each do |club|
      player = club.players.first
      patch "/dashboard/players/#{player.id}", params: { player: { name: "Renamed #{club.name}" } }
      expect(player.reload.name).to eq("Renamed #{club.name}")
    end
  end

  it "404s a Manager of another Club on the groups and Players of these Clubs" do
    group = lisboa_group
    player = lisboa.players.first

    sign_in outsider
    get "/dashboard/class_groups/#{group.id}"
    expect(response).to have_http_status(:not_found)

    sign_in outsider
    patch "/dashboard/class_groups/#{group.id}", params: { class_group: { player_ids: [player.id] } }, as: :json
    expect(response).to have_http_status(:not_found)

    sign_in outsider
    patch "/dashboard/players/#{player.id}", params: { player: { name: "Hacked" } }
    expect(response).to have_http_status(:not_found)
    expect(player.reload.name).not_to eq("Hacked")
    expect(group.players.reload.size).to eq(2)
  end
end
