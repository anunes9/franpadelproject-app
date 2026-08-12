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

  it "defines the expected role values" do
    expect(User.roles.keys).to match_array(%w[admin sales client])
  end

  it "authenticates with the correct password" do
    user = create(:user, password: "password123")
    expect(user.valid_password?("password123")).to be true
  end
end
