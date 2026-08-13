class ProfileController < DashboardController
  def index
    render inertia: "Profile/Show", props: { profile: current_user.profile_json }
  end
end
