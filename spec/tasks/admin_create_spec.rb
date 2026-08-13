require "rails_helper"
require "rake"

RSpec.describe "admin:create rake task" do
  before(:all) do
    Rails.application.load_tasks
  end

  before do
    Rake::Task["admin:create"].reenable
  end

  around do |example|
    original_email = ENV["EMAIL"]
    original_password = ENV["PASSWORD"]
    example.run
    ENV["EMAIL"] = original_email
    ENV["PASSWORD"] = original_password
  end

  it "creates a new admin user" do
    ENV["EMAIL"] = "newadmin@example.com"
    ENV["PASSWORD"] = "password123"

    expect { Rake::Task["admin:create"].invoke }.to change(User, :count).by(1)

    user = User.find_by(email: "newadmin@example.com")
    expect(user.role).to eq("admin")
    expect(user.name).to eq("newadmin")
  end

  it "promotes an existing user to admin instead of creating a duplicate" do
    existing = create(:user, email: "promote@example.com", role: :client)
    ENV["EMAIL"] = "promote@example.com"
    ENV["PASSWORD"] = "password123"

    expect { Rake::Task["admin:create"].invoke }.not_to change(User, :count)

    expect(existing.reload.role).to eq("admin")
  end

  it "exits without raising when EMAIL or PASSWORD is missing" do
    ENV["EMAIL"] = "bad@example.com"
    ENV["PASSWORD"] = ""

    expect { Rake::Task["admin:create"].invoke }.to raise_error(SystemExit)
  end
end
