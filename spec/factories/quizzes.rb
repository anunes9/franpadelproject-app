FactoryBot.define do
  factory :quiz do
    course_module
  end

  factory :quiz_question do
    quiz
    sequence(:position) { |n| n }
    text_pt { "Quantos serviços existem no padel?" }
    text_en { "How many services are there in padel?" }
    options_pt { %w[1 2 3] }
    options_en { %w[1 2 3] }
    correct_index { 1 }
  end
end
