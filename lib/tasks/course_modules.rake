namespace :course_modules do
  desc "Import course modules from docs/courses/*.json. Usage: rails course_modules:import"
  task import: :environment do
    files = {
      beginner: Rails.root.join("docs/courses/beginner.json")
    }

    files.each do |level, path|
      entries = JSON.parse(path.read)

      entries.each_with_index do |entry, index|
        course_module = CourseModule.find_or_create_by!(slug: entry["externalId"]) do |cm|
          cm.level = level
          cm.position = index + 1
          cm.title = entry["title"]["pt"]
          cm.description = entry["description"]["pt"]
          cm.topics = entry["topics"]["pt"]
          cm.duration = entry["duration"]["pt"]
          cm.content = entry["content"]["pt"]
        end

        status = course_module.previously_new_record? ? "Created" : "Skipped (already exists)"
        puts "#{status}: #{course_module.slug}"
      end
    end

    puts "Done. #{CourseModule.count} course modules total."
  end
end
