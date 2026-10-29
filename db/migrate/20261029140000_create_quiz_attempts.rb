# One submission of a Module's Quiz by a Client. The score is frozen when it
# is submitted, so editing the Quiz never changes it (or takes a Quiz Pass away).
class CreateQuizAttempts < ActiveRecord::Migration[8.1]
  def change
    create_table :quiz_attempts, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :quiz, type: :uuid, null: false, foreign_key: true
      t.integer :score, null: false
      t.jsonb :answers, null: false, default: {}

      t.timestamps
    end

    add_index :quiz_attempts, [:user_id, :quiz_id]
  end
end
