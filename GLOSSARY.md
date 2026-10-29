# Fran Padel Project

An online learning platform where padel players and coaches work through structured Courses of theory and on-court drills, and track how far they've got.

## People

**Client**:
Anyone with an account on the platform other than an Admin: a Club Manager or a Coach.
_Avoid_: User, customer, member

**Club Manager**:
A Client who manages one or more Clubs, their Coaches, Class Groups and Players. A Club Manager is created by an Admin and cannot create Clubs.
_Avoid_: Club (for the account), club admin, club owner

**Coach**:
A Client who belongs to exactly one Club, added by a Club Manager through an email invitation. A Coach owns Class Groups, runs their Classes, and also learns through the Courses.
_Avoid_: Instructor, teacher, trainer

**Player**:
A person who plays padel at a Club, recorded with a name, position (left, right or both), dominant hand and Level. A Player has no account and cannot log in. A Player belongs to one Club and can be in several Class Groups.
_Avoid_: Student, learner, member

**Club**:
A padel club with its Coaches, Players and Break Periods. Created and linked to Club Managers by an Admin.
_Avoid_: Academy, venue

**Admin**:
A person who manages the platform's content, Clubs and Clients, rather than teaching or learning from it.
_Avoid_: Staff, sales, superuser

## Content

**Course**:
One of the three top-level learning paths (Beginner, Intermediate, Advanced), identified by its Level. A Course's Exercises are the Exercises of its Modules.
_Avoid_: Program, path, track

**Planned**:
A Course that has no Modules yet. It is shown as coming soon and cannot be completed.
_Avoid_: Empty, upcoming, draft

**Module**:
An ordered unit within a Course that presents a set of topics and explanations.
_Avoid_: Mesociclo (the Portuguese translation, used only in PT copy), CourseModule, lesson, chapter

**Exercise**:
A practical drill, optionally part of one Module.
_Avoid_: Drill, task

**Level**:
The difficulty scale (Beginner, Intermediate, Advanced). On content it organizes and filters; on a player it is informational only and never restricts access.
_Avoid_: Tier, difficulty

**Resource**:
A file attached to a Module to support it, such as a presentation, PDF, video or image.
_Avoid_: Document, attachment, material (except "Materiais", the Portuguese translation, used only in PT copy), presentation

**Quiz**:
A Module's set of multiple-choice questions, in Portuguese and English, that checks a Client's understanding of it. A Module has at most one.
_Avoid_: Knowledge check, test, assessment

**Topic**:
A label from a fixed, curated list, named in both Portuguese and English, used to group and filter Modules and Exercises.
_Avoid_: Tag, category, theme, Technical/Tactical

## Progress

**Quiz Attempt**:
One submission of a Module's Quiz by a Client, with its score.
_Avoid_: Try, submission

**Quiz Pass**:
A Client having made a Quiz Attempt scoring at least 80%. Once reached it is never lost, whatever later attempts score or however the Quiz's questions are edited; Clients may retake a Quiz as often as they like.
_Avoid_: Quiz done, quiz completed

**Exercise Completion**:
A Client having done an Exercise.
_Avoid_: Done, finished

**Module Completion**:
A Client's Quiz Pass on the Module (when it has a Quiz) plus Exercise Completion of every Exercise currently in the Module. It always reflects the Module's current content, so adding a Quiz or an Exercise can remove it. A Module with neither a Quiz nor Exercises is complete for everyone who can open it. A Locked Module never has it.
_Avoid_: Module done, module progress

**Locked**:
A Module that cannot be opened because the previous Module in its Course lacks Module Completion. A Locked Module never has Module Completion, even with nothing left to do in it. A Player's Level never locks anything.
_Avoid_: Blocked, unavailable

**Available**:
A Module that is not Locked and in which the Client has no Exercise Completion or Quiz Attempt yet.
_Avoid_: Current, open, unlocked

**In Progress**:
A Module with at least one Exercise Completion or Quiz Attempt but no Module Completion.
_Avoid_: Current, started

**Course Completion**:
Module Completion of every Module in a Course that is not Planned.
_Avoid_: Course done

**Certification**:
Recognition given to a Client after Course Completion, a passed Practical Assessment and a passed Final Exam.
_Avoid_: Certificate (for the achievement), diploma

## Planning

**Class Group**:
A group of one to eight Players taught by one Coach, tied to one Course through its Level. It has a start date, a cadence (once or twice a week), chosen weekdays, a start time and a Class duration (1 hour or 1h30). The Coach picks its Level; it is not computed from its Players. The Coach may also give it a name, such as "Fim de tarde"; a group without one is shown by its Level. A finished Class Group stays as history; the next Course is a new Class Group.
_Avoid_: Class (for the group), team, cohort

**Training Plan**:
The ordered Classes of one Class Group, generated up front by rules from the Course's Modules, and editable by the Coach. It runs through the Course's seven Modules in order and has no season end date. Its cadence sets the weeks per Module; the Class duration only sets its Class Structure. Regenerating happens only on request, and keeps completed Classes. It is an intention only.
_Avoid_: Weekly Plan, schedule, calendar

**Class**:
One dated day of a Training Plan, with a start time, a Module and optionally Exercises the Coach picks. It is a reference for the Coach to see what is planned that day. A Coach, and a Player, can never have two Classes overlapping in time. A skipped Class stays in the plan but no longer takes up its time. Classes are numbered in plan order within their group, Class 1 to the last, skipped ones included.
_Avoid_: Session, lesson

**Class Structure**:
How a Class is spent, set by its duration: a warm-up, the Exercises the Coach picks (8 minutes each), a game based on the exercises ("jogo com base nos exercícios"), and a game for the remaining time. A 1-hour Class has a 5-minute warm-up, 4 Exercises and 10–15 minutes of game based on the exercises; a 1h30 Class has a 10–15-minute warm-up, 5 Exercises and 20–25 minutes of it. The Class page lays it out as a timeline.
_Avoid_: Class plan, lesson plan

**Assessment Class**:
The last Class of each Module in a Training Plan, in week 6 at once a week and in week 4 at twice a week. It is where each Player's qualitative evaluation of the Module's concepts will be recorded; that evaluation feature is still to be scoped, and is separate from Certification.
_Avoid_: Test, exam, Practical Assessment

**Break Period**:
A span of weeks defined by a Club's Club Manager (Christmas, Easter, August) during which no Classes are generated for its Class Groups.
_Avoid_: Holiday, vacation

