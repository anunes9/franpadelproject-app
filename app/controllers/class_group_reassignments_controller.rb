# Reassigning a Class Group to another Coach of its Club, by a Club Manager of
# that Club (docs/adr/0006-manager-oversight.md). Coaches, Managers of other
# Clubs and Admins get a 404, as if the group did not exist. Both outcomes
# return to the group's page; a refusal brings its errors and clashing dates,
# marked as the "reassignment" edit for the page to show them by its control.
class ClassGroupReassignmentsController < DashboardController
  include ClubManagerOnly

  REFUSED_EDIT = "reassignment".freeze

  # The Coaches a Club Manager can hand `group` to: the other Coaches of its
  # Club. None for anyone else, who cannot reassign.
  def self.coach_options(group, user)
    return [] unless user.club_manager?

    group.club.coaches.where.not(id: group.coach_id).order(:name).map { |coach| { id: coach.id, name: coach.name } }
  end

  def update
    group = ClassGroup.visible_to(current_user).find(params[:class_group_id])
    return redirect_to class_group_path(group) if group.reassign_to(new_coach, today: Academy.today)

    flash_clash_dates(group.clashing_dates)
    flash[:refused_edit] = REFUSED_EDIT
    redirect_to class_group_path(group), inertia: { errors: form_errors(group) }
  end

  private

  # The chosen user, whoever they are: ClassGroup#reassign_to says why it
  # refuses anyone but a Coach of the group's Club.
  def new_coach
    User.find_by(id: params[:coach_id])
  end
end
