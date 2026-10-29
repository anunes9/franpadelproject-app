ActiveAdmin.register Player do
  menu parent: "Clubs"

  permit_params :club_id, :name, :level, :position, :hand

  index do
    selectable_column
    column :name
    column :club
    column :level
    column :position
    column :hand
    column("Class Groups") { |player| player.class_groups.size }
    actions
  end

  filter :name
  filter :club, as: :select, collection: -> { Club.order(:name) }
  # Enum filters submit the integer values; see app/admin/users.rb.
  filter :level, as: :select, collection: -> { Player.levels.to_a }
  filter :position, as: :select, collection: -> { Player.positions.to_a }
  filter :hand, as: :select, collection: -> { Player.hands.to_a }

  show do |player|
    attributes_table do
      row :name
      row :club
      row :level
      row :position
      row :hand
      row :created_at
      row :updated_at
    end

    panel "Class Groups" do
      table_for player.class_groups.includes(:coach) do
        column("Group") { |group| link_to(group.name || group.level.capitalize, admin_class_group_path(group)) }
        column :level
        column :coach
      end
    end
  end

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Player Details" do
      f.input :club, as: :select, collection: Club.order(:name), include_blank: false
      f.input :name
      f.input :level, as: :select, collection: Player.levels.keys, include_blank: false
      f.input :position, as: :select, collection: Player.positions.keys, include_blank: false
      f.input :hand, as: :select, collection: Player.hands.keys, include_blank: false
    end
    f.actions
  end

  controller do
    # A Player in a Class Group cannot be deleted (restrict_with_error); say why.
    def destroy
      if resource.destroy
        redirect_to collection_path, notice: "#{resource.name} was deleted."
      else
        redirect_to resource_path, alert: "#{resource.name} was not deleted: they are in a Class Group."
      end
    end
  end
end
