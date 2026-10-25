FactoryBot.define do
  factory :break_period do
    club
    name { "Christmas" }
    starts_on { Date.new(2026, 12, 21) }
    ends_on { Date.new(2027, 1, 3) }
  end
end
