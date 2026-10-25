# A skipped Class stays in the plan and frees its time

The parent spec (#6) lets the Coach skip a Class of a Training Plan, but leaves open what a skipped Class is: deleted, or kept and marked. It also leaves open how a skipped Class meets the clash rule, and whether it can be done. We decided:

- **A skipped Class stays in the plan but frees its time.** It keeps its date, start time, Module and picked Exercises, and the plan shows it as skipped. Unskipping brings it back as it was.
- **A skipped Class is never part of a clash, in either direction.** Another Class of the Coach or of a Player may take its time, and the skipped Class never refuses an edit or a new plan.
- **Unskipping is checked against the clash rule; moving a skipped Class is not.** Unskipping takes the time back, so it is refused if that time is now taken. A skipped Class takes up no time, so moving it cannot clash; the check happens when it is unskipped.
- **Done and skipped are mutually exclusive.** Marking a skipped Class done is refused, and so is skipping a done Class. A done Class can still be moved, so the Coach can correct its date.
- **`coach_added` marks the Classes the Coach added.** Whether regenerating the plan keeps them is left to #18.

## Considered options

- **Deleting a skipped Class**: rejected. The Coach loses its Exercises and cannot take the skip back, and the plan no longer shows that the Module lost a Class.
- **Clash-checking a move of a skipped Class**: rejected. It would refuse a move that takes up no time, and unskipping checks it anyway.
- **Letting a Class be both done and skipped**: rejected. A Class either took place or did not.
