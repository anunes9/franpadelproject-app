# Editing a Class Group: its Players, cadence, weekdays, start time and
# duration. Its Level and start date are not editable. The owning Coach and
# the Club Managers of the group's Club can edit; anyone else gets a 404, as
# if the group did not exist.
#
# An edit never changes the group's Classes, except that they all take its new
# duration; see docs/adr/0004-editing-a-class-group.md. An edit that would
# double-book the Coach or a Player is refused with the clashing dates.
class ClassGroupEditsController < DashboardController
  def edit
    group = find_group

    render inertia: "ClassGroups/Form", props: form_props(group).merge(
      classGroup: group.summary_json,
      clashDates: flash[:clash_dates] || []
    )
  end

  def update
    group = find_group

    if group.update_with_clash_check(class_group_params)
      redirect_to class_group_path(group)
    else
      # The clashing dates go next to the errors, which hold codes only.
      flash[:clash_dates] = group.clashing_dates.map(&:iso8601) if group.clashing_dates.present?
      redirect_to edit_class_group_path(group), inertia: { errors: form_errors(group) }
    end
  end

  private

  # The groups the signed-in user may edit.
  def find_group
    ClassGroup.visible_to(current_user).find(params[:id])
  end

  def class_group_params
    params.require(:class_group).permit(:cadence, :start_time, :duration, weekdays: [], player_ids: [])
  end

  def form_props(group)
    {
      club: group.club.summary_json,
      players: group.club.players.alphabetical.map(&:players_json),
      cadenceOptions: ClassGroup::CADENCES,
      weekdayOptions: ClassGroup::WEEKDAYS,
      durationOptions: ClassGroup::DURATIONS,
      maxPlayers: ClassGroup::MAX_PLAYERS
    }
  end
end
