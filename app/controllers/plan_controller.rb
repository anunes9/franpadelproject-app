class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: DashboardData::DAYS,
      shortDay: DashboardData::SHORT_DAY,
      defaultPlan: DashboardData::DEFAULT_PLAN,
      exercises: DashboardData::EXERCISES
    }
  end
end
