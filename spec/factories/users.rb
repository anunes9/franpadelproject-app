FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:name) { |n| "User #{n}" }
    password { "password123" }
    role { :coach }
    # A Coach belongs to exactly one Club; other roles have no home Club.
    club { association(:club) if role.to_s == "coach" }

    trait :admin do
      role { :admin }
    end

    trait :club_manager do
      role { :club_manager }
    end

    trait :coach do
      role { :coach }
    end
  end
end
