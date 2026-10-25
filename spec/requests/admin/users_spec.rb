require "rails_helper"

RSpec.describe "Admin users management", type: :request do
  let(:admin) { create(:user, :admin) }

  before { sign_in admin }

  it "lists users" do
    create(:user, email: "someone@example.com")
    get "/admin/users"
    expect(response).to have_http_status(200)
    expect(response.body).to include("someone@example.com")
  end

  it "filters users by role" do
    create(:user, email: "coach-person@example.com", role: :coach)
    # The rendered filter <select> submits the enum's integer value (see
    # app/admin/users.rb) -- not the string key, which Ransack's role_eq
    # would silently miscast via a naive #to_i.
    get "/admin/users", params: { q: { role_eq: User.roles["coach"] } }
    expect(response).to have_http_status(200)
    expect(response.body).to include("coach-person@example.com")
  end

  it "creates a Coach in a Club with a password" do
    club = create(:club)

    expect {
      post "/admin/users", params: {
        user: {
          email: "new@example.com", role: "coach", name: "New Coach", club_id: club.id,
          password: "password123", password_confirmation: "password123"
        }
      }
    }.to change(User, :count).by(1)

    expect(User.find_by(email: "new@example.com")).to have_attributes(role: "coach", club: club)
  end

  it "does not create a Coach without a Club" do
    expect {
      post "/admin/users", params: {
        user: {
          email: "new@example.com", role: "coach", name: "New Coach",
          password: "password123", password_confirmation: "password123"
        }
      }
    }.not_to change(User, :count)
  end

  it "creates a Club Manager linked to several Clubs" do
    clubs = create_list(:club, 2)

    post "/admin/users", params: {
      user: {
        email: "manager@example.com", role: "club_manager", name: "Manager",
        password: "password123", password_confirmation: "password123",
        managed_club_ids: ["", *clubs.map(&:id)]
      }
    }

    expect(User.find_by(email: "manager@example.com").managed_clubs).to match_array(clubs)
  end

  it "links an existing Club Manager to another Club" do
    manager = create(:user, :club_manager)
    club = create(:club)

    patch "/admin/users/#{manager.id}", params: {
      user: { email: manager.email, role: "club_manager", managed_club_ids: [club.id], password: "", password_confirmation: "" }
    }

    expect(manager.reload.managed_clubs).to eq([club])
  end

  it "lets an Admin create a Club" do
    expect { post "/admin/clubs", params: { club: { name: "New Club" } } }.to change(Club, :count).by(1)
  end

  it "updates a user's role without requiring a password" do
    target = create(:user, role: :coach)

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: "admin", password: "", password_confirmation: "" }
    }

    expect(target.reload.role).to eq("admin")
  end

  it "leaves a user's existing password valid when editing without touching it" do
    target = create(:user, email: "keep-pass@example.com", password: "originalpass1")

    patch "/admin/users/#{target.id}", params: {
      user: { email: target.email, role: "coach", password: "", password_confirmation: "" }
    }

    expect(target.reload.valid_password?("originalpass1")).to be true
  end

  it "deletes a user" do
    target = create(:user)
    expect { delete "/admin/users/#{target.id}" }.to change(User, :count).by(-1)
  end

  it "refuses to delete a Coach who owns a Class Group, keeping the Coach and the group" do
    coach = create(:user, :coach)
    group = ClassGroup.create!(coach: coach, players: [create(:player, club: coach.club)], level: "beginner",
                               starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: ["tuesday"],
                               start_time: "18:00", duration: 60)

    expect { delete "/admin/users/#{coach.id}" }.not_to change(User, :count)

    expect(ClassGroup.exists?(group.id)).to be true
    follow_redirect!
    expect(response.body).to include("owns Class Groups, so reassign them to another Coach first")
  end

  it "refuses the delete the same way when the database finds a Class Group the check missed" do
    coach = create(:user, :coach)
    allow_any_instance_of(User).to receive(:destroy).and_raise(ActiveRecord::InvalidForeignKey)

    expect { delete "/admin/users/#{coach.id}" }.not_to change(User, :count)

    follow_redirect!
    expect(response.body).to include("owns Class Groups, so reassign them to another Coach first")
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
