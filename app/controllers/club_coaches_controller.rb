# Removing a Coach from a Club, by a Club Manager of that Club, from the Club
# overview (docs/adr/0006-manager-oversight.md). A Coach belongs to exactly one
# Club, so removing them deletes their account, with their course progress and
# Exercise Completions. It is refused while they own Class Groups, which are
# reassigned first. Anyone else, and anyone who is not a Coach of the Club,
# gets a 404.
class ClubCoachesController < DashboardController
  include ClubScoped
  include ClubManagerOnly

  def destroy
    club = find_accessible_club(params[:club_id])
    coach = club.coaches.find(params[:id])
    return redirect_to club_path(club) if remove(coach)

    # Which Coach's removal was refused, like a refused edit of a Class.
    flash[:refused_edit] = coach.id
    redirect_to club_path(club), inertia: { errors: form_errors(coach) }
  end

  private

  # A group reassigned to the Coach during the delete makes the foreign key
  # refuse it, which is the same refusal as the model's.
  def remove(coach)
    coach.destroy
  rescue ActiveRecord::InvalidForeignKey
    coach.refuse_destroy_owning_class_groups
  end
end
