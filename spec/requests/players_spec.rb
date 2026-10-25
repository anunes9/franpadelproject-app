require "rails_helper"

RSpec.describe "Players", type: :request do
  let(:club) { create(:club, name: "Padel Clube Lisboa") }
  let(:coach) { create(:user, :coach, club: club) }
  let(:player_params) do
    { player: { name: "Rita Sousa", position: "left", hand: "right", level: "beginner" } }
  end

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  describe "creating a Player" do
    it "lets a Coach add a Player to their Club" do
      sign_in coach

      expect { post "/dashboard/clubs/#{club.id}/players", params: player_params }
        .to change { club.players.count }.by(1)

      player = club.players.last
      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/players")
      expect(player).to have_attributes(name: "Rita Sousa", position: "left", hand: "right", level: "beginner")
    end

    it "lets a Club Manager add a Player to any of their linked Clubs" do
      manager = create(:user, :club_manager)
      other_linked_club = create(:club)
      create(:club_membership, user: manager, club: club)
      create(:club_membership, user: manager, club: other_linked_club)
      sign_in manager

      expect { post "/dashboard/clubs/#{other_linked_club.id}/players", params: player_params }
        .to change { other_linked_club.players.count }.by(1)
    end

    it "404s for a Club the Coach does not belong to" do
      sign_in create(:user, :coach)

      expect { post "/dashboard/clubs/#{club.id}/players", params: player_params }
        .not_to change(Player, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "404s for a Club the Club Manager is not linked to" do
      sign_in create(:user, :club_manager)

      expect { post "/dashboard/clubs/#{club.id}/players", params: player_params }
        .not_to change(Player, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "rejects a Player without a name or with an unknown position and shows the errors" do
      sign_in coach

      expect do
        post "/dashboard/clubs/#{club.id}/players",
             params: { player: { name: "", position: "middle", hand: "right", level: "beginner" } }
      end.not_to change(Player, :count)
      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/players/new")

      follow_redirect!
      # Players/Form shows its own copy for these known messages, and the
      # server's message for any other.
      expect(page_props["errors"]).to eq(
        "name" => ["can't be blank"],
        "position" => ["is not included in the list"]
      )
    end

    it "never gives the Player an email or password" do
      sign_in coach

      post "/dashboard/clubs/#{club.id}/players",
           params: { player: player_params[:player].merge(email: "rita@example.com", password: "secret123") }

      expect(club.players.last.attributes.keys).not_to include("email", "encrypted_password")
      expect(User.find_by(email: "rita@example.com")).to be_nil
    end

    it "requires authentication" do
      post "/dashboard/clubs/#{club.id}/players", params: player_params

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  describe "the Players list" do
    it "shows a Coach the Players of their Club only" do
      create(:player, club: club, name: "Rita Sousa")
      create(:player, name: "Someone Elsewhere")
      sign_in coach

      get "/dashboard/clubs/#{club.id}/players"

      expect(response).to have_http_status(200)
      expect(response.body).to include(%q("component":"Players/Index"))
      expect(response.body).to include("Rita Sousa")
      expect(response.body).to include("Padel Clube Lisboa")
      expect(response.body).not_to include("Someone Elsewhere")
    end

    it "is shared by every Coach of the Club" do
      create(:player, club: club, name: "Rita Sousa")
      sign_in create(:user, :coach, club: club)

      get "/dashboard/clubs/#{club.id}/players"

      expect(response.body).to include("Rita Sousa")
    end

    it "shows a Club Manager the roster of a linked Club" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      create(:player, club: club, name: "Rita Sousa")
      sign_in manager

      get "/dashboard/clubs/#{club.id}/players"

      expect(response.body).to include("Rita Sousa")
    end

    it "404s for another Club's Players" do
      create(:player, club: club, name: "Rita Sousa")
      sign_in create(:user, :coach)

      get "/dashboard/clubs/#{club.id}/players"

      expect(response).to have_http_status(:not_found)
    end

    it "404s for an Admin, who manages Clubs through the admin screens" do
      sign_in create(:user, :admin)

      get "/dashboard/clubs/#{club.id}/players"

      expect(response).to have_http_status(:not_found)
    end

    it "renders the new Player form with the position, hand and Level options" do
      sign_in coach

      get "/dashboard/clubs/#{club.id}/players/new"

      expect(response).to have_http_status(200)
      expect(response.body).to include(%q("component":"Players/Form"))
      expect(page_props).to include(
        "positionOptions" => %w[left right both],
        "handOptions" => %w[left right],
        "levelOptions" => %w[beginner intermediate advanced]
      )
    end

    it "404s the new Player form for another Club" do
      sign_in create(:user, :coach)

      get "/dashboard/clubs/#{club.id}/players/new"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "navigation" do
    it "gives a Coach their Club for the Players link" do
      sign_in coach

      get "/dashboard"

      expect(page_props["dashboardUser"]["clubs"]).to eq([{ "id" => club.id, "name" => "Padel Clube Lisboa" }])
    end

    it "gives a Club Manager each linked Club, by name" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      create(:club_membership, user: manager, club: create(:club, name: "Academia Porto"))
      sign_in manager

      get "/dashboard/clubs/#{club.id}/players"

      expect(page_props["dashboardUser"]["clubs"].map { |c| c["name"] }).to eq(["Academia Porto", "Padel Clube Lisboa"])
    end
  end

  describe "editing a Player" do
    let!(:player) { create(:player, club: club, name: "Rita Sousa", position: "left", level: "beginner") }

    it "lets a Coach of the Club edit the Player" do
      sign_in create(:user, :coach, club: club)

      get "/dashboard/players/#{player.id}/edit"
      expect(response).to have_http_status(200)
      expect(response.body).to include("Rita Sousa")

      patch "/dashboard/players/#{player.id}", params: { player: { position: "both", level: "intermediate" } }

      expect(response).to redirect_to("/dashboard/clubs/#{club.id}/players")
      expect(player.reload).to have_attributes(position: "both", level: "intermediate")
    end

    it "lets a linked Club Manager edit the Player" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: club)
      sign_in manager

      patch "/dashboard/players/#{player.id}", params: { player: { name: "Rita M. Sousa" } }

      expect(player.reload.name).to eq("Rita M. Sousa")
    end

    it "never moves a Player to another Club" do
      sign_in coach

      patch "/dashboard/players/#{player.id}", params: { player: { club_id: create(:club).id } }

      expect(player.reload.club).to eq(club)
    end

    it "rejects invalid changes and shows the errors" do
      sign_in coach

      patch "/dashboard/players/#{player.id}", params: { player: { name: "", hand: "both" } }

      expect(response).to redirect_to("/dashboard/players/#{player.id}/edit")
      expect(player.reload).to have_attributes(name: "Rita Sousa")
      follow_redirect!
      expect(page_props["errors"].keys).to contain_exactly("name", "hand")
    end

    it "404s the edit form of another Club's Player for a Coach" do
      sign_in create(:user, :coach)

      get "/dashboard/players/#{player.id}/edit"

      expect(response).to have_http_status(:not_found)
    end

    it "404s updating another Club's Player for a Coach" do
      sign_in create(:user, :coach)

      patch "/dashboard/players/#{player.id}", params: { player: { name: "Hacked" } }
      expect(response).to have_http_status(:not_found)
      expect(player.reload.name).to eq("Rita Sousa")
    end

    it "404s another Club's Player for a Club Manager not linked to it" do
      manager = create(:user, :club_manager)
      create(:club_membership, user: manager, club: create(:club))
      sign_in manager

      patch "/dashboard/players/#{player.id}", params: { player: { name: "Hacked" } }

      expect(response).to have_http_status(:not_found)
      expect(player.reload.name).to eq("Rita Sousa")
    end
  end
end
