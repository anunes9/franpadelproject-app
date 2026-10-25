class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :registerable, :recoverable, :rememberable are deferred to a future spec.
  devise :database_authenticatable, :validatable

  enum :role, { admin: 0, club_manager: 1, coach: 2 }
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }
  enum :hand, { left: 0, right: 1 }
  enum :locale, { pt: 0, en: 1 }

  belongs_to :club, optional: true
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
      clubs: accessible_clubs.order(:name).map { |c| { id: c.id, name: c.name } }
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
end
