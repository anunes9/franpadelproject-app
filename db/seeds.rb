club = Club.find_or_create_by!(name: "Padel Clube Lisboa") do |c|
  c.location = "Lisboa, Portugal"
end

admin = User.find_or_initialize_by(email: "admin@example.com")
admin.password = "password123" if admin.new_record?
admin.role = :admin
admin.name = "Admin User"
admin.save!

manager = User.find_or_initialize_by(email: "manager@example.com")
manager.password = "password123" if manager.new_record?
manager.role = :club_manager
manager.name = "Sofia Almeida"
manager.save!
manager.managed_clubs << club unless manager.managed_clubs.include?(club)

coach = User.find_or_initialize_by(email: "coach@example.com")
coach.password = "password123" if coach.new_record?
coach.role = :coach
coach.name = "Miguel Santos"
coach.age = 34
coach.level = :beginner
coach.hand = :right
coach.club = club
coach.save!

require "rake"
Rails.application.load_tasks unless Rake::Task.task_defined?("course_modules:import")
Rake::Task["course_modules:import"].execute
Rake::Task["exercises:import"].execute

# Every seed user has Module Completion of the first two Beginner Modules
# (every Exercise done and the Quiz passed) and has done 40% of the third's
# Exercises, so it is In Progress and the rest are Locked.
User.find_each do |user|
  %w[module-1 module-2].each do |slug|
    course_module = CourseModule.find_by!(slug: slug)
    course_module.exercises.each { |exercise| ExerciseCompletion.find_or_create_by!(user: user, exercise: exercise) }
    next unless course_module.quiz?

    quiz = course_module.quiz
    QuizAttempt.create!(user: user, quiz: quiz, answers: quiz.correct_answers) unless quiz.attempts.passing.exists?(user: user)
  end

  module_three = CourseModule.find_by!(slug: "module-3")
  module_three.exercises.first((module_three.exercises.size * 0.4).round).each do |exercise|
    ExerciseCompletion.find_or_create_by!(user: user, exercise: exercise)
  end
end
