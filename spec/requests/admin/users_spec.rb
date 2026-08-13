require "rails_helper"

RSpec.describe "Admin users management", type: :request do
  let(:admin) { create(:user, role: :admin) }

  before { sign_in admin }

  it "lists users" do
    create(:user, email: "someone@example.com")
    get "/admin/users"
    expect(response).to have_http_status(200)
    expect(response.body).to include("someone@example.com")
  end

  it "filters users by role" do
    create(:user, email: "sales-person@example.com", role: :sales)
    # The rendered filter <select> submits the enum's integer value (see
    # app/admin/users.rb) -- not the string key, which Ransack's role_eq
    # would silently miscast via a naive #to_i.
    get "/admin/users", params: { q: { role_eq: User.roles["sales"] } }
    expect(response).to have_http_status(200)
    expect(response.body).to include("sales-person@example.com")
  end

  it "creates a user with a password" do
    expect {
      post "/admin/users", params: {
        user: {
          email: "new@example.com", role: "client", name: "New User",
          password: "password123", password_confirmation: "password123"
        }
      }
    }.to change(User, :count).by(1)

    expect(User.find_by(email: "new@example.com")).to be_present
  end

  it "updates a user's role without requiring a password" do
    target = create(:user, role: :client)

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: "sales", password: "", password_confirmation: "" }
    }

    expect(target.reload.role).to eq("sales")
  end

  it "leaves a user's existing password valid when editing without touching it" do
    target = create(:user, email: "keep-pass@example.com", password: "originalpass1")

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: "client", password: "", password_confirmation: "" }
    }

    expect(target.reload.valid_password?("originalpass1")).to be true
  end

  it "deletes a user" do
    target = create(:user)
    expect { delete "/admin/users/#{target.id}" }.to change(User, :count).by(-1)
  end

  it "assigns a user to a club" do
    club = create(:club, name: "Padel Clube Lisboa")
    target = create(:user)

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: target.role, club_id: club.id, password: "", password_confirmation: "" }
    }

    expect(target.reload.club).to eq(club)
  end
end
