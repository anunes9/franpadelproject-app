namespace :demo do
  desc "Create, or reset, the demo Club shown to prospective clients. Usage: rails demo:club [DEMO_PASSWORD=secret]"
  task club: :environment do
    summary = DemoClub.build(password: ENV["DEMO_PASSWORD"])

    puts "Demo Club ready: #{summary.club.name} (#{summary.club.location})"
    puts "  Club Manager: #{summary.manager.name} <#{summary.manager.email}>"
    summary.coaches.each { |coach| puts "  Coach: #{coach.name} <#{coach.email}>" }
    puts "  Pending Coach invitation: #{summary.invitation.name} <#{summary.invitation.email}>"
    puts "  Players: #{summary.players.size}"
    puts "  Break Periods: #{summary.break_periods.map { |p| "#{p.name} #{p.starts_on}..#{p.ends_on}" }.join(', ')}"
    finished, current = summary.class_groups.partition(&:finished?)
    puts "  Class Groups: #{current.size} current, #{finished.size} finished, " \
         "#{summary.class_groups.sum { |g| g.training_classes.size }} Classes in total"
    if ENV["DEMO_PASSWORD"].blank?
      puts "  Password for every demo account: #{DemoClub::DEFAULT_PASSWORD} (set DEMO_PASSWORD to change it)"
    end
  rescue DemoClub::Error => error
    abort error.message
  end
end
