# Reaction Time Test

## Current State
New project. No existing backend or frontend.

## Requested Changes (Diff)

### Add
- A mobile-first single-screen mini game "Reaction Time Test"
- Full-screen color display: starts red (wait state), turns green (tap state) after a random delay (1-4 seconds)
- Reaction time measurement in milliseconds (time from green to tap)
- "Too early" penalty if user taps during red phase
- Round tracker: up to 5 rounds per session
- Display: current reaction time, average over completed rounds, best score all-time (session-scoped)
- Results summary screen after 5 rounds with average and best
- Restart/play again button to reset rounds

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. No backend needed — pure frontend React game
2. Create a single `ReactionGame` component with state machine: idle → waiting (red) → ready (green) → result → summary
3. Use `useRef` for precise timing (`performance.now()`)
4. Track rounds array, compute average and best in-component
5. Random delay between 1000ms and 4000ms using `setTimeout`
6. Full-viewport tap target (entire screen is interactive)
7. Animate color transition for green flash
8. Show per-round result, then summary after round 5
9. Apply deterministic `data-ocid` markers to all interactive surfaces
