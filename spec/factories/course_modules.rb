FactoryBot.define do
  factory :course_module do
    sequence(:slug) { |n| "module-#{n}" }
    sequence(:position) { |n| n }
    level { :beginner }
    title { "Module" }
    description { "Description" }
    duration { "2 - 4 weeks" }
    topics { ["Topic"] }
    content { "## Heading\n\n- Item one;\n- Item two;" }
  end
end
