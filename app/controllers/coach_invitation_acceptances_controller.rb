# The page an invited Coach reaches from the emailed link: they choose their
# name and password, become a Coach of the inviting Club and are signed in.
# An unknown link is a 404; an expired or already used one says so.
class CoachInvitationAcceptancesController < ApplicationController
  before_action :find_invitation

  def show
    render inertia: "Auth/AcceptInvitation", props: {
      state: state,
      invitation: { name: @invitation.name, email: @invitation.email, club: @invitation.club.name }
    }
  end

  def update
    return redirect_to accept_coach_invitation_path(params[:token]) unless state == "pending"

    coach = @invitation.accept(**acceptance_params.to_h.symbolize_keys)

    if coach.persisted?
      sign_in(coach)
      redirect_to dashboard_path
    else
      redirect_to accept_coach_invitation_path(params[:token]), inertia: { errors: coach.errors }
    end
  end

  private

  def find_invitation
    @invitation = CoachInvitation.find_by_token(params[:token]) or raise ActiveRecord::RecordNotFound
  end

  def state
    return "accepted" if @invitation.accepted?
    return "expired" if @invitation.expired?

    "pending"
  end

  def acceptance_params
    params.require(:invitation).permit(:name, :password, :password_confirmation)
      .with_defaults(name: "", password: "", password_confirmation: "")
  end
end
