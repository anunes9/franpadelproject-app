class DashboardController < ApplicationController
  before_action :authenticate_user!

  inertia_share do
    { dashboardUser: DashboardData::USER }
  end

  def index
    render inertia: "Dashboard/Home", props: {
      courseStats: DashboardData::COURSE_STATS,
      modules: DashboardData::MODULES
    }
  end
end
