# Renaming a Class Group from its page. The owning Coach and the Club
# Managers of the group's Club can rename it; anyone else gets a 404, as if
# the group did not exist. A blank name removes it: the group is then shown
# by its Level. A rename changes nothing else, so it is never clash-checked.
class ClassGroupNamesController < DashboardController
  def update
    group = ClassGroup.visible_to(current_user).find(params[:class_group_id])

    if group.update(name: params.require(:class_group).fetch(:name, ""))
      return_to(group)
    else
      return_to(group, inertia: { errors: form_errors(group) })
    end
  end

  private

  # Back to the group's page as it was (its plan view kept), on this site.
  def return_to(group, **)
    redirect_back_or_to class_group_path(group), allow_other_host: false, **
  end
end
