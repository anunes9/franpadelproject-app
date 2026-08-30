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

  show do |exercise|
    attributes_table do
      row :ref
      row :title
      row :category
      row("Course Module") { link_to exercise.course_module.title, admin_course_module_path(exercise.course_module) }
      row :duration
      row :description
      row :created_at
      row :updated_at
    end

    panel "Content Preview (as shown on the exercise page)" do
      # Mirrors the frontend's Exercises::Show#renderBoldText exactly: each
      # non-blank line becomes its own paragraph, with **bold** spans as the
      # only special formatting -- so this matches what a student actually
      # sees, not a generic markdown render.
      lines = exercise.content.to_s.split("\n").map(&:strip).reject(&:blank?).map { |line| line.split(/(\*\*[^*]+\*\*)/) }

      if lines.present?
        lines.each do |parts|
          para do
            parts.each do |part|
              if part.start_with?("**") && part.end_with?("**")
                strong part[2..-3]
              else
                text_node part
              end
            end
          end
        end
      else
        para "No content yet.", class: "empty"
      end
    end

    panel "Media (#{exercise.media.count})" do
      if exercise.media.attached?
        div class: "media-thumb-grid" do
          exercise.media.each do |file|
            div class: "media-thumb-card" do
              content_type = file.content_type.to_s
              url = rails_blob_path(file, disposition: "inline")

              if content_type.start_with?("image/")
                text_node(image_tag(url, class: "media-thumb", alt: file.filename.to_s))
              elsif content_type.start_with?("video/")
                text_node(video_tag(url, class: "media-thumb", controls: true, preload: "metadata"))
              else
                div class: "media-thumb media-thumb-generic" do
                  span File.extname(file.filename.to_s).delete(".").upcase.presence || "FILE"
                end
              end

              div class: "media-thumb-meta" do
                text_node file.filename.to_s
              end

              div class: "media-thumb-actions" do
                text_node(link_to("View", url, target: "_blank", rel: "noopener"))
              end
            end
          end
        end
      else
        para "No media attached.", class: "empty"
      end
    end
  end

  form do |f|
    f.inputs "Exercise Details" do
      f.input :course_module, collection: CourseModule.ordered.pluck(:title, :id)
      f.input :ref
      f.input :title
      f.input :category, as: :select, collection: Exercise.categories.keys, include_blank: true
      f.input :duration
      f.input :description
      f.input :content, as: :text, input_html: {
        rows: 20,
        data: {
          easymde: true,
          easymde_hint: "Only **bold** text renders specially on the exercise page — " \
                        "headings and bullet lists aren't supported there, so write plain lines instead."
        }
      }
    end

    panel "Content Preview (as shown on the exercise page)" do
      para "Reflects the saved content -- save the form to refresh this preview.", class: "admin-content-editor-hint"

      lines = f.object.content.to_s.split("\n").map(&:strip).reject(&:blank?).map { |line| line.split(/(\*\*[^*]+\*\*)/) }
      if lines.present?
        lines.each do |parts|
          para do
            parts.each do |part|
              if part.start_with?("**") && part.end_with?("**")
                strong part[2..-3]
              else
                text_node part
              end
            end
          end
        end
      else
        para "No content yet.", class: "empty"
      end
    end

    f.inputs "Media" do
      if f.object.media.attached?
        div class: "media-thumb-grid" do
          f.object.media.each do |file|
            div class: "media-thumb-card" do
              content_type = file.content_type.to_s
              url = rails_blob_path(file, disposition: "inline")

              if content_type.start_with?("image/")
                text_node(image_tag(url, class: "media-thumb", alt: file.filename.to_s))
              elsif content_type.start_with?("video/")
                text_node(video_tag(url, class: "media-thumb", controls: true, preload: "metadata"))
              else
                div class: "media-thumb media-thumb-generic" do
                  span File.extname(file.filename.to_s).delete(".").upcase.presence || "FILE"
                end
              end

              div class: "media-thumb-meta" do
                text_node file.filename.to_s
              end

              div class: "media-thumb-actions" do
                text_node(link_to("View", url, target: "_blank", rel: "noopener"))
                text_node " · "
                text_node(link_to("Remove", remove_media_admin_exercise_path(f.object, media_id: file.id),
                                   method: :delete, data: { confirm: "Remove this file?" }, class: "media-thumb-remove"))
              end
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
