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

progress_by_slug = {
  "module-1" => { status: :done, progress: 100 },
  "module-2" => { status: :done, progress: 100 },
  "module-3" => { status: :current, progress: 40 },
  "module-4" => { status: :locked, progress: 0 },
  "module-5" => { status: :locked, progress: 0 },
  "module-6" => { status: :locked, progress: 0 },
  "module-7" => { status: :locked, progress: 0 }
}.freeze

User.find_each do |user|
  progress_by_slug.each do |slug, attrs|
    course_module = CourseModule.find_by!(slug: slug)
    UserModuleProgress.find_or_create_by!(user: user, course_module: course_module) do |progress|
      progress.status = attrs[:status]
      progress.progress = attrs[:progress]
    end
  end
end
