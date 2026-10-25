# A Class is stored as a TrainingClass

The domain calls one dated day of a Training Plan a **Class** (see `GLOSSARY.md`). Ruby already defines `Class`, so a model of that name would shadow the core class and break the app. We store a Class as the `TrainingClass` model in the `training_classes` table, alongside `ClassGroup` (`class_groups`).

The rename stops at the code. UI copy, the glossary, issues and test names keep saying "Class" and "Assessment Class". `TrainingClass` is only the Ruby and database name for that term. It does not mean a different concept, and nobody should call it a "training class" in conversation.

A Class's type (regular or assessment) is stored in a `kind` column, not `type`, because Rails reserves `type` for single-table inheritance.

## Considered options

- **`Lesson` or `Session`**: rejected. The glossary avoids both words for a Class, so using them in code would bring back the vocabulary we chose to drop.
- **Namespacing, e.g. `Planning::Class`**: rejected. Inside the namespace, a bare `Class` would still be ambiguous, and every call site would have to qualify it.
