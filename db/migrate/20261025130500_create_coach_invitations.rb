# An email invitation from a Club Manager for someone to join a Club as a
# Coach. Only a digest of the emailed token is stored, as Devise does for
# reset-password tokens.
class CreateCoachInvitations < ActiveRecord::Migration[8.1]
  def change
    create_table :coach_invitations, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :invited_by, type: :uuid, null: false, foreign_key: { to_table: :users, on_delete: :cascade }
      t.string :name, null: false
      t.string :email, null: false
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :accepted_at

      t.timestamps
    end
    add_index :coach_invitations, :token_digest, unique: true
  end
end
