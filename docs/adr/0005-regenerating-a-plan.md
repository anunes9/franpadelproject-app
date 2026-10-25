# Regenerating a plan keeps only done Classes and continues the Course

The parent spec (#6) says regeneration "happens only on request, keeps completed Classes, and replaces the rest". It leaves open what counts as kept, where the new plan starts, whether it restarts the Course, and how it meets the clash rule. ADR 0003 left the treatment of Coach-added Classes to this decision. We decided:

- **Only done Classes are kept, with their Exercises.** Every other Class is deleted and replaced, together with its picked Exercises: skipped, moved and Coach-added (`coach_added`) Classes included. A done Coach-added Class is kept like any done Class.
- **The new plan starts on the first of the group's weekdays on or after the later of today and the day after the last done Class.** It uses the group's current cadence, weekdays, start time and duration, and the Club's current Break Periods.
- **It continues the Course rather than restarting it.**
  - A Module whose Assessment Class is done is complete and is not regenerated.
  - In the first incomplete Module, every done Class of that Module counts toward its Classes (6 at once a week, 8 at twice a week). Only the remaining Classes are generated, counted in Classes rather than weeks, and the last of them is the Assessment Class. At least the Assessment Class is always generated, even when more Classes than the Module's count are done.
  - When no Class of that Module is done, it is generated exactly as on creation, so ADR 0002's partial first week still counts as a full week.
  - Later Modules start in the next open week and are generated in full. A week the first Module leaves part used is not used by the next Module, so every later Module keeps its full 4 or 6 weeks.
  - When every Module is complete, regeneration is refused (`base: plan_complete`). A Course with no Modules is refused as on creation (`level: no_modules`).
- **Only on request.** A dedicated action (`POST /dashboard/class_groups/:id/regeneration`), behind a confirmation that says which Classes and Exercises are replaced. Nothing else regenerates a plan: not editing the group or its Classes, and not visiting it.
- **Clash-checked like creation.** In one transaction, with the Coach and Players locked, the new Classes are checked against every other Class of the Coach and the Players. Only the Classes being replaced are left out; the group's done Classes still count. On a clash nothing changes and the clashing dates are returned.

## Considered options

- **Keeping skipped, moved or Coach-added Classes**: rejected. The spec keeps only completed Classes, and a kept Class that is not done would have to be fitted around the new plan, which brings back the silent rules regeneration is meant to avoid. The confirmation names them so the Coach is not surprised.
- **Restarting the Course from its first Module**: rejected. It would repeat Modules the group has finished and assessed.
- **Counting the first incomplete Module in weeks, as on creation**: rejected. Done Classes do not fall on whole weeks once Classes are moved, skipped or added, so the remaining part is counted in Classes.
- **Starting the next Module in the week the first one ends**: rejected. That week would count as a full week of the next Module, shortening it.
