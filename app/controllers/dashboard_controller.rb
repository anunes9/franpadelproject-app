class DashboardController < ApplicationController
  before_action :authenticate_user!

  inertia_share do
    { dashboardUser: DashboardData::USER }
  end

  def index
    render inertia: "Dashboard/Home", props: {
      courseStats: DashboardData::COURSE_STATS,
      modules: CourseModule.dashboard_list_for(current_user)
    }
  end
end
