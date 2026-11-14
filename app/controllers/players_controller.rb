# A Club's Players, managed by its Coaches and Club Managers.
# Players of Clubs the user cannot access are 404s.
class PlayersController < DashboardController
  include ClubScoped

  def index
    club = find_accessible_club(params[:club_id])

    render inertia: "Players/Index", props: {
      club: club.summary_json,
      players: club.players.alphabetical.map(&:players_json)
    }
  end

  def new
    club = find_accessible_club(params[:club_id])

    render inertia: "Players/Form", props: form_props(club, nil)
  end

  def create
    club = find_accessible_club(params[:club_id])
    player = club.players.new(player_params)

    if player.save
      redirect_to club_players_path(club)
    else
      redirect_to new_club_player_path(club), inertia: { errors: form_errors(player) }
    end
  end

  def edit
    player = accessible_players.find(params[:id])

    render inertia: "Players/Form", props: form_props(player.club, player)
  end

  def update
    player = accessible_players.find(params[:id])

    if player.update(player_params)
      redirect_to club_players_path(player.club)
    else
      redirect_to edit_player_path(player), inertia: { errors: form_errors(player) }
    end
  end

  private

  def player_params
    params.require(:player).permit(:name, :position, :hand, :level, :gender)
  end

  def form_props(club, player)
    {
      club: club.summary_json,
      player: player&.players_json,
      positionOptions: Player.positions.keys,
      handOptions: Player.hands.keys,
      genderOptions: Player.genders.keys,
      levelOptions: Player.levels.keys
    }
  end
end
