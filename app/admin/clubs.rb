ActiveAdmin.register Club do
  permit_params :name, :location, :instagram, :logo

  index do
    selectable_column
    column :name
    column :location
    column :instagram
    actions
  end

  filter :name

  member_action :remove_logo, method: :delete do
    resource.logo.purge
    redirect_to edit_admin_club_path(resource), notice: "Logo removed."
  end

  form do |f|
    f.inputs "Club Details" do
      f.input :name
      f.input :location
      f.input :instagram
    end

    f.inputs "Logo" do
      if f.object.logo.attached?
        para do
          text_node "Current logo: #{f.object.logo.filename}"
          text_node " — "
          text_node(link_to("Remove", remove_logo_admin_club_path(f.object),
                             method: :delete, data: { confirm: "Remove the logo?" }))
        end
      end
      f.input :logo, as: :file
    end

    f.actions
  end
end
