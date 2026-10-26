# Devise's failure app, which also hands the sign-in page the code of why a
# removed user was turned away (User#inactive_message,
# docs/adr/0006-manager-oversight.md), so the page can say so in the Client's
# language. Devise only gives this reason once the password is right, so it
# tells no one without the password anything new.
class AuthFailureApp < Devise::FailureApp
  REFUSALS = %i[removed].freeze

  def recall
    flash.now[:sign_in_refusal] = refusal if refusal
    super
  end

  def redirect
    flash[:sign_in_refusal] = refusal if refusal
    super
  end

  private

  def refusal
    warden_message.to_s if REFUSALS.include?(warden_message)
  end
end
