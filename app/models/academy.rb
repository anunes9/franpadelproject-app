# The academy as a whole. Its Clubs are in Portugal, so "today" (for which
# Classes are past and where a regenerated plan starts) is the date in
# Lisbon, whatever the server's or the app's time zone.
module Academy
  TIME_ZONE = "Europe/Lisbon".freeze

  def self.today
    Time.current.in_time_zone(TIME_ZONE).to_date
  end
end
