# Boards are scratch until saved, and private to their Coach

A Board (PT "Quadro") is an interactive padel court a Coach uses to explain an Exercise or a tactic (spec: `docs/specs/Boards.md`). The first draft stored every Board, let Managers oversee them and attached them to Classes. The product owner said Boards "don't need to be persisted, only if the coach saves the board. It can be just an interactive board to explain the exercise and discard it later." We decided:

- **A Board is scratch by default.** It lives in the browser only, and closing it throws it away. The current scratch Board is also kept in `localStorage` so that a reload doesn't lose it mid-explanation; that copy is a convenience, never relied on.
- **Only Save persists a Board**, into the Coach's own library.
- **A saved Board is visible only to the Coach who saved it.** Other Coaches, Club Managers and Admins get a 404. This is a deliberate exception to Manager oversight (ADR 0006 and the Class Group screens): a Board is the Coach's personal teaching material, like their notes, not part of a Class Group's record.
- **An Exercise has at most one official Board, authored by Admins and readable by every Client.** A Coach never edits it. "Explain on a Board" opens a scratch copy, and saving that copy creates a new Board in the Coach's library with no link back ("copy to adapt").
- **Boards are not attached to Classes.** A running Class opens the current Exercise's Board in one tap instead.

## Considered options

- **Storing every Board, autosaved**: rejected. Most Boards exist for one explanation, and the library would fill with clutter the Coach must clean up.
- **Club Managers seeing Coaches' Boards**: rejected by the product owner. Boards are for the Coach who created them.
- **Coaches suggesting edits to an Exercise's official Board**: rejected. Copy to adapt keeps the official Fran Methodology diagram under Admin control.
- **Boards attached to a Class**: dropped. Opening the current Exercise's Board from the running Class covers the need without another ownership rule.
