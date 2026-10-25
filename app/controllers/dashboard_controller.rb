class DashboardController < ApplicationController
  before_action :authenticate_user!

  inertia_share do
    { dashboardUser: current_user.dashboard_profile_json }
  end

  # A Club Manager's home is the overview of a Club they manage, so they land
  # on their first linked Club, or on an empty Club Manager home while they
  # have none. Everyone else gets the Course home.
  def index
    return club_manager_home if current_user.club_manager?

    render inertia: "Dashboard/Home", props: {
      courseStats: CourseModule.dashboard_stats_for(current_user),
      modules: CourseModule.dashboard_list_for(current_user)
    }
  end

  private

  # After a refused change, the dates on which it clashed, for the next page.
  # They go next to the errors, which hold codes only; a page reads none as [].
  def flash_clash_dates(dates)
    flash[:clash_dates] = dates.map(&:iso8601) if dates.present?
  end

  def club_manager_home
    club = current_user.accessible_clubs.order(:name).first
    return redirect_to club_path(club) if club

    render inertia: "Clubs/Show", props: ClubsController.overview_props(nil)
  end
end
