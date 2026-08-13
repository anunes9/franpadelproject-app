require "rails_helper"

RSpec.describe "Admin panel access", type: :request do
  it "redirects an anonymous visitor to the login page" do
    get "/admin"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "redirects an authenticated non-admin user away with an alert" do
    user = create(:user, role: :client)
    sign_in user
    get "/admin"
    expect(response).to redirect_to(root_path)
    expect(flash[:alert]).to eq("You are not authorized to access this page.")
  end

  it "allows an authenticated admin to reach the admin panel" do
    admin = create(:user, role: :admin)
    sign_in admin
    get "/admin"
    expect(response).to have_http_status(200)
  end
end
