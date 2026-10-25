require "rails_helper"

RSpec.describe CoachInvitation, type: :model do
  let(:club) { create(:club) }
  let(:manager) { create(:user, :club_manager) }

  def issue(email: "carla@example.com")
    described_class.issue(name: "Carla Coach", email: email, club: club, invited_by: manager)
  end

  describe ".issue" do
    it "returns the saved invitation with the raw token of its acceptance link" do
      invitation, token = issue

      expect(invitation).to be_persisted
      expect(described_class.find_by_token(token)).to eq(invitation)
    end

    it "returns the unsaved invitation, with its errors, when it is invalid" do
      invitation, = issue(email: "")

      expect(invitation).not_to be_persisted
      expect(invitation.errors.details[:email]).to include(error: :blank)
    end

    it "refuses an email that already has an account, saying so" do
      create(:user, :coach, email: "carla@example.com")

      invitation, = issue

      expect(invitation.errors.details[:email]).to include(error: :account_exists)
    end
  end

  describe "#accept" do
    let(:password) { { name: "Carla Costa", password: "secret-pass-1", password_confirmation: "secret-pass-1" } }

    it "re-checks, under a lock, that the invitation is still pending, so a stale copy cannot accept it twice" do
      invitation, = issue
      stale_copy = described_class.find(invitation.id)
      invitation.accept(**password)

      expect { expect(stale_copy.accept(**password)).to be_nil }.not_to change(User, :count)
    end

    it "does not accept an expired invitation" do
      invitation, = issue
      invitation.update!(expires_at: 1.minute.ago)

      expect(invitation.accept(**password)).to be_nil
    end
  end
end
