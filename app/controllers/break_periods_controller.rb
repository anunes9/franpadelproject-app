# A Club's Break Periods, managed by the Club Managers linked to it. Coaches,
# Admins and Club Managers of other Clubs get 404s.
class BreakPeriodsController < DashboardController
  include ClubScoped
  include ClubManagerOnly

  def index
    club = find_accessible_club(params[:club_id])

    render inertia: "BreakPeriods/Index", props: {
      club: club.summary_json,
      breakPeriods: club.break_periods.chronological.map(&:summary_json)
    }
  end

  def new
    club = find_accessible_club(params[:club_id])

    render inertia: "BreakPeriods/Form", props: { club: club.summary_json, breakPeriod: nil }
  end

  def create
    club = find_accessible_club(params[:club_id])
    break_period = club.break_periods.new(break_period_params)

    if break_period.save
      redirect_to club_break_periods_path(club)
    else
      redirect_to new_club_break_period_path(club), inertia: { errors: form_errors(break_period) }
    end
  end

  def edit
    break_period = accessible_break_periods.find(params[:id])

    render inertia: "BreakPeriods/Form", props: {
      club: break_period.club.summary_json,
      breakPeriod: break_period.summary_json
    }
  end

  def update
    break_period = accessible_break_periods.find(params[:id])

    if break_period.update(break_period_params)
      redirect_to club_break_periods_path(break_period.club)
    else
      redirect_to edit_break_period_path(break_period), inertia: { errors: form_errors(break_period) }
    end
  end

  def destroy
    break_period = accessible_break_periods.find(params[:id])
    break_period.destroy!

    redirect_to club_break_periods_path(break_period.club), status: :see_other
  end

  private

  def break_period_params
    params.require(:break_period).permit(:name, :starts_on, :ends_on)
  end
end
