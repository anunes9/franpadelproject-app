# Editing a Class Group never moves its Classes

The parent spec (#6) lets the Coach add or remove Players and change a Class Group's cadence or schedule "without the plan changing by itself", and says every such change is checked for clashes. It leaves open what "the schedule" means for Classes already in the plan, which changes can clash, and which of the group's settings can be edited at all. We decided:

- **An edit never changes a Class's date, start time or Module.** New weekdays, a new start time or a new cadence are stored on the group and only take effect when the Coach regenerates the plan (#18), which is clash-checked then. Until then they cannot clash, so they are never refused for a clash.
- **Duration is the exception.** A Class has no duration of its own: it lasts as long as its group's Classes (see `TrainingClass`). A new duration therefore changes every Class's interval straight away, so it is checked against the clash rule for the group's Classes that are not skipped, with the new duration, and refused with the clashing dates. Those Classes are also checked against each other, since a Class the Coach added on the same day as another may now overlap it. A new duration is also refused when it would make any Class of the plan, a moved one included, end after midnight.
- **Each added Player is checked against the group's Classes that are not skipped.** Removing a Player is never refused, but the group keeps one to eight Players.
- **The weekdays must still match the cadence, and the new start time plus the duration must end by midnight**, as when creating a group.
- **The Level and start date are not editable.** A new Level would mean a different Course, whose Modules the existing Classes are not for, and a new start date only matters to a regenerated plan. Changing either is left out; a Coach who needs it creates a new group.
- **An edit is all or nothing.** The change and its clash check run in one transaction holding `ClassClash.lock` on the Coach and on every Player, old and new. A refused edit changes nothing.
- **The owning Coach and the Club Managers of the group's Club can edit**, through `ClassGroup.visible_to`, like the plan. Anyone else gets a 404.

## Considered options

- **Moving the existing Classes to the new weekdays or start time**: rejected. It would change the plan by itself, against #6, and could silently undo the Coach's moves. Regeneration does this on request.
- **Clash-checking a new start time or weekdays against the existing plan**: rejected. The existing Classes keep their times, so the check would refuse edits that double-book no one.
- **A duration per Class, so that a new duration only applies to regenerated Classes**: rejected. It contradicts #6 (a Class inherits its group's duration) and makes the same group's Classes last different times.
