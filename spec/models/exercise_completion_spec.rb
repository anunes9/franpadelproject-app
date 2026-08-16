require "rails_helper"

RSpec.describe ExerciseCompletion, type: :model do
  it "is valid with a user and an exercise" do
    expect(build(:exercise_completion)).to be_valid
  end

  it "only allows one completion row per user and exercise" do
    exercise = create(:exercise)
    user = create(:user)
    create(:exercise_completion, user: user, exercise: exercise)

    expect(build(:exercise_completion, user: user, exercise: exercise)).not_to be_valid
  end

  it "allows the same exercise to be completed by different users" do
    exercise = create(:exercise)
    create(:exercise_completion, user: create(:user), exercise: exercise)

    expect(build(:exercise_completion, user: create(:user), exercise: exercise)).to be_valid
  end
end
