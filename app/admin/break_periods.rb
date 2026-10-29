ActiveAdmin.register BreakPeriod do
  menu parent: "Clubs"

  # Like a Club Manager's change, a new or edited Break Period applies to the
  # Training Plans generated or regenerated after it; existing Classes stay.
  permit_params :club_id, :name, :starts_on, :ends_on

  includes :club

  config.sort_order = "starts_on_asc"

  index do
    selectable_column
    column :name
    column :club
    column :starts_on
    column :ends_on
    actions
  end

  filter :club, as: :select, collection: -> { Club.order(:name) }
  filter :name
  filter :starts_on
  filter :ends_on

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Break Period" do
      f.input :club, as: :select, collection: Club.order(:name), include_blank: false
      f.input :name
      f.input :starts_on, as: :datepicker
      f.input :ends_on, as: :datepicker, hint: "Both dates are included."
    end
    f.actions
  end
end
