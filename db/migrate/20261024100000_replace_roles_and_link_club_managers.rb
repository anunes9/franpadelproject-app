# Roles become admin (0), club_manager (1) and coach (2). The old client role
# (2) is the Player-with-login role, which no longer exists. The app is
# pre-launch, so its users, their progress and the Weekly Plan are dropped.
class ReplaceRolesAndLinkClubManagers < ActiveRecord::Migration[8.1]
  def up
    drop_table :plan_entries

    execute "DELETE FROM exercise_completions WHERE user_id IN (SELECT id FROM users WHERE role = 2)"
    execute "DELETE FROM user_module_progresses WHERE user_id IN (SELECT id FROM users WHERE role = 2)"
    execute "DELETE FROM users WHERE role = 2"

    create_table :club_memberships, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :club, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end
    add_index :club_memberships, [:user_id, :club_id], unique: true
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
