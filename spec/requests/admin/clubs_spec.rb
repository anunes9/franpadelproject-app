require "rails_helper"

RSpec.describe "Admin clubs management", type: :request do
  let(:admin) { create(:user, role: :admin) }

  before { sign_in admin }

  it "lists clubs" do
    create(:club, name: "Special Club")
    get "/admin/clubs"
    expect(response).to have_http_status(200)
    expect(response.body).to include("Special Club")
  end

  it "creates a club" do
    expect {
      post "/admin/clubs", params: { club: { name: "New Club", location: "Porto", instagram: "@newclub" } }
    }.to change(Club, :count).by(1)
  end

  it "updates a club" do
    target = create(:club, name: "Old Name")
    patch "/admin/clubs/#{target.id}", params: { club: { name: "New Name" } }
    expect(target.reload.name).to eq("New Name")
  end

  it "deletes a club" do
    target = create(:club)
    expect { delete "/admin/clubs/#{target.id}" }.to change(Club, :count).by(-1)
  end

  it "uploads a logo" do
    target = create(:club)
    file = fixture_file_upload(Rails.root.join("spec/fixtures/files/logo.png"), "image/png")

    patch "/admin/clubs/#{target.id}", params: { club: { logo: file } }

    expect(target.reload.logo).to be_attached
  end

  it "removes a logo" do
    target = create(:club)
    target.logo.attach(io: StringIO.new("logo"), filename: "logo.png", content_type: "image/png")

    delete "/admin/clubs/#{target.id}/remove_logo"

    expect(target.reload.logo).not_to be_attached
  end
end
