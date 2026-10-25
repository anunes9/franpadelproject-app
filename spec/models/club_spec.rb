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

  it "summarizes itself as its id and name" do
    club = create(:club, name: "Padel Clube Lisboa")

    expect(club.summary_json).to eq(id: club.id, name: "Padel Clube Lisboa")
  end

  it "refuses to be destroyed while it has Players" do
    club = create(:club)
    player = create(:player, club: club)

    expect(club.destroy).to be(false)
    expect(club.errors[:base]).not_to be_empty
    expect(Player.exists?(player.id)).to be(true)
  end

  it "can be destroyed once it has no Players" do
    club = create(:club)

    expect(club.destroy).to be_truthy
  end

  it "gives its own Break Periods as inclusive date ranges, in date order, for the Training Plan generator" do
    club = create(:club)
    create(:break_period, club: club, starts_on: Date.new(2027, 8, 1), ends_on: Date.new(2027, 8, 31))
    create(:break_period, club: club, starts_on: Date.new(2026, 12, 21), ends_on: Date.new(2027, 1, 3))
    create(:break_period, starts_on: Date.new(2027, 4, 1), ends_on: Date.new(2027, 4, 5))

    expect(club.break_period_ranges).to eq([
      Date.new(2026, 12, 21)..Date.new(2027, 1, 3),
      Date.new(2027, 8, 1)..Date.new(2027, 8, 31)
    ])
  end

  it "removes its Break Periods when it is destroyed" do
    club = create(:club)
    create(:break_period, club: club)

    expect { club.destroy }.to change(BreakPeriod, :count).by(-1)
  end

  it "removes its Coach invitations when it is destroyed" do
    club = create(:club)
    invitation, = CoachInvitation.issue(
      name: "Carla Coach", email: "carla@example.com", club: club, invited_by: create(:user, :club_manager)
    )

    expect(club.coach_invitations).to eq([invitation])
    expect { club.destroy }.to change(CoachInvitation, :count).by(-1)
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
