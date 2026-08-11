# Card Tracker Architecture

## Source-of-truth hierarchy

Use the active repository code as the implementation source of truth. Use this document to understand intent and boundaries, not as a substitute for inspection. Treat constants and numeric baselines in their source files as authoritative; do not duplicate volatile values here.

## Active application path

The current production path is:

`src/main.tsx` → `src/App.tsx` → `src/app/MainApp.tsx`

`MainApp` owns application-level composition and orchestration, including the active cards collection, active-card selection, creation state, completion transitions, and archive-shell state.

The active card model is `VisualCard` from `src/app/cardTheme.ts`.

Current collection state uses:

- `cards: VisualCard[]`
- `activeCardId`
- an active card derived from those values

Do not replace this model or introduce competing ownership without explicit instruction.

## Active component areas

- `src/components/task-card/`: active `TaskCard`, countdown, attached completion coupon, and detached falling coupon.
- `src/components/draft-card/`: fixed-card creation flow and its title, kind, time-mode, date, clock, and navigation steps.
- `src/components/card-switcher/`: visible card selection, circular navigation, wheel handling, and DEV geometry configuration.
- `src/components/card-stack/`: lightweight neighboring-card material previews and DEV geometry configuration.
- `src/components/archive/`: the current archive environment and navigation shell.
- `src/components/shared/`: shared physical selection controls.
- `src/components/sandboxes/`: experiments and visual references. Do not treat sandbox data models or behavior as production architecture unless explicitly requested.

Keep `MainApp` focused on state, transitions, handlers, and scene composition. Put visually independent implementation in the established component area when doing so is within scope; do not create micro-components merely to move lines.

## Project terminology and decisions

### Ghost card

The Ghost card is a separate, intentional UI object and creation affordance behind the active card. It is not a CardStack layer. Do not remove, repurpose, or merge it into CardStack unless explicitly requested.

### CardStack

CardStack renders lightweight face-side/material previews representing real neighboring active `VisualCard` objects. These layers are not card backs and are not full `TaskCard` instances. They must not run countdowns, coupons, or other stateful TaskCard behavior.

### CardSwitcher

CardSwitcher selects among current `VisualCard` objects and uses circular navigation. Its windowing, wheel normalization, indicator behavior, geometry config, and DEV debugger are established mechanisms. Change them only when the task includes them.

### Completion coupon

`CompletionCoupon` is attached to the active TaskCard. `DetachedCompletionCoupon` is a fixed physical copy that leaves the card and reports completion of its flight. Preserve the distinction and existing completion semantics.

### Completion reveal

During completion, one prepared full next `TaskCard` may temporarily exist under the active TaskCard so the outgoing card reveals an already-painted successor. This temporary full card is different from normal CardStack preview layers. Preserve stable keys, paint synchronization, interaction locking, and a flash-free prepared-to-active handoff.

### Archive shell

The archive currently provides navigation and a visual environment. Its existence does not prove that completed-card persistence, archival lifecycle, restore/delete behavior, or archived-card storage is implemented. Do not infer or invent those systems.

### Draft flow

The creation UI is a sequence of steps inside one fixed physical card. Existing title, kind, time-mode, date, clock, and creation semantics are independent concerns. Do not redesign or combine steps while implementing an unrelated change.

## Legacy quarantine

The inactive Zustand/deck architecture is legacy and prohibited for new development unless the user explicitly requests migration, comparison, cleanup, or reuse.

Legacy areas include:

- `src/store/useDeckStore.ts`
- legacy `src/components/DeckView.tsx`
- legacy `src/components/TaskCard.tsx`
- `src/app/types/card.ts`
- `src/app/storage/cardStorage.ts`
- components whose active data source is `useDeckStore`, including the legacy modal/layout/museum/incubator path
- old card types, storage formats, and models associated with that path

Do not import these into `MainApp`, adapt current `VisualCard` data to them, or use their persistence as a shortcut.

## Git and repository-state guardrails

- Never assume the current branch. Inspect Git state when branch context matters.
- Treat risky feature work as branch/checkpoint-oriented, but never create, switch, stage, commit, merge, push, reset, or restore unless explicitly requested.
- Do not hard-code branch names as permanent architecture.
- Do not perform housekeeping or repository cleanup during feature work unless requested.
- Do not opportunistically remove unrelated tracked/untracked assets, generated files, experiments, or cleanup candidates.
- Preserve a dirty worktree and work around unrelated user changes whenever possible.

## Structural change rules

- Inspect imports and call paths before moving code.
- Preserve public props, handler timing, keys, and state ownership unless the requested change requires modification.
- Avoid broad rewrites of `MainApp` or large text replacements when a focused component or block edit is sufficient.
- Do not add a global store merely for convenience.
- Do not add persistence, archival lifecycle, or new model fields by inference.
- After structural work, check imports, TypeScript/JSX syntax, lost handlers, duplicate old implementations, and cleanup of effects/listeners introduced by the change.