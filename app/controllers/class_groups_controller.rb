# Class Groups and their Training Plans. A Coach lists and creates their own
# groups; a group's page is visible to its Coach and to the Club Managers of
# its Club. Anyone else, Admins and Coaches without a Club included, gets a
# 404.
class ClassGroupsController < DashboardController
  include CoachOnly
  include ClassGroupForm

  skip_before_action :require_coach, only: :show
  before_action :require_club, only: %i[new create]

  # Current groups first; finished groups are kept apart, as history.
  def index
    finished, current = current_user_groups.partition(&:finished?)
    render inertia: "ClassGroups/Index", props: {
      classGroups: current.map(&:list_json),
      finishedGroups: finished.map(&:list_json)
    }
  end

  # The create form, or with `from` a finished group's id, the form for the
  # group continuing it at the next Level (docs/adr/0007).
  def new
    continued = continued_group(params[:from])
    render inertia: "ClassGroups/Form", props: class_group_form_props(current_user.club).merge(
      levelOptions: ClassGroup.levels.keys,
      clashDates: flash[:clash_dates] || [],
      copy: continued && copy_props(continued)
    )
  end

  def create
    continued = continued_group(params.dig(:class_group, :previous_class_group_id))
    group = ClassGroup.new(class_group_params(:level, :starts_on).merge(coach: current_user,
                                                                        previous_class_group: continued))

    if group.create_with_plan
      redirect_to class_group_path(group)
    else
      flash_clash_dates(group.clashing_dates)
      redirect_to new_class_group_path(from: continued&.id), inertia: { errors: form_errors(group) }
    end
  end

  def show
    group = ClassGroup.visible_to(current_user).find(params[:id])

    render inertia: "ClassGroups/Show", props: {
      classGroup: group.summary_json.merge(previousGroup: previous_group_json(group)),
      classes: group.training_classes.includes(:course_module, :exercises).map(&:plan_json),
      nextLevel: next_level_for_copy(group),
      **plan_editing_props(group),
      **reassignment_props(group)
    }
  end

  private

  # The finished group of the Coach's that a new group continues at the next
  # Level, from its id, or nil without one. A group that is not the Coach's,
  # not finished, or has no next Level is a 404.
  def continued_group(id)
    return if id.blank?

    group = ClassGroup.visible_to(current_user).find(id)
    raise ActiveRecord::RecordNotFound unless group.finished? && group.next_level

    group
  end

  # What the create form starts from when continuing `group`: the next Level
  # and the group's Players still in the Coach's Club. Nothing else.
  def copy_props(group)
    {
      from: group.link_json,
      level: group.next_level,
      playerIds: group.players.where(club: current_user.club).alphabetical.map(&:id)
    }
  end

  # The next Level, for starting the group that continues a finished one:
  # offered to its owning Coach only, as only Coaches create groups.
  def next_level_for_copy(group)
    group.next_level if group.coach == current_user && group.finished?
  end

  # The group this one continues, while the user can still see it.
  def previous_group_json(group)
    previous = group.previous_class_group
    previous.link_json if previous && ClassGroup.visible_to(current_user).exists?(previous.id)
  end

  # What editing the plan needs: the Modules a Class can be added for, which
  # refused edit is a regeneration, and after a refused edit (see
  # TrainingClassesController and PlanRegenerationsController), its clashing
  # dates and which edit it was.
  def plan_editing_props(group)
    {
      moduleOptions: group.course_modules.map(&:option_json),
      regenerationEdit: PlanRegenerationsController::REFUSED_EDIT,
      clashDates: flash[:clash_dates] || [],
      refusedEdit: flash[:refused_edit]
    }
  end

  # Reassigning the group: the Coaches it can go to (none unless the user is a
  # Club Manager), and which refused edit is a reassignment.
  def reassignment_props(group)
    {
      coachOptions: ClassGroupReassignmentsController.coach_options(group, current_user),
      reassignmentEdit: ClassGroupReassignmentsController::REFUSED_EDIT
    }
  end

  def require_club
    raise ActiveRecord::RecordNotFound unless current_user.club
  end

  def current_user_groups
    ClassGroup.where(coach: current_user).with_finished.includes(:coach, :players).order(:created_at)
  end
end
