namespace :admin do
  desc "Create or promote an admin user. Usage: rails admin:create EMAIL=admin@example.com PASSWORD=secret123"
  task create: :environment do
    email = ENV["EMAIL"]
    password = ENV["PASSWORD"]

    if email.blank? || password.blank?
      abort "Usage: rails admin:create EMAIL=admin@example.com PASSWORD=secret123"
    end

    user = User.find_or_initialize_by(email: email)
    user.password = password
    user.role = :admin
    user.name = email.split("@").first if user.name.blank?

    if user.save
      puts "Admin user '#{email}' #{user.previously_new_record? ? "created" : "updated"}."
    else
      abort "Failed to save admin user: #{user.errors.full_messages.join(', ')}"
    end
  end
end
