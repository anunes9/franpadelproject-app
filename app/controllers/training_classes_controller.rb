# A Class's page, and editing a Class Group's Training Plan one Class at a
# time: adding a Class, moving one, skipping or unskipping it, and marking it
# done or undone. The owning Coach and the Club Managers of the group's Club
# can see and edit; anyone else gets a 404, as if the Class did not exist.
# Every edit returns to the page it was made on, the group's or the Class's
# own, or else to the group's page.
#
# Adding, moving and unskipping are checked against the clash rule. A Class is
# never both done and skipped (docs/adr/0003-skipping-a-class.md). A refusal
# returns with the errors, the clashing dates and which edit was refused (a
# Class's id, or "new" for an added Class), for the page to show them there.
class TrainingClassesController < DashboardController
  NEW_CLASS = "new".freeze

  # The Class, numbered in its plan, with its Module's description and
  # topics, how a Class of its duration is spent (ClassStructure), the
  # Exercises its Coach picked, and those of its Module still to pick (see
  # ClassExercisesController), each with its image. After a refused edit on
  # this page, its clashing dates and which edit it was.
  def show
    training_class = visible_classes.includes(:course_module, class_group: %i[coach players training_classes])
                                    .find(params[:id])
    chosen = training_class.exercises.with_attached_media.to_a

    render inertia: "TrainingClasses/Show", props: {
      today: Academy.today.iso8601,
      trainingClass: training_class.page_json,
      classCount: training_class.class_group.training_classes.size,
      classGroup: training_class.class_group.summary_json,
      classStructure: ClassStructure.json_for(training_class.duration),
      exercises: chosen.map(&:as_class_json),
      availableExercises: (training_class.course_module.exercises.with_attached_media.to_a - chosen)
        .map(&:as_class_json),
      clashDates: flash[:clash_dates] || [],
      refusedEdit: flash[:refused_edit]
    }
  end

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
    mark(skipped: true)
  end

  def unskip
    training_class = find_training_class
    training_class.skipped = false

    save_and_return(training_class, refused_edit: training_class.id)
  end

  def done
    mark(done: true)
  end

  def undone
    mark(done: false)
  end

  private

  def visible_classes
    TrainingClass.where(class_group: ClassGroup.visible_to(current_user))
  end

  def find_training_class
    visible_classes.find(params[:id])
  end

  # Back to the page the edit was made on, on this site, or else the group's.
  def return_to(training_class, **)
    redirect_back_or_to class_group_path(training_class.class_group), allow_other_host: false, **
  end

  def save_and_return(training_class, refused_edit:)
    return return_to(training_class) if training_class.save_unless_clashing

    refuse(training_class, refused_edit: refused_edit, clashing_dates: training_class.clashing_dates)
  end

  # Skipping and marking done or undone take up no new time, so they are not
  # checked against the clash rule.
  def mark(attributes)
    training_class = find_training_class
    return return_to(training_class) if training_class.update(attributes)

    refuse(training_class, refused_edit: training_class.id)
  end

  def refuse(training_class, refused_edit:, clashing_dates: [])
    flash_clash_dates(clashing_dates)
    flash[:refused_edit] = refused_edit
    return_to(training_class, inertia: { errors: form_errors(training_class) })
  end
end
