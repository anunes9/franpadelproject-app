# Class Groups and their Training Plans. A Coach lists and creates their own
# groups; a group's page is visible to its Coach and to the Club Managers of
# its Club. Anyone else, Admins included, gets a 404.
class ClassGroupsController < DashboardController
  include ClubScoped
  include CoachOnly

  coach_only only: %i[index new create]

  def index
    render inertia: "ClassGroups/Index", props: {
      classGroups: current_user_groups.map(&:list_json)
    }
  end

  def new
    render inertia: "ClassGroups/Form", props: form_props
  end

  def create
    group = ClassGroup.new(class_group_params.merge(coach: current_user))

    if group.create_with_plan
      redirect_to class_group_path(group)
    else
      errors = form_errors(group)
      errors[:clashDates] = group.clashing_dates.map(&:iso8601) if group.clashing_dates.present?
      redirect_to new_class_group_path, inertia: { errors: errors }
    end
  end

  def show
    group = accessible_class_groups.find(params[:id])

    render inertia: "ClassGroups/Show", props: {
      classGroup: group.summary_json,
      classes: group.training_classes.includes(:course_module).map(&:plan_json)
    }
  end

  private

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
