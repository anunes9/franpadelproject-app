ActiveAdmin.register User do
  permit_params :email, :role, :password, :password_confirmation, :name, :age, :level, :hand, :club_id

  index do
    selectable_column
    column :email
    column :name
    column :role
    column :club
    column :created_at
    actions
  end

  filter :email
  # Ransack's role_eq casts the submitted value with a naive #to_i (not
  # Rails' enum-aware type casting), so a string key like "sales" silently
  # becomes 0 and matches "admin" instead. Submit the enum's real integer
  # values instead of its string keys to avoid that.
  filter :role, as: :select, collection: -> { User.roles.to_a }
  filter :club, as: :select, collection: -> { Club.order(:name) }

  form do |f|
    f.inputs "User Details" do
      f.input :email
      f.input :name
      f.input :role, as: :select, collection: User.roles.keys
      f.input :age
      f.input :level, as: :select, collection: User.levels.keys, include_blank: true
      f.input :hand, as: :select, collection: User.hands.keys, include_blank: true
      f.input :club, as: :select, collection: Club.order(:name), include_blank: true
      f.input :password
      f.input :password_confirmation
    end
    f.actions
  end

  controller do
    def update_resource(object, attributes)
      params = attributes.first
      params = params.except(:password, :password_confirmation) if params[:password].blank?
      object.update(params)
    end
  end
end
