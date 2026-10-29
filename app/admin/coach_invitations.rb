ActiveAdmin.register CoachInvitation do
  menu parent: "Clubs"

  # An invitation is issued and emailed as a Club Manager's is
  # (CoachInvitation.issue), from the signed-in Admin. Only its token's digest
  # is stored, so an invitation cannot be edited: expire it and issue another.
  actions :all, except: %i[edit update]

  permit_params :club_id, :name, :email

  includes :club, :invited_by

  index do
    selectable_column
    column :name
    column :email
    column :club
    column :invited_by
    column(:status) { |invitation| status_tag(invitation_status(invitation), class: INVITATION_STATUS_CLASSES[invitation_status(invitation)]) }
    column :expires_at
    column :created_at
    actions
  end

  filter :club, as: :select, collection: -> { Club.order(:name) }
  filter :email
  filter :name
  filter :accepted_at
  filter :expires_at

  member_action :expire, method: :post do
    resource.update!(expires_at: Time.current) if resource.pending?
    redirect_to resource_path, notice: "The invitation was expired."
  end

  action_item :expire, only: :show, if: proc { resource.pending? } do
    link_to "Expire", expire_admin_coach_invitation_path(resource), method: :post,
                                                                     data: { confirm: "Expire this invitation? Its link stops working." }
  end

  show do |invitation|
    attributes_table do
      row :name
      row :email
      row :club
      row :invited_by
      row(:status) { status_tag(invitation_status(invitation), class: INVITATION_STATUS_CLASSES[invitation_status(invitation)]) }
      row :expires_at
      row :accepted_at
      row :created_at
    end
  end

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Invite a Coach" do
      f.input :club, as: :select, collection: Club.order(:name), include_blank: false
      f.input :name
      f.input :email, hint: "The invitation link is emailed here and works for #{CoachInvitation::VALID_FOR.inspect}."
    end
    f.actions
  end

  INVITATION_STATUS_CLASSES = { "accepted" => "yes", "expired" => "no" }.freeze

  controller do
    helper do
      def invitation_status(invitation)
        if invitation.accepted? then "accepted"
        elsif invitation.expired? then "expired"
        else "pending"
        end
      end
    end

    def create
      @coach_invitation, token = CoachInvitation.issue(permitted_params[:coach_invitation].merge(invited_by: current_user))

      if resource.persisted?
        CoachInvitationMailer.invite(resource, token).deliver_later
        redirect_to resource_path, notice: "The invitation was emailed to #{resource.email}."
      else
        render :new, status: :unprocessable_content
      end
    end
  end
end
