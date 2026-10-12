# TODO

Terms below are defined in [GLOSSARY.md](./GLOSSARY.md).

## Module Completion and Module states

Module Completion is currently a manual "mark as done" (`CourseModule#complete_for!`) that ignores Exercises.

- [ ] Derive Module Completion from the Module's current content: Quiz Pass (only when the Module has a Quiz) + Exercise Completion of every Exercise currently in the Module. Until Quizzes ship, no Module has one, so Exercises alone decide
- [ ] A Module with neither a Quiz nor Exercises is complete for everyone
- [ ] Adding an Exercise (or later a Quiz) to a Module removes Module Completion from Clients who no longer meet it
- [ ] Derive Locked: a Module is Locked unless it is first in its Course or the previous Module has Module Completion; a Player's Level never locks anything
- [ ] Derive Available / In Progress / Completed for a Client's Module (replaces `locked/current/done`)
- [ ] Derive Course Completion: Module Completion of every Module in a non-Planned Course (including the Coach Module)
- [ ] Show a Course with no Modules (Advanced) as Planned / coming soon
- [ ] Replace the stored `UserModuleProgress` status/progress with derived values (or keep it strictly as a cache) and remove the manual "mark as done"
- [ ] Wire `exercisesDone` in `CourseModule.dashboard_stats_for` to real Exercise Completions

## Undo Exercise Completion

- [ ] Let a Client undo an Exercise Completion
- [ ] Undoing it removes Module Completion (and Course Completion) and re-locks the following Modules, even ones already started

## Quizzes

The current quiz (`DashboardData::QUIZ`) is a hard-coded mock shared by every Module.

- [ ] At most one Quiz per Module, questions and answers in PT and EN, managed by Admins
- [ ] Record Quiz Attempts with their score; Clients may retake as often as they like
- [ ] Quiz Pass at ≥ 80%, never lost by later attempts or by editing the Quiz's questions
- [ ] Count Quiz Attempts towards In Progress, and Quiz Pass towards Module Completion

## Topics as a fixed, bilingual list

Topics are free text on Modules, Portuguese only; Exercises use a separate `category` (Technical/Tactical).

- [ ] Introduce Topics as a curated list with PT and EN names, managed by Admins
- [ ] Modules and Exercises each reference many Topics from that list
- [ ] Migrate existing Module topic strings onto the list (merge near-duplicates, e.g. "Volley" / "1º Volley")
- [ ] Drop Exercise `category`; filter Exercises by Topic instead

## Player vs. Coach

Clients have no way to say whether they are a Player or a Coach.

- [ ] Record whether a Client is a Player or a Coach
- [ ] Let an Admin set it when creating the account, and show it on the profile
- [ ] Club Manager is out of scope for this phase
