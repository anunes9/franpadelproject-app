require "rails_helper"

RSpec.describe "Boards", type: :request do
  let(:coach) { create(:user, :coach) }

  # A small Board: A with the ball, a ball path off back glass 2, and ink.
  let(:document) do
    {
      "version" => 1, "view" => "full", "labels" => "glass",
      "pieces" => [{ "id" => "a", "kind" => "player", "label" => "A" }, { "id" => "b", "kind" => "ball" }],
      "steps" => [
        {
          "caption" => "Serviço",
          "positions" => { "a" => { "x" => 1.5, "y" => 6.4 }, "b" => { "x" => 2.5, "y" => 6.6 } },
          "marks" => [
            { "id" => "m1", "kind" => "ballPath",
              "points" => [{ "x" => 2.5, "y" => 6.6 }, { "x" => 20, "y" => 3.1, "glass" => { "wall" => "back", "number" => 2 } }] },
            { "id" => "m2", "kind" => "ink", "points" => [[11, 1], [11.4, 1.5]] }
          ]
        }
      ]
    }
  end

  # The props of the Inertia page in the response.
  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  # Inertia sends a Board as JSON, which keeps the ink's nested lists intact.
  def save_board(params)
    post "/dashboard/boards", params: { board: params }, as: :json
  end

  describe "opening a scratch Board" do
    it "shows a Coach a blank Board" do
      sign_in coach

      get "/dashboard/boards/new"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(%q("component":"Boards/New"))
    end

    it "is a 404 for anyone who isn't a Coach" do
      [create(:user, :club_manager), create(:user, :admin)].each do |user|
        sign_in user

        get "/dashboard/boards/new"

        expect(response).to have_http_status(:not_found)
      end
    end

    it "sends a signed-out visitor to sign in" do
      get "/dashboard/boards/new"

      expect(response).to redirect_to("/users/sign_in")
    end
  end

  describe "saving a Board" do
    it "keeps it in the Coach's library and opens it" do
      sign_in coach

      expect { save_board(title: "  Serviço  ao vidro ", document: document) }.to change(Board, :count).by(1)

      board = Board.last
      expect(response).to redirect_to("/dashboard/boards/#{board.id}")
      expect(board.boardable).to eq(coach)
      expect(board.title).to eq("Serviço ao vidro")
      expect(board.document).to eq(document)

      get "/dashboard/boards/#{board.id}"
      expect(response.body).to include(%q("component":"Boards/Show"))
      expect(page_props["board"]).to include("id" => board.id, "title" => "Serviço ao vidro", "document" => document)
    end

    it "refuses a Board without a title, or with a broken document, and saves nothing" do
      sign_in coach

      expect { save_board(title: " ", document: document) }.not_to change(Board, :count)
      expect(response).to redirect_to("/dashboard/boards/new")
      expect(session[:inertia_errors]).to include(title: [hash_including(code: "blank")])

      expect { save_board(title: "Broken", document: document.merge("version" => 9)) }.not_to change(Board, :count)
      expect(session[:inertia_errors]).to include(document: [hash_including(code: "invalid")])
    end
  end

  describe "a Coach's library" do
    it "lists only their own Boards, most recently changed first" do
      older = create_board(coach, "Older", updated_at: 2.days.ago)
      newer = create_board(coach, "Newer", updated_at: 1.hour.ago)
      create_board(create(:user, :coach), "Someone else's")
      sign_in coach

      get "/dashboard/boards"

      expect(response.body).to include(%q("component":"Boards/Index"))
      expect(page_props["boards"].map { |board| board["id"] }).to eq([newer.id, older.id])
      expect(page_props["boards"].first).to include("title" => "Newer", "document" => document)
    end

    it "updates a Board's document and renames it" do
      board = create_board(coach, "Serve")
      sign_in coach

      moved = document.deep_dup
      moved["steps"][0]["positions"]["a"] = { "x" => 4, "y" => 6 }
      patch "/dashboard/boards/#{board.id}", params: { board: { document: moved } }, as: :json
      expect(response).to redirect_to("/dashboard/boards/#{board.id}")
      expect(board.reload.document["steps"][0]["positions"]["a"]).to eq("x" => 4, "y" => 6)

      patch "/dashboard/boards/#{board.id}", params: { board: { title: "Serve to the glass" } }, as: :json
      expect(board.reload.title).to eq("Serve to the glass")
      expect(board.document).to eq(moved)
    end

    it "deletes a Board" do
      board = create_board(coach, "Serve")
      sign_in coach

      expect { delete "/dashboard/boards/#{board.id}" }.to change(Board, :count).by(-1)
      expect(response).to redirect_to("/dashboard/boards")
    end

    # A 404 doesn't carry the signed-in session on, so each request signs in.
    it "is a 404 on another Coach's Board, which is left as it was" do
      board = create_board(create(:user, :coach), "Theirs")

      sign_in coach
      get "/dashboard/boards/#{board.id}"
      expect(response).to have_http_status(:not_found)
      sign_in coach
      patch "/dashboard/boards/#{board.id}", params: { board: { title: "Mine now" } }, as: :json
      expect(response).to have_http_status(:not_found)
      sign_in coach
      delete "/dashboard/boards/#{board.id}"
      expect(response).to have_http_status(:not_found)
      expect(board.reload.title).to eq("Theirs")
    end

    it "is a 404 for a Club Manager or an Admin, even on the Boards of their Club's Coaches" do
      board = create_board(coach, "Serve")
      manager = create(:user, :club_manager)
      ClubMembership.create!(user: manager, club: coach.club)

      [manager, create(:user, :admin)].each do |user|
        ["/dashboard/boards", "/dashboard/boards/#{board.id}"].each do |path|
          sign_in user
          get path
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end

  def create_board(owner, title, **attributes)
    Board.create!(boardable: owner, title: title, document: document, **attributes)
  end
end
