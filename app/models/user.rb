class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :registerable, :recoverable, :rememberable are deferred to a future spec.
  devise :database_authenticatable, :validatable

  enum :role, { admin: 0, club_manager: 1, coach: 2 }
  enum :level, Level::VALUES
  enum :hand, { left: 0, right: 1 }
  enum :locale, { pt: 0, en: 1 }

  belongs_to :club, optional: true
  # A Coach who owns Class Groups cannot be deleted (base: has_class_groups):
  # their groups are reassigned first, never deleted or left without an owner
  # (docs/adr/0006-manager-oversight.md). Like dependent: :restrict_with_error,
  # with our own error code; declared before the other dependents so a refused
  # delete touches nothing.
  has_many :class_groups, foreign_key: :coach_id, inverse_of: :coach
  before_destroy :keep_while_owning_class_groups
  has_many :user_module_progresses, dependent: :destroy
  has_many :exercise_completions, dependent: :destroy
  has_many :club_memberships, dependent: :destroy
  has_many :managed_clubs, through: :club_memberships, source: :club

  validates :name, presence: true
  # A Coach belongs to exactly one Club; a Club Manager is linked to Clubs
  # through memberships instead, and an Admin has none.
  validates :club, presence: true, if: :coach?
  validates :club, absence: true, if: :club_manager?

  # The Clubs whose Coaches, Class Groups and Players this user may see and
  # manage: a Coach's one Club, or a Club Manager's linked Clubs. Admins work
  # through the admin screens instead, so they get none here.
  def accessible_clubs
    if coach?
      Club.where(id: club_id)
    elsif club_manager?
      managed_clubs
    else
      Club.none
    end
  end

  def initials
    name.to_s.split.first(2).map { |word| word[0] }.join.upcase
  end

  # ISO 8601 date; the client formats it in the Client's language.
  def member_since
    created_at.to_date.iso8601
  end

  def dashboard_profile_json
    {
      name: name,
      initials: initials,
      club: club&.name,
      clubs: accessible_clubs.order(:name).map(&:summary_json)
    }
  end

  def profile_json
    {
      name: name,
      initials: initials,
      email: email,
      role: role,
      age: age,
      level: level&.capitalize,
      hand: hand&.capitalize,
      club: club&.name,
      memberSince: member_since
    }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[email role created_at club_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  # The user as a choice of Coach, when reassigning a Class Group.
  def option_json
    { id: id, name: name }
  end

  # Marks a refused delete of a Coach who owns Class Groups and returns
  # false. The screens call it too when the database's foreign key refuses the
  # delete: a backstop for a group reassigned to the Coach during the delete.
  def refuse_destroy_owning_class_groups
    errors.add(:base, :has_class_groups)
    false
  end

  private

  # Runs inside the delete's transaction. The row lock makes a reassignment
  # to this Coach, which locks them too (ClassClash.lock), wait for the delete
  # or finish before the check, so the check sees its group.
  def keep_while_owning_class_groups
    lock!
    return unless class_groups.exists?

    refuse_destroy_owning_class_groups
    throw :abort
  end
end
