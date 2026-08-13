require "rails_helper"

RSpec.describe UserModuleProgress, type: :model do
  it "is valid with a user, course module, status, and progress" do
    expect(build(:user_module_progress)).to be_valid
  end

  it "defines the expected status values" do
    expect(UserModuleProgress.statuses.keys).to match_array(%w[locked current done])
  end

  it "requires progress to be between 0 and 100" do
    expect(build(:user_module_progress, progress: -1)).not_to be_valid
    expect(build(:user_module_progress, progress: 101)).not_to be_valid
    expect(build(:user_module_progress, progress: 50)).to be_valid
  end

  it "only allows one progress row per user and course module" do
    course_module = create(:course_module)
    user = create(:user)
    create(:user_module_progress, user: user, course_module: course_module)

    expect(build(:user_module_progress, user: user, course_module: course_module)).not_to be_valid
  end
end
