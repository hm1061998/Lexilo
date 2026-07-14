# Phase 3 — Study session

## Data flow

```text
Study Setup → StudySessionService → candidate queue → question generator
            → StudyRepository.createSession → SQLite

Study Answer → review schedule + XP → exclusive SQLite transaction
             ├─ card_progress
             ├─ study_session_items
             ├─ review_logs
             ├─ study_sessions
             ├─ daily_statistics
             └─ sync_queue
```

## Session state machine

`active ↔ paused → completed | abandoned`. Completed and abandoned are terminal states. Completing an already completed session returns the existing result without incrementing statistics again. Only one active/paused session is allowed.

## Queue generation

Candidates are loaded through one joined query with a bounded limit. Deleted cards/decks and suspended cards are excluded. Mixed scope prioritizes relearning, learning and review cards that are due, followed by new cards. Fisher–Yates shuffling happens only after the bounded candidate query.

## Questions

Flashcard stores both faces. Multiple choice removes duplicate answer text, excludes the current card and prefers the same part of speech. Typing prompts with `backText` and accepts `frontText`. Every discriminated question is serialized into `study_session_items.question_json`, preserving order and distractors after restart.

## Answer transaction and recovery

Each answer validates that the session is active and the item is not already answered. It then calculates the next review, writes progress/log/counters/statistics/queue and promotes the next item inside one exclusive transaction. The Home banner loads the active or paused session; opening a paused session resumes it. Zustand stores only ephemeral answer and feedback state.

## Spaced repetition

The deterministic algorithm supports Again, Hard, Good and Easy, clamps ease to 1.3–3.5 and marks cards mastered after interval ≥60 days, repetitions ≥5 and positive accuracy. It is intentionally simpler than FSRS.

## Typing, XP and streak

Typing normalizes Unicode, case and whitespace. One edit is accepted only for answers of at least six characters with the same punctuation pattern. XP uses mode base values, rating/new/fast bonuses and hint/incorrect penalties, clamped to 0–20. Streak operates on unique local `YYYY-MM-DD` values and supports year/month boundaries.

## Known limitations

No backend sync, AI, listening/speaking quiz, pronunciation scoring, cloud backup or advanced analytics. Multiple-choice distractors come from local cards. Typing accepts `frontText` by default. Review logs cannot be edited. The scheduling model is not full FSRS.
