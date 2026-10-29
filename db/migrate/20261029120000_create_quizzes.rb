# A Module's Quiz (at most one) and its multiple-choice questions, each in
# Portuguese and English with one correct option shared by both languages.
class CreateQuizzes < ActiveRecord::Migration[8.1]
  def change
    create_table :quizzes, id: :uuid do |t|
      t.references :course_module, type: :uuid, null: false, foreign_key: true, index: { unique: true }

      t.timestamps
    end

    create_table :quiz_questions, id: :uuid do |t|
      t.references :quiz, type: :uuid, null: false, foreign_key: true
      t.integer :position, null: false
      t.text :text_pt, null: false
      t.text :text_en, null: false
      t.jsonb :options_pt, null: false, default: []
      t.jsonb :options_en, null: false, default: []
      t.integer :correct_index, null: false

      t.timestamps
    end

    add_index :quiz_questions, [:quiz_id, :position]
  end
end
