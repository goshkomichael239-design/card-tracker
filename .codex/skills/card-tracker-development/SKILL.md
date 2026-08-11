---
name: card-tracker-development
description: Repository-specific development guide for the Card Tracker app. Use automatically whenever Codex inspects, plans, edits, reviews, debugs, tests, or verifies work in the Card Tracker repository, especially for React/TypeScript components, VisualCard state, card creation, task cards, CardSwitcher, CardStack, completion, archive shell, styling, animation, and performance.
---

# Card Tracker Development

## Operating contract

Make the smallest coherent change that satisfies the request. Preserve unrelated behavior, visuals, files, and user changes. Do not silently improve adjacent UI, architecture, animation, or styling.

Treat this skill as project intent and guardrails. Treat the current repository as the runtime and implementation source of truth. If a reference conflicts with active code:

1. Inspect the code.
2. Do not blindly follow stale documentation.
3. Mention the discrepancy.
4. Prefer the current active implementation unless the user explicitly requests restoration of an older design.

## Required workflow

1. Inspect only the relevant files and existing mechanism. Check Git state when branch context matters; never assume a branch.
2. Read the relevant reference below. Do not load unrelated references.
3. Identify explicit scope, protected behavior, and existing user changes.
4. Implement a minimal, local change using existing patterns and component boundaries.
5. Verify in proportion to the change and the user's instructions.
6. Report changed files and exactly which build, lint, or browser checks actually ran.

## Non-negotiable guardrails

- Use the active `VisualCard` architecture. Do not connect new work to the legacy Zustand/deck architecture unless the user explicitly requests migration, comparison, cleanup, or reuse.
- Never switch or create branches; stage, commit, merge, push, reset, restore, or otherwise mutate Git history or index without explicit authorization.
- Never discard unrelated tracked or untracked changes. Do not perform opportunistic housekeeping or repository cleanup.
- Do not broaden a targeted fix into a refactor or redesign.
- Preserve established textures, geometry, timings, state semantics, and component ownership unless they are in the requested scope.
- Do not add dependencies or persistence layers without explicit need and authorization.

## Reference routing

- Read [references/architecture.md](references/architecture.md) for models, state, component ownership, creation/completion flows, archive behavior, storage, structural changes, Git context, or legacy boundaries.
- Read [references/ui-motion.md](references/ui-motion.md) for styling, materiality, layout geometry, CardSwitcher, CardStack, Ghost card, coupons, animation, render performance, or visual debugging.

When both areas are involved, read both references before editing.

## Verification policy

- Run `npm run build` after functional, architectural, TypeScript, state-management, animation-logic, or component changes.
- Run `npm run lint` when requested, when lint/config files change, or when it is useful for diagnosis.
- Do not automatically start a dev server or browser unless runtime or visual verification is required or requested.
- For tiny visual-only changes, follow the user's explicit verification instructions; a build is optional when TypeScript and behavior clearly cannot be affected.
- Never imply interactive verification occurred when the browser or runtime environment was unavailable.