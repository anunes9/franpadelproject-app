class ExercisesController < DashboardController
  def index
    render inertia: "Exercises/Index", props: {
      exercises: Exercise.ordered.map { |e| e.as_dashboard_json(current_user) }
    }
  end

  def show
    exercise = Exercise.find_by(ref: params[:ref])
    return head :not_found unless exercise

    progress = UserModuleProgress.find_by(user: current_user, course_module: exercise.course_module)

    render inertia: "Exercises/Show", props: {
      exercise: exercise.as_dashboard_json(current_user),
      courseModule: exercise.course_module.as_dashboard_json(progress)
    }
  end

  def complete
    exercise = Exercise.find_by(ref: params[:ref])
    return head :not_found unless exercise

    ExerciseCompletion.find_or_create_by!(user: current_user, exercise: exercise)

    redirect_to "/dashboard/exercises/#{exercise.ref}"
  end
end
