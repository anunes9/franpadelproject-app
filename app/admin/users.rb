ActiveAdmin.register User do
  permit_params :email, :role, :password, :password_confirmation, :name, :age, :level, :hand, :club_id,
                managed_club_ids: []

  index do
    selectable_column
    column :email
    column :name
    column :role
    column :club
    column("Managed clubs") { |user| user.managed_clubs.map(&:name).join(", ") }
    column :created_at
    actions
  end

  filter :email
  # Ransack's role_eq casts the submitted value with a naive #to_i (not
  # Rails' enum-aware type casting), so a string key like "coach" silently
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
      f.input :club, as: :select, collection: Club.order(:name), include_blank: true,
                     hint: "Coaches belong to exactly one Club."
      f.input :managed_clubs, as: :check_boxes, collection: Club.order(:name),
                              hint: "Club Managers can be linked to several Clubs."
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

    # A refused delete (a Coach who still owns Class Groups) says why.
    def destroy
      destroy! do |_success, failure|
        failure.html { redirect_to collection_path, alert: resource.errors.full_messages.to_sentence }
      end
    end
  end
end
