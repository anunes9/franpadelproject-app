# TODO

Terms below are defined in [GLOSSARY.md](./GLOSSARY.md).

## Module Completion and Module states

Module Completion is worked out from the Module's current content (ADR 0008); the manual "mark as done" is gone.

- [x] Derive Module Completion from the Module's current content: Quiz Pass (only when the Module has a Quiz) + Exercise Completion of every Exercise currently in the Module
- [x] A Module with neither a Quiz nor Exercises is complete for everyone
- [x] Adding an Exercise or a Quiz to a Module removes Module Completion from Clients who no longer meet it
- [x] Derive Locked: a Module is Locked unless it is first in its Course or the previous Module has Module Completion; a Player's Level never locks anything
- [x] Derive Available / In Progress / Completed for a Client's Module (replaces `locked/current/done`)
- [ ] Derive Course Completion: Module Completion of every Module in a non-Planned Course
- [ ] Show a Course with no Modules (Advanced) as Planned / coming soon
- [x] Replace the stored `UserModuleProgress` status/progress with derived values and remove the manual "mark as done" (the table is dropped)
- [x] Wire `exercisesDone` in `CourseModule.dashboard_stats_for` to real Exercise Completions

## Undo Exercise Completion

- [ ] Let a Client undo an Exercise Completion
- [ ] Undoing it removes Module Completion (and Course Completion) and re-locks the following Modules, even ones already started

## Quizzes

See [docs/specs/Quizzes.md](docs/specs/Quizzes.md).

- [x] At most one Quiz per Module, questions and answers in PT and EN, managed by Admins
- [x] Record Quiz Attempts with their score; Clients may retake as often as they like
- [x] Quiz Pass at ≥ 80%, never lost by later attempts or by editing the Quiz's questions
- [x] Count Quiz Attempts towards In Progress, and Quiz Pass towards Module Completion

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
