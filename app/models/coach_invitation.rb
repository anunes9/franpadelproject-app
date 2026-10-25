# A Club Manager's email invitation for someone to join one of their Clubs as
# a Coach. The emailed link carries a random token; only its digest is stored,
# using Devise's token generator as Devise does for reset-password tokens. The
# link works once, and only until it expires.
class CoachInvitation < ApplicationRecord
  VALID_FOR = 7.days

  belongs_to :club
  belongs_to :invited_by, class_name: "User"

  # The raw token for the acceptance link, only known right after #issue.
  attr_reader :token

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, format: { with: Devise.email_regexp, allow_blank: true }
  validate :email_has_no_account, on: :create

  scope :pending, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }

  # Builds and saves an invitation with a fresh token and expiry. A newer
  # invitation to the same email for the same Club expires any pending one.
  def self.issue(attributes)
    invitation = new(attributes)
    raw, digest = Devise.token_generator.generate(self, :token_digest)
    invitation.assign_attributes(token_digest: digest, expires_at: VALID_FOR.from_now)
    invitation.instance_variable_set(:@token, raw)

    transaction do
      pending.where(club: invitation.club, email: invitation.email).update_all(expires_at: Time.current) if invitation.valid?
      invitation.save
    end
    invitation
  end

  def self.find_by_token(token)
    find_by(token_digest: Devise.token_generator.digest(self, :token_digest, token.to_s))
  end

  def accepted? = accepted_at.present?
  def expired? = expires_at <= Time.current

  # Creates the Coach of this invitation's Club with the chosen name and
  # password and uses up the invitation. Returns the Coach, which carries the
  # validation errors when it could not be saved.
  def accept(name:, password:, password_confirmation:)
    coach = User.new(
      role: :coach, club: club, email: email, name: name,
      password: password, password_confirmation: password_confirmation,
      locale: invited_by.locale
    )
    transaction do
      coach.save && update!(accepted_at: Time.current)
    end
    coach
  end

  def pending_json
    { id: id, name: name, email: email }
  end

  private

  def email_has_no_account
    errors.add(:email, :taken) if email.present? && User.exists?(email: email)
  end
end
