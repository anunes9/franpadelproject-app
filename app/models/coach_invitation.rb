# A Club Manager's email invitation for someone to join one of their Clubs as
# a Coach. The emailed link carries a random token; only its digest is stored,
# using Devise's token generator as Devise does for reset-password tokens. The
# link works once, and only until it expires.
class CoachInvitation < ApplicationRecord
  VALID_FOR = 7.days

  belongs_to :club
  belongs_to :invited_by, class_name: "User"

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, format: { with: Devise.email_regexp, allow_blank: true }
  validate :email_has_no_account, on: :create

  scope :pending, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }

  # Saves a new invitation with a fresh token and expiry; a newer invitation
  # to the same email for the same Club expires any pending one. Returns the
  # invitation (carrying its errors when it could not be saved) and the raw
  # token for the acceptance link. Only the token's digest is stored, so the
  # caller hands the raw token to the mailer.
  def self.issue(attributes)
    raw, digest = Devise.token_generator.generate(self, :token_digest)
    invitation = new(attributes.merge(token_digest: digest, expires_at: VALID_FOR.from_now))

    transaction do
      if invitation.save
        pending.where(club: invitation.club, email: invitation.email).where.not(id: invitation.id)
          .update_all(expires_at: Time.current)
      end
    end
    [invitation, raw]
  end

  def self.find_by_token(token)
    find_by(token_digest: Devise.token_generator.digest(self, :token_digest, token.to_s))
  end

  def accepted? = accepted_at.present?
  def expired? = expires_at <= Time.current
  def pending? = !accepted? && !expired?

  # Creates the Coach of this invitation's Club with the chosen name and
  # password and uses up the invitation. Returns the Coach, which carries the
  # validation errors when it could not be saved, or nil when the invitation
  # is no longer pending. The invitation row stays locked from the pending
  # check to the accept, so two accepts at once cannot both go through.
  def accept(name:, password:, password_confirmation:)
    with_lock do
      next unless pending?

      coach = User.new(
        role: :coach, club: club, email: email, name: name,
        password: password, password_confirmation: password_confirmation,
        locale: invited_by.locale
      )
      if coach.save
        update!(accepted_at: Time.current)
      elsif coach.errors.of_kind?(:email, :taken)
        coach.errors.delete(:email, :taken)
        coach.errors.add(:email, :account_exists)
      end
      coach
    end
  end

  # The invitation as the Club overview lists it while it is pending.
  def summary_json
    { id: id, name: name, email: email }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name email club_id accepted_at expires_at created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  private

  def email_has_no_account
    errors.add(:email, :account_exists) if email.present? && User.exists?(email: email)
  end
end
