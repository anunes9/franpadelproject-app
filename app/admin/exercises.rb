ActiveAdmin.register Exercise do
  permit_params :course_module_id, :ref, :title, :category, :duration, :description, :content,
                new_media: []

  index do
    selectable_column
    column :ref
    column :title
    column :category
    column :course_module
    column :duration
    actions
  end

  filter :course_module, as: :select, collection: -> { CourseModule.ordered.pluck(:title, :id) }
  filter :category, as: :select, collection: -> { Exercise.categories.to_a }
  filter :title

  member_action :remove_media, method: :delete do
    resource.media.find(params[:media_id]).purge
    redirect_to edit_admin_exercise_path(resource), notice: "Media removed."
  end

  form do |f|
    f.inputs "Exercise Details" do
      f.input :course_module, collection: CourseModule.ordered.pluck(:title, :id)
      f.input :ref
      f.input :title
      f.input :category, as: :select, collection: Exercise.categories.keys, include_blank: true
      f.input :duration
      f.input :description
      f.input :content, as: :text, input_html: { rows: 20 }
    end

    f.inputs "Media" do
      if f.object.media.attached?
        ul do
          f.object.media.each do |file|
            li do
              text_node file.filename.to_s
              text_node " — "
              text_node(link_to("Remove", remove_media_admin_exercise_path(f.object, media_id: file.id),
                                 method: :delete, data: { confirm: "Remove this file?" }))
            end
          end
        end
      end
      f.input :new_media, as: :file, input_html: { multiple: true },
                          hint: "Upload one or more files (video, gif, image). Existing media is kept unless removed above."
    end

    f.actions
  end
end
