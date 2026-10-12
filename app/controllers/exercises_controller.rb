class ExercisesController < DashboardController
  def index
    scope = Exercise.ordered
    scope = scope.where(category: Exercise.categories[params[:category].downcase]) if params[:category].present? && params[:category] != "All"
    scope = scope.joins(:course_module).where(course_modules: { slug: params[:module] }) if params[:module].present? && params[:module] != "All"
    exercises = scope.page(params[:page]).per(12)

    render inertia: "Exercises/Index", props: {
      exercises: Exercise.dashboard_list(exercises, current_user),
      modules: CourseModule.ordered.map { |m| { id: m.slug, title: m.title } },
      pagination: { page: exercises.current_page, pages: exercises.total_pages, count: exercises.total_count },
      filters: { category: params[:category] || "All", module: params[:module] || "All" }
    }
  end

  def show
    exercise = Exercise.find_by(ref: params[:ref])
    return head :not_found unless exercise

    course_module = exercise.course_module
    render inertia: "Exercises/Show", props: {
      exercise: exercise.as_dashboard_json(current_user),
      courseModule: course_module&.as_dashboard_json(course_module.state_for(current_user))
    }
  end

  def complete
    exercise = Exercise.find_by(ref: params[:ref])
    return head :not_found unless exercise

    ExerciseCompletion.find_or_create_by!(user: current_user, exercise: exercise)

    redirect_to "/dashboard/exercises/#{exercise.ref}"
  end
end
