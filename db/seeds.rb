club = Club.find_or_create_by!(name: "Padel Clube Lisboa") do |c|
  c.location = "Lisboa, Portugal"
end

admin = User.find_or_initialize_by(email: "admin@example.com")
admin.password = "password123" if admin.new_record?
admin.role = :admin
admin.name = "Admin User"
admin.save!

sales = User.find_or_initialize_by(email: "sales@example.com")
sales.password = "password123" if sales.new_record?
sales.role = :sales
sales.name = "Sales User"
sales.save!

client = User.find_or_initialize_by(email: "client@example.com")
client.password = "password123" if client.new_record?
client.role = :client
client.name = "Miguel Santos"
client.age = 34
client.level = :beginner
client.hand = :right
client.club = club
client.save!

course_modules_data = JSON.parse(Rails.root.join("docs/courses/beginner.json").read)

course_modules_data.each_with_index do |data, index|
  CourseModule.find_or_create_by!(slug: data["externalId"]) do |course_module|
    course_module.level = :beginner
    course_module.position = index + 1
    course_module.title = data["title"]["pt"]
    course_module.description = data["description"]["pt"]
    course_module.topics = data["topics"]["pt"]
    course_module.duration = data["duration"]["pt"]
    course_module.content = data["content"]["pt"]
  end
end

progress_by_slug = {
  "module-1" => { status: :done, progress: 100 },
  "module-2" => { status: :done, progress: 100 },
  "module-3" => { status: :current, progress: 40 },
  "module-4" => { status: :locked, progress: 0 },
  "module-5" => { status: :locked, progress: 0 },
  "module-6" => { status: :locked, progress: 0 },
  "module-7" => { status: :locked, progress: 0 },
  "module-8" => { status: :locked, progress: 0 }
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
