class ProfileController < DashboardController
  def index
    render inertia: "Profile/Show", props: {
      profile: DashboardData::USER.merge(
        email: current_user.email,
        role: current_user.role
      )
    }
  end
end
