# Module Completion is worked out from content, without keeping "mark as done"

Until Quizzes, Module Completion was a manual button: `CourseModule#complete_for!` wrote a `done` row in `user_module_progresses` and moved the next Module to `current`. `GLOSSARY.md` already defines Module Completion as a Quiz Pass (when the Module has a Quiz) plus Exercise Completion of every Exercise currently in the Module, always reflecting the Module's current content. With Quizzes stored (see `docs/specs/Quizzes.md`), we can finally do that. We decided:

- **Module Completion is worked out every time, never stored.** `CourseModule.states_by_user` decides Completed as (no Quiz, or a Quiz Pass) and every current Exercise has an Exercise Completion. Adding a Quiz or an Exercise can take Module Completion away, as the glossary says.
- **"Has a Quiz" means a Quiz with at least one question.** An empty Quiz never blocks anyone.
- **A Quiz Pass is worked out from Quiz Attempts, never stored.** It is "an attempt scored at 80% or more exists". The score is frozen on the attempt when it is submitted, so editing or removing questions never takes a pass away.
- **In Progress counts Quiz Attempts too**, and a Module's progress counts its Quiz as one step: (Exercises done + 1 if Quiz Pass) ÷ (Exercises + 1 if it has a Quiz).
- **The manual "mark as done" is removed**: `complete_for!`, `PATCH /dashboard/courses/:id/complete` and its button. `user_module_progresses` no longer decides completion.
- **Existing "done" rows are not kept as passes.** A Client who marked a Module done without passing its Quiz loses Module Completion on it, and the next Module can lock again until they pass. No Client has progress that needs protecting yet, and keeping the rows would make one Client's completion mean something different from another's.

## Considered options

- **Writing a synthetic passing Quiz Attempt for every existing "done" row**: rejected for now. It would fake a score nobody earned. We can do it as a one-off migration if real Clients have progress before this ships.
- **Storing Module Completion and updating it when Exercises, Quizzes or attempts change**: rejected. Every content edit would have to rewrite completions for every Client, and the glossary wants completion to follow current content anyway.
- **Storing a Quiz Pass flag**: rejected. It is the same fact as "an attempt with score ≥ 80 exists", and two sources of truth can disagree.
