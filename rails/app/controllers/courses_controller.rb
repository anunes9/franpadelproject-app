class CoursesController < DashboardController
  def index
    render inertia: "Courses/Index", props: { modules: DashboardData::MODULES }
  end

  def show
    course_module = DashboardData.find_module(params[:id])
    return head :not_found unless course_module

    sections = course_module[:sections] || DashboardData::MODULE_1_SECTIONS
    exercises = DashboardData::EXERCISES.select { |e| e[:moduleId] == course_module[:id] }

    render inertia: "Courses/Show", props: {
      courseModule: course_module,
      sections: sections,
      exercises: exercises
    }
  end

  def quiz
    course_module = DashboardData.find_module(params[:id])
    return head :not_found unless course_module

    render inertia: "Courses/Quiz", props: {
      id: course_module[:id],
      quiz: DashboardData::QUIZ
    }
  end
end
