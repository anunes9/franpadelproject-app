# Intermediate placeholder Modules and their numbering

The academy wrote quizzes for seven Intermediate mesocycles (9 to 15), but the app had one Intermediate Module, `module-8`, holding the Progressive Transitions content. A Quiz belongs to exactly one Module, so the Intermediate questions had nowhere to go. We decided:

- **The Intermediate Course gets its seven Modules now**, `module-8` … `module-14`, in `docs/courses/intermediate.json`. Mesocycle `n` maps to `module-(n-1)`.
- **The numbers are one behind the mesocycle numbers** because Beginner mesocycle 8, "Coaching Tools", is not a Module. Its questions are kept in `docs/questions/unassigned/coaching-tools.json` and never imported.
- **The Progressive Transitions content moves from `module-8` to `module-13`**, because it matches mesocycle 14's quiz (progressive transitions supported by the lob). `module-8` becomes a placeholder for mesocycle 9. No Client had Intermediate progress, so nothing is lost.
- **A placeholder is an ordinary Module with no content yet**: a PT/EN title, a PT/EN theme taken from its quiz heading, a Quiz, and no topics, content or Exercises. It is listed, locked and unlocked in order, and its Quiz can be taken. The Module page says the content is coming soon. "Placeholder" is not a glossary term, because the state is temporary.
- **Intermediate Training Plans accept placeholders as they are.** Their Classes have no Exercises to pick until content arrives.

## Considered options

- **Keeping the Intermediate quizzes as JSON only until their Modules exist**: rejected by the product owner, who wants the questions usable now and the content filled in later.
- **Hiding placeholder Modules behind a draft flag**: rejected. It would add a concept that every list, lock and plan rule would have to respect, for a state that will go away.
- **Numbering Intermediate Modules by mesocycle (`module-9` … `module-15`)**: rejected. It would leave a gap at `module-8` and break the Module numbering that continues from Beginner's 1–7.
