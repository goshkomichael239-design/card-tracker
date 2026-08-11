# Card Tracker UI and Motion

## Visual language

Card Tracker is a physical, skeuomorphic product rather than a conventional interface decorated with textures. Preserve the established world of wood, marble, cardboard, paper, printing, embossing, perforation, physical edges, contact shadows, and layered materials.

Avoid introducing generic flat UI, Material Design, glassmorphism, glossy plastic, SaaS controls, or unrelated visual modernization.

## Scope discipline

- Change only the visual blocks named by the user.
- Preserve neighboring geometry, typography, textures, palettes, shadows, labels, and animation timings unless included in scope.
- Do not reinterpret a small visual correction as permission to redesign a screen.
- Inspect the existing composition and stacking context before adding layers or changing `z-index`.
- Reuse existing textures and material constants instead of approximating them with unrelated CSS.

## Physical composition rules

- Separate contact shadows from broad directional shadows when material depth matters.
- Use subtle edges and static light gradients to communicate cardboard thickness; avoid expensive decorative filters.
- Treat embedded controls as paper/cardboard objects or printed/pressed regions, not default browser controls.
- Preserve the Ghost card as its own creation affordance.
- Keep CardStack previews lightweight and visually subordinate to the active TaskCard.
- Keep the prepared completion-reveal TaskCard distinct from CardStack preview layers.

## Animation and render-performance rules

- Prefer compositor-friendly `transform` and `opacity` animation.
- Avoid animating width, height, top, left, layout, blur, filter, or complex shadows unless the requested effect cannot be achieved otherwise.
- Avoid springs, bounce, keyframe complexity, or direction changes unless explicitly part of the requested physical behavior.
- Use stable React keys. Check for unintended remounts when a visual object should persist through a logical state transition.
- Avoid simultaneous opaque copies of the same full TaskCard when handing prepared state to active state; prevent double shadows, entrance animations, and one-frame flashes.
- Pre-render heavy visual content before revealing it when necessary. Use animation callbacks and `requestAnimationFrame` paint boundaries instead of guessed delays.
- Clean up timers, animation frames, native listeners, intervals, and subscriptions.
- Keep native wheel listeners stable and use `{ passive: false }` only when `preventDefault()` is necessary.
- Do not render full TaskCard components in normal CardStack layers or start countdown/effect logic in previews.
- Block conflicting interaction during fragile transitions instead of allowing state changes to race animation state.

## DEV geometry debugger workflow

For visually uncertain geometry involving several numeric parameters, consider a temporary DEV-only debugger/config workflow:

- expose only the relevant geometry values;
- allow live tuning without reload;
- show numeric values;
- provide `Copy config` and `Reset` when useful;
- keep debugger layout separate from production layout;
- guard it with `import.meta.env.DEV` so it does not render in production;
- freeze the selected baseline in the source config afterward;
- remove or retain the debugger only as explicitly requested.

Do not create a debugger for a trivial one-value visual adjustment.

## Animation-change workflow

1. Identify the physical object and its ownership.
2. Trace React state, keys, stacking, `AnimatePresence`, effects, and callbacks through the transition.
3. Determine whether the issue is timing, remounting, paint, layout, or rendering cost before optimizing.
4. Make the smallest change that addresses the demonstrated cause.
5. Preserve unrelated duration, easing, geometry, and visual baselines.
6. Build after animation-logic changes and perform runtime verification only when requested or required.

## Verification reporting

Distinguish clearly among:

- code inspection or static reasoning;
- successful TypeScript/Vite build;
- lint execution;
- actual browser interaction or visual observation;
- performance profiling.

Never report that a transition is visually smooth or free of frame drops unless it was actually observed or profiled. If browser tooling is unavailable, state that limitation.