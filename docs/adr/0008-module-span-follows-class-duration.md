# A Module's span follows the Class duration, not the cadence

The parent spec (#6) gave a Module 6 weeks at once a week and 4 weeks at twice a week. Reviewing the demo, the product owner corrected the rule: the span depends on how long the Classes last. We decided:

- **The duration sets the span.** A Module spans 6 weeks when the group's Classes last 1 hour (60 minutes) and 4 weeks when they last 1h30 (90 minutes). The span follows how much court time a Module gets: per weekly slot it is 6 hours either way, six 1-hour Classes or four 1h30 Classes.
- **The cadence sets the Classes per week.** At once a week a Module has 6 or 4 Classes; at twice a week it has 12 or 8.
- **The Assessment Class is the last Class of the Module's last week** (docs/adr/0002), so at twice a week it is the later Class of week 6 or week 4.
- **Regeneration counts the remaining Classes from the group's current schedule** (docs/adr/0005): a started Module has its weeks for the current duration times the current cadence, less the Classes already done, and always at least its Assessment Class.
- **Editing the duration does not re-span the plan by itself** (docs/adr/0004). Every Class takes the new duration straight away, but the Module's weeks only change when the Coach regenerates the plan.

`TrainingPlanGenerator::WEEKS_PER_MODULE` holds the rule, keyed by duration, and its keys are the durations a Class Group may have.

## Considered options

- **Keeping the span on the cadence**: rejected. A Module's court time per weekly slot then depended on the schedule: 6 hours for 1-hour Classes once a week, but 9 hours for 1h30 Classes once a week and 4 hours for 1-hour Classes twice a week.
