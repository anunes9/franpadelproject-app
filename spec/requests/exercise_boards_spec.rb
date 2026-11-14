require "rails_helper"

RSpec.describe "Exercise Boards", type: :request do
  let(:exercise) { create(:exercise, ref: "exercise-10.1", title: "Serviço ao vidro") }
  let(:admin) { create(:user, :admin) }
  let(:coach) { create(:user, :coach) }

  # The official Board: A with the ball, its words in both languages.
  let(:document) do
    {
      "version" => 1, "view" => "full", "labels" => "sectors",
      "pieces" => [{ "id" => "a", "kind" => "player", "label" => "A" }, { "id" => "b", "kind" => "ball" }],
      "steps" => [
        {
          "caption" => { "pt" => "Serviço", "en" => "Serve" },
          "positions" => { "a" => { "x" => 1.5, "y" => 6.4 }, "b" => { "x" => 2.5, "y" => 6.6 } },
          "marks" => [{ "id" => "t", "kind" => "text", "x" => 3, "y" => 5, "text" => { "pt" => "serviço", "en" => "serve" } }]
        }
      ]
    }
  end

  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def put_board(doc)
    put "/dashboard/exercises/#{exercise.ref}/board", params: { board: { document: doc } }, as: :json
  end

  describe "an Admin editing it" do
    it "starts from an empty court, then saves the Board, titled after the Exercise" do
      sign_in admin
      get "/dashboard/exercises/#{exercise.ref}/board/edit"
      expect(response.body).to include(%q("component":"Boards/Exercise"))
      expect(page_props["exercise"]).to include("ref" => "exercise-10.1", "title" => "Serviço ao vidro",
                                                "adminPath" => "/admin/exercises/#{exercise.id}")
      expect(page_props["document"]).to be_nil

      expect { put_board(document) }.to change(Board, :count).by(1)
      expect(response).to redirect_to("/dashboard/exercises/exercise-10.1/board/edit")
      expect(exercise.reload.board).to have_attributes(title: "Serviço ao vidro", document: document)
    end

    it "updates the one Board an Exercise has" do
      sign_in admin
      put_board(document)
      sign_in admin
      expect { put_board(document.merge("labels" => "glass")) }.not_to change(Board, :count)
      expect(exercise.reload.board.document["labels"]).to eq("glass")
    end

    it "refuses a broken document" do
      sign_in admin
      expect { put_board(document.merge("version" => 9)) }.not_to change(Board, :count)
      expect(session[:inertia_errors]).to include(document: [hash_including(code: "invalid")])
    end

    it "takes the Board away" do
      exercise.create_board!(title: exercise.title, document: document)
      sign_in admin

      expect { delete "/dashboard/exercises/#{exercise.ref}/board" }.to change(Board, :count).by(-1)
      expect(response).to redirect_to("/dashboard/exercises/exercise-10.1/board/edit")
    end

    it "is a 404 for anyone else, who can't change it" do
      [coach, create(:user, :club_manager)].each do |user|
        sign_in user
        get "/dashboard/exercises/#{exercise.ref}/board/edit"
        expect(response).to have_http_status(:not_found)
        sign_in user
        put_board(document)
        expect(response).to have_http_status(:not_found)
      end
      expect(exercise.reload.board).to be_nil
    end
  end

  describe "a Coach explaining on it" do
    it "opens a scratch copy of the Board" do
      exercise.create_board!(title: exercise.title, document: document)
      sign_in coach

      get "/dashboard/exercises/#{exercise.ref}/board"

      expect(response.body).to include(%q("component":"Boards/New"))
      expect(page_props["from"]).to eq("ref" => "exercise-10.1", "title" => "Serviço ao vidro", "document" => document)
    end

    it "is a 404 when the Exercise has no Board, and for anyone but a Coach" do
      sign_in coach
      get "/dashboard/exercises/#{exercise.ref}/board"
      expect(response).to have_http_status(:not_found)

      exercise.create_board!(title: exercise.title, document: document)
      sign_in admin
      get "/dashboard/exercises/#{exercise.ref}/board"
      expect(response).to have_http_status(:not_found)
    end

    it "saves a copy into the Coach's library, leaving the official Board as it was" do
      board = exercise.create_board!(title: exercise.title, document: document)
      sign_in coach

      copy = document.deep_dup
      copy["steps"][0]["caption"] = "Serviço, à minha maneira"
      post "/dashboard/boards", params: { board: { title: "Serviço ao vidro", document: copy } }, as: :json

      expect(coach.boards.sole.document).to eq(copy)
      expect(board.reload.document).to eq(document)
    end
  end

  describe "the Exercise's court diagram" do
    it "comes with the Exercise wherever it is shown" do
      exercise.create_board!(title: exercise.title, document: document)
      sign_in coach

      get "/dashboard/exercises/#{exercise.ref}"
      expect(page_props["exercise"]["board"]).to eq(document)

      get "/dashboard/exercises"
      expect(page_props["exercises"].first["board"]).to eq(document)
    end
  end

  it "is reached from the Exercise in the admin" do
    sign_in admin
    get "/admin/exercises/#{exercise.id}"
    expect(response.body).to include("Add board", "None: the first image is the court diagram")

    exercise.create_board!(title: exercise.title, document: document)
    get "/admin/exercises/#{exercise.id}"
    expect(response.body).to include("Edit board", "1 step", "/dashboard/exercises/exercise-10.1/board/edit")
  end

  it "allows one Board per Exercise" do
    exercise.create_board!(title: exercise.title, document: document)
    second = Board.new(boardable: exercise, title: "Again", document: document)

    expect(second).not_to be_valid
    expect(second.errors.details[:boardable_id]).to include(hash_including(error: :taken))
  end
end
