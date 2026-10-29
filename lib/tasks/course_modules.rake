namespace :course_modules do
  desc "Import each Course's Modules from docs/courses/*.json and their Quizzes from docs/questions. Usage: rails course_modules:import"
  task import: :environment do
    CourseImport.new.run.log.each { |line| puts line }

    puts "Done. #{CourseModule.count} course modules, #{Quiz.count} quizzes total."
  end
end
