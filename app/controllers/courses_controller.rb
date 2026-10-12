class CoursesController < DashboardController
  def index
    render inertia: "Courses/Index", props: { modules: CourseModule.dashboard_list_for(current_user) }
  end

  def show
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module

    state = course_module.state_for(current_user)
    return redirect_to("/dashboard/courses") if state[:status] == "locked"


    render inertia: "Courses/Show", props: {
      courseModule: course_module.as_dashboard_json(state),
      sections: course_module.sections,
      exerciseStats: {
        count: course_module.exercises.count,
        completed: ExerciseCompletion.joins(:exercise).where(user: current_user, exercises: { course_module_id: course_module.id }).count
      },
      documents: course_module.documents_json,
      quizQuestionCount: DashboardData::QUIZ.length
    }
  end

  def complete
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module
    return redirect_to("/dashboard/courses") if course_module.locked_for?(current_user)

    course_module.complete_for!(current_user)

    redirect_to "/dashboard/courses/#{course_module.slug}"
  end

  def quiz
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module
    return redirect_to("/dashboard/courses") if course_module.locked_for?(current_user)

    render inertia: "Courses/Quiz", props: {
      id: course_module.slug,
      quiz: DashboardData::QUIZ
    }
  end
end
