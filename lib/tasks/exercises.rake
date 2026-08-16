namespace :exercises do
  desc "Import exercises from docs/courses/exercises.json. Usage: rails exercises:import"
  task import: :environment do
    entries = JSON.parse(Rails.root.join("docs/courses/exercises.json").read)

    entries.each do |entry|
      course_module = CourseModule.find_by(slug: entry["moduleExternalId"])
      if course_module.nil?
        puts "Skipped: #{entry['externalId']} (unknown module #{entry['moduleExternalId']})"
        next
      end

      exercise = Exercise.find_or_initialize_by(ref: entry["externalId"])
      is_new = exercise.new_record?
      exercise.course_module = course_module
      exercise.title = entry["title"]["pt"]
      exercise.description = entry["description"]["pt"]
      exercise.content = entry["content"] if entry.key?("content")
      exercise.save!

      status = is_new ? "Created" : (exercise.saved_changes? ? "Updated" : "Unchanged")
      puts "#{status}: #{exercise.ref}"
    end

    puts "Done. #{Exercise.count} exercises total."
  end
end
