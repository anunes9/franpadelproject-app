# Player Performance Profile: Evaluations in the Assessment Class

_Published as GitHub issue #58._

## Problem Statement

Every Module of a Training Plan ends with an Assessment Class, where the Coach is meant to evaluate each Player. Today the Assessment Class is only a marker (`training_classes.kind = assessment`) with a note. Nothing is recorded per Player, so a Coach has no record of where a Player is strong or weak, no view of how a Player progresses from Module to Module, and nothing to hand over when a group or Player moves to another Coach. `docs/Product.md` asks for "graphs per Player and the areas to improve"; the Coach Class Groups spec (#6) left this out of scope.

## Solution

In an Assessment Class, the Coach records an Evaluation for each Player of the group: a 1–5 Rating for each of five fixed Profile Areas (Technique, Tactics, Physical, Mental, Attitude) and for the Strokes the Module works on, with optional comments. Each Player gets a Performance Profile page, built only from their Evaluations, with a radar chart of the latest Area Ratings, their Strokes with a trend, the items to improve, and the history of every Evaluation. Evaluations and Profiles are for Coaches and Club Managers only; Players still have no login.

Vocabulary follows `GLOSSARY.md` (Coach, Club Manager, Player, Class Group, Class, Assessment Class, Module, and the new Profile Area, Stroke, Rating, Evaluation, Performance Profile).

## User Stories

1. As a Coach, I want to evaluate each Player of my group in the Assessment Class, so that I keep a record of how they did in the Module.
2. As a Coach, I want to rate every Player on the same five Profile Areas (Technique, Tactics, Physical, Mental, Attitude), so that Evaluations are comparable from Module to Module.
3. As a Coach, I want to rate the Strokes the Module works on, already listed for me, so that I don't have to pick them each time.
4. As a Coach, I want to add any other Stroke to a Player's Evaluation, so that I can record a Stroke I noticed even if the Module doesn't cover it.
5. As a Coach, I want one 1–5 scale with a label on each step, so that a Rating means the same thing for every Coach.
6. As a Coach, I want to add an optional comment to any Rating and one overall comment per Player, so that I can explain a Rating.
7. As a Coach, I want to leave any Area or Stroke unrated, so that I only rate what I actually saw.
8. As a Coach, I want to evaluate one Player at a time on my phone, so that I can do it at the court.
9. As a Coach, I want to see which Players are not evaluated, partly evaluated or evaluated, so that I know who is left.
10. As a Coach, I want to save a partial Evaluation and come back to it, so that I am never forced to finish in one go.
11. As a Coach, I want to edit an Evaluation later, even after the group has finished, so that I can fix mistakes.
12. As a Coach, I want an absent Player to simply stay unevaluated, so that I don't need to record attendance.
13. As a Coach, I want the Assessment Class marked done when I record the first Evaluation, so that regenerating the plan never deletes my Evaluations.
14. As a Coach, I want each Player to have one Performance Profile across all their groups, Coaches and Levels, so that I can see their whole history.
15. As a Coach, I want the Profile to show a radar chart of the latest Rating per Profile Area, so that I see the Player's shape at a glance.
16. As a Coach, I want the Profile to list Strokes with their latest Rating and a trend against the previous one, so that I see what is improving.
17. As a Coach, I want the Profile to show the items to improve (latest Rating 1 or 2), so that I know what to work on next.
18. As a Coach, I want the Profile's history to show each Evaluation with its Module, date, Coach, Ratings and comments, so that I can see who recorded what.
19. As a Coach taking over a Player, I want to see Evaluations other Coaches recorded, so that I don't start from zero.
20. As a Club Manager, I want to read the Profiles of my Clubs' Players, so that I can follow how Players progress.
21. As an Admin, I want to set which Strokes each Module works on, so that Coaches see the right Strokes in its Assessment Class.
22. As a Coach, I want everything in Portuguese or English, so that I can use my language.

## Implementation Decisions

- **Profile Areas.** A fixed list in code, with PT and EN names: Technique (Técnica), Tactics (Tática), Physical (Físico), Mental (Mental), Attitude (Atitude). Not editable by Admins.
- **Strokes.** A fixed list in code, with stable keys and PT and EN names. Not editable by Admins; adding one is a deploy. The PT names below are a draft to review.

  | Key | EN | PT |
  |---|---|---|
  | `serve` | Serve | Serviço |
  | `return` | Return | Resposta |
  | `forehand` | Forehand | Direita |
  | `backhand` | Backhand | Esquerda |
  | `forehand_volley` | Forehand volley | Volley de direita |
  | `backhand_volley` | Backhand volley | Volley de esquerda |
  | `bandeja` | Bandeja | Bandeja |
  | `vibora` | Víbora | Víbora |
  | `smash` | Smash | Remate |
  | `lob` | Lob | Balão |
  | `chiquita` | Chiquita | Chiquita |
  | `drop_shot` | Drop shot | Amorti |
  | `forehand_back_wall` | Forehand off the back wall | Saída de vidro de direita |
  | `backhand_back_wall` | Backhand off the back wall | Saída de vidro de esquerda |
  | `side_wall` | Off the side wall | Saída de parede lateral |
  | `bajada` | Bajada | Bajada |

- **Rating scale.** An integer 1–5, the same for Areas and Strokes: 1 Beginning (Iniciação), 2 Developing (Em desenvolvimento), 3 Consistent (Consistente), 4 Proficient (Proficiente), 5 Mastered (Domínio). An unrated item has no Rating; it is never stored as 0.
- **Strokes are separate from Technique.** Technique is rated on its own as an overall impression, not calculated from the Strokes.
- **A Module's Strokes.** Each Module in `docs/courses/*.json` gets a `strokes` list of Stroke keys, imported into `course_modules.strokes` (jsonb) by `rails course_modules:import` and editable in ActiveAdmin, like `topics`. Unknown keys are refused. The draft Beginner mapping, for review:
  - Module 1 (Service, Return, 1st Volley): `serve`, `return`, `forehand_volley`, `backhand_volley`
  - Module 2 (Posture, Preparation, Mobility, Stability, Execution): none
  - Module 3 (Forehand, Backhand, Volley): `forehand`, `backhand`, `forehand_volley`, `backhand_volley`
  - Module 4 (Defense, Counter-attack, Attack, …): `lob`, `chiquita`
  - Module 5 (Glass Exit): `forehand_back_wall`, `backhand_back_wall`, `side_wall`
  - Module 6 (Traditional Smash, Viper, Net): `bandeja`, `vibora`, `smash`
  - Module 7 (Glasses, Speedometer): `forehand_back_wall`, `backhand_back_wall`, `side_wall`, `bajada`
  - The Intermediate Modules stay empty until their content exists; Coaches add Strokes by hand.
- **Evaluation.** One per Player per Assessment Class: the Class, the Player, the Coach who recorded it (kept when that Coach is later removed, ADR 0006), an optional overall comment, and its Ratings. Each Rating is either an Area or a Stroke, by key, with a value 1–5 and an optional comment, and is unique per Evaluation and item. A Rating can be removed, which leaves the item unrated.
- **Which Strokes are offered.** The Module's `strokes`, plus any Stroke the Coach adds to that Player's Evaluation. Strokes added for one Player are not added for the others.
- **When an Evaluation can be recorded.** Only in a Class of kind `assessment`, only from the Class's date (Lisbon date, `Academy.today`) onwards, and never in a skipped Class. It can be saved partly done; there is no draft state. It stays editable afterwards, including after the group has finished (ADR 0007).
- **Who is evaluated.** The group's current Players are listed. An Evaluation already recorded stays in the Player's Profile after the Player leaves the group. There is no attendance or "absent" status.
- **Evaluating marks the Class done (ADR 0011).** Saving the first Rating of any Player in an Assessment Class marks that Class done. While the Class has any Evaluation, marking it undone or skipping it is refused. So regeneration (ADR 0005) keeps it, and its Module counts as complete.
- **Who can record.** The Class Group's owning Coach. Club Managers can read but not record.
- **Performance Profile.** Derived from the Player's Evaluations, never stored or edited. One per Player across every group, Coach and Level. At `/dashboard/players/:id`, linked from the Player names on a Class Group's page and from the Club Manager's Players list. It shows:
  - a radar chart of the latest Rating per Profile Area (a small custom SVG; no chart library is added);
  - every Stroke ever rated, with its latest Rating and a trend (up, down, same) against its previous Rating;
  - the items to improve: Areas and Strokes whose latest Rating is 1 or 2, lowest first;
  - the history: each Evaluation with its Module, Class date, Coach, Ratings and comments, newest first.
  - "Latest" means the Rating from the Evaluation with the latest Class date that rated that item.
- **Who can read a Profile.** Any Coach with the Player in one of their Class Groups (finished groups included), and the Club Managers of the Player's Club. Anyone else gets a 404, as elsewhere (`ClubScoped`, `ClassGroup.visible_to`).
- **Screens.** The Assessment Class page gets an "Evaluate Players" section: the group's Players with their status (not evaluated, partly, evaluated), each opening one Player's form with the five Areas, the Module's Strokes, an "Add Stroke" picker, the per-item comments and the overall comment. The scale labels are shown on the rating control. All copy goes in `app/frontend/i18n/translations/{en,pt}.ts`.

## Testing Decisions

- A good test checks external behaviour only: what a Coach or Manager sees, can save or is refused, not how it is stored.
- **Seam 1, request specs (primary).** Recording, editing and clearing Ratings; refusal before the Class date, on a skipped Class, on a regular Class, for a Player outside the group, for an unknown Area or Stroke key, for a value outside 1–5, and for a Club Manager or another Coach; the first Rating marking the Class done; undone and skip refused while Evaluations exist; regeneration keeping an evaluated Assessment Class; Profile access for the group's Coach, another Coach with the Player, a Club Manager, and a 404 for anyone else. Prior art: the existing training class and class group request specs.
- **Seam 2, Performance Profile model spec (new).** Plain inputs and outputs: latest Rating per item across several Evaluations, trend against the previous Rating, items to improve and their order, unrated items left out. Prior art: the existing model specs.
- **Seam 3, course import spec.** `strokes` imported from the JSON, unknown keys refused.
- **Frontend (Vitest).** The radar chart's geometry for given Ratings, including missing Areas.

## Out of Scope

- Any Player-facing screen, sharing or export of the Profile.
- Attendance or an "absent" status.
- Ratings of sub-skills inside a Profile Area other than Strokes.
- Calculating Technique from Strokes, or any overall score.
- Comparing Players, groups or Coaches, and Club-wide dashboards.
- Evaluations outside an Assessment Class.
- Admin-editable Profile Areas or Strokes.
- Certification's Practical Assessment, which stays separate.
- Linking Strokes to Topics or to Exercises.

## Further Notes

- `GLOSSARY.md` gains Profile Area, Stroke, Rating, Evaluation and Performance Profile, and the Assessment Class entry now says what is evaluated.
- ADR 0011 records why evaluating marks the Assessment Class done, and amends ADR 0005.
- The Beginner Stroke mapping and the PT Stroke names above are drafts for Fran's review before content is imported.
