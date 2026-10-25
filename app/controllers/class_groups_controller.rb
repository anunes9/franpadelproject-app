# Class Groups and their Training Plans. A Coach lists and creates their own
# groups; a group's page is visible to its Coach and to the Club Managers of
# its Club. Anyone else, Admins and Coaches without a Club included, gets a
# 404.
class ClassGroupsController < DashboardController
  include CoachOnly
  include ClassGroupForm

  skip_before_action :require_coach, only: :show
  before_action :require_club, only: %i[new create]

  def index
    render inertia: "ClassGroups/Index", props: {
      classGroups: current_user_groups.map(&:list_json)
    }
  end

  def new
    render inertia: "ClassGroups/Form", props: class_group_form_props(current_user.club).merge(
      levelOptions: ClassGroup.levels.keys,
      clashDates: flash[:clash_dates] || []
    )
  end

  def create
    group = ClassGroup.new(class_group_params(:level, :starts_on).merge(coach: current_user))

    if group.create_with_plan
      redirect_to class_group_path(group)
    else
      flash_clash_dates(group.clashing_dates)
      redirect_to new_class_group_path, inertia: { errors: form_errors(group) }
    end
  end

  def show
    group = ClassGroup.visible_to(current_user).find(params[:id])

    render inertia: "ClassGroups/Show", props: {
      classGroup: group.summary_json,
      classes: group.training_classes.includes(:course_module, :exercises).map(&:plan_json),
      **plan_editing_props(group),
      **reassignment_props(group)
    }
  end

  private

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
    ClassGroup.where(coach: current_user).includes(:coach, :players).order(:created_at)
  end
end
