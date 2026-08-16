FactoryBot.define do
  factory :exercise do
    course_module
    sequence(:ref) { |n| "EX-#{n}" }
    title { "Exercise" }
    category { :technical }
    duration { "10 min" }
    description { "Description" }
  end
end
