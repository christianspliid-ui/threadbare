> **title:** `Economy answers the god — economic context in encounter scoring/seeding — THR-725`
> **linear_issue:** THR-725
> **author:** `Claude Code (Fable design session, per user routing decision 2026-07-23)`
> **created:** 2026-07-23
> **three_pillars:** Engine `done` · Content `done` · UI `done — debug surface + scenes ARE the display; rationale inline`

# Economy answers the god — THR-725

*The player already holds four economic verbs that verifiably move prosperity — and the
world never says anything back. This plan closes link 4 of the player-loop chain with an
economic-context term in scene selection plus shock-seeded scenes, using zero new UI.*

## Why this is load-bearing

Bless the Harvest, Blight the Fields, Open the Markets, and Reveal the Vein are granted,
playable, and mechanically real (`loc.blight` lowers `prosperity` + `populationHealth` and
drags staple stocks toward Famine — verified in `action-technical-effects.ts`). But
`encounterScoring.ts` contains **zero** prosperity/economic/wealth terms: a blighted
province produces no desperation scenes, a boom produces no festivals. The M3 project's own
promised system ("economic context modifying encounter scoring") is the missing feedback
beat of shipped player actions. Evidence + player-lens verdict:
`Docs/audits/2026-07-23-simulation-coupling-assessment.md` (opportunity #2).

**Pattern to extend, not invent:** `battleAftermath.ts` already does economy-driven scene
response (prosperity loss → refugee encounters at adjacent settlements). This plan
generalizes that pattern to ambient economic state.

## Engine pillar

### Systems design

Two mechanisms, both additive:

1. **Ambient scoring term.** A new `economicContextBonus` in the encounter-scoring pipeline
   (alongside `ambitionBoost` / `personalityBias` / `reputationBonus`): for a candidate
   encounter at/near a settlement, read the settlement's prosperity (existing property
   maintained by `phaseProsperity`) and apply a family-affinity weight. **No template type
   changes** (avoids the 291-importer `unifiedAction.ts` blast radius): affinity comes from
   a new data table `ECONOMIC_SCENE_AFFINITY` mapping template family prefixes (e.g.
   `tavern.`, `social.trade`, `crime.`, `guild.`) → `{ boomWeight, bustWeight }`. Bonus =
   `ECON_SCORING_WEIGHT × deviation × familyWeight`, where deviation is prosperity's signed
   distance outside the `[ECON_BUST_THRESHOLD, ECON_BOOM_THRESHOLD]` neutral band, capped
   at `ECON_SCORING_CAP`.
2. **Shock seeding.** On a per-tick prosperity delta beyond `ECON_SHOCK_DELTA` (the four
   verbs, battle aftermath, and any future cause all qualify — cause-agnostic by design),
   seed `ECON_SHOCK_SEED_COUNT` themed encounter seeds at the settlement via the existing
   `PendingEncounterSeed` substrate (THR-697 seed v2 — `inheritContext` threads the
   location). Boom shocks seed opportunity families; bust shocks seed desperation families.

### Graph nodes / edges

None new. Reads settlement `prosperity` / stock tiers; writes only encounter seeds through
the existing seed pipeline.

### Tick phases

No new phases. The scoring term lives inside existing candidate scoring; shock detection
rides `phaseProsperity` (which already computes the deltas it would report).

### Resolution logic

Scoring-term math above; deterministic given graph state. Seed maturation uses the
existing seed-v2 eligibility mirror (actorAffinities + location-subtype + not-busy).

### PRNG callouts

Shock seeding uses the phase-scoped seeded rng for family selection within the themed pool.
The scoring term is deterministic (no rng).

## Content pillar

### Encounter templates

No new bespoke templates in v1. The themed pools reference **existing** families
(tavern/social/crime/guild/borderland); volume variety comes from Tier-2
`contextFragments` (THR-573 machinery) with boom/bust place-fragments —
`ECON_FRAGMENT_COUNT` fragments per polarity.

### Prose tables

Boom/bust context fragments carry the economic mood ("grain-heavy wagons", "shuttered
stalls") — authored under `prose-content-systems` conventions, Threadbare voice.

### Attachment content

N/A.

### Data tables

`ECONOMIC_SCENE_AFFINITY` (new, `src/data/economic-scene-affinity.ts`): family-prefix →
weights. Every row is content, not code — tuning the economy's story response is editing
this table (NFP #1).

## UI pillar

*Screenshot tool: Playwright (DOM — DebugPanel scoring breakdown).*

### Player-facing display

**The scenes themselves are the display** — that is the point of the design: the payoff of
economic verbs arrives as story, through surfaces that already exist (encounter feed,
chronicle). No new player-facing component; explicit N/A with this rationale.

### Event notifications

Shock seeds surface through existing seed→encounter→notification flow; no new channel.

### Debug inspection (DebugPanel)

The scoring-breakdown view (which already renders per-term contributions) gains the
`economicContextBonus` line. This is the browser-verify target.

### Visual presence (HexMapV2)

N/A for v1 — prosperity already has map presence via settlement tiers.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| scoring term (in `encounterScoring.ts`) | agent decision (existing) | DebugPanel scoring breakdown | — (derived) | breakdown field on existing scoring trace | breakdown view |
| shock detection (in `phaseProsperity`) | 6.63x (existing) | — | `pendingEncounterSeeds` | `econ_shock_seeded` | trace viewer |
| `economic-scene-affinity.ts` | — (data) | — | — | — | table in CMS registry |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ECON_SCORING_WEIGHT` | 0.15 | Global multiplier for the economic scoring term |
| `ECON_SCORING_CAP` | 0.5 | Cap on the term's absolute contribution |
| `ECON_BOOM_THRESHOLD` | 0.7 | Prosperity above this = boom deviation |
| `ECON_BUST_THRESHOLD` | 0.3 | Prosperity below this = bust deviation |
| `ECON_SHOCK_DELTA` | 0.15 | Per-tick prosperity swing that triggers shock seeding |
| `ECON_SHOCK_SEED_COUNT` | 2 | Seeds planted per shock |
| `ECON_SHOCK_SEED_TTL` | 24 | Ticks a shock seed stays viable |
| `ECON_FRAGMENT_COUNT` | 6 | Boom/bust context fragments per polarity (content) |

## Tracing

```ts
// econ_shock_seeded — emitted once per shock event (aggregate, never per-seed)
interface EconShockSeededTrace {
  type: 'econ_shock_seeded';
  // settlementId: string; delta: number; polarity: 'boom' | 'bust'; seedIds: string[]; cause?: string;
}
```

The scoring term extends the **existing** scoring-breakdown trace with one field — beware
the `emitTrace` Omit-collapse trap (union types reject extra fields silently anywhere but
`tsc -b`); follow the per-member-Omit helper pattern if the union complains.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Candidate has no resolvable settlement/prosperity | term contributes 0 (neutral), no trace |
| Affinity table has no row for a family | weight 0 — unlisted families are economically neutral by design |
| Shock fires where no themed template is eligible | seeds simply never mature (existing seed TTL behavior) |
| Prosperity property missing/NaN | treat as neutral band; one aggregate failSoft trace per tick max |

## Interface impact

Registry rows pre-seeded by this design session (deferralTicket THR-725):
`economy-context-scene-scoring` (UNWIRED — symbol `economicContextBonus` does not exist
yet) and `economy-verbs-answered` (LEAKED — link 4 of the player-loop chain for the four
granted verbs). Actions: **add** Economy→Encounters (scoring), **add** Economy→Encounters
(shock seeding), **extend** the verbs' player-loop rows to link 4. Executor flips rows
green with run evidence. **Stretch decision recorded:** pressure-driven migration
(`MIGRATION_CHANCE` flat 0.02) is explicitly **deferred** — executor opens the Deferral
issue at closeout (create-then-reference; never predict ids) and cites it in a registry row.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (debug surface; player display is the scenes themselves, rationale inline)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted — directly serves the living-world premise (M3) and
  the omen/cool-failure direction (busts create pressure, not dead air).
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes — no new verbs, costs, or prerequisites; the world's
  *response* deepens.
- [x] Rulebook untouched; the economic-verbs row may gain an `[IMPL]` note about visible
  consequences in the closing PR (optional).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 8 named constants + a data table; feel changes = table edits |
| 2. Inspectability | PASS | breakdown field + aggregate shock trace |
| 3. Determinism | PASS | scoring deterministic; seeding uses phase rng |
| 4. Fail-soft | PASS | neutral-contribution fallbacks throughout |
| 5. Narrative over mechanical perfection | PASS | the entire feature is "numbers become story" |
| 6. Additive over destructive | PASS | no type changes, no refactors; new term + new table |
| 7. Performance budget | PASS with note | prosperity lookup per candidate must reuse the candidate's already-resolved location — no extra graph walks per score |

## Done when

- [ ] CLI: cast/force `loc.blight` on a settlement (via `__DEBUG.fireAction` or spawn), run
  ≤ `ECON_SHOCK_SEED_TTL` ticks → ≥1 economically-themed scene at/near it; paste trace lines
- [ ] CLI: 120-tick standard run shows nonzero `economicContextBonus` contributions in
  scoring breakdowns at boom/bust settlements
- [ ] Registry rows for THR-725 flipped green with evidence; generator green
- [ ] `npm test` + `npx vite build` pass; `tsc -b` net-new diff clean; 30-tick engine smoke
- [ ] Closing commit + PR body include `Fixes THR-725`
- [ ] Browser-verify: DebugPanel scoring breakdown showing the econ term at 1920×1080
  (Playwright), console clean, `__DEBUG` assertion on a seeded shock

## Coordination block

**Suggested model:** opus — spec is bounded, math is small, content is fragment-writing
(advisory; the automation runs Opus regardless).

**Parallel-safe with:** THR-724 (secrets modules disjoint), THR-726 (ambition modules
disjoint) — except the shared files below.

**Mutex with:** anything editing `encounterScoring.ts` (THR-726 reads it but must not edit;
confirm), `phaseProsperity.ts`, or `scripts/interface-contracts.ts` (all three coupling
tickets — land registry edits serially, regenerate on conflict).

**Files to touch:**
- Create: `src/data/economic-scene-affinity.ts`, boom/bust fragments file (or extend the
  existing fragments tables per THR-573 conventions)
- Edit: `src/engine/encounterScoring.ts`, `src/engine/phaseProsperity.ts`,
  `src/types/trace.ts` (+ TRACE_CATEGORIES), `scripts/interface-contracts.ts`, CMS registry
  (affinity table browsable)

## Notes for the executor

- **Do not add a field to `UnifiedActionTemplate`** for affinity — the family-prefix data
  table exists precisely to avoid the 291-importer blast radius. If prefixes prove too
  coarse, widen the table's key format, not the type.
- Shock seeding is cause-agnostic on purpose: battles, verbs, and future systems all
  qualify via the same prosperity-delta test. Do not special-case the four cards.
- The scoring pipeline is order-sensitive and heavily tested — add the term where
  `reputationBonus` folds in (THR-641 precedent) and follow its test structure.

## Forked-audit verdicts

**Skipped with recorded rationale (2026-07-23):** intent was verified interactively by the
user across the originating session (coupling assessment → player-lens verdicts → model
routing decision → "feel free to do the outstanding design work"), the interface framework
these plans instantiate passed an adversarial cold-context Fable review the same day
(verdicts in `Docs/plans/2026-07-23-system-interface-map.md` tail), and every diagnosis
claim here is runtime/grep-verified rather than intention-transcribed. Chat approval
satisfies the human gate (THR-608). Executor guardrail: if the substrate diverges from the
diagnosis, stop and surface — do not adapt silently.
