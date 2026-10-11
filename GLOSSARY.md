# Fran Padel Project

An online learning platform where padel players and coaches work through structured Courses of theory and on-court drills, and track how far they've got.

## People

**Client**:
Anyone with an account on the platform other than an Admin: a Player, a Coach or a Club Manager.
_Avoid_: User, customer, member

**Player**:
A Client learning to play padel through the Courses.
_Avoid_: Student, learner

**Coach**:
A Client who teaches padel and uses the platform as a teaching resource.
_Avoid_: Instructor, teacher, trainer

**Club Manager**:
A Client who represents a Club and follows the progress of its Players and Coaches.
_Avoid_: Club (for the account), club admin, club owner

**Club**:
A padel club that Players and Coaches can belong to.
_Avoid_: Academy, venue

**Admin**:
A person who manages the platform's content and Clients, rather than learning from it.
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

**Coach Module**:
The one Module in each Course about teaching padel. It is seen, Locked and completed like any other Module, by every Client.
_Avoid_: Coaching module, instructor module

**Exercise**:
A practical drill, optionally part of one Module.
_Avoid_: Drill, task

**Level**:
The difficulty scale (Beginner, Intermediate, Advanced). On content it organizes and filters; on a player it is informational only and never restricts access.
_Avoid_: Tier, difficulty

**Resource**:
A file attached to a Module to support it, such as a presentation, PDF, video or image.
_Avoid_: Document, attachment, material, presentation

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
A Client's Quiz Pass on the Module (when it has a Quiz) plus Exercise Completion of every Exercise currently in the Module. It always reflects the Module's current content, so adding a Quiz or an Exercise can remove it. A Module with neither a Quiz nor Exercises is complete for everyone.
_Avoid_: Module done, module progress

**Locked**:
A Module that cannot be opened because the previous Module in its Course lacks Module Completion. A Player's Level never locks anything.
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

**Weekly Plan**:
A Client's schedule of Modules and Exercises across the days of one week. It is an intention only and never records progress or grants access.
_Avoid_: Training planner, schedule, calendar
