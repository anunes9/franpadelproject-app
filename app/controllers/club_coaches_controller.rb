# Removing a Coach from a Club, by a Club Manager of that Club, from the Club
# overview (docs/adr/0006-manager-oversight.md). Removing keeps the Coach's
# account and history but takes away their access (User#remove!). It is
# refused while they own Class Groups, which are reassigned first. Anyone
# else, and anyone who is not an active Coach of the Club, gets a 404.
class ClubCoachesController < DashboardController
  include ClubScoped
  include ClubManagerOnly

  def destroy
    club = find_accessible_club(params[:club_id])
    coach = club.coaches.find(params[:id])
    return redirect_to club_path(club) if coach.remove!

    # Which Coach's removal was refused, like a refused edit of a Class.
    flash[:refused_edit] = coach.id
    redirect_to club_path(club), inertia: { errors: form_errors(coach) }
  end
end
