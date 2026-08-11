# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users, id: :uuid do |t|
      ## Database authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      # Recoverable, Rememberable, Trackable, Confirmable, and Lockable columns
      # are intentionally omitted: only :database_authenticatable and
      # :validatable are enabled on User for this spec. Add them back when a
      # future spec enables the corresponding Devise module.

      t.integer :role, null: false, default: 0

      t.timestamps null: false
    end

    add_index :users, :email, unique: true
  end
end
