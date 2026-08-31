class ProfileController < DashboardController
  def index
    render inertia: "Profile/Show", props: {
      profile: current_user.profile_json,
      levelOptions: User.levels.keys,
      handOptions: User.hands.keys
    }
  end

  def update
    attrs = params.permit(:level, :hand).to_h.compact
    return head :unprocessable_content if attrs.empty? || !valid_profile_attrs?(attrs)

    current_user.update!(attrs)
    redirect_back fallback_location: dashboard_path
  end

  private

  def valid_profile_attrs?(attrs)
    attrs.all? do |key, value|
      case key
      when "level" then User.levels.key?(value)
      when "hand" then User.hands.key?(value)
      end
    end
  end
end
