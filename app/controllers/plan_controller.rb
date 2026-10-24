class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: PlanEntry::DAYS,
      plan: PlanEntry.week_json_for(current_user),
      exercises: Exercise.plan_options,
      modules: CourseModule.plan_options,
      preselectedExercise: params[:exercise]
    }
  end

  def create
    day = params[:day].to_s.downcase
    plannable = PlanEntry.find_plannable(params[:kind], params[:key])
    return head :unprocessable_content unless PlanEntry.days.key?(day) && plannable

    entry = current_user.plan_entries.find_or_initialize_by(day: day, plannable: plannable)
    if entry.new_record?
      entry.position = (current_user.plan_entries.where(day: day).maximum(:position) || 0) + 1
      entry.save!
    end

    redirect_to "/dashboard/plan"
  end

  def destroy
    current_user.plan_entries.find(params[:id]).destroy!
    redirect_to "/dashboard/plan"
  end
end
