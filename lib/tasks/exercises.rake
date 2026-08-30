require "open-uri"

namespace :exercises do
  desc "Import exercises from docs/courses/exercises.json. Usage: rails exercises:import LOCALE=pt|en IMPORT_IMAGES=1 N=2"
  task import: :environment do
    locale_keys = { "pt" => "pt", "en" => "en-US" }
    locale = ENV.fetch("LOCALE", "pt")
    locale_key = locale_keys[locale] || raise("Unknown LOCALE #{locale.inspect}, expected one of #{locale_keys.keys}")
    import_images = ENV["IMPORT_IMAGES"] == "1"

    entries = JSON.parse(Rails.root.join("docs/courses/exercises.json").read)
    entries = entries.first(Integer(ENV["N"])) if ENV["N"].present?

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

      next unless import_images

      %w[media animation].each do |field|
        url = entry[field]
        next if url.blank?

        filename = File.basename(URI.parse(url).path)
        if exercise.media.any? { |file| file.filename.to_s == filename }
          puts "  Skipped #{field} (already attached): #{filename}"
          next
        end

        begin
          downloaded = URI.parse(url).open
          exercise.media.attach(
            io: downloaded,
            filename: filename,
            content_type: Marcel::MimeType.for(name: filename)
          )
          puts "  Attached #{field}: #{url}"
        rescue StandardError => e
          puts "  Failed to attach #{field} (#{url}): #{e.message}"
        end
      end
    end

    puts "Done. #{Exercise.count} exercises total."
  end
end
