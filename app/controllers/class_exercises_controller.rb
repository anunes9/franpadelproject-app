# A Class's page and the Exercises its Coach picks for it, from the Class's
# Module only. Like its Class Group, a Class is visible and editable only by
# the group's Coach and the Club Managers of its Club; anyone else, Admins
# included, gets a 404.
class ClassExercisesController < DashboardController
  def show
    training_class = find_class(params[:id])
    group = training_class.class_group
    chosen = training_class.exercises.to_a

    render inertia: "TrainingClasses/Show", props: {
      trainingClass: training_class.plan_json,
      classGroup: group.summary_json,
      exercises: chosen.map { |exercise| exercise_json(exercise) },
      availableExercises: (training_class.course_module.exercises.to_a - chosen).map { |exercise| exercise_json(exercise) }
    }
  end

  def create
    training_class = find_class(params[:class_id])
    pick = training_class.pick_exercise(Exercise.find_by!(ref: params[:ref]))

    if pick.persisted?
      redirect_to class_page_path(training_class)
    else
      redirect_to class_page_path(training_class), inertia: { errors: form_errors(pick) }
    end
  end

  def destroy
    training_class = find_class(params[:class_id])
    training_class.training_class_exercises.joins(:exercise).find_by!(exercises: { ref: params[:ref] }).destroy!

    redirect_to class_page_path(training_class)
  end

  private

  def find_class(id)
    TrainingClass.where(class_group: ClassGroup.visible_to(current_user))
                 .includes(:course_module, :exercises, class_group: %i[coach players])
                 .find(id)
  end

  def exercise_json(exercise)
    exercise.slice(:ref, :title, :duration).merge(category: exercise.category&.capitalize)
  end
end
