User.find_or_create_by!(email: "admin@example.com") do |user|
  user.password = "password123"
  user.role = :admin
end

User.find_or_create_by!(email: "sales@example.com") do |user|
  user.password = "password123"
  user.role = :sales
end

User.find_or_create_by!(email: "client@example.com") do |user|
  user.password = "password123"
  user.role = :client
end
