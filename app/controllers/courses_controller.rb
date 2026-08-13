class CoursesController < DashboardController
  def index
    render inertia: "Courses/Index", props: { modules: CourseModule.dashboard_list_for(current_user) }
  end

  def show
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module

    progress = UserModuleProgress.find_by(user: current_user, course_module: course_module)
    exercises = DashboardData::EXERCISES.select { |e| e[:moduleId] == course_module.slug }

    render inertia: "Courses/Show", props: {
      courseModule: course_module.as_dashboard_json(progress),
      sections: course_module.sections,
      exercises: exercises
    }
  end

  def quiz
    course_module = CourseModule.find_by(slug: params[:id])
    return head :not_found unless course_module

    render inertia: "Courses/Quiz", props: {
      id: course_module.slug,
      quiz: DashboardData::QUIZ
    }
  end
end
