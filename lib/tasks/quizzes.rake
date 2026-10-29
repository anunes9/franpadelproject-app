namespace :quizzes do
  desc "Convert quiz Word documents to docs/questions. Usage: rails quizzes:convert SOURCE=path/to/PERGUNTAS [OUT=docs/questions]"
  task convert: :environment do
    source = ENV["SOURCE"].presence or abort "Set SOURCE to the folder holding PT_module_<n>.docx and ENG_module_<n>.docx"
    out = ENV["OUT"].presence || Rails.root.join("docs/questions")

    conversion = QuizConversion.new(source)
    unless conversion.run
      warn "Nothing written. Fix these in the documents and convert again:"
      conversion.errors.each { |e| warn "  - #{e}" }
      abort
    end

    conversion.write(out)
    conversion.quizzes.each { |slug, quiz| puts "Wrote #{slug} (#{quiz[:questions].size} questions)" }
  end
end
