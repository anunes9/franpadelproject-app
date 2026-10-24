require "rails_helper"

RSpec.describe "Admin panel access", type: :request do
  it "redirects an anonymous visitor to the login page" do
    get "/admin"
    expect(response).to redirect_to(new_user_session_path)
  end

  %i[coach club_manager].each do |role|
    it "redirects an authenticated #{role} away with an alert" do
      sign_in create(:user, role)
      get "/admin"
      expect(response).to redirect_to(root_path)
      expect(flash[:alert]).to eq("You are not authorized to access this page.")
    end
  end

  it "does not let a Club Manager create a Club" do
    sign_in create(:user, :club_manager)

    expect { post "/admin/clubs", params: { club: { name: "Sneaky Club" } } }.not_to change(Club, :count)
    expect(response).to redirect_to(root_path)
  end

  it "allows an authenticated admin to reach the admin panel" do
    admin = create(:user, :admin)
    sign_in admin
    get "/admin"
    expect(response).to have_http_status(200)
  end
end
