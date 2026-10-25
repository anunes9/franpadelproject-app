require "rails_helper"

RSpec.describe "Club Manager home", type: :request do
  let(:manager) { create(:user, :club_manager) }
  let(:alpha) { create(:club, name: "Alpha Padel") }
  let(:bravo) { create(:club, name: "Bravo Padel") }
  let(:other_club) { create(:club, name: "Zulu Padel") }

  before do
    create(:club_membership, user: manager, club: bravo)
    create(:club_membership, user: manager, club: alpha)
  end

  # The Inertia page in the response.
  def page
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])
  end

  def props = page["props"]

  it "lands a Club Manager on the overview of their first Club" do
    sign_in manager

    get "/dashboard"

    expect(response).to redirect_to("/dashboard/clubs/#{alpha.id}")
  end

  describe "the Club overview" do
    before do
      create(:user, :coach, club: alpha, name: "Carla Coach")
      create(:user, :coach, club: bravo, name: "Bruno Coach")
      create(:player, club: alpha, name: "Rita Sousa")
      create(:player, club: bravo, name: "Pedro Lima")
    end

    it "shows the selected Club's Coaches and Players" do
      sign_in manager

      get "/dashboard/clubs/#{alpha.id}"

      expect(response).to have_http_status(200)
      expect(page["component"]).to eq("Clubs/Show")
      expect(props["club"]).to eq("id" => alpha.id, "name" => "Alpha Padel")
      expect(props["coaches"].map { |c| c["name"] }).to eq(["Carla Coach"])
      expect(props["players"].map { |p| p["name"] }).to eq(["Rita Sousa"])
      # Class Groups do not exist yet, so the overview shows them as a static
      # empty state rather than receiving them.
      expect(props).not_to have_key("classGroups")
    end

    it "offers a switcher with only the Club Manager's linked Clubs" do
      other_club
      sign_in manager

      get "/dashboard/clubs/#{alpha.id}"

      expect(props["dashboardUser"]["clubs"].map { |c| c["name"] }).to eq(["Alpha Padel", "Bravo Padel"])
      expect(response.body).not_to include("Zulu Padel")
    end

    it "switches the overview to another linked Club" do
      sign_in manager

      get "/dashboard/clubs/#{bravo.id}"

      expect(props["club"]["name"]).to eq("Bravo Padel")
      expect(props["coaches"].map { |c| c["name"] }).to eq(["Bruno Coach"])
      expect(props["players"].map { |p| p["name"] }).to eq(["Pedro Lima"])
      expect(response.body).not_to include("Carla Coach", "Rita Sousa")
    end

    it "404s for a Club the Club Manager is not linked to" do
      sign_in manager

      get "/dashboard/clubs/#{other_club.id}"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for an unknown Club" do
      sign_in manager

      get "/dashboard/clubs/#{SecureRandom.uuid}"

      expect(response).to have_http_status(:not_found)
    end

    it "is not a Coach screen, not even for the Coach's own Club" do
      sign_in alpha.coaches.first

      get "/dashboard/clubs/#{alpha.id}"

      expect(response).to have_http_status(:not_found)
    end

    it "requires authentication" do
      get "/dashboard/clubs/#{alpha.id}"

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  it "keeps the Coach on the Course home" do
    sign_in create(:user, :coach, club: alpha)

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(page["component"]).to eq("Dashboard/Home")
  end

  it "shows a Club Manager with no linked Clubs an empty Club Manager home" do
    sign_in create(:user, :club_manager)

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(page["component"]).to eq("Clubs/Show")
    expect(props["club"]).to be_nil
    expect(props["coaches"]).to eq([])
    expect(props["players"]).to eq([])
    expect(props).not_to have_key("classGroups")
    expect(props["dashboardUser"]["clubs"]).to eq([])
  end
end
