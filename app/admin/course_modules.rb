ActiveAdmin.register CourseModule do
  permit_params :slug, :level, :position, :title, :description, :duration, :topics_text, :content

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
    f.actions
  end
end
