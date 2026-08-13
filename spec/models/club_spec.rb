require "rails_helper"

RSpec.describe Club, type: :model do
  it "is valid with a name" do
    expect(build(:club)).to be_valid
  end

  it "requires a name" do
    expect(build(:club, name: nil)).not_to be_valid
  end

  it "requires a unique name" do
    create(:club, name: "Padel Clube Lisboa")
    expect(build(:club, name: "Padel Clube Lisboa")).not_to be_valid
  end

  it "can have a logo attached" do
    club = create(:club)
    club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")
    expect(club.logo).to be_attached
  end

  it "returns its name as a string representation" do
    expect(build(:club, name: "Padel Clube Lisboa").to_s).to eq("Padel Clube Lisboa")
  end
end
