require "rails_helper"

RSpec.describe "db/seeds.rb" do
  before do
    load Rails.root.join("db/seeds.rb")
  end

  it "creates the 8 beginner course modules from the pt content export" do
    expect(CourseModule.count).to eq(8)

    module_one = CourseModule.find_by(slug: "module-1")
    expect(module_one.title).to eq("Mesociclo 1")
    expect(module_one.level).to eq("beginner")
    expect(module_one.position).to eq(1)
    expect(module_one.sections).not_to be_empty
  end

  it "creates progress rows for every seed user matching today's hardcoded values" do
    expect(UserModuleProgress.count).to eq(User.count * 8)

    client = User.find_by(email: "client@example.com")
    module_three = CourseModule.find_by(slug: "module-3")
    progress = UserModuleProgress.find_by(user: client, course_module: module_three)

    expect(progress.status).to eq("current")
    expect(progress.progress).to eq(40)
  end
end
