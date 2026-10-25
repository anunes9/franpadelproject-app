# The finished Class Group a group continues at the next Level, when it was
# started from one; see docs/adr/0007-finished-class-groups.md. Only a link
# for history: deleting the earlier group just clears it.
class AddPreviousClassGroupToClassGroups < ActiveRecord::Migration[8.1]
  def change
    add_reference :class_groups, :previous_class_group, type: :uuid, null: true,
                                                        foreign_key: { to_table: :class_groups, on_delete: :nullify }
  end
end
