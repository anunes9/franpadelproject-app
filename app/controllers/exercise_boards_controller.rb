# An Exercise's official Board (docs/specs/Boards.md, ADR 0010): the
# Exercise's animated court diagram, which every Client sees on its page.
#
# A Coach opens a scratch copy of it to explain on, which never changes the
# official one; saving that copy puts it in the Coach's own library. Only
# Admins edit an Exercise's Board, or take it away. Anyone else gets a 404,
# as does an Exercise without a Board for a Coach.
class ExerciseBoardsController < DashboardController
  before_action :require_coach, only: :show
  before_action :require_admin, except: :show

  def show
    exercise = find_exercise
    board = exercise.board or raise ActiveRecord::RecordNotFound

    render inertia: "Boards/New", props: {
      from: { ref: exercise.ref, title: exercise.title, document: board.document }
    }
  end

  def edit
    exercise = find_exercise

    render inertia: "Boards/Exercise", props: {
      exercise: { ref: exercise.ref, title: exercise.title, adminPath: admin_exercise_path(exercise) },
      document: exercise.board&.document
    }
  end

  # Saves the Board's document, creating the Board on the first save. It is
  # always titled after its Exercise.
  def update
    exercise = find_exercise
    board = exercise.board || exercise.build_board
    board.assign_attributes(title: exercise.title, document: sent_document)

    if board.save
      redirect_to edit_exercise_board_path(exercise.ref)
    else
      redirect_to edit_exercise_board_path(exercise.ref), inertia: { errors: form_errors(board) }
    end
  end

  def destroy
    exercise = find_exercise
    exercise.board&.destroy!
    redirect_to edit_exercise_board_path(exercise.ref)
  end

  private

  def find_exercise
    Exercise.includes(:board).find_by!(ref: params[:ref])
  end

  def require_coach
    raise ActiveRecord::RecordNotFound unless current_user.coach?
  end

  def require_admin
    raise ActiveRecord::RecordNotFound unless current_user.admin?
  end

  # The document as it was sent, as JSON: BoardDocument checks it whole.
  def sent_document
    sent = request.request_parameters["board"]
    sent["document"] if sent.is_a?(Hash)
  end
end
