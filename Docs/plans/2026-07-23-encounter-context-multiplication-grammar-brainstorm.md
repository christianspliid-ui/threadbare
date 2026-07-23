# Brainstorm companion — encounter context-multiplication grammar (THR-573)

Companion to `Docs/plans/2026-07-23-encounter-context-multiplication-grammar.md`. Captures the alternatives weighed, tensions surfaced, and Vision premises invoked during the design pass — written alongside the plan, not retrofitted.

## Considered alternatives

### 1. Compile-time surface expansion (rejected)

Generate N concrete `UnifiedActionTemplate`s from each skeleton at build time (one template per surface), rather than resolving fragments at render time. Pros: zero runtime machinery; every surface is a plain template the whole existing pipeline already understands. Cons, decisive: (a) explodes the registered pool ~15× and every registry consumer (catalog, orphan detection, beat grants, seeds' family prefix matching) would need dedup logic — the accounting cost lands everywhere; (b) surface identity would live in generated ids, drifting from Phase 0's `surfaceKey`, which already computes identity from *bound* context at selection time — two identity systems is one too many; (c) selection would have to pick among N near-identical templates instead of one template that adapts, distorting scoring weights. Runtime binding keeps one template = one scored candidate, with identity resolved exactly once (Phase 0) and prose following it.

### 2. Per-field variant maps without slot indirection (rejected)

Attach `Record<axisValue, string>` directly to each prose field (e.g. `narrativeVariants` beside `narrative`). Simpler-looking, but: (a) it scatters the multiplication declaration across every step, so nothing enumerates a template's surfaces without walking all prose fields — Rule 3 (measured counting, QA sweep) gets much harder; (b) two fields wanting the same place-texture would duplicate fragments; (c) no natural home for the `'*'`-required invariant. Named slots centralize declaration (`contextFragments` is the one place to look), enable reuse (`{frag:opening}` from any field), and make enumeration trivial.

### 3. Resolver-generated variation instead of authored fragments (rejected as backbone)

Lean on the graph-walking prose resolvers + sphere/omen vocabulary to differentiate surfaces without new authored content. Tempting because it is zero authoring cost — but it is precisely the "coloration" layer the grammar already classifies as free variation, and the parent design's diagnosis stands: enrichment-only swaps (`{name}`, vocab injection) do not make the *situation* read differently. The fence's margin problem and the noble's title problem are authored ideas, not resolvable decorations. Coloration stays; it just doesn't count as identity.

### 4. Personality as an identity axis (rejected for v1, recorded)

Multiplying on the target's axiological profile (e.g. a defiant vs deferential counterpart) was seriously considered — it is the most *simulationist* axis available. Rejected for v1 on legibility: the player cannot see a personality bucket the way they see a shrine or a fence, so surfaces would feel arbitrarily different rather than *situated* — and inspectability of experience is the spirit of NFP #2 applied to prose. Personality already expresses through selection, motive receipts (THR-631), and choice behavior. Revisit as v2 only with a player-legible personality surface to anchor it.

### 5. Faction stance as an identity axis (deferred with a path)

The Stellaris-style lever (same event, different empire relations). Real, but stance is a per-faction-pair value with unbounded combinations per template, and the counterpart's faction is not yet a first-class bound context on the cache entry. Deferring keeps v1's axes exactly congruent with `SURFACE_KEY_AXES` — the invariant "selection identity = prose identity" is worth more than a third axis. The v2 path: promote counterpart-faction-stance onto the cache entry first (selection side), then fragments follow — same order Phase 0 → this plan followed.

### 6. LLM-generated fragments at authoring time (out of scope, not rejected in principle)

Generated-within-constraints is the project's settled content stance; a future `template-context-rewrite` run could draft fragments with an LLM pass and gate them through the same scorer + editorial QA. Nothing in the grammar precludes it — fragments are just authored strings with provenance. Runtime generation stays rejected (determinism, tunability).

## Tensions surfaced

- **Volume vs the prose bar.** The central tension of the whole program. Resolution here: fragments are *fully authored* prose under the same scorer and 5-question bar as any content, and coloration variation is free — so scale comes from combinatorics of authored ideas, never from thinner writing. If Tier-2 surfaces ever read samey, the parent plan's ruling holds: it is a fragment-depth authoring problem, not a reason to abandon multiplication.
- **Axis congruence vs axis ambition.** More axes = more surfaces per skeleton, but every axis not in `SURFACE_KEY_AXES` splits prose identity from selection identity (novelty would repeat what prose says is new, or vice versa). v1 chooses congruence; new axes must land on the selection side first.
- **Declared-default invariant vs authoring burden.** Requiring `'*'` in every variants map is one more thing to author — accepted because the alternative (guarded prose, render-time throws, or silent blanks) re-opens exactly the fail-soft class the cast system's declared-key invariant closed. The default is also what makes a template's fragments safely partial (5 of 20 places authored is a valid, counted state).

## Vision premises invoked

- **Replayability-first** — the ~1,000-surface target and the 8–10-runs-before-repetition model are the quantified form of this premise; the grammar is its Tier-2 engine.
- **Narrative over mechanical perfection (NFP #5)** — multiplication is worthless if it reads as Mad-Libs; authored fragments anchored in real graph state are the guardrail.
- **Player-as-god** — untouched by design; fragments describe mortals acting in mortal places.
- **Generated-within-constraints, never pure LLM / never pure templates** — fragments are the constraint structure; enrichment supplies the graph-awareness.

## Loose ends consciously left

- Multi-variant-per-axis-value (rotating tavern openings) — schema-compatible future addition; seed offset reserved.
- Seen/unseen codex (replayability meta UI) — still deferred until there is volume to perceive.
- Tier-3 ambient grammar — parent Phase 3, untouched here.
- Whether aftermath prose fields should reference `{frag:*}` slots (v1 limits worked example to step narratives; the mechanism does not care, but the authoring guidance should grow one family at a time).
