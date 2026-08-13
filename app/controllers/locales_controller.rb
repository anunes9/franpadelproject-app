class LocalesController < ApplicationController
  before_action :authenticate_user!

  AVAILABLE_LOCALES = %w[pt en].freeze

  def update
    return head :unprocessable_content unless AVAILABLE_LOCALES.include?(params[:locale])

    current_user.update!(locale: params[:locale])
    redirect_back fallback_location: dashboard_path
  end
end
