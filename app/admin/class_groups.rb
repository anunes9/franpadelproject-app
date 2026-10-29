ActiveAdmin.register ClassGroup do
  menu parent: "Training", priority: 1

  # Every change goes through the same model operations as the Coach's own
  # screens, so the admin keeps the Training Plan and the clash rule intact:
  # creating generates the plan (#create_with_plan), editing keeps the
  # Classes (#update_with_clash_check, docs/adr/0004), a new Coach is a
  # reassignment (#reassign_to, docs/adr/0006) and the plan is regenerated on
  # request (#regenerate_plan, docs/adr/0005). Level and start date are fixed
  # once the group exists, as in the app.
  permit_params :coach_id, :name, :level, :starts_on, :cadence, :start_time, :duration, :previous_class_group_id,
                weekdays: [], player_ids: []

  includes :coach, :players

  index do
    selectable_column
    column("Group") { |group| link_to(group.display_name, admin_class_group_path(group)) }
    column :level
    column :coach
    column("Club") { |group| group.club }
    column(:weekdays) { |group| group.weekdays.map(&:capitalize).join(", ") }
    column(:start_time, &:start_time_text)
    column :duration
    column("Players") { |group| group.players.size }
    column(:status) { |group| group.finished? ? status_tag("finished", class: "no") : status_tag("active", class: "yes") }
    actions
  end

  filter :name
  filter :coach, as: :select, collection: -> { User.coach.order(:name) }
  # Enum filters submit the integer values; see app/admin/users.rb.
  filter :level, as: :select, collection: -> { ClassGroup.levels.to_a }
  filter :starts_on

  member_action :regenerate_plan, method: :post do
    if resource.regenerate_plan(today: Academy.today)
      redirect_to resource_path, notice: "The Training Plan was regenerated."
    else
      redirect_to resource_path, alert: refusal_message(resource)
    end
  end

  action_item :regenerate_plan, only: :show do
    link_to "Regenerate plan", regenerate_plan_admin_class_group_path(resource), method: :post,
                                                                                 data: { confirm: "Regenerate the Training Plan? Done Classes are kept; every other Class is replaced." }
  end

  action_item :add_class, only: :show do
    link_to "Add Class", new_admin_class_path(training_class: { class_group_id: resource.id })
  end

  show do |group|
    attributes_table do
      row :name
      row :level
      row :coach
      row("Club") { group.club }
      row :starts_on
      row :cadence
      row(:weekdays) { group.weekdays.map(&:capitalize).join(", ") }
      row(:start_time, &:start_time_text)
      row :duration
      row("Exercises per Class") { ClassStructure.exercises_for(group.duration) }
      row(:previous_class_group) { group.previous_class_group && link_to(group.previous_class_group.display_name, admin_class_group_path(group.previous_class_group)) }
      row(:status) { group.finished? ? status_tag("finished", class: "no") : status_tag("active", class: "yes") }
      row :created_at
      row :updated_at
    end

    panel "Players (#{group.players.size})" do
      table_for group.players.sort_by(&:name) do
        column(:name) { |player| link_to(player.name, admin_player_path(player)) }
        column :level
        column :position
        column :hand
      end
    end

    panel "Training Plan (#{group.training_classes.size} Classes)" do
      table_for group.training_classes.includes(:course_module, :exercises).each_with_index.to_a do
        column("#") { |(_, index)| index + 1 }
        column("Date") { |(training_class, _)| link_to(l(training_class.date, format: :long), admin_class_path(training_class)) }
        column("Start") { |(training_class, _)| training_class.start_time.strftime("%H:%M") }
        column("Module") { |(training_class, _)| "#{training_class.course_module.position}. #{training_class.course_module.title}" }
        column("Kind") { |(training_class, _)| training_class.kind }
        column("Exercises") { |(training_class, _)| training_class.exercises.map(&:ref).join(", ") }
        column("Status") do |(training_class, _)|
          if training_class.done? then status_tag("done", class: "yes")
          elsif training_class.skipped? then status_tag("skipped", class: "no")
          end
        end
      end
    end
  end

  form do |f|
    f.semantic_errors(*f.object.errors.attribute_names)
    f.inputs "Class Group" do
      f.input :coach, as: :select, include_blank: false,
                      collection: User.coach.active.includes(:club).order(:name).map { |coach| ["#{coach.name} (#{coach.club&.name})", coach.id] },
                      hint: f.object.persisted? ? "A new Coach is a reassignment: they must be of the same Club and free at every upcoming Class." : nil
      f.input :name, hint: "Optional. Without one the group is shown by its Level."
      if f.object.new_record?
        f.input :level, as: :select, collection: ClassGroup.levels.keys, include_blank: false
        f.input :starts_on, as: :datepicker
        f.input :previous_class_group, as: :select, include_blank: true,
                                       collection: ClassGroup.finished.includes(:coach).map { |group| [group.display_name, group.id] },
                                       hint: "When continuing a finished group: the new group must be at its next Level."
      end
      f.input :players, as: :select, multiple: true, input_html: { size: 10 },
                        collection: Player.includes(:club).order(:name).map { |player| ["#{player.name} (#{player.club.name}, #{player.level})", player.id] },
                        hint: "One to #{ClassGroup::MAX_PLAYERS} Players of the Coach's Club."
      f.input :cadence, as: :select, collection: ClassGroup::CADENCES, include_blank: false,
                        hint: "Classes a week. Choose the same number of weekdays."
      f.input :weekdays, as: :check_boxes, collection: ClassGroup::WEEKDAYS.map { |day| [day.capitalize, day] }
      f.input :start_time, as: :string, input_html: { value: f.object.start_time_text, placeholder: "18:00" }
      f.input :duration, as: :select, collection: ClassGroup::DURATIONS, include_blank: false, hint: "Minutes."
    end
    para "Editing never moves the Classes already planned (only a new duration applies to them); " \
         "regenerate the plan from the group's page to use a new schedule.", class: "admin-content-editor-hint" if f.object.persisted?
    f.actions
  end

  controller do
    def create_resource(group)
      group.create_with_plan
    end

    # A new Coach first (#reassign_to), then the rest of the edit. Each is
    # checked on its own, so a refused edit after an accepted reassignment
    # leaves the group with its new Coach.
    def update_resource(group, attributes)
      attributes = attributes.first.to_h.symbolize_keys.except(:level, :starts_on, :previous_class_group_id)
      coach_id = attributes.delete(:coach_id)
      if coach_id.present? && coach_id != group.coach_id
        return false unless group.reassign_to(User.find_by(id: coach_id), today: Academy.today)
      end

      group.update_with_clash_check(attributes, today: Academy.today)
    end

    def create
      super do |success, failure|
        failure.html { flash.now[:alert] = refusal_message(resource); render :new, status: :unprocessable_content }
      end
    end

    def update
      super do |success, failure|
        failure.html { flash.now[:alert] = refusal_message(resource); render :edit, status: :unprocessable_content }
      end
    end

    private

    def refusal_message(group)
      message = group.errors.full_messages.to_sentence
      return message if group.clashing_dates.blank?

      "#{message} (on #{group.clashing_dates.map(&:iso8601).to_sentence})"
    end
  end
end
