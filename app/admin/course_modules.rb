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

  form do |f|
    f.inputs "Module Details" do
      f.input :slug
      f.input :level, as: :select, collection: CourseModule.levels.keys
      f.input :position
      f.input :title
      f.input :description
      f.input :duration
      f.input :topics_text, label: "Topics (comma separated)"
      f.input :content, as: :text, input_html: { rows: 20 }
    end

    f.inputs "Documents" do
      if f.object.documents.attached?
        ul do
          f.object.documents.each do |document|
            li do
              text_node document.filename.to_s
              text_node " — "
              text_node(link_to("Remove", remove_document_admin_course_module_path(f.object, document_id: document.id),
                                 method: :delete, data: { confirm: "Remove this document?" }))
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
