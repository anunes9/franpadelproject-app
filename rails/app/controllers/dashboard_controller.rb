class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    render inertia: "Dashboard/Home"
  end
end
