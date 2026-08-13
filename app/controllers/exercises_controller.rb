class ExercisesController < DashboardController
  def index
    render inertia: "Exercises/Index", props: { exercises: DashboardData::EXERCISES }
  end

  def show
    exercise = DashboardData.find_exercise(params[:ref])
    return head :not_found unless exercise

    course_module = DashboardData.find_module(exercise[:moduleId])

    render inertia: "Exercises/Show", props: {
      exercise: exercise,
      courseModule: course_module
    }
  end
end
