ActiveAdmin.register UserModuleProgress, as: "Module Progress" do
  menu parent: "Progress"

  # A done row is a Module Completion; the rest of a Module's state is derived
  # (CourseModule.states_for).
  permit_params :user_id, :course_module_id, :status, :progress

  includes :user, :course_module

  index do
    selectable_column
    column :user
    column :course_module
    column :status
    column :progress
    column :updated_at
    actions
  end

  filter :user, as: :select, collection: -> { User.order(:name) }
  filter :course_module, as: :select, collection: -> { CourseModule.ordered.pluck(:title, :id) }
  # Enum filters submit the integer values; see app/admin/users.rb.
  filter :status, as: :select, collection: -> { UserModuleProgress.statuses.to_a }

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Module Progress" do
      f.input :user, as: :select, collection: User.order(:name), include_blank: false
      f.input :course_module, as: :select, collection: CourseModule.ordered.pluck(:title, :id), include_blank: false
      f.input :status, as: :select, collection: UserModuleProgress.statuses.keys, include_blank: false
      f.input :progress, hint: "0 to 100."
    end
    f.actions
  end
end
