class DashboardController < ApplicationController
  before_action :authenticate_user!

  inertia_share do
    { dashboardUser: current_user.dashboard_profile_json }
  end

  # A Club Manager's home is the overview of a Club they manage, so they land
  # on their first linked Club, or on an empty Club Manager home while they
  # have none. Everyone else gets the Course home, which for a Coach starts
  # with today's Classes and their current Class Groups.
  def index
    return club_manager_home if current_user.club_manager?

    # The Module states, worked out once for both the stats and the list.
    modules = CourseModule.ordered.to_a
    states = CourseModule.states_for(current_user, modules)

    render inertia: "Dashboard/Home", props: {
      courseStats: CourseModule.dashboard_stats_for(current_user, states: states),
      modules: CourseModule.dashboard_list_for(current_user, modules: modules, states: states),
      **coach_home_props
    }
  end

  private

  # Only the Coach's own Classes and groups, never another Coach's of the
  # same Club. "Today" is the date in Lisbon (Academy.today).
  def coach_home_props
    return {} unless current_user.coach?

    {
      todayClasses: TrainingClass.taught_on(Academy.today, coach: current_user).map(&:home_json),
      # Finished groups are history, on the Class Groups list only. .unfinished
      # leaves them out; .with_finished still loads the finished flag that
      # #list_json reads, so it isn't asked of the database per group.
      classGroups: ClassGroup.owned_by(current_user).unfinished.with_finished
                             .includes(:coach, :players).order(:created_at).map(&:list_json)
    }
  end

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
