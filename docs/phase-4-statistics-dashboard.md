# Phase 4 — Statistics dashboard

Phase 4 adds a local-first dashboard, configurable learning goals, streaks, progress charts, deck summaries, difficult cards, a 12-week activity heatmap, and study history queries.

Screens call TanStack Query hooks. Hooks use `StatisticsRepository`; SQLite performs aggregate SQL and maps rows to domain types. Calendar completion, streak, goal progress, heatmap intensity, and difficult-card scoring are pure tested functions. UI code contains no SQL and deck summaries use one grouped query.

Migration 4 creates `learning_goals`, `goal_completion_logs`, and `statistics_metadata`. The stable goal id is `local-default-learning-goal`; defaults are 20 cards, 15 minutes, 5 weekly days, 10 new cards, and 50 reviews.

Daily buckets use device-local `YYYY-MM-DD`; missing days become zero-value points. Accuracy is `correct / (correct + incorrect)`. Today may be empty while yesterday continues a current streak.

## Known limitations

- Goal notifications are in-app only; operating-system reminders are not scheduled yet.
- Previous-period trend comparison is reserved and currently reports zero.
- Aggregates are local-device data until a later cloud sync phase.
- Charts are accessible native views, not interactive plotting surfaces.
