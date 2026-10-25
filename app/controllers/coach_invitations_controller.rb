# A Club Manager invites a Coach to one of their linked Clubs by email.
# Clubs the Club Manager is not linked to are 404s, and so is the screen for
# anyone who is not a Club Manager.
class CoachInvitationsController < DashboardController
  include ClubScoped
  include ClubManagerOnly

  def new
    render inertia: "CoachInvitations/New", props: { club: find_accessible_club(params[:club_id]).summary_json }
  end

  def create
    club = find_accessible_club(params[:club_id])
    invitation, token = CoachInvitation.issue(invitation_params.merge(club: club, invited_by: current_user))

    if invitation.persisted?
      CoachInvitationMailer.invite(invitation, token).deliver_later
      redirect_to club_path(club)
    else
      redirect_to new_club_coach_invitation_path(club), inertia: { errors: form_errors(invitation) }
    end
  end

  private

  def invitation_params
    params.require(:coach_invitation).permit(:name, :email)
  end
end
