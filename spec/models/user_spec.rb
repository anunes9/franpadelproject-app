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
    expect(User.roles.keys).to match_array(%w[admin sales client])
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

  it "does not require a club" do
    expect(build(:user, club: nil)).to be_valid
  end

  it "nullifies club_id when its club is destroyed" do
    club = create(:club)
    user = create(:user, club: club)

    club.destroy

    expect(user.reload.club_id).to be_nil
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
    it "formats created_at as an abbreviated month and year" do
      user = create(:user)
      user.update_column(:created_at, Time.zone.local(2026, 3, 15))
      expect(user.member_since).to eq("Mar 2026")
    end
  end

  describe "#dashboard_profile_json" do
    it "returns name, initials, and the club's name" do
      club = create(:club, name: "Padel Clube Lisboa")
      user = build(:user, name: "Miguel Santos", club: club)

      expect(user.dashboard_profile_json).to eq(name: "Miguel Santos", initials: "MS", club: "Padel Clube Lisboa")
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
