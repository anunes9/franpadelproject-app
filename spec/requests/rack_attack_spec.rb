require "rails_helper"

RSpec.describe "Rack::Attack", type: :request do
  [
    "/xmlrpc.php",
    "/tracking.php",
    "/wp-includes/wlwmanifest.xml",
    "/wp-admin/setup-config.php",
    "/.env",
    "/.git/config",
    "/_internal/api/setup.php",
    "/.amper/challenge/fp.js",
    "/.rt/verify",
    "/assets/js/telegram_redirect.js",
    "/set_captcha_validated.php",
    "/setup",
    "/cgi-bin/test.cgi",
    "/phpmyadmin/index.php",
  ].each do |path|
    it "blocks scanner requests to #{path}" do
      get path

      expect(response).to have_http_status(:forbidden)
    end
  end

  it "does not block legitimate application routes" do
    get "/"

    expect(response).not_to have_http_status(:forbidden)
  end

  it "does not block the health check" do
    get "/up"

    expect(response).not_to have_http_status(:forbidden)
  end
end
