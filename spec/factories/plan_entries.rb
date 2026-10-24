FactoryBot.define do
  factory :plan_entry do
    user
    day { :monday }
    position { 1 }
    association :plannable, factory: :exercise
  end
end
