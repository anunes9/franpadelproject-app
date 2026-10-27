require "rails_helper"

RSpec.describe ClassStructure do
  it "gives a 1-hour Class 4 Exercises and a 1h30 Class 5" do
    expect(described_class.exercises_for(60)).to eq(4)
    expect(described_class.exercises_for(90)).to eq(5)
  end

  it "has a structure for every Class duration a group may have" do
    expect(described_class::BY_DURATION.keys).to match_array(ClassGroup::DURATIONS)
  end

  it "leaves time for the game after the longest warm-up, Exercises and conditioning" do
    described_class::BY_DURATION.each do |duration, parts|
      planned = parts[:warm_up].last + (parts[:exercises] * described_class::EXERCISE_MINUTES) + parts[:conditioning].last
      expect(planned).to be < duration
    end
  end

  it "describes a 1h30 Class for its page" do
    expect(described_class.json_for(90)).to eq(
      warmUp: { min: 10, max: 15 }, exercises: { count: 5, minutes: 8 }, conditioning: { min: 20, max: 25 }
    )
  end
end
