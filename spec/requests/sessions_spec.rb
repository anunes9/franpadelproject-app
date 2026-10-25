require "rails_helper"

RSpec.describe "Sessions", type: :request do
  let!(:user) { create(:user, email: "test@example.com", password: "password123") }

  it "logs in with valid credentials and redirects to the dashboard" do
    post user_session_path, params: { user: { email: user.email, password: "password123" } }
    expect(response).to redirect_to(dashboard_path)
  end

  it "rejects invalid credentials and re-renders the login page with an error" do
    post user_session_path, params: { user: { email: user.email, password: "wrongpassword" } }
    # Devise's Warden failure app recalls SessionsController#new in-process on
    # failure (see devise/failure_app.rb#recall) and forces a 422 status,
    # rather than issuing a redirect.
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.body).to include('"base":"invalid_credentials"')
  end

  describe "a removed user (docs/adr/0006-manager-oversight.md)" do
    let!(:coach) { create(:user, :coach, email: "removed@example.com", password: "password123") }

    it "cannot sign in, and is told the account no longer has access" do
      coach.remove!

      post user_session_path, params: { user: { email: coach.email, password: "password123" } }

      expect(response).to redirect_to(new_user_session_path)
      follow_redirect!
      expect(response.body).to include('"base":"removed"')
      get dashboard_path
      expect(response).to redirect_to(new_user_session_path)
    end

    it "is told only that the credentials are wrong when the password is wrong" do
      coach.remove!

      post user_session_path, params: { user: { email: coach.email, password: "wrongpassword" } }

      expect(response.body).to include('"base":"invalid_credentials"')
    end

    it "is signed out on their next request when removed mid-session" do
      post user_session_path, params: { user: { email: coach.email, password: "password123" } }
      get dashboard_path
      expect(response).to have_http_status(:ok)

      coach.remove!
      get dashboard_path

      expect(response).to redirect_to(new_user_session_path)
      follow_redirect!
      expect(response.body).to include('"base":"removed"')
      get dashboard_path
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  it "logs out and redirects to login" do
    post user_session_path, params: { user: { email: user.email, password: "password123" } }
    delete destroy_user_session_path
    expect(response).to redirect_to(new_user_session_path)
  end

  it "serves the login page at root" do
    get "/"
    expect(response).to have_http_status(200)
    expect(response.body).to include("data-page")
  end

  it "shares the pt locale by default for guests" do
    get "/"
    expect(response.body).to include('"locale":"pt"')
  end

  it "redirects an already-authenticated visitor away from the login page" do
    sign_in user
    get "/"
    expect(response).to redirect_to(dashboard_path)
  end

  it "includes a meta description, canonical link, and Open Graph tags" do
    get "/"

    expect(response.body).to include('<meta name="description" content="Curso de padel online com módulos de vídeo, exercícios técnicos e táticos, testes de conhecimentos e plano de treino semanal personalizado.">')
    expect(response.body).to include('<link rel="canonical" href="https://app.franpadelproject.com/">')
    expect(response.body).to include('<meta property="og:image" content="https://app.franpadelproject.com/og-image.png">')
  end

  it "sets a descriptive page title" do
    get "/"

    expect(response.body).to include("<title data-inertia>Fran Padel Academy — Curso de Padel Online</title>")
  end
end
