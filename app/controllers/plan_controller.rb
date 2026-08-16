class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: DashboardData::DAYS,
      defaultPlan: DashboardData::DEFAULT_PLAN,
      exercises: Exercise.ordered.map { |e| e.as_dashboard_json(current_user) }
    }
  end
end
