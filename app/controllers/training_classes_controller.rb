# Editing a Class Group's Training Plan, one Class at a time: adding a Class,
# moving one, skipping or unskipping it, and marking it done or undone. The
# owning Coach and the Club Managers of the group's Club can edit; anyone
# else gets a 404, as if the Class did not exist. Every edit returns to the
# group's page.
#
# Adding, moving and unskipping are checked against the clash rule. A refusal
# returns with the errors, the clashing dates and which edit was refused (a
# Class's id, or "new" for an added Class), for the page to show them there.
class TrainingClassesController < DashboardController
  NEW_CLASS = "new".freeze

  # Adds a regular Class of the Coach's own, for a Module of the group's Course.
  def create
    group = ClassGroup.visible_to(current_user).find(params[:class_group_id])
    training_class = group.training_classes.build(
      params.require(:training_class).permit(:date, :start_time, :course_module_id)
        .merge(kind: :regular, coach_added: true)
    )

    save_and_return(training_class, refused_edit: NEW_CLASS)
  end

  # Moves a Class to another date and/or start time.
  def update
    training_class = find_training_class
    training_class.assign_attributes(params.require(:training_class).permit(:date, :start_time))

    save_and_return(training_class, refused_edit: training_class.id)
  end

  def skip
    training_class = find_training_class
    training_class.update!(skipped: true)

    redirect_to class_group_path(training_class.class_group)
  end

  def unskip
    training_class = find_training_class
    training_class.skipped = false

    save_and_return(training_class, refused_edit: training_class.id)
  end

  def done
    training_class = find_training_class
    training_class.update!(done: true)

    redirect_to class_group_path(training_class.class_group)
  end

  def undone
    training_class = find_training_class
    training_class.update!(done: false)

    redirect_to class_group_path(training_class.class_group)
  end

  private

  def find_training_class
    TrainingClass.where(class_group: ClassGroup.visible_to(current_user)).find(params[:id])
  end

  def save_and_return(training_class, refused_edit:)
    group = training_class.class_group
    return redirect_to class_group_path(group) if training_class.save_unless_clashing

    # The clashing dates go next to the errors, which hold codes only.
    flash[:clash_dates] = training_class.clashing_dates.map(&:iso8601)
    flash[:refused_edit] = refused_edit
    redirect_to class_group_path(group), inertia: { errors: form_errors(training_class) }
  end
end
