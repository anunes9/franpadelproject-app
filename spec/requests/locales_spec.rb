require "rails_helper"

RSpec.describe "Locales", type: :request do
  let(:user) { create(:user, locale: :pt) }

  before { sign_in user }

  it "updates the current user's locale and redirects back" do
    patch "/locale", params: { locale: "en" }, headers: { "HTTP_REFERER" => "/dashboard/profile" }

    expect(response).to redirect_to("/dashboard/profile")
    expect(user.reload.locale).to eq("en")
  end

  it "falls back to the dashboard when there's no referer" do
    patch "/locale", params: { locale: "en" }

    expect(response).to redirect_to(dashboard_path)
  end

  it "rejects an invalid locale without changing the user" do
    patch "/locale", params: { locale: "fr" }

    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.locale).to eq("pt")
  end

  it "requires authentication" do
    sign_out user
    patch "/locale", params: { locale: "en" }
    expect(response).to redirect_to(new_user_session_path)
  end
end
