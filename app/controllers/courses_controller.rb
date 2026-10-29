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
      # 0 when the Module has no Quiz, and the page leaves the Quiz out.
      quizQuestionCount: course_module.quiz? ? course_module.quiz.questions.size : 0
    }
  end

  # The Module's Quiz, in the Client's language and without the answers. Right
  # after a Quiz Attempt (see QuizAttemptsController) it also carries that
  # attempt's result, once.
  def quiz
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module
    return redirect_to("/dashboard/courses") if course_module.locked_for?(current_user)
    return head :not_found unless course_module.quiz?

    quiz = course_module.quiz
    attempt = quiz.attempts.find_by(id: flash[:quiz_attempt_id], user: current_user) if flash[:quiz_attempt_id]

    render inertia: "Courses/Quiz", props: {
      id: course_module.slug,
      questions: quiz.questions.map { |q| q.quiz_json(current_user.locale) },
      result: attempt&.result_json
    }
  end
end
