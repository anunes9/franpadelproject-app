require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid with an email, password, and role" do
    expect(build(:user)).to be_valid
  end

  it "requires an email" do
    expect(build(:user, email: nil)).not_to be_valid
  end

  it "requires a unique email" do
    create(:user, email: "duplicate@example.com")
    expect(build(:user, email: "duplicate@example.com")).not_to be_valid
  end

  it "requires a name" do
    expect(build(:user, name: nil)).not_to be_valid
  end

  it "defines the expected role values" do
    expect(User.roles.keys).to match_array(%w[admin club_manager coach])
  end

  it "defines the expected level values" do
    expect(User.levels.keys).to match_array(%w[beginner intermediate advanced])
  end

  it "defines the expected hand values" do
    expect(User.hands.keys).to match_array(%w[left right])
  end

  it "defines the expected locale values" do
    expect(User.locales.keys).to match_array(%w[pt en])
  end

  it "defaults to pt" do
    expect(create(:user).locale).to eq("pt")
  end

  it "authenticates with the correct password" do
    user = create(:user, password: "password123")
    expect(user.valid_password?("password123")).to be true
  end

  it "has no Player-with-login role" do
    expect(User.roles).not_to have_key("client")
  end

  describe "Club rules" do
    it "requires a Coach to belong to a Club" do
      expect(build(:user, :coach, club: nil)).not_to be_valid
    end

    it "does not require an Admin to have a Club" do
      expect(build(:user, :admin, club: nil)).to be_valid
    end

    it "does not give a Club Manager a single home Club" do
      expect(build(:user, :club_manager, club: create(:club))).not_to be_valid
    end

    it "links a Club Manager to several Clubs" do
      manager = create(:user, :club_manager)
      clubs = create_list(:club, 2)

      manager.managed_clubs << clubs

      expect(manager.reload.managed_clubs).to match_array(clubs)
    end

    it "refuses to link a Coach as a Club Manager" do
      coach = create(:user, :coach)

      expect(build(:club_membership, user: coach)).not_to be_valid
    end

    it "refuses linking the same Manager to the same Club twice" do
      membership = create(:club_membership)

      expect(build(:club_membership, user: membership.user, club: membership.club)).not_to be_valid
    end

    it "lists a Club's Coaches and Managers separately" do
      club = create(:club)
      coach = create(:user, :coach, club: club)
      manager = create(:club_membership, club: club).user

      expect(club.coaches).to eq([coach])
      expect(club.managers).to eq([manager])
    end

    it "refuses to destroy a Club that still has Coaches" do
      club = create(:club)
      create(:user, :coach, club: club)

      expect(club.destroy).to be false
      expect(Club.exists?(club.id)).to be true
    end
  end

  describe "#initials" do
    it "returns the first letter of the first two words" do
      expect(build(:user, name: "Miguel Santos").initials).to eq("MS")
    end

    it "returns a single letter for a one-word name" do
      expect(build(:user, name: "Admin").initials).to eq("A")
    end
  end

  describe "#member_since" do
    it "returns created_at as an ISO 8601 date for the client to format" do
      user = create(:user)
      user.update_column(:created_at, Time.zone.local(2026, 3, 15))
      expect(user.member_since).to eq("2026-03-15")
    end
  end

  describe "#dashboard_profile_json" do
    it "returns name, initials, the club's name and the Clubs whose roster they manage" do
      club = create(:club, name: "Padel Clube Lisboa")
      user = build(:user, name: "Miguel Santos", club: club)

      expect(user.dashboard_profile_json).to eq(
        name: "Miguel Santos",
        initials: "MS",
        club: "Padel Clube Lisboa",
        clubs: [{ id: club.id, name: "Padel Clube Lisboa" }]
      )
    end

    it "returns a nil club when the user has none" do
      user = build(:user, name: "Miguel Santos", club: nil)
      expect(user.dashboard_profile_json).to include(club: nil)
    end
  end

  describe "#profile_json" do
    it "includes level and hand capitalized" do
      user = create(:user, level: :beginner, hand: :right)
      expect(user.profile_json).to include(level: "Beginner", hand: "Right")
    end

    it "returns nil for level and hand when unset" do
      user = create(:user, level: nil, hand: nil)
      expect(user.profile_json).to include(level: nil, hand: nil)
    end
  end
end
