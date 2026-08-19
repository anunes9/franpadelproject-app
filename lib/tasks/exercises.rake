namespace :exercises do
  desc "Import exercises from docs/courses/exercises.json. Usage: rails exercises:import LOCALE=pt|en"
  task import: :environment do
    locale_keys = { "pt" => "pt", "en" => "en-US" }
    locale = ENV.fetch("LOCALE", "pt")
    locale_key = locale_keys[locale] || raise("Unknown LOCALE #{locale.inspect}, expected one of #{locale_keys.keys}")

    entries = JSON.parse(Rails.root.join("docs/courses/exercises.json").read)

    entries.each do |entry|
      course_module = CourseModule.find_by(slug: entry["moduleExternalId"])
      if course_module.nil?
        puts "Skipped: #{entry['externalId']} (unknown module #{entry['moduleExternalId']})"
        next
      end

      title = entry["title"][locale_key]
      description = entry["description"][locale_key]
      if title.blank? || description.blank?
        puts "Skipped: #{entry['externalId']} (no #{locale_key} translation)"
        next
      end

      exercise = Exercise.find_or_initialize_by(ref: entry["externalId"])
      is_new = exercise.new_record?
      exercise.course_module = course_module
      exercise.title = title
      exercise.description = description
      exercise.content = entry["content"] if entry.key?("content")
      exercise.save!

      status = is_new ? "Created" : (exercise.saved_changes? ? "Updated" : "Unchanged")
      puts "#{status}: #{exercise.ref}"
    end

    puts "Done. #{Exercise.count} exercises total."
  end
end
