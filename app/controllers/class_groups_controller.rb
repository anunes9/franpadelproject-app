# Class Groups and their Training Plans. A Coach lists and creates their own
# groups; a group's page is visible to its Coach and to the Club Managers of
# its Club. Anyone else, Admins and Coaches without a Club included, gets a
# 404.
class ClassGroupsController < DashboardController
  include CoachOnly
  include ClassGroupForm

  skip_before_action :require_coach, only: :show
  before_action :require_club, only: %i[new create]

  # The week's Classes (this week, or with `week` a date, the week holding
  # it), then the current groups with how far each plan has got. Finished
  # groups are kept apart, as history.
  def index
    today = Academy.today
    week = week_of(params[:week], today)
    finished, current = current_user_groups.includes(training_classes: :course_module).partition(&:finished?)

    render inertia: "ClassGroups/Index", props: {
      today: today.iso8601,
      week: {
        startsOn: week.first.iso8601,
        classes: TrainingClass.week_of(coach: current_user, dates: week).map(&:week_json)
      },
      classGroups: current.map { |group| group.card_json(today: today) },
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
      continuation: continued && continuation_props(continued)
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

  # The group with its whole plan, numbered, beside its Course's Modules and
  # its Club's Break Periods, for the plan's calendar and list.
  def show
    group = ClassGroup.visible_to(current_user).with_finished
                      .includes(:players, training_classes: %i[course_module exercises]).find(params[:id])
    today = Academy.today

    render inertia: "ClassGroups/Show", props: {
      today: today.iso8601,
      classGroup: group.summary_json.merge(previousGroup: previous_group_json(group),
                                           progress: group.progress_json(today: today)),
      classes: group.training_classes.each_with_index.map { |c, index| c.plan_json(number: index + 1) },
      modules: group.course_modules.map(&:plan_json),
      breakPeriods: group.club.break_periods.chronological.map(&:summary_json),
      nameMaxLength: ClassGroup::NAME_MAX_LENGTH,
      nextLevel: next_level_for_continuation(group),
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
  def continuation_props(group)
    {
      from: group.link_json,
      level: group.next_level,
      playerIds: group.players.where(club: current_user.club).alphabetical.map(&:id)
    }
  end

  # The next Level, for starting the group that continues a finished one:
  # offered to its owning Coach only, as only Coaches create groups.
  def next_level_for_continuation(group)
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
      coachOptions: reassignment_coaches(group).map(&:option_json),
      reassignmentEdit: ClassGroupReassignmentsController::REFUSED_EDIT
    }
  end

  # The Coaches a Club Manager can hand `group` to: the other Coaches of its
  # Club. None for anyone else, who cannot reassign.
  def reassignment_coaches(group)
    return User.none unless current_user.club_manager?

    group.club.coaches.where.not(id: group.coach_id).order(:name)
  end

  # The Monday-to-Sunday week holding `date` (YYYY-MM-DD), or `today`'s when
  # it is missing or not a date.
  def week_of(date, today)
    day = begin
      Date.iso8601(date.to_s)
    rescue Date::Error
      today
    end
    day.beginning_of_week..day.end_of_week
  end

  def require_club
    raise ActiveRecord::RecordNotFound unless current_user.club
  end

  def current_user_groups
    ClassGroup.where(coach: current_user).with_finished.includes(:coach, :players).order(:created_at)
  end
end
