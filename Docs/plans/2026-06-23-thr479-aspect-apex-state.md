# Influence "Aspect" apex state — design

**Issue:** THR-479 (child of THR-414 verdict #1)
**Date:** 2026-06-23
**Status:** Design complete — director verdicts captured, ready for implementation handoff
**Parent design:** THR-414 rulebook Phase 1 review pass; sibling THR-478 (tier name-map rename, in Codex)

---

## Premise

The Influence Tier scale stays **five integer rungs** (`InfluenceTier = 0|1|2|3|4`, renamed by THR-478 to Unaware / Curious / Recognized / Devoted / Enthralled). "Aspect" — a mortal becoming a partial *aspect of the god* — is **not a sixth rung**. It is a distinct apex milestone reached only by a small number of mortals over a run, beyond the top of the tier ladder.

This doc designs what "Aspect" is, now that the tier vocabulary no longer holds it.

## Director verdicts (2026-06-23)

| # | Question | Verdict |
|---|----------|---------|
| 1 | **Trigger** | **Capstone encounter / agreement.** A mortal who has reached the top of the tier ladder can be offered an apotheosis encounter/covenant; resolving it grants Aspect. Not automatic-on-threshold, not a raw rarity gate. |
| 2 | **Effects** | **Hybrid — light mechanics + heavy narrative.** A modest, tunable mechanical grant plus strong narrative gravity. No power spike. |
| 3 | **Reversibility** | **Permanent + survives death.** Once an Aspect, always an Aspect. Death turns the mortal into lasting myth/echo; the apex is never lost. |
| 4 | **Representation** | (agent recommendation, confirm at impl) **New `aspect_of` graph edge** (ascendant → mortal). Per the load-bearing rule "relationships are edges": being an aspect *of a god* is a distinct relationship from being *threaded by* that god, so it earns its own edge rather than a flag on the `thread` edge. |
| 5 | **Surfacing** | (agent recommendation) **Prose-first, three touchpoints:** chronicle beat at attainment, an "Aspect" badge in the retinue/ThreadsPanel, and aspect-flavored thread-detail prose. |

---

## Core model

An Aspect is the terminal of a *relationship*, not a level of a *score*. The existing `thread` edge (god → mortal) already carries `tier`. When a tier-4 (Enthralled) mortal resolves the apotheosis capstone, a **new `aspect_of` edge** is created from ascendant → mortal. The `thread` edge persists unchanged; `aspect_of` is the additive apex marker that other systems read.

Why a new edge and not a property on `thread`:
- "is an aspect of \<god\>" is a *relationship of a different kind* than "is threaded by \<god\>" — apotheosis is partial incarnation, not deeper influence. The load-bearing decision says model distinct relationships as edges.
- Survives death cleanly: when the mortal dies, the `thread` edge may be torn down by normal death handling, but `aspect_of` is explicitly **never garbage-collected** — it is what makes the dead Aspect a persistent myth.
- Bounded cardinality (a handful per run) — no traversal-cost concern.

---

## Trigger pipeline (capstone encounter)

1. **Eligibility.** A `thread` edge at `tier === 4` (Enthralled) that has held tier 4 for `ASPECT_ELIGIBILITY_TICKS` becomes eligible to *seed* the apotheosis capstone. (Holding-time, not instant, so apotheosis reads as earned, not mechanical.)
2. **Seeding.** The apotheosis encounter (`encounter.apotheosis.ascension`, a **Tier-1 bespoke marquee** per THR-467 tiering) is seeded onto the eligible mortal via the standard encounter-seed path. It is a curated, player-spotlight beat — never ambient/auto-resolve.
3. **Resolution.** The encounter is a covenant: the player (as god) offers apotheosis; the mortal accepts, refuses, or is unmade by it (fail-forward branch). Only the accept terminal applies the grant.
4. **Grant.** The accept aftermath reaction runs a new graph op `grant_aspect`, which:
   - creates the `aspect_of` edge (ascendant → mortal) with `AspectEdgeProperties`,
   - emits an `aspect_attained` trace,
   - queues the Aspect chronicle beat.

Refusal/unmaking leave the mortal at tier 4 (the offer can recur after a cooldown — `ASPECT_REOFFER_COOLDOWN_TICKS`).

---

## Three pillars

### Engine

- **New edge type** `aspect_of` added to `EdgeType` union (`src/types/graph.ts`), with `AspectEdgeProperties`:
  ```ts
  export interface AspectEdgeProperties {
    attainedTick: number;
    originEncounterId: string;   // the apotheosis encounter instance
    sourceTier: InfluenceTier;   // always 4 at grant; recorded for audit
    survivesDeath: true;         // invariant; documents the never-GC contract
    mythicEcho?: boolean;        // set true when the mortal dies (aspect becomes myth)
  }
  ```
- **New graph op / aftermath reaction kind** `grant_aspect` (register in the systemic wiring guide). Pure, idempotent: creating a second `aspect_of` for the same pair is a no-op.
- **Eligibility predicate** in the encounter-seeding phase: tier-4 thread held ≥ `ASPECT_ELIGIBILITY_TICKS` → seed `encounter.apotheosis.ascension`. Fail-soft: if the thread is gone at seed time, skip silently.
- **Essence contribution** (the "light mechanic"): each living Aspect contributes `ASPECT_ESSENCE_PER_TICK` to the god's pool in `essenceIncome.ts` — a living conduit. Tunable, modest (default below the value of a place of power).
- **Narrative-gravity bump** (the other half of "light mechanic"): on grant, raise the mortal's importance/rarity weighting by `ASPECT_GRAVITY_BONUS` so the Aspect is more likely to anchor future curated encounters (feeds the portfolio-scan loop). No combat/capability inflation.
- **Death handling.** When an Aspect mortal dies, do **not** remove `aspect_of`; set `mythicEcho = true`, retain the (now-deceased) mortal node so chronicle/thread surfaces can still resolve it, and stop the essence contribution (a myth no longer channels). Add the dead Aspect to the mythic-echo set the Twilight/chronicle layer can harvest.
- **Tracing.** `aspect_attained` (grant), `aspect_echoed` (death→myth). Register both in `TRACE_CATEGORIES`.

### Content

- **`encounter.apotheosis.ascension`** — Tier-1 bespoke marquee, authored to the meeting-encounter prose bar (the quality benchmark). A covenant beat: the god offers to make the mortal an aspect of itself; branches = accept / refuse / unmade. Prose-first, no exposed numbers. Author via `encounter-pipeline` (bespoke quality engine).
- **Aspect chronicle beat** — the attainment moment as a chronicle entry; mythic register.
- **Aspect thread-detail prose** — aspect-flavored copy for the thread detail panel (distinct from tier-4 Enthralled copy).
- **Mythic-echo prose** — copy for a dead Aspect surfaced as lasting myth.
- All content holds the Threadbearer voice contract and the player-as-god framing (the player offers; the mortal answers).

### UI

- **Retinue / ThreadsPanel "Aspect" badge** — distinct from `courtPosition`; reads the `aspect_of` edge, not the tier. Shows on both living Aspects and mythic echoes (echo styled as faded/past-tense).
- **Thread detail** — Aspect section with the aspect-flavored prose and the attainment chronicle link.
- **Chronicle** — the attainment beat appears in the event feed/chronicle.
- **DebugPanel + `__DEBUG`** — inspect the `aspect_of` edge, `AspectEdgeProperties`, eligibility state, and a `window.__DEBUG`-readable list of current aspects/echoes for the browser-verify artifact.

### Wiring

| Module | Hook |
|--------|------|
| Encounter seeding phase | eligibility predicate → seed apotheosis encounter |
| Aftermath resolution | `grant_aspect` reaction kind on accept terminal |
| `essenceIncome.ts` | per-aspect essence contribution (living only) |
| Death/cleanup phase | retain node + edge, set `mythicEcho`, stop contribution |
| `retinue.ts` | expose aspect/echo state to ThreadsPanel selectors |
| Chronicle/Twilight | consume `aspect_attained` / mythic-echo set |
| `traceBuffer` / `TRACE_CATEGORIES` | register the two new trace categories |
| Systemic wiring guide | document `grant_aspect` graph op + `aspect_of` edge for content authors |

---

## Constants (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `ASPECT_ELIGIBILITY_TICKS` | 60 | Ticks at tier 4 before the apotheosis capstone can seed (~2 months on top of the 180-tick climb to tier 4). |
| `ASPECT_REOFFER_COOLDOWN_TICKS` | 90 | Cooldown after a refused/failed apotheosis before it can re-seed. |
| `ASPECT_ESSENCE_PER_TICK` | 0.3 | Living-conduit essence trickle per Aspect (below `ESSENCE_PER_PLACE_OF_POWER = 0.5`). |
| `ASPECT_GRAVITY_BONUS` | tunable weight | Importance/rarity bump so Aspects anchor curated encounters more often. |

All live in a named constants block (influence-content or a dedicated aspect-content module).

## Tracing (NFP #2)

```ts
interface AspectAttainedTrace { type: 'aspect_attained'; ascendantId: string; mortalId: string; tick: number; originEncounterId: string; }
interface AspectEchoedTrace   { type: 'aspect_echoed';   ascendantId: string; mortalId: string; tick: number; }
```

## Fail-soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| Thread edge missing at seed time | Skip seeding silently; no throw. |
| `grant_aspect` on a pair that already has `aspect_of` | No-op (idempotent). |
| Aspect mortal node missing when surfacing | Treat as mythic echo; render generic myth copy. |
| Apotheosis encounter content missing | Seeding no-ops; logged once; tier-4 mortal simply never ascends (no crash). |

## Blast radius

`src/types/graph.ts` `EdgeType` is widely imported. Adding a union member is **additive**; TypeScript will flag any exhaustive `switch` over `EdgeType` that needs a new case (search edge-type switches — most use `default`/fall-through). No schema rewrite. Low cascade risk.

## NFP compliance

| NFP | Status |
|-----|--------|
| 1 Tunability | PASS — all four levers are named constants. |
| 2 Inspectability | PASS — two traces, DebugPanel + `__DEBUG` reads, graph edge is queryable. |
| 3 Determinism | PASS — eligibility is tick-counted; grant is encounter-driven through the seeded PRNG path. |
| 4 Fail-soft | PASS — table above; every path no-ops rather than throws. |
| 5 Narrative over mechanical | PASS — hybrid leans narrative; mechanic is a modest trickle, the weight is chronicle/myth. |
| 6 Additive | PASS — new edge, new graph op, new content; nothing removed (tier scale untouched; THR-478 handles the rename). |
| 7 Performance | PASS — handful of edges per run; per-tick essence sum is O(aspects). |

## Open follow-ups (do not block)

- UL-proposal: formalize "Aspect" vs the five tier names in the Influence/Retinue shard (the apex is now a separate concept).
- If apotheosis proves too rare/common in playtest, tune `ASPECT_ELIGIBILITY_TICKS` (no code change — NFP #1).
- Twilight Phase could feature mythic echoes as closing-chapter material (ties to THR-414 open question #6).
