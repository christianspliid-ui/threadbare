> **title:** `The world mints ambitions — world events write themselves into mortal desire — THR-726`
> **linear_issue:** THR-726
> **author:** `Claude Code (Fable design session, per user routing decision 2026-07-23)`
> **created:** 2026-07-23
> **three_pillars:** Engine `done` · Content `done` · UI `done — rides THR-721 surfaces + receipts; rationale inline`

# The world mints ambitions — THR-726

*Ambitions are the game's best-coupled system, but the world never puts wants into people:
a sacked hometown, a blighted harvest, a kin death mint nothing. This plan closes the loop —
your deeds become their desires, and motive receipts say so out loud.*

## Why this is load-bearing

`assignInitialAmbitions` reads only the agent's own snapshot (call sites: `worldSeed.ts`,
`agentLifecycle.ts` births, `ambitionTick.ts` re-eval). Meanwhile the downstream pipeline is
live and audited: `pursues` edges, milestone progress, `applyAmbitionBoost` biasing scene
choice, and **motive receipts** carrying ambition provenance into foreshadowing. Minting
ambitions from world events multiplies the consequence of *every existing player verb* with
zero new UI — blight fields and mortals mint *leave-this-land* and *revenge-on-the-heavens*
wants, then visibly act on them, and receipts read "because the fields were blighted."
Assessment: `Docs/audits/2026-07-23-simulation-coupling-assessment.md` (opportunity #3).

## Engine pillar

### Systems design

A minting pass **inside the existing `ambitionTick` re-eval cadence** (extend, don't fork):

1. On each re-eval interval, for each agent with a free ambition slot, scan for
   **qualifying event nodes** within `MINT_LOOKBACK_TICKS` that touch the agent: events at
   the agent's hex/home settlement (via `occurred_at` + located_at resolution) or events
   the agent `participated_in` (graph-native event nodes, TB-077 substrate — deterministic,
   no transient-event dependence).
2. Match against the **minting rules table** (`AMBITION_MINTING_RULES`, data): event class ×
   agent relation (witness / local / victim / kin) → candidate ambition template + weight.
   Personality still gates: candidates run through the existing `selectAmbitions` scoring
   so a craven agent mints *flee* where a proud one mints *revenge* from the same ruin.
3. Cap: at most `MINT_MAX_PER_EVENT` agents mint from any single event (deterministic
   selection by weighted-then-seeded order — one razed town produces a handful of avengers,
   not fifty), and at most one minted ambition per agent per re-eval.
4. **Provenance:** the minted `pursues` edge carries `mintedByEventId` (+
   `mintedByLabel` for prose). `motiveReceipt` composition reads it so foreshadowing can
   name the origin (its ambition term already carries provenance detail — extend that
   field, additive).

### Graph nodes / edges

No new types. New **edge properties** on `pursues`: `mintedByEventId?: string`,
`mintedByLabel?: string` (property-bag addition, additive).

### Tick phases

No new phases — rides `phaseAmbitionProgress` / `ambitionTick`'s existing
`AMBITION_REEVAL_INTERVAL` cadence. The scan is bounded: only agents with free slots, only
events in the lookback window.

### Resolution logic

Candidate selection reuses `selectAmbitions` (personality-weighted, threshold-gated);
minting only *supplies candidates + weights*, never bypasses the funnel.

### PRNG callouts

Weighted tie-breaks and the per-event agent cap use the phase-scoped seeded rng (same
stream discipline as `ambitionTick`'s existing `assignInitialAmbitions` calls).

## Content pillar

### Encounter templates

N/A — no encounter changes; minted ambitions flow into scene choice through the existing
`applyAmbitionBoost`.

### Prose tables

Receipt phrasing for minted origins ("for the blighted fields", "for the fallen of
{settlement}") — extend the motive-receipt phrase table, Threadbare voice, no digits.

### Attachment content

N/A.

### Data tables

- `AMBITION_MINTING_RULES` (new, `src/data/ambition-minting-rules.ts`): event class ×
  relation → template id + weight. Content, not code — the living world's emotional logic
  is this table.
- New ambition templates in `ambition-templates.ts` for event-minted themes: revenge,
  protect-the-home, flee-the-land, rebuild, found-anew (~`MINT_TEMPLATE_COUNT`). **Use the
  existing milestone predicate vocabulary only** (`agent_has_trait`, `agent_reach_above`,
  `target_agent_eliminated` with `$killer`-style refs — a revenge-shaped predicate already
  exists; reuse before minting new predicate types. A new predicate type is out of scope.)

## UI pillar

*Screenshot tool: Playwright (DOM — Journey tab / foreshadowing surfaces).*

### Player-facing display

Minted ambitions ARE ambitions — they surface exactly where ambitions surface (Journey
tab / strand view; visibility work is THR-721's scope, related ticket). The distinctive
addition is **provenance in motive receipts**: the foreshadowing surface reads "she seeks
vengeance for the blighted fields." No new component; explicit N/A-with-rationale beyond
receipt phrasing.

### Event notifications

Minting itself is silent (desire is interior); the existing ambition-completion alerts
carry the payoff. Optional entity-notice badge reuse only if it falls out free.

### Debug inspection (DebugPanel)

`ambition_minted` aggregate trace (below); minted edges visible in existing graph/trace
views via the provenance property.

### Visual presence (HexMapV2)

N/A.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| minting pass (in `ambitionTick.ts`) | 2.32/2.33 (existing) | Journey tab (via THR-721) | `pursues` edges + props | `ambition_minted` (aggregate) | trace viewer |
| `ambition-minting-rules.ts` | — (data) | — | — | — | CMS registry |
| receipt provenance (in `motiveReceipt.ts`) | scoring/receipt composition (existing) | foreshadowing surface | — | existing receipt trace | receipt view |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `MINT_LOOKBACK_TICKS` | 25 | Event window scanned at each re-eval (matches `AMBITION_REEVAL_INTERVAL`) |
| `MINT_MAX_PER_EVENT` | 4 | Cap on agents minting from one event |
| `MINT_BASE_CHANCE` | 0.6 | Chance a qualifying candidate is offered into `selectAmbitions` |
| `MINT_TEMPLATE_COUNT` | 6 | Event-minted ambition templates authored in v1 |

## Tracing

```ts
// ambition_minted — ONE aggregate entry per re-eval tick (never per-agent; trace-volume rule)
interface AmbitionMintedTrace {
  type: 'ambition_minted';
  // mintedCount: number; byEventClass: Record<string, number>; sampleAgentIds: string[]; // capped sample
}
```

Register in `TRACE_CATEGORIES`; beware the `emitTrace` Omit-collapse trap (only `tsc -b`
catches rejected extra fields).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No minting rule matches an event class | event ignored — unlisted classes are inert by design |
| Agent has no free slot | skip (v1 never replaces existing ambitions) |
| Event node missing/unresolvable location | skip that event, no throw |
| Template id in rules table doesn't exist | skip + one aggregate failSoft note (content bug made visible, not fatal) |
| Receipt finds no `mintedByLabel` | falls back to existing generic ambition phrasing |

## Interface impact

Registry rows pre-seeded by this design session (deferralTicket THR-726):
`world-events-mint-ambitions` (UNWIRED — minting symbols don't exist yet) and
`minted-ambition-provenance` (UNWIRED — receipts can't yet name origins). Actions: **add**
Encounters/War/Economy-events→Ambitions (minting), **add** Ambitions→Omens (receipt
provenance, extending the existing verified ambition→receipt row). Executor flips green
with run evidence.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (rides THR-721 + receipts; rationale inline)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted — this is the living-world premise distilled: history
  writes desire, desire writes history.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes — no new verbs/costs/clocks; mortals' inner lives deepen.
- [x] Rulebook untouched (agent-behavior reference pages update at closeout per wiki DoD).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 4 constants + two data tables carry all feel |
| 2. Inspectability | PASS | aggregate mint trace + edge provenance + receipts |
| 3. Determinism | PASS | graph-native event scan + seeded rng; no transient-event dependence |
| 4. Fail-soft | PASS | inert-by-default for unlisted classes; content bugs degrade to skips |
| 5. Narrative over mechanical perfection | PASS | receipts naming origins is the point |
| 6. Additive over destructive | PASS | property-bag additions + candidate supply; funnel untouched |
| 7. Performance budget | PASS with note | scan bounded to free-slot agents × lookback window; reuse the re-eval loop's agent iteration, no second full pass |

## Done when

- [ ] CLI: force a battle or `loc.blight` (debug spawn/fireAction), advance past one
  re-eval interval → themed `pursues` edges with `mintedByEventId` on nearby agents,
  count ≤ `MINT_MAX_PER_EVENT`; paste `eval` output + the aggregate trace line
- [ ] A motive receipt naming the origin event appears in traces for a minted-ambition
  agent's scene choice
- [ ] 120-tick standard run: minting occurs organically (>0) without flooding
  (total minted within sane band; report the count)
- [ ] Registry rows flipped green with evidence; generator green
- [ ] `npm test` + `npx vite build` pass; `tsc -b` net-new diff clean; 30-tick engine smoke
- [ ] Closing commit + PR body include `Fixes THR-726`
- [ ] Browser-verify: Journey tab showing a minted ambition + console at 1920×1080
  (Playwright), `__DEBUG` assertion on a minted edge

## Coordination block

**Suggested model:** opus — bounded extension of a healthy pipeline with a precise spec
(advisory; the automation runs Opus regardless).

**Parallel-safe with:** THR-724 (secrets modules disjoint), THR-725 (must NOT edit
`encounterScoring.ts` — reads ambition boost only through existing seams).

**Mutex with:** THR-721 on `ambition-templates.ts` / ambition UI files if run
concurrently; `scripts/interface-contracts.ts` with the other coupling tickets (land
registry edits serially).

**Files to touch:**
- Create: `src/data/ambition-minting-rules.ts`
- Edit: `src/engine/ambitionTick.ts`, `src/engine/foreshadowing/motiveReceipt.ts`,
  `src/data/ambition-templates.ts`, `src/types/ambition.ts` (edge-prop typing if typed),
  `src/types/trace.ts` (+ TRACE_CATEGORIES), `scripts/interface-contracts.ts`, CMS registry

## Notes for the executor

- **Never bypass `selectAmbitions`** — minting supplies candidates; personality decides.
  That interplay (craven flees, proud avenges) is the design, not an implementation detail.
- Event scanning is graph-native (event nodes + `occurred_at`/`participated_in`), not
  `state.events` — transient tick events don't survive to the re-eval boundary.
- v1 never replaces held ambitions; "minted ambitions can displace stale secondaries" is
  explicitly out of scope (note as a possible future ticket at closeout if it itches).
- Milestone predicates: reuse existing vocabulary only; a new predicate type is scope creep.

## Forked-audit verdicts

**Skipped with recorded rationale (2026-07-23):** intent was verified interactively by the
user across the originating session (coupling assessment → player-lens verdicts → model
routing decision → "feel free to do the outstanding design work"), the interface framework
these plans instantiate passed an adversarial cold-context Fable review the same day
(verdicts in `Docs/plans/2026-07-23-system-interface-map.md` tail), and every diagnosis
claim here is runtime/grep-verified rather than intention-transcribed. Chat approval
satisfies the human gate (THR-608). Executor guardrail: if the substrate diverges from the
diagnosis, stop and surface — do not adapt silently.
