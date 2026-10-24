# Coach-first model: Class Groups and generated Training Plans

_Published as GitHub issue #6._


## Problem Statement

The app today is a self-learning platform: a Player with a login works through Courses and keeps a personal Weekly Plan. That is not how padel clubs work. A Club has Coaches who teach groups of Players on a fixed weekly schedule, and a Coach has to plan a whole season of Classes by hand from the Modules and Exercises. Club Managers have no way to manage their Coaches, groups and Players, and nobody can see what is planned for a given day.

## Solution

Make the app Coach-first. A Club Manager manages one or more Clubs and invites Coaches into them. A Coach creates Class Groups of up to eight Players, describing the group (Level, start date, once or twice a week, weekdays, start time, 1h or 1h30). From that description the app generates the group's Training Plan for the whole Course: a dated list of Classes, one Module at a time in Course order, with an Assessment Class in the last week of each Module and no Classes during the Club's Break Periods. The Coach can edit the plan afterwards. Players are records with no login. A Coach and a Player can never be in two Classes that overlap in time.

Vocabulary follows `GLOSSARY.md` (Client, Club Manager, Coach, Player, Club, Class Group, Training Plan, Class, Assessment Class, Break Period).

## User Stories

1. As an Admin, I want to create Clubs, so that Managers have something to manage.
2. As an Admin, I want to create Club Managers and link each to one or more Clubs, so that a Manager can run several Clubs.
3. As an Admin, I want a Manager to be unable to create Clubs, so that Club creation stays controlled.
4. As a Club Manager, I want to see only the Clubs I am linked to, so that I never see another Club's data.
5. As a Club Manager, I want to switch between my Clubs, so that I can manage each one.
6. As a Club Manager, I want to invite a Coach to a Club by email, so that they can join without me setting a password.
7. As an invited Coach, I want to accept the invitation and set my own password, so that I can log in.
8. As a Club Manager, I want each Coach to belong to exactly one Club, so that groups and Players stay within one Club.
9. As a Club Manager, I want to see a Club overview (Coaches, Class Groups, Players), so that I know what is going on.
10. As a Club Manager, I want to see each Coach's Course progress, so that I can follow their learning.
11. As a Club Manager, I want to see and edit every Class Group and Player in my Clubs, so that I can fix mistakes for a Coach.
12. As a Club Manager, I want to reassign a Class Group to another Coach in the same Club, so that groups survive staff changes.
13. As a Club Manager, I want removing a Coach to be blocked until their Class Groups are reassigned, so that no group is left without an owner or deleted.
14. As a Club Manager, I want to define my Club's Break Periods (Christmas, Easter, August), so that no Classes are generated in them.
15. As a Club Manager or Coach, I want to create a Player with name, position (left, right or both), dominant hand and Level, so that I can add them to groups.
16. As a Coach, I want to reuse a Player of my Club in several Class Groups, including groups of other Coaches, so that I don't retype them.
17. As a Club Manager, I want Players to belong to a Club, so that the roster is shared by its Coaches.
18. As a Coach, I want Players to have no login, so that I don't have to manage accounts for them.
19. As a Coach, I want to create a Class Group with a Level, start date, cadence (once or twice a week), weekdays, start time and duration (1h or 1h30), so that the app can plan for it.
20. As a Coach, I want to choose the group's Level myself, so that it is not computed from its Players.
21. As a Coach, I want a Class Group limited to eight Players, so that groups stay a workable size.
22. As a Coach, I want the group's Level to select its Course, so that the plan uses the right Modules.
23. As a Coach, I want group creation to be refused while the Course has no teaching Modules, so that the app never invents content.
24. As a Coach, I want the Training Plan generated for the whole Course on creation, so that I see the full year at once.
25. As a Coach, I want a Module to take 6 weeks at once a week and 4 weeks at twice a week, so that the plan follows the academy's methodology.
26. As a Coach, I want the last week of each Module to be an Assessment Class, so that I know when to assess.
27. As a Coach, I want Modules used in Course order and the Coach Module excluded, so that the plan is the teaching sequence.
28. As a Coach, I want no Classes generated in my Club's Break Periods, so that the plan fits the calendar.
29. As a Coach, I want the first Class on the first chosen weekday on or after the start date, so that the plan starts when I expect.
30. As a Coach, I want the plan to end after the last Module's assessment with no fixed season end, so that it fits any start date.
31. As a Coach, I want each Class to show date, start time, Module and the note for an Assessment Class, so that I know what is planned that day.
32. As a Coach, I want to pick the Exercises of each Class from its Module, so that I decide what is taught.
33. As a Coach, I want to move or skip a Class, so that I can handle holidays and cancellations.
34. As a Coach, I want to add a Class of my own, for example in spare weeks, so that I can use the time freely.
35. As a Coach, I want to mark a Class as done, so that I can see how far the plan has progressed.
36. As a Coach, I want to regenerate the plan only when I ask, so that my edits are never overwritten silently.
37. As a Coach, I want regeneration to keep completed Classes, so that history is preserved.
38. As a Coach, I want to add or remove Players and change the cadence without the plan changing by itself, so that nothing happens silently.
39. As a Coach, I want to be refused when a group would put me in two Classes that overlap in time, so that I am never double-booked.
40. As a Coach, I want to be refused when a Player would be in two Classes that overlap in time, so that a Player is never double-booked.
41. As a Coach, I want a refused plan to list the clashing dates, so that I know how to fix the group.
42. As a Coach, I want moving a Class, adding a Player or changing the schedule to be checked for clashes too, so that the rule always holds.
43. As a Coach, I want a 1h Class at 18:00 to clash with a 1h30 Class at 18:30, so that overlaps are detected by time and not by identical start.
44. As a Coach, I want to see only my own Class Groups, so that my groups are private from other Coaches.
45. As a Coach, I want a home screen with today's Classes and my Class Groups, so that I start from what I need.
46. As a Coach, I want to keep browsing Courses, Modules and Exercises as a library, so that I can prepare Classes and learn.
47. As a Coach, I want to keep my own Course progress, Quizzes and Certification, so that I can learn through the Courses.
48. As a Coach, I want a finished Class Group kept as history, so that I can review it.
49. As a Coach, I want to create the next group at the next Course level by copying a finished group's Players, so that I don't re-enter them.
50. As a Coach, I want to use the app in Portuguese or English, so that I can use my language.

## Implementation Decisions

- **Roles.** Replace today's `admin` / `client` roles with `admin`, `club_manager` and `coach`. The Player-with-login role is removed. Client now means a Club Manager or a Coach.
- **Club membership.** A Coach belongs to exactly one Club. A Club Manager is linked to one or more Clubs through a join between Managers and Clubs. Admins create Clubs, Managers and links. Managers cannot create Clubs.
- **Coach invitation.** A Manager invites a Coach by email. The Coach accepts through a link and sets a password. Authentication stays on the existing email-and-password sign-in.
- **Player.** A new record owned by a Club, not a User, with name, position (left, right or both), dominant hand (left or right) and Level (beginner, intermediate, advanced). It has no credentials. Its Level is informational only.
- **Class Group.** Owned by one Coach, with its Club taken from that Coach. Holds Level (chosen by the Coach), start date, cadence (1 or 2 per week), chosen weekdays (one per weekly Class), a start time and a duration (60 or 90 minutes). It has one to eight Players, who can also be in other groups. A group is tied to one Course through its Level. It is never deleted when its Coach is removed; ownership is reassigned first.
- **Break Period.** A set of date ranges per Club, defined by its Managers. Plans skip these dates.
- **Class.** One dated entry of a Training Plan with a date, start time, duration, Module, optional Exercises chosen by the Coach, a type (regular or assessment), and a done flag. A Class has no per-Class duration; it inherits the group's.
- **Training Plan generator.** A rule-based generator, with no AI. Inputs: the Course's teaching Modules in order (the Coach Module excluded), the group's cadence, weekdays, time and start date, and the Club's Break Periods. Output: the dated Classes for the whole Course.
  - Once a week: 6 weeks per Module, the 6th being an Assessment Class. Twice a week: 4 weeks per Module, the 4th being the assessment week.
  - The Module's own `duration` text is ignored.
  - The first Class is on the first chosen weekday on or after the start date. Weeks that fall in a Break Period get no Classes and are not counted toward the Module's weeks.
  - The plan ends after the last Module's Assessment Class. There is no season end date.
  - The generator does not assign Exercises. The Coach picks them.
  - It refuses a Course that has no teaching Modules, like a Planned Course.
- **Clash rule.** A Coach cannot have two Classes that overlap in time, and neither can a Player, comparing the full time interval (start plus duration). It is checked on creating a group, adding a Player, changing the schedule, moving or adding a Class, and regenerating. Generating a group is all-or-nothing: if any generated Class clashes, nothing is created and the clashing dates are returned.
- **Plan editing.** The Coach can move, skip, add and mark Classes done, and pick their Exercises. Regeneration happens only on request, keeps completed Classes, and replaces the rest.
- **Visibility.** A Class Group and its plan are visible and editable only to its owning Coach and to the Managers of its Club. Other Coaches cannot see it.
- **Manager powers.** Managers manage the Coaches, Class Groups and Players of their linked Clubs, including reassigning a group to another Coach in the same Club. Removing a Coach is blocked while they own groups.
- **Screens.** The Coach home shows today's Classes and their Class Groups. The Manager home is a Club overview with a Club switcher. The Courses, Modules and Exercises library is shared by both roles. The Coach keeps their own progress, Quizzes and Certification.
- **Removed.** The Player's per-user Weekly Plan is removed along with the Player-with-login role. The app is pre-launch, so existing Player data is dropped, not migrated.
- **Content dependency.** The Intermediate Course currently has no teaching Modules, and the Beginner Module 7 has no Exercises. Generation for the Intermediate Course stays unavailable until its Modules exist. Exercises have no duration in the content source, so nothing depends on Exercise duration.

## Testing Decisions

- A good test checks external behavior only: what a user sees or is refused, and the resulting plan, not how it is built.
- **Seam 1, request specs (primary).** Covers invitations and role-based access, Class Group creation and the plan it returns, clash refusal on creation and on every later edit, plan editing and regeneration that keeps completed Classes, Break Periods, Club roster and Player management, Manager multi-Club access and reassignment, and Coach removal being blocked. Prior art: the existing request specs for the plan, the admin Clubs and Users screens, and the dashboard.
- **Seam 2, Training Plan generator spec (new).** A model-level spec with plain inputs and outputs, with no HTTP. It covers 4 and 6 weeks per Module, the Assessment Class in the last week, Module order with the Coach Module excluded, skipping Break Periods, the first-Class date rule, a plan ending after the last Module, and refusal for a Course without teaching Modules. Prior art: the existing model specs. Request specs only check that the generator is wired up.
- No other seams. Assessment evaluation and Exercise suggestion are out of scope.

## Out of Scope

- The per-Player qualitative Assessment evaluation, with graphs and areas to improve. It is a separate feature to scope.
- Suggesting or auto-picking Exercises for a Class.
- Players having logins, or any Player-facing screen.
- Certification's Practical Assessment and Final Exam, which stay undecided.
- Season end dates, public holiday calendars and court booking.
- Content for the Intermediate Course and Beginner Module 7's Exercises.
- Migrating existing Player data.

## Further Notes

- The 44-week figure (52 weeks minus 2 Christmas, 4 August and 2 Easter weeks) is only a sanity check showing that 7 Modules fit: 42 weeks at once a week, 28 at twice a week. It is not a limit, and spare weeks are simply left unscheduled for the Coach to use.
- `GLOSSARY.md` already reflects this vocabulary.
