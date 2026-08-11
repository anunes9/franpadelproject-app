require "rails_helper"

RSpec.describe "Tailwind asset pipeline", type: :request do
  it "serves the Tailwind CSS bundle alongside the login page" do
    get "/"
    expect(response).to have_http_status(200)
    expect(response.body).to match(%r{href="/vite-test/assets/application-[^"]+\.css"})
  end
end
