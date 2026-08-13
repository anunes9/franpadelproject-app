FactoryBot.define do
  factory :club do
    sequence(:name) { |n| "Club #{n}" }
  end
end
