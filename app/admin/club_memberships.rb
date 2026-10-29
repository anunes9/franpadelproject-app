ActiveAdmin.register ClubMembership do
  menu parent: "Clubs", label: "Club Managers"

  # Links a Club Manager to a Club they manage; also editable on the user.
  permit_params :user_id, :club_id

  includes :user, :club

  index title: "Club Managers" do
    selectable_column
    column :user
    column :club
    column :created_at
    actions
  end

  filter :club, as: :select, collection: -> { Club.order(:name) }
  filter :user, as: :select, collection: -> { User.club_manager.order(:name) }

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Club Manager link" do
      f.input :user, as: :select, collection: User.club_manager.order(:name), include_blank: false, label: "Club Manager"
      f.input :club, as: :select, collection: Club.order(:name), include_blank: false
    end
    f.actions
  end
end
