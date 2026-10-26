ActiveAdmin.register User do
  permit_params :email, :role, :password, :password_confirmation, :name, :age, :level, :hand, :club_id,
                managed_club_ids: []

  # Users are removed, never deleted: a removed user keeps their account and
  # history but can no longer sign in (User#remove!,
  # docs/adr/0006-manager-oversight.md). Both the Delete link and the batch
  # action remove.
  REMOVE_CONFIRMATION = "Remove this user? They lose access; their account and history are kept."

  batch_action :destroy, false
  batch_action :remove, confirm: REMOVE_CONFIRMATION do |ids|
    users = batch_action_collection.find(ids)
    refused = users.reject(&:remove!)
    message = { notice: "Removed #{users.size - refused.size} user(s)." }
    message[:alert] = "Not removed: #{refused.map(&:email).to_sentence} (they own Class Groups)." if refused.any?
    redirect_to collection_path, message
  end

  index do
    selectable_column
    column :email
    column :name
    column :role
    column :club
    column("Managed clubs") { |user| user.managed_clubs.map(&:name).join(", ") }
    column :created_at
    column(:status) { |user| user.removed? ? status_tag("removed", class: "no") : status_tag("active", class: "yes") }
    column :removed_at
    actions defaults: false do |user|
      item "View", resource_path(user), class: "member_link"
      item "Edit", edit_resource_path(user), class: "member_link"
      unless user.removed?
        item "Remove", resource_path(user), class: "member_link", method: :delete,
                                            data: { confirm: REMOVE_CONFIRMATION }
      end
    end
  end

  filter :email
  # Ransack's role_eq casts the submitted value with a naive #to_i (not
  # Rails' enum-aware type casting), so a string key like "coach" silently
  # becomes 0 and matches "admin" instead. Submit the enum's real integer
  # values instead of its string keys to avoid that.
  filter :role, as: :select, collection: -> { User.roles.to_a }
  filter :club, as: :select, collection: -> { Club.order(:name) }
  filter :removed_at_null, as: :select, label: "Status", collection: [["Active", "true"], ["Removed", "false"]]

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

    # Delete removes instead (see above); a refused removal (a Coach who still
    # owns Class Groups) says why.
    def destroy
      if resource.remove!
        redirect_to collection_path, notice: "#{resource.email} was removed: they lose access, their history is kept."
      else
        redirect_to collection_path, alert: resource.errors.full_messages.to_sentence
      end
    end
  end
end
