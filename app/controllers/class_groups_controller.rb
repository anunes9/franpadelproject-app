# Class Groups and their Training Plans. A Coach lists and creates their own
# groups; a group's page is visible to its Coach and to the Club Managers of
# its Club. Anyone else, Admins and Coaches without a Club included, gets a
# 404.
class ClassGroupsController < DashboardController
  include CoachOnly

  skip_before_action :require_coach, only: :show
  before_action :require_club, only: %i[new create]

  def index
    render inertia: "ClassGroups/Index", props: {
      classGroups: current_user_groups.map(&:list_json)
    }
  end

  def new
    render inertia: "ClassGroups/Form", props: form_props.merge(clashDates: flash[:clash_dates] || [])
  end

  def create
    group = ClassGroup.new(class_group_params.merge(coach: current_user))

    if group.create_with_plan
      redirect_to class_group_path(group)
    else
      # The clashing dates go next to the errors, which hold codes only.
      flash[:clash_dates] = group.clashing_dates.map(&:iso8601) if group.clashing_dates.present?
      redirect_to new_class_group_path, inertia: { errors: form_errors(group) }
    end
  end

  def show
    group = ClassGroup.visible_to(current_user).find(params[:id])

    render inertia: "ClassGroups/Show", props: {
      classGroup: group.summary_json,
      classes: group.training_classes.includes(:course_module, :exercises).map(&:plan_json),
      **plan_editing_props(group)
    }
  end

  private

  # What editing the plan needs: the Modules a Class can be added for, and
  # after a refused edit (see TrainingClassesController), its clashing dates
  # and which edit it was.
  def plan_editing_props(group)
    {
      moduleOptions: group.course_modules.map(&:option_json),
      clashDates: flash[:clash_dates] || [],
      refusedEdit: flash[:refused_edit]
    }
  end

  def require_club
    raise ActiveRecord::RecordNotFound unless current_user.club
  end

  def current_user_groups
    ClassGroup.where(coach: current_user).includes(:coach, :players).order(:created_at)
  end

  def class_group_params
    params.require(:class_group).permit(:level, :starts_on, :cadence, :start_time, :duration,
                                        weekdays: [], player_ids: [])
  end

  def form_props
    {
      club: current_user.club.summary_json,
      players: current_user.club.players.alphabetical.map(&:players_json),
      levelOptions: ClassGroup.levels.keys,
      cadenceOptions: ClassGroup::CADENCES,
      weekdayOptions: ClassGroup::WEEKDAYS,
      durationOptions: ClassGroup::DURATIONS,
      maxPlayers: ClassGroup::MAX_PLAYERS
    }
  end
end
