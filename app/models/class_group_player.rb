# A Player in a Class Group. A Player may be in several groups, including
# other Coaches' groups.
class ClassGroupPlayer < ApplicationRecord
  belongs_to :class_group
  belongs_to :player
end
