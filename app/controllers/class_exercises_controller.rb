# The Exercises a Coach picks for a Class, from the Class's Module only. The
# Class's page itself is TrainingClassesController#show. Like its Class Group,
# a Class is editable only by the group's Coach and the Club Managers of its
# Club; anyone else, Admins included, gets a 404.
class ClassExercisesController < DashboardController
  def create
    training_class = find_class
    pick = training_class.pick_exercise(Exercise.find_by!(ref: params[:ref]))

    if pick.persisted?
      redirect_to training_class_path(training_class)
    else
      redirect_to training_class_path(training_class), inertia: { errors: form_errors(pick) }
    end
  end

  def destroy
    training_class = find_class
    training_class.training_class_exercises.joins(:exercise).find_by!(exercises: { ref: params[:ref] }).destroy!

    redirect_to training_class_path(training_class)
  end

  private

  def find_class
    TrainingClass.where(class_group: ClassGroup.visible_to(current_user)).find(params[:class_id])
  end
end
