# A Client submitting a Module's Quiz. The score is worked out here, never in
# the browser, and the result is shown once, on the Quiz page straight after.
class QuizAttemptsController < DashboardController
  def create
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module
    return redirect_to("/dashboard/courses") if course_module.locked_for?(current_user)
    return head :not_found unless course_module.quiz?

    attempt = current_user.quiz_attempts.create(quiz: course_module.quiz, answers: submitted_answers)
    quiz_path = "/dashboard/courses/#{course_module.slug}/quiz"
    return redirect_to(quiz_path, inertia: { errors: { answers: "incomplete" } }) unless attempt.persisted?

    flash[:quiz_attempt_id] = attempt.id
    redirect_to quiz_path
  end

  private

  # Question id => chosen option index. The attempt checks every question is
  # answered with one of its options.
  def submitted_answers
    answers = params[:answers]
    answers.is_a?(ActionController::Parameters) ? answers.permit!.to_h : {}
  end
end
