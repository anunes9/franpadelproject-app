require "rails_helper"

RSpec.describe DashboardData do
  it "finds a module by id" do
    expect(DashboardData.find_module("module-1")[:title]).to eq("Module 1")
  end

  it "returns nil for an unknown module id" do
    expect(DashboardData.find_module("nope")).to be_nil
  end

  it "finds an exercise by ref" do
    expect(DashboardData.find_exercise("EX-01")[:title]).to eq("Slice serve, elbow above 90º")
  end

  it "returns nil for an unknown exercise ref" do
    expect(DashboardData.find_exercise("nope")).to be_nil
  end

  it "has 8 modules and 8 exercises" do
    expect(DashboardData::MODULES.size).to eq(8)
    expect(DashboardData::EXERCISES.size).to eq(8)
  end
end
