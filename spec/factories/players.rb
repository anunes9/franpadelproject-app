FactoryBot.define do
  factory :player do
    club
    sequence(:name) { |n| "Player #{n}" }
    position { :right }
    hand { :right }
    level { :beginner }
  end
end
