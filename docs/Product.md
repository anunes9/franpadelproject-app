# Fran Padel Project - Product

<!-- impeccable:product-schema 1 -->

Terms in **bold capitals** are defined in [GLOSSARY.md](../GLOSSARY.md). Features marked _(not built yet)_ are agreed but not yet in the app. The Coach-first model (Club Managers, Coaches, Class Groups and Training Plans) is specified in [docs/specs/CoachClassGroups.md](specs/CoachClassGroups.md) and is not built yet; the app today is still the earlier self-learning platform.

## Overview

Fran Padel Project is a platform for padel clubs to teach with one methodology. A **Club Manager** runs one or more **Clubs** and their **Coaches**. Each **Coach** teaches **Class Groups** of **Players** and gets a **Training Plan** generated from the **Courses** of theory (**Modules**) and on-court drills (**Exercises**). Coaches also work through the Courses themselves and track how far they've got. The whole platform, interface and content alike, is available in Portuguese and English.

## Platform

web

## Positioning

The platform teaches **Fran's own methodology** for padel: one coach's structured method, delivered in a fixed order. Modules unlock in sequence, Training Plans walk the Modules in that same order, and theory, on-court Exercises and the Coach Module all follow that method. A generic padel course or a YouTube drill collection can't honestly claim to be the Fran Methodology.

## Operating Context

- **Desktop or laptop**: a Club Manager or Coach studying Modules, reading explanations, viewing Resources and building Class Groups at a desk.
- **Phone, off court**: checking the Training Plan, reading Modules and choosing a Class's Exercises at home or while commuting.
- **Coach showing players**: a Coach opens an Exercise on a phone or tablet and shows it to a group, so Exercise content has to read at arm's length and to several people at once.

On-court, mid-session use on a Coach's own phone, such as opening today's Class, is plausible but not a confirmed primary scene. Players never use the app.

## Brand Commitments

- **Fran Padel Project** is the brand.
- **Fran Methodology** is the teaching method (`public/fran-methodology-logo.png`, shown in the app sidebar).
- **Fran Padel Academy** is this learning platform (page title, `application-name`, Open Graph name).
- Portuguese is the primary language (`og:locale pt_PT`), and English is secondary. Every interface string and every piece of content exists in both.

## Who it's for

- **Club Managers**, who run one or more Clubs and manage their Coaches, Class Groups and Players _(not built yet)_.
- **Coaches**, who belong to one Club, run Class Groups from a generated Training Plan, and use the platform as a teaching resource by following the same Courses _(Training Plans not built yet)_.
- **Players**, who are taught in Class Groups. They are records the Coach keeps, with no account and no screens of their own _(not built yet)_.

## People and access

- **Client**: a Club Manager or a Coach. Clients sign in and use the platform.
- **Player**: a person a Club teaches. A Player is a record (name, position, dominant hand, **Level**) owned by a Club, with no login. A Player can be in several Class Groups.
- **Admin**: manages content, Clubs and Clients through the admin area. Admins create Clubs and Club Managers and link each Manager to one or more Clubs.

A Club Manager manages only the Clubs they are linked to, and cannot create Clubs. A Coach belongs to exactly one Club.

Clients sign in with email and password.

_(not built yet)_: Club Manager and Coach roles (today every non-Admin account is a plain Client), inviting a Coach by email so they set their own password, passwordless sign-in with one-time codes, password reset, email verification.

### Profile

A Client's profile shows their name, email, **Club** and member-since date, and lets them choose their interface language.

_(not built yet)_: recording whether a Client is a Club Manager or a Coach.

## Clubs, Coaches and Players _(not built yet)_

A Club Manager sees an overview of each Club they manage: its Coaches, Class Groups and Players. A Manager with several Clubs switches between them.

- **Coaches**: the Manager invites a Coach to a Club by email, and the Coach accepts and sets a password. The Manager can see each Coach's Course progress. A Coach cannot be removed until the Manager has reassigned their Class Groups.
- **Players**: Managers and Coaches add Players to the Club's roster. A Player has a name, position (left, right or both), dominant hand and **Level**. Level is informational only.
- **Class Groups**: Managers see and edit every Class Group in their Clubs and can reassign a group to another Coach in the same Club.
- **Break Periods**: a Manager defines the Club's Break Periods (Christmas, Easter, August), when no Classes are generated.

## Class Groups and Training Plans _(not built yet)_

A Coach creates **Class Groups**. A Class Group is up to eight Players, a Level, a start date, a cadence (once or twice a week), the weekdays and start time of its Classes, and a Class duration (1 hour or 1h30). The Coach chooses the group's Level, which selects its Course. A Class Group is visible only to its Coach and its Club's Managers.

### Training Plan

From that description the app generates the group's **Training Plan** for the whole Course up front, by rules, with no AI:

- It walks the Course's seven teaching Modules in order. The Coach Module is not part of it.
- A Module takes 6 weeks at once a week and 4 weeks at twice a week. The last week is the **Assessment Class**.
- The first Class falls on the first chosen weekday on or after the start date. No Classes fall in the Club's Break Periods.
- The plan ends after the last Module's Assessment Class. It has no season end date. At 44 teaching weeks in a year (52 weeks less 2 Christmas, 4 August and 2 Easter weeks) all seven Modules fit: 42 weeks at once a week and 28 at twice a week. Spare weeks stay unscheduled.
- A group can't be created while its Course has no teaching Modules, so Advanced, and for now Intermediate, are unavailable.

A **Class** is one dated day of the plan: its date, time, Module and the Exercises the Coach chooses from that Module. It is a reference so the Coach can see what is planned that day. Planning a Class never records progress.

### Editing and clashes

- The Coach can move, skip or add Classes, choose each Class's Exercises, and mark Classes done.
- Regenerating the plan happens only when the Coach asks, and keeps completed Classes. Changing the cadence or the Players never changes the plan by itself.
- A Coach, and a Player, can never have two Classes that overlap in time. This is checked whenever a group is created or changed, or a Class is moved. A group whose plan would clash is refused, with the clashing dates listed.
- When a Course is finished, the next Course is a new Class Group, created by copying the Players. The finished group stays as history.

### Home screens

A Coach's home shows today's Classes and their Class Groups. A Club Manager's home is the Club overview. Courses, Modules and Exercises are a library available to both.

## Courses and Modules

There are three Courses, one per Level:

- **Beginner**: the fundamentals of padel technique and tactics.
- **Intermediate**: more advanced technique and tactics, building on Beginner.
- **Advanced**: currently **Planned** (no Modules yet), shown as coming soon.

Each Course is an ordered sequence of Modules (called _mesociclos_ in Portuguese). Each Course is meant to have seven teaching Modules, which Training Plans use. Every Course also includes one **Coach Module** about teaching padel, which every Client sees and completes like any other Module.

A Module has:

- a title, description and estimated duration
- **Topics** it covers
- explanations, organised into sections
- **Resources**: presentations, PDFs, videos and images, viewed inside the app
- the **Exercises** that belong to it
- a **Quiz** _(not built yet)_

A Module's stored duration text is for display only. A Training Plan always gives a Module 4 or 6 weeks, whatever it says.

### Module status

For each Client, every Module is in exactly one state, worked out from their progress:

| State           | Meaning                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| **Locked**      | The previous Module in the Course lacks Module Completion                   |
| **Available**   | Not Locked, and the Client has no Exercise Completion or Quiz Attempt in it  |
| **In Progress** | At least one Exercise Completion or Quiz Attempt, but no Module Completion  |
| Completed       | **Module Completion**                                                       |

The first Module of each Course is never Locked. Module status is about a Client's own learning. It has no effect on which Modules a Training Plan uses.

## Exercises

The Exercise library holds the platform's practical drills. Each Exercise has a title, description, step-by-step content and a gallery of images and videos. An Exercise usually belongs to one Module, but may stand alone in the library. The content has no per-Exercise duration, so nothing in a Training Plan depends on one.

Clients browse the library page by page and filter it by Module, and record **Exercise Completion** for any Exercise. Exercise Completion can be undone _(not built yet)_. A Coach picks Exercises from the library for each Class.

_(not built yet)_: filtering by Topic, suggesting Exercises for a Class automatically.

## Quizzes _(not built yet)_

A Module has at most one Quiz: multiple-choice questions in Portuguese and English.

- Each submission is a **Quiz Attempt** with a score.
- A Quiz Attempt scoring at least 80% gives a **Quiz Pass**.
- A Quiz Pass is never lost, whatever later attempts score or however the questions are edited.
- Clients may retake a Quiz as often as they like.

## Progress

Progress is a Client's own learning, which today means a Coach's.

- **Module Completion**: a Quiz Pass (when the Module has a Quiz) plus Exercise Completion of every Exercise currently in the Module. It always reflects the Module's current content, so adding a Quiz or an Exercise can remove it, and undoing an Exercise Completion removes it too, re-locking the following Modules. A Module with neither a Quiz nor Exercises is complete for everyone.
- **Course Completion**: Module Completion of every Module in a Course that is not Planned.

The dashboard shows overall progress, Modules completed out of the total, and Exercises completed.

_(not built yet)_: Module Completion worked out as above (today a Module is marked done by hand), the Exercises-completed count, quiz scores, hours practised.

## Assessment of Players _(not built yet, to be scoped)_

The last Class of each Module is an **Assessment Class**. Each Player in the group will get a qualitative evaluation of the concepts learned in that Module, so the app can show graphs per Player and the areas to improve. This is a separate feature that still needs scoping. Until then an Assessment Class is only a marker in the plan, and no evaluations are recorded.

## Certification _(not built yet)_

**Certification** is recognition given to a Client after Course Completion, a passed Practical Assessment and a passed Final Exam. Who runs the Practical Assessment, and what the Final Exam is, are still to be decided. It is separate from the Assessment of Players.

## Content management

Admins manage Modules, Exercises, Resources, Clubs, Club Managers and Clients from the admin area.

_(not built yet)_: managing the Topic list and Quizzes, linking Managers to Clubs.

## Journeys

### Club Manager _(not built yet)_

1. An Admin creates the Manager's account and links it to their Clubs.
2. The Manager lands on the Club overview and defines the Club's Break Periods.
3. They invite Coaches by email and add Players to the Club's roster.
4. They follow their Coaches' Course progress and Class Groups, and reassign a group when a Coach leaves.

### Coach

1. A Manager invites the Coach, who sets a password and signs in.
2. They work through the Courses, doing each Module's Exercises, gaining Module Completion and unlocking the next Module. A Quiz _(not built yet)_ will be part of that.
3. They create a Class Group, choosing its Players, Level, start date, cadence, weekdays, time and duration _(not built yet)_.
4. The app generates the Training Plan. The Coach picks Exercises for each Class and adjusts dates as the year goes on _(not built yet)_.
5. On a Class day, they open it from their home screen and show the Exercises to the group _(not built yet)_.
6. When the Course ends, they create the next group at the next Level _(not built yet)_.

## Evidence on Hand

- Course content for Beginner and Intermediate: `docs/courses/*.json` and `docs/Courses.md`. The Intermediate file holds a single Module so far, and Beginner Module 7 has no Exercises.
- The Exercise library: `docs/Exercises_all.csv` (about 255 rows), `docs/Exercises.md` and `docs/exercise-images.json`.
- Draft Quiz questions for Module 1 in PT and EN: `docs/questions/`.
- Brand assets: `public/fran-padel-project-logo.svg`, `public/fran-methodology-logo.png`, `public/og-image.png`, and the teaser video used on the sign-in page (hosted on Contentful).
- There are no testimonials, Client numbers, Club names, results data or press. Future work must not invent any of these.

## Product Principles

1. **The method sets the order.** Module sequence, locking and Training Plans all express the Fran Methodology, so the interface never suggests a shortcut around it.
2. **Show only what's true.** Progress, Module states and plans reflect real data. Sample or placeholder data is labelled as such, never presented as real.
3. **Portuguese first, bilingual always.** Design and copy start from Portuguese and must hold up in both languages, including longer PT strings.
4. **Teach for the court.** Every Module points toward practice: Exercises and Classes are where theory turns into play.
5. **Show the Exercise clearly.** Exercise content has to be clear when a Coach shows it on a phone or tablet to a group of players.
6. **The Coach decides.** The app plans by rules, never silently changes a Coach's edits, and never invents content.

## Future ideas

Not yet agreed, kept here as a backlog of possibilities:

- Advanced Course content
- Suggesting Exercises for a Class automatically
- Player-facing screens or logins
- Community and social features
- Native mobile app and offline access
- Achievements and badges
- Subscriptions and payments
