FactoryBot.define do
  factory :user_module_progress do
    user
    course_module
    status { :locked }
    progress { 0 }
  end
end
