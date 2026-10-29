ActiveAdmin.register ExerciseCompletion do
  menu parent: "Progress"

  permit_params :user_id, :exercise_id

  includes :user, :exercise

  index do
    selectable_column
    column :user
    column :exercise
    column :created_at
    actions
  end

  filter :user, as: :select, collection: -> { User.order(:name) }
  filter :exercise, as: :select, collection: -> { Exercise.ordered.map { |exercise| ["#{exercise.ref} — #{exercise.title}", exercise.id] } }
  filter :created_at

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Exercise Completion" do
      f.input :user, as: :select, collection: User.order(:name), include_blank: false
      f.input :exercise, as: :select, include_blank: false,
                         collection: Exercise.ordered.map { |exercise| ["#{exercise.ref} — #{exercise.title}", exercise.id] }
    end
    f.actions
  end
end
