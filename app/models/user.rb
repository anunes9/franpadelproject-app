class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # :registerable, :recoverable, :rememberable are deferred to a future spec.
  devise :database_authenticatable, :validatable

  enum :role, { admin: 0, sales: 1, client: 2 }
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }
  enum :hand, { left: 0, right: 1 }
  enum :locale, { pt: 0, en: 1 }

  belongs_to :club, optional: true
  has_many :user_module_progresses, dependent: :destroy
  has_many :exercise_completions, dependent: :destroy

  validates :name, presence: true

  def initials
    name.to_s.split.first(2).map { |word| word[0] }.join.upcase
  end

  def member_since
    created_at.strftime("%b %Y")
  end

  def dashboard_profile_json
    { name: name, initials: initials, club: club&.name }
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
