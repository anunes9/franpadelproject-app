# Fran Padel Project - Product

<!-- impeccable:product-schema 1 -->

Terms in **bold capitals** are defined in [GLOSSARY.md](../GLOSSARY.md). Features marked _(not built yet)_ are agreed but not yet in the app.

## Overview

Fran Padel Project is an online learning platform for padel. Clients work through structured **Courses** of theory (**Modules**) and on-court drills (**Exercises**), plan their week of training, and track how far they've got. The whole platform, interface and content alike, is available in Portuguese and English.

## Platform

web

## Positioning

The platform teaches **Fran's own methodology** for padel: one coach's structured method, delivered in a fixed order. Modules unlock in sequence, and theory, on-court Exercises and the Coach Module all follow that method. A generic padel course or a YouTube drill collection can't honestly claim to be the Fran Methodology.

## Operating Context

- **Desktop or laptop**: studying Modules, reading explanations and viewing Resources at a desk.
- **Phone, off court**: reading Modules and planning the week at home or while commuting.
- **Coach showing players**: a Coach opens an Exercise on a phone or tablet and shows it to a group, so Exercise content has to read at arm's length and to several people at once.

On-court, mid-session use on the Client's own phone is not a confirmed primary scene.

## Brand Commitments

- **Fran Padel Project** is the brand.
- **Fran Methodology** is the teaching method (`public/fran-methodology-logo.png`, shown in the app sidebar).
- **Fran Padel Academy** is this learning platform (page title, `application-name`, Open Graph name).
- Portuguese is the primary language (`og:locale pt_PT`), and English is secondary. Every interface string and every piece of content exists in both.

## Who it's for

- **Players** of every Level, learning to play padel through the Courses.
- **Coaches**, using the platform as a teaching resource and following the same Courses.
- **Clubs**, whose **Club Manager** follows the progress of the club's Players and Coaches _(not built yet)_.

## People and access

- **Client**: a Player, Coach or Club Manager. Clients learn from the platform.
- **Admin**: manages content and Clients through the admin area.

Clients sign in with email and password. Accounts are created by Admins.

_(not built yet)_: passwordless sign-in with one-time codes, invitation links, password reset, email verification.

### Profile

A Client's profile shows their name, email, age, **Level**, playing hand, **Club** and member-since date, and lets them choose their interface language. A Player's Level is informational only: it never restricts which Courses or Modules they can open.

_(not built yet)_: recording whether a Client is a Player or a Coach.

## Courses and Modules

There are three Courses, one per Level:

- **Beginner**: the fundamentals of padel technique and tactics.
- **Intermediate**: more advanced technique and tactics, building on Beginner.
- **Advanced**: currently **Planned** (no Modules yet), shown as coming soon.

Each Course is an ordered sequence of Modules (called _mesociclos_ in Portuguese). Every Course includes one **Coach Module** about teaching padel, which every Client sees and completes like any other Module.

A Module has:

- a title, description and estimated duration
- **Topics** it covers
- explanations, organised into sections
- **Resources**: presentations, PDFs, videos and images, viewed inside the app
- the **Exercises** that belong to it
- a **Quiz** _(not built yet)_

### Module status

For each Client, every Module is in exactly one state, worked out from their progress:

| State           | Meaning                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| **Locked**      | The previous Module in the Course lacks Module Completion                   |
| **Available**   | Not Locked, and the Client has no Exercise Completion or Quiz Attempt in it  |
| **In Progress** | At least one Exercise Completion or Quiz Attempt, but no Module Completion  |
| Completed       | **Module Completion**                                                       |

The first Module of each Course is never Locked.

## Exercises

The Exercise library holds the platform's practical drills. Each Exercise has a title, description, step-by-step content, a duration and a gallery of images and videos. An Exercise usually belongs to one Module, but may stand alone in the library.

Clients browse the library page by page and filter it by Module, and record **Exercise Completion** for any Exercise. Exercise Completion can be undone _(not built yet)_.

_(not built yet)_: filtering by Topic.

## Quizzes _(not built yet)_

A Module has at most one Quiz: multiple-choice questions in Portuguese and English.

- Each submission is a **Quiz Attempt** with a score.
- A Quiz Attempt scoring at least 80% gives a **Quiz Pass**.
- A Quiz Pass is never lost, whatever later attempts score or however the questions are edited.
- Clients may retake a Quiz as often as they like.

## Progress

- **Module Completion**: a Quiz Pass (when the Module has a Quiz) plus Exercise Completion of every Exercise currently in the Module. It always reflects the Module's current content, so adding a Quiz or an Exercise can remove it, and undoing an Exercise Completion removes it too, re-locking the following Modules. A Module with neither a Quiz nor Exercises is complete for everyone.
- **Course Completion**: Module Completion of every Module in a Course that is not Planned.

The dashboard shows overall progress, Modules completed out of the total, and Exercises completed.

_(not built yet)_: Module Completion worked out as above (today a Module is marked done by hand), the Exercises-completed count, quiz scores, hours practised.

## Weekly Plan

A Client's **Weekly Plan** places Modules and Exercises on the days of a week. It is an intention only: planning something never records progress and never unlocks a Module, so Locked Modules can be planned too.

_(not built yet)_: saving plans and moving between weeks (today the planner shows a sample plan).

## Certification _(not built yet)_

**Certification** is recognition given to a Client after Course Completion, a passed Practical Assessment and a passed Final Exam. Who runs the Practical Assessment, and what the Final Exam is, are still to be decided.

## Content management

Admins manage Modules, Exercises, Resources, Clubs and Clients from the admin area.

_(not built yet)_: managing the Topic list and Quizzes.

## Client journey

1. An Admin creates the Client's account.
2. The Client signs in and lands on the dashboard, which shows their Courses, Module states and progress.
3. They open the first Available Module, work through its explanations and Resources, and do its Exercises.
4. They pass the Module's Quiz _(not built yet)_, gaining Module Completion and unlocking the next Module.
5. They use the Exercise library and Weekly Plan to organise their practice.
6. Completing every Module in a Course gives Course Completion.

## Evidence on Hand

- Course content for Beginner and Intermediate: `docs/courses/*.json` and `docs/Courses.md`.
- The Exercise library: `docs/Exercises_all.csv` (about 255 rows), `docs/Exercises.md` and `docs/exercise-images.json`.
- Draft Quiz questions for Module 1 in PT and EN: `docs/questions/`.
- Brand assets: `public/fran-padel-project-logo.svg`, `public/fran-methodology-logo.png`, `public/og-image.png`, and the teaser video used on the sign-in page (hosted on Contentful).
- There are no testimonials, Client numbers, Club names, results data or press. Future work must not invent any of these.

## Product Principles

1. **The method sets the order.** Module sequence and locking express the Fran Methodology, so the interface never suggests a shortcut around it.
2. **Show only what's true.** Progress, Module states and plans reflect the Client's real data. Sample or placeholder data is labelled as such, never presented as the Client's own.
3. **Portuguese first, bilingual always.** Design and copy start from Portuguese and must hold up in both languages, including longer PT strings.
4. **Teach for the court.** Every Module points toward practice: Exercises and the Weekly Plan are where theory turns into play.
5. **Show the Exercise clearly.** Exercise content has to be clear when a Coach shows it on a phone or tablet to a group of players.

## Future ideas

Not yet agreed, kept here as a backlog of possibilities:

- Advanced Course content
- Coach tools beyond the Coach Module
- Community and social features
- Native mobile app and offline access
- Achievements and badges
- Live training sessions
- Subscriptions and payments
