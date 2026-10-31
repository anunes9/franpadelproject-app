# A Coach's Board (Quadro): an interactive padel court on which the Coach
# places players, the ball, cones and markings, in Steps, to explain an
# Exercise or a tactic (docs/specs/Boards.md).
#
# A Board is scratch until saved (ADR 0010), and saving isn't built yet, so
# the page needs nothing from the server: the whole Board lives in the
# browser. Anyone who isn't a Coach gets a 404.
class BoardsController < DashboardController
  include CoachOnly

  def new
    render inertia: "Boards/New"
  end
end
