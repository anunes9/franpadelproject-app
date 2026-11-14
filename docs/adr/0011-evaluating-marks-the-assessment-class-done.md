# Evaluating Players marks the Assessment Class done

The Player Performance Profile (`docs/specs/PlayerPerformanceProfile.md`) records each Player's Evaluation in the Assessment Class. ADR 0005 says regenerating a plan keeps only done Classes and deletes every other Class. If Evaluations were independent of the done flag, a Coach could evaluate a whole group, forget to mark the Assessment Class done, regenerate, and lose every Evaluation. We decided:

- **Saving the first Rating in an Assessment Class marks it done.** Having evaluated the Players is finishing the Module, so the Class is done, regeneration keeps it (ADR 0005), and its Module counts as complete for regeneration.
- **While an Assessment Class has any Evaluation, marking it undone or skipping it is refused.** A Coach who wants to undo it removes the Evaluations first.
- **Marking an Assessment Class done does not require Evaluations.** A Coach can still finish a Module without evaluating anyone.
- **An Evaluation can only be recorded from the Class's date and never on a skipped Class.** A Class is never both done and skipped, so the two rules agree.

This amends ADR 0005 only in what makes a Class done; its rules on what regeneration keeps are unchanged.

## Considered options

- **Keeping Evaluations independent of done, tied to the Player and Module, surviving the Class's deletion**: rejected. Regeneration would then generate a new Assessment Class for a Module already assessed, and the Evaluation would point at a Class that no longer exists.
- **Regeneration also keeping Assessment Classes that have Evaluations but are not done**: rejected. ADR 0005 keeps only done Classes so that no kept Class has to be fitted around the new plan; this would bring that problem back.
- **Requiring Evaluations before an Assessment Class can be marked done**: rejected. It would block the Coach when a Player is absent or the Coach doesn't want to evaluate.
