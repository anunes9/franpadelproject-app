require "rails_helper"

RSpec.describe "Boards", type: :request do
  describe "opening a scratch Board" do
    it "shows a Coach a blank Board" do
      sign_in create(:user, :coach)

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
end
