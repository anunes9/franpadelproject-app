# A finished Class Group is derived, kept as history, and continued by a new group

The parent spec (#6, user stories 48 and 49) asks that a finished Class Group is kept as history and that its Coach can start the next Course Level's group by copying its Players. It leaves open when a group counts as finished, what "history" allows, and how the copy meets the rules of normal creation. `GLOSSARY.md` already says a finished Class Group stays as history and the next Course is a new Class Group. We decided:

- **Finished is derived, never stored.** A Class Group is finished when at least one of its Classes is done and every Class is done or skipped. There is no flag to keep in sync: marking a Class undone, or adding a Class, makes the group unfinished again. `ClassGroup#finished?` answers it, and the scopes `ClassGroup.finished` and `ClassGroup.unfinished` filter by the same SQL condition. Lists load `ClassGroup.with_finished`, which reads the answer with the groups instead of asking once per group.
  - A group with no Classes is not finished.
  - A group whose Classes are all skipped is not finished either: nothing was taught, so there is nothing to continue. This is the one case where "every Class that isn't skipped is done" alone would call a group finished.
- **History is not a lock.** A finished group keeps its page, with its plan, done Classes and their picked Exercises, for its Coach and the Club Managers of its Club. It can still be edited like any group. Nothing is deleted or archived.
- **Lists.** The Coach's Class Groups list shows current groups first and finished groups apart, as history. The group's page and the Club overview's group rows show a "Finished" pill.
- **The next Level follows the shared `Level` order**: Beginner, then Intermediate, then Advanced (`Level.next`). Advanced has no next Level, so no copy is offered for it.
- **The copy is the normal create form, pre-filled.** On a finished group's page, its owning Coach gets "Start next level group", which opens `GET /dashboard/class_groups/new?from=<group>` with the next Level and the group's Players still in the Coach's Club already chosen. Nothing else is pre-filled: the Coach chooses the start date and schedule. The new group must be at that next Level, or it is refused (`level: not_next_level`) with the form still pre-filled. Submitting goes through `create_with_plan` like any group, so the clash refusal, the refusal for a Course without Modules (the Intermediate Course today) and every validation apply.
  - Copying from a group that is not finished, has no next Level, or is not visible to the user is a 404, on the form and on submit. Only Coaches create groups, so Club Managers and Admins get a 404 too, and the page offers the copy to the owning Coach only.
- **The new group records the group it continues** in `previous_class_group_id`: nullable, and cleared if that group is ever deleted. It is a link for history only, shown as "Continues from the <Level> group" on the new group's page while the user can still see the earlier group. It changes nothing about the new group's plan.

## Considered options

- **Storing a `finished` flag or a finished date**: rejected. It would have to be kept in step with every Class edit, and a stale flag would hide a group the Coach is still teaching.
- **Locking or archiving a finished group**: rejected. A Coach who marks a Class done by mistake must be able to undo it, and the spec only asks that the history stays viewable.
- **Creating the next group in one click, copying the schedule too**: rejected. The next Course usually starts on a new date and schedule, and a copied schedule would often clash. The Coach chooses them in the normal form.
- **Copying Players who left the Coach's Club**: rejected. A group's Players must be of its Coach's Club, so they would only be refused on submit.
