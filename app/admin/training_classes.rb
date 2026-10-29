ActiveAdmin.register TrainingClass, as: "Class" do
  menu parent: "Training", priority: 2

  # A Class that takes up new time (added, moved or unskipped) is checked
  # against the clash rule, as in the Coach's plan (#save_unless_clashing).
  # Marking done or skipped takes no new time, so it is not. The Exercises the
  # Coach picked are managed on the Class's page (#pick_exercise).
  permit_params :class_group_id, :course_module_id, :date, :start_time, :kind, :done, :skipped, :coach_added

  includes :course_module, class_group: :coach

  index do
    selectable_column
    column("Class") { |training_class| link_to(l(training_class.date, format: :long), admin_class_path(training_class)) }
    column("Start") { |training_class| training_class.start_time.strftime("%H:%M") }
    column :class_group
    column("Module") { |training_class| "#{training_class.course_module.position}. #{training_class.course_module.title}" }
    column :kind
    column :done
    column :skipped
    column :coach_added
    actions
  end

  filter :class_group, as: :select, collection: -> { ClassGroup.includes(:coach).map { |group| [group.display_name, group.id] } }
  filter :course_module, as: :select, collection: -> { CourseModule.ordered.pluck(:title, :id) }
  filter :date
  # Enum filters submit the integer values; see app/admin/users.rb.
  filter :kind, as: :select, collection: -> { TrainingClass.kinds.to_a }
  filter :done
  filter :skipped
  filter :coach_added

  member_action :pick_exercise, method: :post do
    pick = resource.pick_exercise(Exercise.find(params[:exercise_id]))
    if pick.persisted?
      redirect_to resource_path, notice: "#{pick.exercise.ref} was picked."
    else
      redirect_to resource_path, alert: pick.errors.full_messages.to_sentence
    end
  end

  member_action :remove_exercise, method: :delete do
    resource.training_class_exercises.find_by!(exercise_id: params[:exercise_id]).destroy
    redirect_to resource_path, notice: "The Exercise was removed from the Class."
  end

  show do |training_class|
    attributes_table do
      row :class_group
      row("Club") { training_class.class_group.club }
      row :date
      row(:start_time) { training_class.start_time.strftime("%H:%M") }
      row :duration
      row("Number in plan", &:number_in_plan)
      row(:course_module) { link_to(training_class.course_module.title, admin_course_module_path(training_class.course_module)) }
      row :kind
      row :done
      row :skipped
      row :coach_added
      row :created_at
      row :updated_at
    end

    expected = ClassStructure.exercises_for(training_class.duration)
    panel "Exercises (#{training_class.exercises.size} of #{expected})" do
      if training_class.training_class_exercises.any?
        table_for training_class.training_class_exercises.includes(:exercise) do
          column :position
          column("Ref") { |pick| link_to(pick.exercise.ref, admin_exercise_path(pick.exercise)) }
          column("Title") { |pick| pick.exercise.title }
          column("Category") { |pick| pick.exercise.category }
          column("") do |pick|
            link_to "Remove", remove_exercise_admin_class_path(training_class, exercise_id: pick.exercise_id),
                    method: :delete, data: { confirm: "Remove this Exercise from the Class?" }
          end
        end
      else
        para "No Exercises picked yet.", class: "empty"
      end

      available = training_class.course_module.exercises.where.not(id: training_class.exercise_ids)
      if available.any?
        form action: pick_exercise_admin_class_path(training_class), method: :post do
          input type: :hidden, name: :authenticity_token, value: form_authenticity_token
          select name: :exercise_id do
            available.each { |exercise| option "#{exercise.ref} — #{exercise.title}", value: exercise.id }
          end
          input type: :submit, value: "Pick Exercise"
        end
      end
    end
  end

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Class" do
      if f.object.new_record?
        f.input :class_group, as: :select, include_blank: false,
                              collection: ClassGroup.includes(:coach).map { |group| [group.display_name, group.id] }
      else
        li "Class Group: #{f.object.class_group.display_name}"
      end
      f.input :course_module, as: :select, include_blank: false,
                              collection: CourseModule.ordered.map { |course_module| ["#{course_module.level.capitalize} #{course_module.position}. #{course_module.title}", course_module.id] },
                              hint: "A Module of the group's Course."
      f.input :date, as: :datepicker
      f.input :start_time, as: :string, input_html: { value: f.object.start_time&.strftime("%H:%M"), placeholder: "18:00" }
      f.input :kind, as: :select, collection: TrainingClass.kinds.keys, include_blank: false
      f.input :done
      f.input :skipped
      f.input :coach_added
    end
    f.actions
  end

  controller do
    # A Class added to a plan is an added one, as when a Coach adds it, and
    # starts at its group's time, unless the form says otherwise.
    def build_new_resource
      super.tap do |training_class|
        training_class.coach_added = true unless params.dig(:training_class, :coach_added)
        training_class.start_time ||= training_class.class_group&.start_time
      end
    end

    def create_resource(training_class)
      training_class.save_unless_clashing
    end

    def update_resource(training_class, attributes)
      training_class.assign_attributes(attributes.first.except(:class_group_id))
      takes_new_time = training_class.date_changed? || training_class.start_time_changed? ||
                       (training_class.skipped_changed? && !training_class.skipped?)
      takes_new_time ? training_class.save_unless_clashing : training_class.save
    end

    def create
      super do |_success, failure|
        failure.html { flash.now[:alert] = refusal_message(resource); render :new, status: :unprocessable_content }
      end
    end

    def update
      super do |_success, failure|
        failure.html { flash.now[:alert] = refusal_message(resource); render :edit, status: :unprocessable_content }
      end
    end

    private

    def refusal_message(training_class)
      message = training_class.errors.full_messages.to_sentence
      return message if training_class.clashing_dates.blank?

      "#{message} (on #{training_class.clashing_dates.map(&:iso8601).to_sentence})"
    end
  end
end
