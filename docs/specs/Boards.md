# Boards: an interactive padel court to explain Exercises and tactics

_Draft for discussion. Not yet published as a GitHub issue._

## Problem Statement

A Coach explains an Exercise or a tactic by talking, waving at the court, or holding up a phone with the Exercise's court diagram. That diagram is a static PNG, the Exercise's first media image. It can't show movement or order ("first the lob, then both move to the net"), can't be adapted to the group in front of the Coach, and can only be changed by uploading a new image. Coaches have nowhere in the app to keep their own tactics, and nothing on a Class to show the group what that day is about.

## Solution

A **Board** is a top-down padel court the Coach can place players, the ball, cones and arrows on, in one or more **Steps**. Tapping through the Steps animates the pieces from one position to the next. A Board is stored as a structured document, not an image, so it stays editable, scales sharply on any screen, and can be copied and adapted.

Boards live in three places:

- **On an Exercise**: the official Fran Methodology Board, authored by an Admin. When an Exercise has one, it replaces the PNG as its court diagram everywhere the diagram is shown (Exercise page, Exercise cards, Class slots).
- **In a Coach's library**: the Coach's own Boards for tactics that aren't an Exercise. A Coach can start one from scratch or copy an Exercise's Board to adapt it.
- **On a Class**: Boards the Coach attaches to a specific Class to show the group that day.

Any Board can be opened in **Present** mode: full screen, large pieces, Step by Step, built to be held up on a tablet to several players. In Present mode the Coach can also **draw freehand** over the court and move pieces to answer a question on the spot. That ink and those moves are thrown away when they leave the Step, unless they choose "Save as a copy".

Players on a Board are generic tokens (A1, A2, B1, B2, or a short free label), not links to Player records, so a Board stays reusable across Class Groups.

## Proposed vocabulary (to add to `GLOSSARY.md` once agreed)

**Board**:
A top-down padel court with pieces and markings, in one or more Steps, used to explain an Exercise or a tactic. It belongs to an Exercise, to a Coach, or to a Class. PT: "Quadro".
_Avoid_: Whiteboard, tactic board, diagram (kept for the legacy PNG), drawing

**Step**:
One moment of a Board: where every piece stands, plus that moment's arrows, zones and labels, with an optional caption.
_Avoid_: Frame, slide, phase

**Present**:
Showing a Board full screen to a group, Step by Step, with freehand ink that is never saved.
_Avoid_: Play mode, live mode, slideshow

## The court

Drawn as SVG in metres, so the geometry is the real court and scales to any screen:

- 20 m × 10 m playing area, net across the middle.
- Service lines 6.95 m from the net on each side; centre service line from the net to each service line (extending 0.2 m past it).
- Walls drawn on the outline: back glass, side glass for the 4 m at each end (with the 2 m step), mesh in between. Ball paths can bounce off them.
- Two views: **full court** and **half court** (one side, larger). Landscape and portrait orientation, so it fits a phone held either way.

## Pieces and markings

| Kind | Persists across Steps | Notes |
|---|---|---|
| Player | yes, moves between Steps | Team A / Team B colour, label (A1… or free text up to ~6 chars), optional Coach marker |
| Ball | yes, moves between Steps | At most one |
| Cone / target | yes | Static equipment, a target zone circle |
| Movement arrow | per Step | Dashed, player run |
| Ball path | per Step | Solid curve, with optional bounce point and wall bounce; the ball follows it when animating to the next Step |
| Zone | per Step | Shaded rectangle or freeform polygon, e.g. "the gap down the middle" |
| Text | per Step | Short label, both languages on Exercise Boards |

## User Stories

1. As an Admin, I want to build a Board on an Exercise with players, ball, cones, arrows and zones, so that every Exercise has an accurate, editable court diagram.
2. As an Admin, I want to split a Board into Steps with a caption each, in Portuguese and English, so that an Exercise's sequence is shown in order.
3. As a Client, I want an Exercise's Board to replace its PNG diagram wherever the diagram is shown, and the PNG to still show when there is no Board, so that nothing goes blank during the change.
4. As a Client, I want to tap through a Board's Steps and see players and ball glide between positions, so that I understand the movement and not just the positions.
5. As a Coach, I want my own library of Boards, private to me, so that I can keep tactics that aren't Exercises.
6. As a Coach, I want to copy an Exercise's Board into my library and change it, without changing the official one, so that I can adapt a drill to my group.
7. As a Coach, I want to attach Boards to a Class, from my library or new, so that the Class page has what I want to show the group that day.
8. As a Coach, I want to open any Board in Present mode on a tablet or phone, full screen, with big pieces and Step controls, so that a group can read it at arm's length.
9. As a Coach, I want to draw freehand and drag pieces while presenting, without that changing the Board, so that I can answer a question on the spot.
10. As a Coach, I want to save what I improvised in Present mode as a new Board, so that a good idea isn't lost.
11. As a Coach, I want editing to work with touch, mouse and pen, with undo and redo, so that I can build Boards on whatever device I have.
12. As a Coach, I want to switch between full court and half court, so that drills on one side are big enough to read.
13. As a Club Manager, I want to see the Boards on my Clubs' Classes, as I see the rest of a Class, so that oversight covers what is taught. _(Pending: see Open questions.)_

## Implementation Decisions

- **One `boards` table.** `id` (uuid), polymorphic `boardable` (`Exercise`, `TrainingClass`, or `User` for a Coach's library), `author_id`, `title` (and `title_en` on Exercise Boards), `document` (`jsonb`), timestamps. An Exercise has at most one Board. A Class has many, ordered.
- **Copy, never share.** Copying an Exercise Board or attaching a library Board to a Class makes a copy, so editing one never changes another. It avoids a "which Classes use this?" problem. To be recorded in an ADR.
- **Document shape, versioned from the start:**

  ```json
  {
    "version": 1,
    "view": "full",
    "pieces": [
      { "id": "p1", "kind": "player", "team": "a", "label": "A1" },
      { "id": "b",  "kind": "ball" }
    ],
    "steps": [
      {
        "caption": { "pt": "Serviço", "en": "Serve" },
        "positions": { "p1": { "x": 7.5, "y": 19.2 }, "b": { "x": 7.3, "y": 19.0 } },
        "marks": [
          { "id": "m1", "kind": "ballPath", "points": [[7.3, 19.0], [2.5, 4.0]], "bounce": [2.5, 4.0] }
        ]
      }
    ]
  }
  ```

  Coordinates are metres on the court (x 0–10 across, y 0–20 along). Pieces are declared once and positioned per Step, which is what makes animation a simple interpolation. Marks belong to a Step.
- **Validated on the server.** A JSON Schema (with a `version` check) runs in a model validation, so a broken document never reaches the database. Upgrades between versions are pure functions on the document.
- **Frontend: no new canvas library.** A `Court` SVG component draws the court. A `BoardViewer` (read-only, Steps, animation, used in cards and pages) and a `BoardEditor` (selection, drag with Pointer Events, toolbar, undo/redo as a stack of documents) sit on top of it. Present mode is the viewer full screen plus a throwaway ink layer. Animation uses `requestAnimationFrame` interpolation, with the ball following the Step's ball path when there is one.
- **Thumbnails** are the viewer rendering Step 1 statically. No server-side image generation.
- **Routes.** Admin edits Exercise Boards in the admin area; Coaches use `/boards` (library), `/boards/:id/edit`, `/boards/:id/present`, and attach Boards from the Class page. Authorization follows the existing Class and Coach rules.
- **i18n.** All interface strings in PT and EN. Captions and text marks on Exercise Boards in both languages; Coach Boards in one free-text language.

## Phasing

1. **Court and viewer.** The `Court` component, the document schema and its validation, `BoardViewer` with Steps and animation. One Exercise Board seeded by hand to prove it end to end.
2. **Editor on Exercises (Admin).** `BoardEditor`, and Exercise Boards replacing the PNG where present.
3. **Coach library.** Personal Boards, copying an Exercise Board.
4. **Classes and Present.** Boards on a Class, Present mode with freehand ink, and "Save as a copy".

Each phase ships on its own. Phase 1 already makes Exercises better to read.

## Testing Decisions

- Model specs: schema validation (good document, every kind of broken document, unknown version), one Board per Exercise, copy semantics.
- Request specs: who can view, edit, copy and attach (Admin, Coach owner, other Coach, Club Manager).
- The geometry and interpolation logic is pure TypeScript and worth unit tests. The repo has no JS test runner yet, so adding Vitest for it is proposed.
- A Playwright smoke test: open an Exercise Board, step through it, and drag a piece in the editor.

## Out of Scope

- Linking tokens to real Players.
- Real-time collaboration or several people editing one Board.
- Video export or GIFs. PNG/PDF export may come later.
- 3D, side views, or modelling wall heights beyond the outline.
- Converting the existing PNG diagrams into Boards automatically. Admins rebuild them over time; the PNG stays the fallback.

## Open questions

1. **Name.** "Board" / "Quadro", or something closer to how Fran's coaches talk ("Quadro tático", "Pizarra")?
2. **Manager oversight.** Do Club Managers see Coaches' library Boards, or only Boards on Classes (in line with ADR 0006)?
3. **Sharing within a Club.** Should a Coach be able to share a library Board with the other Coaches of their Club, or does that wait?
4. **Exercise Boards for Coaches.** Read-only for Coaches with "copy to adapt" (as proposed), or may Coaches suggest edits to the official Board?
5. **Present mode on the Class page.** Should a running Class (the timeline already shows the current step) open the current Exercise's Board in Present with one tap?
