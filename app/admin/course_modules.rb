ActiveAdmin.register CourseModule do
  menu parent: "Content", priority: 1

  permit_params :slug, :level, :position, :title, :description, :duration, :topics_text, :content,
                new_documents: [],
                quiz_attributes: [ :id, { questions_attributes: %i[id position text_pt text_en options_pt_text
                                                                 options_en_text correct_index _destroy] } ]

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

    panel "Quiz (#{course_module.quiz&.questions&.size.to_i} questions)" do
      if course_module.quiz?
        table_for course_module.quiz.questions do
          column("#", &:position)
          column("Question") { |q| safe_join([ q.text_pt, tag.br, tag.small(q.text_en) ]) }
          column("Options") do |q|
            ol(style: "list-style-type: upper-alpha; padding-left: 1.5em") do
              q.options_pt.zip(q.options_en).each_with_index do |(pt, en), i|
                li do
                  text_node pt
                  text_node " / #{en}"
                  text_node " ✓" if i == q.correct_index
                end
              end
            end
          end
        end
      else
        para "No quiz. Add questions on the edit page; a Quiz with no questions does not count.", class: "empty"
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
    # Lists errors the inputs can't show next to themselves, such as a quiz
    # question's options (edited through the one-per-line text fields).
    f.semantic_errors(*f.object.errors.attribute_names)

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

    f.inputs "Quiz", for: [ :quiz, f.object.quiz || f.object.build_quiz ] do |quiz|
      quiz.has_many :questions, heading: false, allow_destroy: true, new_record: "Add question" do |q|
        q.input :position, hint: "Questions are shown in this order."
        q.input :text_pt, label: "Question (PT)", input_html: { rows: 2 }
        q.input :text_en, label: "Question (EN)", input_html: { rows: 2 }
        q.input :options_pt_text, as: :text, label: "Options (PT)", input_html: { rows: 4 },
                                  hint: "One per line, 2 to 4, in the order shown."
        q.input :options_en_text, as: :text, label: "Options (EN)", input_html: { rows: 4 },
                                  hint: "Same options, same order, as the Portuguese."
        q.input :correct_index, as: :select, label: "Correct option", collection: ("A".."D").each_with_index.to_a, include_blank: false
      end
    end

    f.actions
  end
end
