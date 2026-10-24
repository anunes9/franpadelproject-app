FactoryBot.define do
  factory :club_membership do
    association :user, factory: [:user, :club_manager]
    club
  end
end
