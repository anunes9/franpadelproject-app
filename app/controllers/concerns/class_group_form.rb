# What the Class Group form needs, shared by creating a group
# (ClassGroupsController) and editing one (ClassGroupEditsController): the
# schedule and Players it submits, and the options it shows.
module ClassGroupForm
  extend ActiveSupport::Concern

  private

  # The submitted name, schedule and Players, plus `extra` fields (creating
  # also takes the Level and start date).
  def class_group_params(*extra)
    params.require(:class_group).permit(*extra, :name, :cadence, :start_time, :duration, weekdays: [], player_ids: [])
  end

  # The Club's roster and the schedule options, for a group of `club`.
  def class_group_form_props(club)
    {
      club: club.summary_json,
      players: club.players.alphabetical.map(&:players_json),
      cadenceOptions: ClassGroup::CADENCES,
      weekdayOptions: ClassGroup::WEEKDAYS,
      durationOptions: ClassGroup::DURATIONS,
      maxPlayers: ClassGroup::MAX_PLAYERS,
      nameMaxLength: ClassGroup::NAME_MAX_LENGTH
    }
  end
end
