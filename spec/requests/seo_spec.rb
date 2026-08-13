require "rails_helper"

RSpec.describe "SEO crawler files", type: :request do
  describe "GET /robots.txt" do
    it "disallows gated routes and points at the sitemap" do
      get "/robots.txt"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Disallow: /dashboard")
      expect(response.body).to include("Disallow: /admin")
      expect(response.body).to include("Disallow: /users")
      expect(response.body).to include("Sitemap: https://app.franpadelproject.com/sitemap.xml")
    end
  end

  describe "GET /sitemap.xml" do
    it "lists the public root URL" do
      get "/sitemap.xml"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("<loc>https://app.franpadelproject.com/</loc>")
    end
  end
end
