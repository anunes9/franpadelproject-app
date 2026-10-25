# Regenerating a Class Group's Training Plan, only when its Coach or a Club
# Manager of its Club asks (docs/adr/0005-regenerating-a-plan.md). The done
# Classes are kept and every other Class is replaced. Anyone else gets a 404,
# as if the group did not exist. Both outcomes return to the group's page; a
# refusal brings its errors and clashing dates, marked as the "regeneration"
# edit for the page to show them by its button. The page learns that marker
# from ClassGroupsController, so it is defined only here.
class PlanRegenerationsController < DashboardController
  REFUSED_EDIT = "regeneration".freeze

  def create
    group = ClassGroup.visible_to(current_user).find(params[:class_group_id])
    return redirect_to class_group_path(group) if group.regenerate_plan(today: Academy.today)

    flash_clash_dates(group.clashing_dates)
    flash[:refused_edit] = REFUSED_EDIT
    redirect_to class_group_path(group), inertia: { errors: form_errors(group) }
  end
end
