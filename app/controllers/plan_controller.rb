class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: DashboardData::DAYS,
      defaultPlan: DashboardData::DEFAULT_PLAN,
      exercises: DashboardData::EXERCISES
    }
  end
end
