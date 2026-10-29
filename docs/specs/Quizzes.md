# Quizzes: one per Module, counted towards Module Completion

_Published as GitHub issue #41._

## Problem Statement

Every Module page links to a Quiz, but it is a hard-coded mock (`DashboardData::QUIZ`): four English questions shared by every Module, scored in the browser and never saved. The real questions exist only as Word documents written by the academy, one Portuguese and one English file per mesocycle. Because nothing is recorded, a Quiz cannot count towards Module Completion, so Module Completion is still a manual "mark as done" button, and a Client can move through a Course without ever showing they understood it.

The Intermediate Course has quiz documents for seven mesocycles but only one Module in the app, so most of its questions have nowhere to go.

## Solution

Give every Module that has questions a real Quiz, in Portuguese and English, stored in the database and edited by Admins. A Client answers every question, the server scores the Quiz Attempt, and a score of 80% or more is a Quiz Pass that is never lost. Module Completion is then worked out from the Module's content (a Quiz Pass when it has a Quiz, plus every Exercise done) instead of the manual button.

The questions are converted once from the Word documents into JSON, checked by a person, and imported. The Intermediate Course gets its seven Modules now, most of them placeholders holding only a title, a theme and a Quiz until their content arrives.

Vocabulary follows `GLOSSARY.md` (Quiz, Quiz Attempt, Quiz Pass, Module Completion, Locked, Available, In Progress). Decisions are recorded in ADR 0008 (Module Completion from content) and ADR 0009 (Intermediate placeholder Modules).

## Source documents and mapping

The Word documents are outside the repo, in `fran padel project/docs/CURSOS/PERGUNTAS/{Beginner,Intermedio}/`, named `PT_module_<n>.docx` and `ENG_module_<n>.docx`, where `<n>` is the academy's mesocycle number. The correct option is the one in **bold**.

| Mesocycle files | Module | Notes |
|---|---|---|
| 1–7 (Beginner) | `module-1` … `module-7` | Existing Beginner Modules |
| 8 (Beginner, "Coaching Tools") | none | Converted to `docs/questions/unassigned/coaching-tools.json`, never imported |
| 9 … 15 (Intermedio) | `module-8` … `module-14` | Mesocycle `n` → `module-(n-1)` |

The Intermediate Module numbers are one behind the mesocycle numbers because Coaching Tools is not a Module. The existing `module-8` content ("Progressive Transitions – 1 Time", topic Lob) belongs to mesocycle 14, the lob transitions quiz, so it moves to `module-13`. `module-8` becomes a placeholder for mesocycle 9.

## User Stories

1. As an Admin, I want every quiz document converted into one JSON file per Module, so that the questions live in the repo and not in Word.
2. As an Admin, I want the conversion to fail and list every place where a Portuguese and an English document disagree (question count, option count, correct option), so that I fix the documents instead of shipping a guess.
3. As the academy, I want readable PT and EN markdown copies of each converted Quiz, so that we can check the correct answers before Clients see them.
4. As an Admin, I want the Coaching Tools questions kept in their own file and attached to no Module, so that they are not lost and not shown.
5. As an Admin, I want the seven Intermediate Modules to exist now, six of them with only a title, a theme and a Quiz, so that Clients can take the Intermediate Quizzes before the content is written.
6. As an Admin, I want the Progressive Transitions content moved from `module-8` to `module-13`, so that each Module's content matches its Quiz.
7. As an Admin, I want one import task to load both Courses and their Quizzes, and to update Modules and Quizzes that already exist, so that the JSON files stay the source of what gets imported.
8. As an Admin, I want to edit a Module's Quiz in the admin, adding, removing, reordering and rewording questions in both languages, so that I can fix mistakes without a deploy.
9. As an Admin, I want a question to be refused unless it has text in both languages, 2–4 options, the same number of options in each language and exactly one correct option, so that a Quiz can never be broken in one language.
10. As an Admin, I want a Quiz with no questions to count as no Quiz, so that an empty Quiz never blocks Module Completion.
11. As a Client, I want to take a Module's Quiz any time once the Module is not Locked, before or after its Exercises, so that I can check myself when I like.
12. As a Client, I want to see the Quiz in my own language, so that I understand the questions.
13. As a Client, I want every question shown in a fixed order with its options in a fixed order, so that options like "a) and b) are correct" make sense.
14. As a Client, I want Submit disabled until I have answered every question, so that I never lose marks for a question I missed.
15. As a Client, I want my answers scored by the server as the percentage of questions right, so that my score is recorded and can be trusted.
16. As a Client, I want to see my score, whether I passed, and which questions I got wrong, but not the right answers, so that a retake still tests me.
17. As a Client, I want to retake a Quiz as often as I like, so that I can keep learning.
18. As a Client, I want a Quiz Pass to stay mine whatever I score later and however the Quiz is edited, so that I never lose progress.
19. As a Client, I want past attempts to show only their score and date, so that edits to the Quiz never show me misleading history.
20. As a Client, I want a Module complete exactly when I have passed its Quiz (if it has one) and done all its Exercises, so that completion means I learned it.
21. As a Client, I want a Module with a Quiz Attempt but no Module Completion to show as In Progress, so that attempting a Quiz counts as starting.
22. As a Client, I want a Module's progress to count its Quiz as one step, so that a Module with only a Quiz goes from 0% to 100% when I pass it.
23. As a Client, I want the next Module unlocked as soon as the current one is complete, without pressing a button, so that progress follows what I did.
24. As a Client, I want the Quiz card on the Module page to show the number of questions, my best score and whether I passed, so that I know where I stand.
25. As a Client, I want my average quiz score on the dashboard to use my best score on each Quiz I attempted, so that retakes improve it.
26. As a Club Manager, I want to see my Coaches' quiz results only through their Module Completion and progress, so that Quizzes stay a private check for the Coach.

## Implementation Decisions

**Conversion (one-time).**
- A script reads each `PT_module_<n>.docx` / `ENG_module_<n>.docx` pair, takes paragraphs as question then options, and takes the bold option as correct. The source folder is passed as an argument; the documents are not committed.
- The PT and EN files are paired by mesocycle number and their questions by position. Any difference in question count, option count or correct position stops the conversion and lists every mismatch.
- Output, per Module: `docs/questions/<module-slug>.json` in the existing `module-1-questions.json` shape, but with the correct answer as an index (`correctIndex`) shared by both languages. Also `docs/questions/<module-slug>.pt.md` and `.en.md` for review, in the format of the existing `pt_module-1.md`.
- Mesocycle 8 goes to `docs/questions/unassigned/coaching-tools.json` (and its review markdown).
- The existing hand-made Module 1 files are replaced by the converted ones once they have been diffed against each other.

**Intermediate Modules.**
- `docs/courses/intermediate.json` lists `module-8` … `module-14`. Placeholders have a PT/EN title ("Mesociclo n" / "Module n"), a PT/EN description taken from the quiz heading, no topics, no content and no Exercises.
- The Progressive Transitions entry becomes `module-13`, with its `technicalContent` key read as content.
- Placeholders are ordinary Modules: listed, locked and unlocked in order, Quiz takeable. The Module page shows a "content coming soon" note when content is empty. Intermediate Training Plans will have Classes with no Exercises to pick until content arrives.

**Data model.**
- `quizzes`: belongs to `course_module` (unique, so at most one per Module).
- `quiz_questions`: belongs to `quiz`; `position`; `text_pt`, `text_en`; `options_pt`, `options_en` (JSONB arrays); `correct_index`.
- `quiz_attempts`: belongs to `user` and `quiz`; `score` (integer percentage, frozen when submitted); `answers` (JSONB of question id → chosen index); `created_at`.
- Quiz Pass is not stored; it is "an attempt with `score >= 80` exists". Because the score is frozen on the attempt, editing questions never takes a pass away.
- "Has a Quiz" means the Module has a Quiz with at least one question.

**Import.**
- `rails course_modules:import` reads `beginner.json` and `intermediate.json`, upserts Modules by slug (title, description, duration, level, position, topics, content from the JSON), then upserts each Module's Quiz from `docs/questions/<slug>.json`, replacing its questions.
- Files under `docs/questions/unassigned/` and files with no matching Module are skipped. Running the task twice changes nothing the second time.
- Re-importing overwrites admin edits to fields that come from the JSON. Fix questions in the JSON and re-import, or in the admin and accept that the next import resets them.

**Admin.** The ActiveAdmin Module screen (`app/admin/course_modules.rb`) gets the Quiz as a nested form of questions, with the validations from story 9.

**Taking a Quiz.**
- `GET /dashboard/courses/:id/quiz` renders `Courses/Quiz` with the Quiz's questions in the Client's locale, without the correct indexes.
- `POST /dashboard/courses/:id/quiz/attempts` scores the answers on the server, stores the Quiz Attempt, and returns the score, the pass state and the ids of the wrong questions.
- Both refuse a Locked Module as `show` does today, and give a 404 for a Module with no Quiz. A submission that misses a question is refused.
- The results screen exists only straight after submitting. Past attempts show score and date only.

**Module Completion and states** (`CourseModule.states_by_user`, still a fixed number of queries per call).
- Completed = (no Quiz, or a Quiz Pass) and every Exercise currently in the Module has an Exercise Completion. A Module with neither is complete for everyone.
- In Progress = not Completed, with at least one Exercise Completion or Quiz Attempt.
- progress = (Exercises done + 1 if Quiz Pass) ÷ (Exercises + 1 if the Module has a Quiz).
- Locked comes first: a Module after an incomplete one is Locked, and not Completed, even with nothing left to do in it.
- The manual "mark as done" (`complete_for!`, `PATCH /dashboard/courses/:id/complete`, the button on `Show.tsx`) is removed, and the `user_module_progresses` table is dropped. Existing "done" rows are not kept as passes (ADR 0008). A Module that isn't complete says what is left instead.

**Dashboard.** The Module page's Quiz card shows the question count, the Client's best score and pass state. `averageQuiz` in `dashboard_stats_for` is the mean of the Client's best score on each Quiz they attempted, or nil if none. The Club overview shows only completion and progress.

## Testing Decisions

RSpec only, testing behaviour through public interfaces, as the existing `spec/requests` and `spec/models` do.

- **Conversion:** a spec on the parser with a small fixture `.docx` pair, covering the bold correct option, a True/False question and a mismatched pair being refused.
- **Import:** a request or task spec showing Modules and Quizzes created, updated on a second run, unchanged on a third, and `unassigned/` skipped.
- **Model:** `QuizQuestion` validations, Quiz Pass surviving later failing attempts and question edits, and `states_by_user` for each Completed / In Progress / Available / Locked case, including a Quiz-only Module and a Module with neither Quiz nor Exercises.
- **Requests:** the quiz page (no correct indexes in props, Locked redirect, 404 without a Quiz), attempt submission (score, wrong ids, missing answer refused), and the admin Quiz form, extending `spec/requests/courses_quiz_spec.rb` and `spec/requests/admin/course_modules_spec.rb`.

## Out of Scope

- Coaching Tools as a Module, or any use of its questions.
- Intermediate Module content (topics, sections, Exercises) beyond the existing Progressive Transitions text.
- Notion as the editor for Quizzes. It comes with the wider Notion content sync.
- Shuffling questions or options, timed Quizzes, question banks, or questions with more than one correct option.
- Showing per-Coach quiz scores to Club Managers.
- Certification and the Final Exam.

## Delivery

Delivered as vertical slices, sub-issues of #41, in order #42 → #43 → #44 → #45. #46 can run in parallel with #45.

1. #42 Convert the quiz documents into JSON and review markdown
2. #43 Store Quizzes, import both Courses and edit Quizzes in the admin
3. #44 Take a Quiz: Quiz Attempts, server scoring and the real Quiz page
4. #45 Work out Module Completion and states from content, remove "mark as done" (closes #31)
5. #46 Quiz card details and average quiz score
