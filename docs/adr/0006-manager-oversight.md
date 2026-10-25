# Reassigning a Class Group and removing a Coach

The parent spec (#6) lets a Club Manager reassign a Class Group to another Coach of the same Club and blocks removing a Coach while they own groups (user stories 12 and 13). It leaves open who exactly can reassign, whether a reassignment is clash-checked, what removing a Coach does to their account, and where the removal rule lives. We decided:

- **Only a Club Manager of the group's Club reassigns it**, through `ClassGroup.visible_to`. The group's own Coach, other Coaches, Managers of other Clubs and Admins get a 404, like every other screen they cannot use.
- **The new owner must be a Coach of the group's Club.** Anyone else is refused with a code on `coach`: `blank` for a user that does not exist, `not_a_coach` for a Club Manager or an Admin, `other_club` for a Coach of another Club. A group's Club is its Coach's Club, so the group and its Players never change Club.
- **The Training Plan is kept as it is.** Its Classes keep their dates, times, Modules, Exercises and done or skipped marks. Nothing is regenerated.
- **Reassigning is clash-checked for the new Coach**, as every change to who teaches a Class is. The group's upcoming Classes (dated today or later in Lisbon, `Academy.today`, neither done nor skipped, as in ADR 0004) must not overlap another Class of the new Coach. A clash refuses the reassignment with the clashing dates and changes nothing. Past and done Classes are history and never refuse it. The Players do not change, so they are not checked again.
- **A reassignment is all or nothing.** The check and the change run in one transaction holding `ClassClash.lock` on the new Coach and the group's Players.
- **Removing a Coach deletes their account.** A Coach belongs to exactly one Club and has no other place to live, so there is no "unlinking". Their course progress and Exercise Completions go with them. Their Club, its Players and its Coach Invitations stay (invitations belong to the Club and the inviting Club Manager, never to the invited Coach).
- **A Coach who owns any Class Group cannot be removed**, finished groups included. The Manager reassigns the groups first. The Club overview says so next to the Coach.
- **The rule lives on the model.** `User` refuses its own destroy while it owns Class Groups (`base: has_class_groups`), so the admin Users screen, the console and any future screen are held to it too, not only the Manager's screen. The database's foreign key from `class_groups.coach_id` remains as a backstop.
- **Only a Club Manager of the Coach's Club removes a Coach** from the dashboard. A Coach of another Club, a Club Manager, an Admin, or the Manager themselves is a 404 there. Admins can still delete any user in the admin screens, under the same model rule.

## Considered options

- **Deleting a removed Coach's groups, or leaving them ownerless**: rejected by #6. Groups survive staff changes.
- **Reassigning the groups automatically on removal**: rejected. The Manager picks each new owner, and each pick is clash-checked.
- **Keeping the Coach's account but unlinking them from the Club**: rejected. A Coach must belong to exactly one Club, so an unlinked Coach is invalid and has nothing to use.
- **`dependent: :restrict_with_error`**: equivalent, but its error code (`restrict_dependent_destroy.has_many`) is Rails' rather than ours, so the screens could not tell this refusal from any other. We keep the same behaviour with our own code.
- **Reassignment without a clash check**: rejected. It would double-book the new Coach, breaking the clash rule of #6.
