class DashboardController < ApplicationController
  before_action :authenticate_user!

  inertia_share do
    { dashboardUser: current_user.dashboard_profile_json }
  end

  def index
    render inertia: "Dashboard/Home", props: {
      courseStats: CourseModule.dashboard_stats_for(current_user),
      modules: CourseModule.dashboard_list_for(current_user)
    }
  end
end
