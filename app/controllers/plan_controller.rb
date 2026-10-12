class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: DashboardData::DAYS,
      defaultPlan: DashboardData::DEFAULT_PLAN,
      exercises: Exercise.plan_options,
      preselectedExercise: params[:exercise]
    }
  end
end
