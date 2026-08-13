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

  describe "organized logo storage" do
    it "stores the logo under clubs/{id}/logo/{filename}" do
      club = create(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")

      expect(club.logo.blob.key).to eq("clubs/#{club.id}/logo/logo.png")
    end

    it "organizes the logo even when it's attached before the club is first saved" do
      club = build(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")
      club.save!

      expect(club.logo.blob.key).to eq("clubs/#{club.id}/logo/logo.png")
    end

    it "sanitizes unsafe characters in the filename before using it as a key" do
      club = create(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "weird/name.png", content_type: "image/png")

      expect(club.logo.blob.key).to eq("clubs/#{club.id}/logo/weird-name.png")
    end

    it "leaves an already-organized blob's key alone on a later, unrelated save" do
      club = create(:club)
      club.logo.attach(io: StringIO.new("logo bytes"), filename: "logo.png", content_type: "image/png")
      organized_key = club.logo.blob.key

      club.update!(name: "#{club.name} Updated")

      expect(club.logo.blob.key).to eq(organized_key)
    end
  end
end
