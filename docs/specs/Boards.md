# Boards: an interactive padel court to explain Exercises and tactics

_Draft for discussion. Not yet published as a GitHub issue._

## Problem Statement

A Coach explains an Exercise or a tactic by talking, waving at the court, or holding up a phone with the Exercise's court diagram. That diagram is a static PNG, the Exercise's first media image. It can't show movement or order ("first the lob, then both move to the net"), can't be adapted to the group in front of the Coach, and can only be changed by uploading a new image.

## Solution

A **Board** (PT "Quadro") is a top-down padel court on which the Coach places players, the ball, cones and arrows, and draws freehand, in one or more **Steps**. Tapping through the Steps animates the pieces from one position to the next.

**A Board is scratch by default.** Opening one gives the Coach a court to explain on: nothing is sent to the server, and closing it throws it away. Only if the Coach presses **Save** does it become a saved Board in their library. Most Boards are never saved.

A Coach opens a Board from:

- **The Boards page**: a blank court, or one of their saved Boards.
- **An Exercise**: when the Exercise has an official Board, "Explain on a Board" opens a scratch copy of it. The Coach can move, draw and add to it freely; the official Board never changes. Saving keeps the adapted copy in their library ("copy to adapt").
- **A running Class**: one tap opens the current Exercise's Board, from the step of the Class Structure the timeline is at.

Every Board opens full screen, readable at arm's length, built to be held up on a tablet to several players. Editing and explaining are the same screen; there is no separate present mode.

**Saved Boards are private to the Coach who saved them.** No other Coach, no Club Manager and no Admin sees them. Admins author the official Board on each Exercise, which every Client can open.

Players on a Board are generic tokens (a player "A", the Coach "P", or another short label), not links to Player records, so a Board stays reusable across Class Groups.

Vocabulary follows `GLOSSARY.md` (Board, Step). Decisions are recorded in ADR 0010 (Boards are scratch until saved, and private).

## The court

The look comes from the academy's own Exercise diagrams. The reference is `docs/specs/boards/court-reference.svg` (an Inkscape file), rendered in `court-reference.png`. The Board does not embed that file: it redraws the same court as a clean React SVG in metres, so the geometry is the real court, scales to any screen, and pieces can be placed in metres. A rebuild in metres was checked against the reference and matches it.

- **Orientation:** landscape, the long axis left to right, the net as a vertical line in the middle. Coordinates are metres, `x` 0–20 along the court (net at 10) and `y` 0–10 across it.
- **Surface and lines:** teal `#6bb8a4` court, white lines (~0.11 m), and a navy `#132d46` outline (~0.2 m). These are the brand colours already in `public/fran-padel-project-logo.svg`.
- **Lines drawn:** service lines 3 m from each back wall (7 m from the net), a centre line between the two service lines, and the net as a white line with a faint dark shadow.
- **Fran Methodology sectors:** this is the academy's own grid, and it is drawn by default.
  - Navy ticks every 2 m outside the outline.
  - Depth zones along the court, labelled at top and bottom: **0** (2–4 m from the back wall, around the service line), **1** (4–6 m), **2** (6–8 m) and **3** (8–12 m, the 4 m around the net), mirrored on the other side. The 2 m nearest each back wall is unlabelled.
  - Lanes across the court, labelled on both sides: **1, 2, J, 2, 1**, each 2 m wide.
  - These labels are how the method describes a position ("zone 1, lane 2"), so the Board keeps them, and a Coach can hide them.
- **Watermark:** the Fran Padel Project logo at 7% opacity at each end, in the strip behind the service line, rotated to read along the court.
- **Walls:** the outline stands for the walls. Ball paths can bounce off them. Glass and mesh aren't drawn, as in the reference.
- **Views:** **full court** and **half court** (one side, larger). On a phone held upright, the court rotates 90° rather than squeezing.

## Pieces and markings

The player tokens, ball path, landing zone and text label follow the reference drawing. Sizes are in metres.

| Kind | Persists across Steps | Look | Notes |
|---|---|---|---|
| Player | yes, moves between Steps | Navy `#132d46` circle, radius ≈ 0.55 m, thin black edge, a white letter | The reference labels it "A" (layer "Player A"). Label is one or two characters. |
| Coach | yes, moves between Steps | Light grey `#cbd1d0` circle, same size, a navy letter | The reference's "Professor", labelled "P". |
| Ball | yes, moves between Steps | _None in the reference._ Proposed: small yellow-green circle, radius ≈ 0.15 m, navy edge | At most one. |
| Cone / target | yes | _None in the reference._ Proposed: small navy triangle | Static equipment. |
| Ball path | per Step | Navy dashed line, dash 1 : gap 2, round caps | Straight or curved, with an optional bounce point and wall bounce. The ball follows it when animating to the next Step. |
| Movement arrow | per Step | Navy solid line with an arrowhead | A player's run. A solid line keeps it distinct from the dashed ball path. |
| Landing zone | per Step | Rectangle with navy diagonal hatching and a thin navy edge | Where the ball should land, e.g. a serve target. |
| Text | per Step | Navy bold text, rotatable, with an optional short marker line | The reference's "serve" label sits beside a line marking where the shot starts. Exercise Boards have both languages. |
| Ink | per Step | Freehand stroke | For quick explaining. One tap clears a Step's ink. |

## User Stories

1. As a Coach, I want to open a blank Board in one tap, full screen, so that I can start explaining straight away.
2. As a Coach, I want to place and drag players, ball and cones, draw arrows, ball paths, zones and freehand ink, with touch, mouse or pen, so that I can show any situation.
3. As a Coach, I want to add Steps and tap through them, with players and ball gliding between positions, so that the group sees the movement and not just the positions.
4. As a Coach, I want undo, redo and "clear ink", so that I can fix a mistake mid-explanation.
5. As a Coach, I want to switch between full court and half court, so that drills on one side are big enough to read.
6. As a Coach, I want closing a Board I haven't saved to simply throw it away, so that explaining never leaves clutter behind.
7. As a Coach, I want a scratch Board to survive an accidental reload on the same device, so that I don't lose it mid-explanation.
8. As a Coach, I want to save a Board with a title into my own library, and later open, update, rename or delete it, so that I keep the tactics I reuse.
9. As a Coach, I want my saved Boards visible to me alone, so that my library is my own.
10. As an Admin, I want to build the official Board of an Exercise with the same tool, with captions and text in Portuguese and English, so that every Exercise can have an accurate, animated court diagram.
11. As a Client, I want an Exercise's Board to replace its PNG diagram wherever the diagram is shown, and the PNG to still show when there is no Board, so that nothing goes blank during the change.
12. As a Coach, I want "Explain on a Board" on an Exercise to open a scratch copy of its Board, so that I can adapt it to my group without changing the official one.
13. As a Coach, I want to save that adapted copy into my library, so that I keep my version of the drill.
14. As a Coach, I want one tap on a running Class to open the current Exercise's Board, so that I can explain it on court without searching.

## Implementation Decisions

- **Scratch Boards live in the browser only.** The whole Board is React state. The current scratch Board is also kept in `localStorage` as a convenience (story 7); it is cleared on close, and its absence is never an error.
- **One `boards` table for what is saved.** `id` (uuid), polymorphic `boardable` (`User` for a Coach's library, `Exercise` for the official Board), `title` (and `title_en` on Exercise Boards), `document` (`jsonb`), timestamps. An Exercise has at most one Board. Boards are not attached to Classes: a running Class opens the current Exercise's Board.
- **Private by ownership.** A Coach's Boards are found only through `current_user.boards`; anyone else gets a 404, as on every other screen they cannot use. Club Managers and Admins have no screen for them. Exercise Boards are readable by every Client and editable only by Admins.
- **Copy, never share.** Opening an Exercise Board for a Coach copies its document into a scratch Board; saving creates a new Board in the Coach's library. Nothing links back, so editing one never changes another.
- **Document shape, versioned from the start:**

  ```json
  {
    "version": 1,
    "view": "full",
    "sectors": true,
    "pieces": [
      { "id": "a",  "kind": "player", "label": "A" },
      { "id": "pr", "kind": "coach",  "label": "P" },
      { "id": "b",  "kind": "ball" }
    ],
    "steps": [
      {
        "caption": { "pt": "Serviço", "en": "Serve" },
        "positions": { "a": { "x": 1.5, "y": 6.4 }, "pr": { "x": 1.5, "y": 3.4 }, "b": { "x": 2.5, "y": 6.6 } },
        "marks": [
          { "id": "m1", "kind": "ballPath", "points": [[2.5, 6.6], [16.0, 1.9]] },
          { "id": "m2", "kind": "landingZone", "x": 15.6, "y": 1.6, "w": 1.35, "h": 1.65 },
          { "id": "m3", "kind": "text", "text": { "pt": "serviço", "en": "serve" }, "x": 2.9, "y": 6.6, "rotate": 90, "marker": true }
        ]
      }
    ]
  }
  ```

  The example is the reference diagram's own serve drill. Coordinates are metres on the court (`x` 0–20 along, net at 10; `y` 0–10 across). Pieces are declared once and positioned per Step, which makes animation a simple interpolation. Marks belong to a Step. A Coach Board's captions use whichever language the Coach typed in.
- **Validated on save.** A JSON Schema (with a `version` check) runs in a model validation, with a size limit to keep ink sane, so a broken document never reaches the database. Upgrades between versions are pure functions on the document.
- **Frontend: no new canvas library.** A `Court` SVG component draws the court in the reference style (see "The court"), with the logo watermark reused from `public/fran-padel-project-logo.svg`. A `BoardViewer` (read-only, Steps and animation, used for Exercise diagrams and thumbnails) and a `Board` screen (selection, drag with Pointer Events, toolbar, ink, undo/redo as a stack of documents) sit on top of it. Animation uses `requestAnimationFrame` interpolation, with the ball following the Step's ball path when there is one.
- **Thumbnails** are the viewer rendering Step 1 statically. No server-side image generation.
- **Routes.** `/boards` (library and "New Board"), `/boards/new` (scratch), `/boards/:id` (a saved Board), `/exercises/:id/board` (scratch copy of the Exercise's Board). Admins edit Exercise Boards from the admin area with the same `Board` screen.
- **i18n.** All interface strings in PT and EN; "Quadro" in PT copy. Captions and text marks on Exercise Boards in both languages.

## Phasing

1. **Scratch Board.** `Court`, pieces, marks, ink, Steps and animation, undo/redo, full and half court. Nothing saved. This alone gives Coaches the explaining tool.
2. **Save to library.** The `boards` table, schema validation, the Boards page, opening, updating, renaming and deleting saved Boards.
3. **Exercise Boards.** Admin authoring, `BoardViewer` replacing the PNG where a Board exists, "Explain on a Board" and saving a copy.
4. **From a running Class.** One tap from the Class timeline to the current Exercise's Board.

Each phase ships on its own.

## Testing Decisions

- Model specs: schema validation (good document, every kind of broken document, unknown version, too large), one Board per Exercise, a copy never touching its source.
- Request specs: a Coach sees, updates and deletes only their own Boards (another Coach, a Club Manager and an Admin get a 404); only Admins edit Exercise Boards.
- The geometry and interpolation logic is pure TypeScript and worth unit tests. The repo has no JS test runner yet, so adding Vitest for it is proposed.
- A Playwright smoke test: open a blank Board, place a player, add a Step, play it, reload and see it kept, close and see it gone.

## Out of Scope

- Sharing Boards with other Coaches, or Managers seeing them.
- Attaching Boards to a Class or a Class Group.
- Linking tokens to real Players.
- Real-time collaboration or several people editing one Board.
- Video export or GIFs. PNG/PDF export may come later.
- 3D, side views, or modelling wall heights beyond the outline.
- Converting the existing PNG diagrams into Boards automatically. Admins rebuild them over time; the PNG stays the fallback.
