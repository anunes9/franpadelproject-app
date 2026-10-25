# Regenerating a Class Group's Training Plan, only when its Coach or a Club
# Manager of its Club asks (docs/adr/0005-regenerating-a-plan.md). The done
# Classes are kept and every other Class is replaced. Anyone else gets a 404,
# as if the group did not exist. Both outcomes return to the group's page; a
# refusal brings its errors and clashing dates, marked as the "regeneration"
# edit for the page to show them by its button.
class PlanRegenerationsController < DashboardController
  REFUSED_EDIT = "regeneration".freeze

  def create
    group = ClassGroup.visible_to(current_user).find(params[:class_group_id])
    return redirect_to class_group_path(group) if group.regenerate_plan(today: Date.current)

    # The clashing dates go next to the errors, which hold codes only.
    flash[:clash_dates] = group.clashing_dates.map(&:iso8601)
    flash[:refused_edit] = REFUSED_EDIT
    redirect_to class_group_path(group), inertia: { errors: form_errors(group) }
  end
end
