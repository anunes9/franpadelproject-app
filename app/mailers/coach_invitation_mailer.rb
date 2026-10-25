# The email inviting someone to join a Club as a Coach, with the link to
# accept. Written in the inviting Club Manager's language.
class CoachInvitationMailer < ApplicationMailer
  def invite(invitation, token)
    @invitation = invitation
    @club = invitation.club
    @manager = invitation.invited_by
    @accept_url = accept_coach_invitation_url(token)

    I18n.with_locale(@manager.locale) do
      mail to: invitation.email, subject: t(".subject", club: @club.name)
    end
  end
end
