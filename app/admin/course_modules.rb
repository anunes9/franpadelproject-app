ActiveAdmin.register CourseModule do
  permit_params :slug, :level, :position, :title, :description, :duration, :topics_text, :content,
                new_documents: []

  index do
    selectable_column
    column :slug
    column :title
    column :level
    column :position
    actions
  end

  filter :level, as: :select, collection: -> { CourseModule.levels.to_a }
  filter :title

  member_action :remove_document, method: :delete do
    resource.documents.find(params[:document_id]).purge
    redirect_to edit_admin_course_module_path(resource), notice: "Document removed."
  end

  show do |course_module|
    attributes_table do
      row :slug
      row :level
      row :position
      row :title
      row :description
      row :duration
      row :topics
      row :created_at
      row :updated_at
    end

    panel "Content Preview (as shown on the course page)" do
      if course_module.sections.present?
        course_module.sections.each do |section|
          div class: "content-preview-section" do
            h4 section[:heading]
            if section[:items].present?
              ul do
                section[:items].each { |item| li item }
              end
            end
          end
        end
      else
        para "No content yet — nothing matches the \"## Heading\" / \"- bullet\" format.", class: "empty"
      end
    end

    panel "Documents (#{course_module.documents.count})" do
      if course_module.documents.attached?
        div class: "media-thumb-grid" do
          course_module.documents.each do |document|
            div class: "media-thumb-card" do
              content_type = document.content_type.to_s
              url = rails_blob_path(document, disposition: "inline")

              if content_type.start_with?("image/")
                text_node(image_tag(url, class: "media-thumb", alt: document.filename.to_s))
              elsif content_type.start_with?("video/")
                text_node(video_tag(url, class: "media-thumb", controls: true, preload: "metadata"))
              else
                div class: "media-thumb media-thumb-generic" do
                  span content_type == "application/pdf" ? "PDF" : (File.extname(document.filename.to_s).delete(".").upcase.presence || "FILE")
                end
              end

              div class: "media-thumb-meta" do
                text_node document.filename.to_s
              end

              div class: "media-thumb-actions" do
                text_node(link_to("View", url, target: "_blank", rel: "noopener"))
              end
            end
          end
        end
      else
        para "No documents attached.", class: "empty"
      end
    end

    panel "Exercises (#{course_module.exercises.count})" do
      if course_module.exercises.any?
        table_for course_module.exercises do
          column :ref
          column :title
          column :category
          column :duration
          column "" do |exercise|
            link_to "View", admin_exercise_path(exercise)
          end
        end
      else
        para "No exercises yet.", class: "empty"
      end
    end
  end

  form do |f|
    f.inputs "Module Details" do
      f.input :slug
      f.input :level, as: :select, collection: CourseModule.levels.keys
      f.input :position
      f.input :title
      f.input :description
      f.input :duration
      f.input :topics_text, label: "Topics (comma separated)"
      f.input :content, as: :text, input_html: {
        rows: 20,
        data: {
          easymde: true,
          easymde_hint: "Only \"## Heading\" lines and \"- bullet\" lines render on the course page — " \
                        "each ## starts a new section, and only the - lines under it show as items. " \
                        "Other formatting (bold, links, etc.) is ignored."
        }
      }
    end

    f.inputs "Documents" do
      if f.object.documents.attached?
        div class: "media-thumb-grid" do
          f.object.documents.each do |document|
            div class: "media-thumb-card" do
              content_type = document.content_type.to_s
              url = rails_blob_path(document, disposition: "inline")

              if content_type.start_with?("image/")
                text_node(image_tag(url, class: "media-thumb", alt: document.filename.to_s))
              elsif content_type.start_with?("video/")
                text_node(video_tag(url, class: "media-thumb", controls: true, preload: "metadata"))
              else
                div class: "media-thumb media-thumb-generic" do
                  span content_type == "application/pdf" ? "PDF" : (File.extname(document.filename.to_s).delete(".").upcase.presence || "FILE")
                end
              end

              div class: "media-thumb-meta" do
                text_node document.filename.to_s
              end

              div class: "media-thumb-actions" do
                text_node(link_to("View", url, target: "_blank", rel: "noopener"))
                text_node " · "
                text_node(link_to("Remove", remove_document_admin_course_module_path(f.object, document_id: document.id),
                                   method: :delete, data: { confirm: "Remove this document?" }, class: "media-thumb-remove"))
              end
            end
          end
        end
      end
      f.input :new_documents, as: :file, input_html: { multiple: true },
                              hint: "Upload one or more documents (PDF, images, etc). Users can view but not download them. Existing documents are kept unless removed above."
    end

    f.actions
  end
end
