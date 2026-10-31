# A Coach's Boards (Quadro): interactive padel courts on which the Coach
# places players, the ball, cones and markings, in Steps, to explain an
# Exercise or a tactic (docs/specs/Boards.md).
#
# A new Board is scratch: it lives in the browser and nothing reaches the
# server until the Coach saves it (ADR 0010). Saved Boards are the Coach's
# own library, found only through current_user.boards, so another Coach's
# Board is a 404. Anyone who isn't a Coach gets a 404 everywhere here.
class BoardsController < DashboardController
  include CoachOnly

  def index
    render inertia: "Boards/Index", props: { boards: current_user.boards.recent.map(&:list_json) }
  end

  def new
    render inertia: "Boards/New"
  end

  def create
    board = current_user.boards.new(board_params)

    if board.save
      redirect_to board_path(board)
    else
      redirect_to new_board_path, inertia: { errors: form_errors(board) }
    end
  end

  def show
    render inertia: "Boards/Show", props: { board: find_board.editor_json }
  end

  # Saves the Board's document, its title, or both.
  def update
    board = find_board

    if board.update(board_params)
      redirect_to board_path(board)
    else
      redirect_to board_path(board), inertia: { errors: form_errors(board) }
    end
  end

  def destroy
    find_board.destroy!
    redirect_to boards_path
  end

  private

  def find_board
    current_user.boards.find(params[:id])
  end

  # The document is taken as the JSON it was sent as, not through permitted
  # params: its shape is checked whole by BoardDocument when the Board saves.
  def board_params
    attributes = params.require(:board).permit(:title).to_h
    sent = request.request_parameters["board"]
    attributes[:document] = sent["document"] if sent.is_a?(Hash) && sent.key?("document")
    attributes
  end
end
