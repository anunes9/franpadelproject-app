# Recording a Player's Evaluation in an Assessment Class, one Player at a
# time (docs/specs/PlayerPerformanceProfile.md). Only the group's owning Coach
# records; anyone else gets a 404, as if the page did not exist. Club
# Managers read the result on the Player's Performance Profile.
class EvaluationsController < DashboardController
  include CoachOnly

  # The form for one Player: the five Profile Areas, the Strokes of the
  # Class's Module and any other Stroke, with the Player's Evaluation so far,
  # the Ratings they had before this Class, and the group's Players to move
  # between. Before the Class's date, or on a regular or skipped Class, back
  # to the Class's page.
  def edit
    training_class = find_training_class
    return redirect_to training_class_path(training_class) if Evaluation.refusal_for(training_class, today: Academy.today)

    player = training_class.class_group.players.find(params[:player_id])
    evaluation = training_class.evaluations.includes(:ratings).find_by(player: player)

    render inertia: "Evaluations/Edit", props: {
      trainingClass: {
        id: training_class.id,
        number: training_class.number_in_plan,
        date: training_class.date.iso8601,
        module: { number: training_class.course_module.position, title: training_class.course_module.title,
                  strokes: training_class.course_module.strokes }
      },
      classGroup: training_class.class_group.link_json,
      player: { id: player.id, name: player.name },
      areas: ProfileArea::KEYS,
      strokes: Stroke::KEYS,
      evaluation: evaluation&.as_form_json,
      previousRatings: previous_ratings(player, training_class),
      roster: training_class.evaluation_roster
    }
  end

  # Saves the whole Evaluation as sent, then goes on to the Player in
  # `next_player_id` when there is one, else back to the Class's page. A
  # refusal returns to the form with the errors.
  def update
    training_class = find_training_class
    player = Player.find(params[:player_id])
    evaluation = Evaluation.record(
      training_class: training_class, player: player, coach: current_user,
      comment: evaluation_params[:comment], ratings: evaluation_params[:ratings], today: Academy.today
    )

    if evaluation.errors.any?
      # Back to the form, unless the Class takes no Evaluations at all.
      back = evaluation.errors.include?(:base) ? training_class_path(training_class) : class_evaluation_path(training_class, player)
      redirect_to back, inertia: { errors: form_errors(evaluation) }
    elsif (next_player = training_class.class_group.players.find_by(id: params[:next_player_id]))
      redirect_to class_evaluation_path(training_class, next_player)
    else
      redirect_to training_class_path(training_class, anchor: "evaluations")
    end
  end

  private

  def find_training_class
    TrainingClass.where(class_group: ClassGroup.owned_by(current_user)).find(params[:training_class_id])
  end

  def evaluation_params
    params.require(:evaluation).permit(:comment, ratings: %i[kind key value comment])
  end

  # The Player's latest Rating of each item from Classes before this one, as
  # "kind:key" => value, for the Coach to compare against.
  def previous_ratings(player, training_class)
    earlier = Rating.joins(evaluation: :training_class)
                    .where(evaluations: { player_id: player.id })
                    .where("(training_classes.date, training_classes.start_time) < (?, ?)",
                           training_class.date, training_class.start_time)
                    .order("training_classes.date DESC, training_classes.start_time DESC")
    earlier.each_with_object({}) { |rating, latest| latest[rating.item_id] ||= rating.value }
  end
end
