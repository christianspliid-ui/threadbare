> **title:** Raise the Old Banner — a hero descended from a dead empire can come to want a piece of its old land back, as a drive with no one to blame — THR-1658
> **linear_issue:** THR-1658
> **author:** Claude Code (design lane, run 2026-10-03a)
> **created:** 2026-10-03
> **three_pillars:** Engine `done — one template field (a descent gate), two milestone conditions, one provenance label on the existing re-evaluation path` · Content `done — one ambition template with its milestones, prose and strategic profile; one rulebook paragraph` · UI `done — the drive reads on the existing ambition card ("Because of the old blood of …"); one debug accessor; no new component`

# Raise the Old Banner — THR-1658

*Worldgen now gives about a quarter of the mortals on a dead empire's land descent from it. Nothing reads that as a want. This plan lets a hero of that blood, when they are free to want something new, come to want the old land under their hand again: walk the stones their forebears left, and take a piece of the old ground for themselves. Nobody living is blamed for an empire that fell centuries ago, so the want is a drive, never a vendetta.*

## Why this is load-bearing

[A world with a past](2026-09-28-thr-1631-world-with-a-past.md) (THR-1631) writes descent on mortals living on a dead empire's land (`backstoryStrata: [{ cultureId, relation: 'descent' }]` + `originCultureId`, `worldPast.ts:457-486`). Its Lane decision 5 kept `reclaim_homeland` out of the t0 mint because the template's only rule is a `holding_seized` victim with a living culprit (`ambition-minting-rules.ts:206-209`), and filed this deferral. The living-world map's audit, which Christian agreed when he chose option A ("explain the map") on [A world with a past](https://linear.app/threadbare/issue/THR-1591), named `reclaim_homeland` as one of the ambitions "that today have no holder at t0" (plan § Why, gap 7). So the want is agreed; what it should be is this plan.

**Measured on current main** (`034dac21`; [census reader](../audits/2026-09-25-living-world-data/readers/descent-homeland.ts), [output](../audits/2026-09-25-living-world-data/output/descent-homeland-2026-10-03-thr1658.json); seeds 42 / 99 / 7, medium map, unattended, 150 ticks):

| | 42 | 99 | 7 |
|---|---|---|---|
| Mortals with descent (all) | 127 | 135 | 136 |
| Living deciders at t0 / of those with descent ("heirs") | 20 / **3** | 23 / **3** | 22 / **6** |
| Heirs with a free ambition slot at t0 | 0 | 1 | 0 |
| Heirs off their ancestors' land, t0 → t150 | 0 → 0 | 0 → 0 | 0 → 0 |
| Who holds an heir's home town (Realm / other faction / nobody) | 1 / 1 / 1 | 0 / 1 / 2 | 1 / 1 / 4 |
| Nearest elder ruin of the heir's own empire, hexes (min / median / max) | 2 / 2 / 2 | 1 / 2 / 4 | 0 / 1 / 2 |
| Heirs who stood on a hex with an ancestral ruin at some tick in 150 | 1 | 1 | 3 |
| Share of heir-ticks with a free slot | 13.5% | 16.4% | 18.7% |
| Heirs who had a free slot at some tick | 1 | 1 | 3 |
| Holdings (`owns`, `acquiredTick > 0`) taken by any decider in 150 ticks | 4 (by 2) | 6 (by 4) | 7 (by 5) |
| Heirs already holding a Place on their ancestors' land at t0 | 0 | 0 | 3 of 6 |
| `reclaim_homeland` minted by any route in 150 ticks | 0 | 0 | 0 |
| `loyalty`-basis ties held by any decider at t150 | 0 | 0 | 0 |

Two further reads, from the same reader at t150: every living heir passes `reclaim_homeland`'s reach floors (iron 0.3, heart 0.3), and its desirability profile ranks **first** among the 7–8 refill templates the heir has not yet pursued in 8 of 9 heirs, second in the ninth (`passesEligibility` / `scoreDesirability`, one shared seed per heir, so the rank is indicative, not exact).

**What these numbers mean.**

1. **A descendant is not an exile.** Every heir lives on the old land and stays there. `reclaim_homeland` is the exile's drive: its milestone `reclaim_return` (`agent_in_origin_region`) is the whole story, and its abandonment trigger fires when the exile settles somewhere else. Handed to someone who never left, *return* is true as soon as residence is first observed (tick 15, `agentResidence.ts` header), and the drive is half done on arrival. It cannot be the descendant's want.
2. **The holder of the old land is mostly nobody.** 7 of 12 heirs' home towns are held by no faction. A rule that names "the Realm now holding the land" as the obstacle has no obstacle to name most of the time, and a grievance would have no culprit (decision D2).
3. **The slot, not the descent, is the bottleneck.** 11 of 12 heirs start with both slots full (partly from THR-1657's own past mints). A t0 mint with a free-slot rule reaches one heir in three worlds. The ordinary re-evaluation pass (`ambitionTick.ts:1034-1090`, every `AMBITION_REEVAL_INTERVAL` = 25 ticks) is where a freed slot is filled, and a descent-gated drive with this profile would win it (decision D4).
4. **The reclaim template's `followers` milestone is dead today.** It asks for three `loyalty` ties; no decider on any seed holds one (bases written: kin, friendship, rivalry, bond, debt). Reported, not chased (Notes for the executor).

**Lane decisions in this plan** (made under `Docs/canon/process.md` § User review interface rule 4, open to veto):

- **D1 wanted:** a descendant can come to want the old land back. The deferral is not closed as unwanted.
- **D2 no one to blame:** the want is a soft drive with no culprit, no heat, no grievance block. An empire's fall centuries ago is not a wrong done by anyone living.
- **D3 a sibling drive, not `reclaim_homeland`:** a new ambition, *Raise the Old Banner*. `reclaim_homeland` stays the exile's drive, unchanged.
- **D4 who and when:** only heirs who already decide, and only when a slot frees, through the ordinary re-evaluation. No t0 mint. No one is pulled into the deciding tier.
- **D5 what finishing means:** walk the old stones (stand where an elder ruin of the ancestors' empire lies) and take ground on the old land (a holding taken since the drive began). Both are needed.

The decisions this plan draws on are THR-1631's Lane decisions 1, 4 and 5 (the past is graph; outline known from minute one; past-fed ambitions go only to deciders). The lane made them on 2026-09-28; they are past their veto window and were not vetoed. D2's line, *living-memory wars mint grievances, ancient falls do not*, is the line THR-1657 already drew: it gives a grievance only to the kin of a commander fallen in a war **in living memory**, with the winning Realm's living leader as culprit (`worldPastAmbitions.ts:84-118`).

## Substrate inventory

Grepped `Docs/canon/systems-inventory.md` for ambition, grievance, descent, worldgen, past, ruin, holding and residence. Every system this plan touches exists.

| Existing subsystem | Status | This plan |
|---|---|---|
| **Ambitions** — `ambitionSelection.passesEligibility` / `scoreDesirability`, `ambitionTick.buildAmbitionAgentSnapshot` (`:160-205`), the re-evaluation refill (`:1034-1090`) | 🟢 ACTIVE | **extends** — one optional snapshot field and one optional template field read by `passesEligibility`; one label on the refill write |
| **Ambition progress** — `graphConditions.evaluateGraphCondition`, `ambitionLifecycle.evaluateAmbitionProgress` (passes `windowStartTick = assignedTick` to milestones and abandonment, `:99-108`) | 🟢 ACTIVE | **extends** — two condition types |
| **World past** — `worldPast.seedWorldPast` S1e descent writer, `WorldPastDescentStratum` (`src/types/worldPast.ts:30`) | 🟢 ACTIVE | **read** — a second reader of descent beside `ruins/clueLifecycle.ts:112-121` |
| **Elder ruins** — `elderRuinSeeding.ts`, `originCultureId` on every `elder_ruin` | 🟢 ACTIVE | **read** |
| **Holdings** — `holdings.ts` single writer of `owns` (`acquiredTick`, `via`, `:258-268`) | 🟢 ACTIVE | **read** |
| **Agent residence** — `readResidence`, `agent_away_from_origin`, `EXILE_ACCEPTED_DWELL_TICKS` (120) | 🟢 ACTIVE | **reused** as the new drive's abandonment trigger |
| **Historical culture layer** — region `belongs_to` culture with `cultureLayer: 'historical'` (`historicalCulture.ts:207-215`) | 🟢 ACTIVE | **read** |
| **Intent section** — `IntentSection.tsx:46-65` renders `mintedByLabel` as *"Because of …"*; `agentDetail.ts:1234-1259` carries it | 🟢 ACTIVE | **consumed** — no edit |
| `ambition_reclaim_homeland` (`ambition-templates.ts:1189-1284`) | 🟢 minted by `holding_seized` (0 mints in 450 measured ticks) | **preserve**, unchanged (D3) |

Green-field claims, with evidence: no ambition template carries a descent gate (`grep -n "descent" src/data/ambition-templates.ts` → 0 hits); no condition type reads `backstoryStrata` (`grep -rn backstoryStrata src/engine/graphConditions.ts` → 0 hits).

## Interface impact

| Contract | Action | Detail |
|---|---|---|
| `world-past-descent-feeds-clue-scoring` (LIVE, `scripts/interface-contracts.ts:5431`) | **preserve** | No edit |
| `world-past-mints-ambitions` (LIVE, `:5540`) | **preserve** | No edit; this plan adds no t0 mint |
| new: `descent-gates-old-banner-drive` | **add** | Producer: `worldPast.ts` S1e (`backstoryStrata`). Readers: `ambitionSelection.passesEligibility` through `buildAmbitionAgentSnapshot.descentCultureIds`, and the two new conditions in `graphConditions.ts`. Proof: Done-when DW2 and the census in DW5 |

## Engine pillar

### Systems design

**The descent reader — one module.** New `src/engine/descent.ts`, pure reads:

- `getDescentCultureIds(node): string[]` — the `cultureId` of every `backstoryStrata` entry with `relation: 'descent'`, sorted, de-duplicated. Does **not** read `originCultureId` alone: that property is shared with ruins and is written by other paths as worldgen grows; the stratum is the descent fact.
- `historicalCultureOfRegion(graph, regionId): string | undefined` — the region's `belongs_to` with `cultureLayer: 'historical'`, lowest target id. This is the exact predicate `worldPast.ts:465-471` uses to assign descent; lift it there and have `worldPast.ts` import it, so the writer and the reader cannot disagree about what "the old land" is.
- `ancestralRuinIds(graph, cultureIds): string[]` — `elder_ruin` locations whose `originCultureId` is in the set, sorted.

**D4 — the gate.** Add to `AmbitionTemplate` (`src/types/ambition.ts`):

```ts
/**
 * Only a mortal who descends from a dead empire may take this up (THR-1658).
 * Read by `passesEligibility` against `AmbitionAgentSnapshot.descentCultureIds`.
 * Absent ⇒ no gate. A snapshot without the field fails the gate (fail-closed), so a
 * caller that does not know descent never hands the drive to someone without it.
 */
readonly requiresDescent?: true;
```

and to `AmbitionAgentSnapshot` (`ambitionSelection.ts:35`): `readonly descentCultureIds?: readonly string[]`, filled in `buildAmbitionAgentSnapshot` from `getDescentCultureIds(actor)`. `passesEligibility` gains one clause: `if (template.requiresDescent && !(agent.descentCultureIds?.length)) return false;`.

`buildAmbitionAgentSnapshot` is the single funnel for the mint lane, the re-evaluation and initial assignment (its own comment, `:192-195`), so all three see descent with one edit. Initial assignment at spawn runs before `seedWorldPast` writes descent, so no one receives the drive at t0, which is D4's intent: no t0 mint, and no change to THR-1657's t0 mints or to the decider headcount.

**Where the template lives.** In `AMBITION_TEMPLATES`, the pool the re-evaluation refill draws from (`ambitionTick.ts:1035`). It is not a harm-minted drive, so it does not belong in `GRIEVANCE_AMBITION_TEMPLATES`, and it is not event-minted. The refill already skips every template the mortal has pursued before (`getPursuedTemplateIds`, `:853`), so a hero raises the banner at most once.

**The label.** In the refill write (`:1049-1056`), when the assigned template carries `requiresDescent`, pass `mintedByLabel: oldBannerLabel(graph, actorId)` — `OLD_BANNER_LABEL_STEM` + the culture node's display name of the heir's first descent culture, e.g. *"the old blood of the Ash-Crowned"*. Word the empire exactly as the chronicle chapter does: `worldPastWords.ts` `empireSeg` (`:243-245`) — the culture node's name through `midSentence` (*"The Ash-Crowned"* → *"the Ash-Crowned"*), falling back to *"a people long gone"*. Export a small `empireWords(graph, cultureId)` from `worldPastWords.ts` for both callers rather than copying the rule. No culture node → the fallback words, so the line still reads. This is the only edit in the refill block.

**D5 — two condition types**, added to the `GraphCondition` union (`src/types/ambition.ts`) and to `evaluateGraphCondition` (`graphConditions.ts`). Both fail soft to `false` on any unresolvable input, per the file's rule (*"a milestone cannot self-complete on missing data"*).

1. `{ type: 'agent_at_ancestral_ruin' }` — *walk the old stones.* True when the agent's current hex (position → parent Location → hex, the resolution `resolveRegionId` already walks) lies within `OLD_BANNER_RUIN_REACH_HEXES` of an elder ruin of one of the agent's descent cultures. Default 0: the same hex, which is the game's own unit of "here" (load-bearing decision: encounter awareness is hex-granular). Instantaneous, not durational; a milestone latches once met, so one visit counts.
2. `{ type: 'agent_took_ancestral_ground' }` — *take ground on the old land.* True when the agent has an `owns` edge whose `acquiredTick >= context.windowStartTick` and whose target is a Location or a Place (`isLocationNode` / `isPlaceNode`, `sublocationShape.ts`) whose region's historical culture is one of the agent's descent cultures. No window (a caller passing no tick) → `false`. The window is load-bearing: 3 of 6 heirs on seed 7 already own a Place on their ancestors' land at t0, and without it the drive would be half done before it began.

Why these two, and why both are required (`completion: { requires: 2, of: 2 }`):

- Neither is free. At t0 no heir has the drive (D4), and the holding must be taken under it.
- Both are reachable by measurement, not by hope. Heirs live 0–4 hexes from an ancestral ruin, and 1–3 per world stood on one in 150 unsteered ticks. Deciders take 4–7 holdings per world per 150 ticks, and the drive's strategic profile points the heir at claiming (below).
- Together they are the story the title tells: go to where your people's stones still stand, then plant your banner on the old ground. Strength and followers were rejected as milestones: strength (`iron` ≥ 0.75) is already true for about half the heirs at t0, and `loyalty` followers are written by nothing (table above).

**Abandonment.** Reuse `{ type: 'agent_away_from_origin', minTicks: EXILE_ACCEPTED_DWELL_TICKS }` with prose of its own. The heir's residence origin is their home on the old land (first observation), so a hero who moves away and puts down roots elsewhere lets the banner go. The window rule (`agentResidence.ts` header) guarantees it cannot fire before `assignedTick + 120`.

**The strategic profile.** `behaviorFamily: 'warlord-expansion'`; `cells`: `cell.observe.location`, `cell.control_claim.place`, `cell.control_claim.location`, `cell.control_seize.location`, `cell.create.place`; `templateIds: []` (the `cells` model is live, `UNDERTAKING_MODEL = 'cells'`); `reachEmphasis: { iron: 0.6, heart: 0.5, stone: 0.3 }`. Proximity ordering of targets (`orderTargetsByProximity`) already starts from the heir's own hex on the old land, so the claims land on old ground without a new target rule. If DW5 shows claims landing off the old land, that is reported, not chased (a target rule for "ancestral land" is a separate decision).

### Graph nodes / edges

- **No new node type, no new edge type, no new edge property.** The drive is an ordinary template ambition on a `pursues` edge, a soft drive with no `grievance` block.
- `src/types/graph.ts` is **not** touched.

### Tick phases

No new phase. The gate is read in the existing re-evaluation pass (`phaseAmbitionProgress` → `ambitionTick`, every 25 ticks); the conditions are read on the existing milestone pass (every `MILESTONE_CHECK_INTERVAL` = 15 ticks).

### Resolution logic

None new. The holding is taken through the existing claim and seize cells and `holdings.ts`; the drive's progress is the existing lifecycle.

### PRNG callouts

None. The gate and both conditions are deterministic reads. Selection keeps its existing seeded scorer (`selectAmbitions`, `mulberry32(seed)`).

## Content pillar

### The ambition template

Add to `AMBITION_TEMPLATES` in `src/data/ambition-templates.ts`, beside the other dominion drives:

```ts
{
  id: 'ambition_raise_the_old_banner',
  displayName: 'Raise the Old Banner',
  category: 'dominion',
  requiresDescent: true,
  reachFloors: { iron: 0.3, heart: 0.3 },          // reclaim_homeland's floors; every measured heir passes
  requiredTraits: [],
  blockingTraits: [],
  sphereAffinities: ['force', 'spirit'],
  bondModifiers: [{ bondType: 'kin', modifier: 0.3 }],
  boostingTraits: ['trait.mastery.steadfast'],
  reachAffinity: { iron: 0.6, heart: 0.6, stone: 0.3 },
  poleAffinities: [
    { valuePair: 'loyalty_ambition', pole: 'virtue', weight: 0.6 },
    { valuePair: 'preservation_transformation', pole: 'virtue', weight: 0.8 },
  ],
  strategicProfile: { /* as § Engine — The strategic profile */ },
  milestones: [
    { id: 'old_stones', condition: { type: 'agent_at_ancestral_ruin' }, prose: [/* below */] },
    { id: 'old_ground', condition: { type: 'agent_took_ancestral_ground' }, prose: [/* below */] },
  ],
  completion: { requires: 2, of: 2 },
  abandonmentTriggers: [
    { condition: { type: 'agent_away_from_origin', minTicks: EXILE_ACCEPTED_DWELL_TICKS }, prose: [/* below */] },
  ],
  abandonmentCooldown: 50,
  // prose fields below
}
```

The affinities deliberately sit close to `reclaim_homeland`'s, whose profile measured first in the refill ranking; `preservation_transformation` leans harder (this is keeping an old thing alive, not going home).

### Prose

GM-narration register (`Docs/canon/prose.md`): the game says what happened, never in situ; no pronoun that fixes a gender (the lines carry no slot, as the template pools' lines do not). Samples; the executor may improve them, keeping register and the no-slot rule:

| Field | Lines |
|---|---|
| `selectionProse` | "Their forebears ruled this country once. The thought will not leave them alone." · "The old stones still stand here. Someone ought to remember whose they were." |
| `milestoneProse.old_stones` / milestone `prose` | "They walked among the old stones, and the stones seemed to know them." |
| `milestoneProse.old_ground` / milestone `prose` | "A piece of the old land answers to them now." |
| `completionProse` | "The old banner flies again over a corner of the old land. Small, but theirs." |
| `abandonmentProse` / trigger `prose` | "The old empire went back to being a story told by the fire." |

### Data tables

| Table | Change |
|---|---|
| `AMBITION_TEMPLATES` | one entry |
| `src/data/world-past-constants.ts` | `OLD_BANNER_RUIN_REACH_HEXES`, `OLD_BANNER_LABEL_STEM` (or a new `src/data/descent-constants.ts` if the executor prefers to keep world-past constants worldgen-only) |

### Encounter templates

None. Ruin encounter content is [Write where the dice land](https://linear.app/threadbare/issue/THR-1598)'s lane; this drive brings heirs to ruins and will meet that content when it exists.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only, no WebGL).*

### Player-facing display

The drive appears where every ambition already appears: the mortal sheet's ambitions and the intent section. The one visible addition is the provenance line, which `IntentSection.tsx:62-65` renders from `mintedByLabel` as **"Because of the old blood of the Ash-Crowned"**. No new component, no new section, no numeral. The empire's name is part of the outline the player knows from minute one (THR-1631 Lane decision 4), so naming it reveals nothing the fog hides.

Milestone and completion prose reach the existing ambition-progress surfaces (milestone beats in the agent's story, the Journey tab), as for every template ambition.

UI Laws engaged: 1 (one viewport — no new surface), 13/14 (player words: *the old blood of …*, never `backstoryStrata` or a culture id), 17, 21, 33 (the empire name is plain text here, as the intent line renders every label; no new link is added), 37, 56 (state-backed: the label is written on the `pursues` edge at assignment and read from it).

### Event notifications

Nothing new. The re-evaluation already pushes an `ambition_assigned` event carrying the template's first `selectionProse` line (`ambitionTick.ts:1061-1075`), so taking up the banner reads like any new want; milestones and completion use the existing ambition events.

### Debug inspection (DebugPanel)

`window.__DEBUG.getDescent(nameOrId)` — synchronous, declared with JSDoc in `src/debug-bridge.d.ts`: `{ actorId, descentCultureIds, descentCultureNames, ancestralRuinIds, onAncestralLand: boolean, holdsOldBanner: boolean }`. The existing ambition accessors show the drive and its milestones.

### Visual presence (HexMapV2)

N/A. A drive has no map signifier; the ruins and holdings it touches already draw.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `src/engine/descent.ts` (`getDescentCultureIds`, `historicalCultureOfRegion`, `ancestralRuinIds`) | read-only; called from the two passes below | — | graph (`backstoryStrata`, `belongs_to` historical, `elder_ruin.originCultureId`) | — | `getDescent()` |
| `passesEligibility` descent clause + snapshot field | `phaseAmbitionProgress` → re-evaluation (25 ticks) | — | graph (`pursues`) | existing `ambition_assigned` event | existing ambition accessors |
| `agent_at_ancestral_ruin`, `agent_took_ancestral_ground` | milestone pass (15 ticks) | ambition progress surfaces (existing) | graph | existing milestone / completion events | existing ambition accessors |
| refill label | re-evaluation | `IntentSection` (existing) | `pursues.mintedByLabel` | — | `getDescent()` (`holdsOldBanner`) + the existing ambition accessors; the sheet's `IntentSection` |

Wiring checklist: one engine module (read-only), one debug accessor. No modal, no GameState field, no trace category. Add the accessor row to `Docs/plans/wiring-checklist.md`.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `OLD_BANNER_RUIN_REACH_HEXES` | `0` | How near an ancestral elder ruin the heir must stand for *walk the old stones*. 0 = the same hex. The tuning lever if DW5 shows heirs near ruins but never on them at a milestone check |
| `OLD_BANNER_LABEL_STEM` | `'the old blood of'` | The provenance stem; the intent line reads *"Because of the old blood of {empire}"* |

Reach floors, affinities and cooldown live on the template, where every ambition's live. The abandonment dwell is the existing `EXILE_ACCEPTED_DWELL_TICKS`; no second copy.

## Tracing

**No new trace type** (`src/types/trace.ts` untouched). Questions and where they are answered:

- **Why did this heir never take it up?** The re-evaluation is silent by design; `getDescent()` shows descent and `holdsOldBanner`; the existing ambition accessors show both slots full. The census (DW5) counts heirs with a free slot at a re-evaluation tick.
- **Why is a milestone not met?** `getDescent()` gives `ancestralRuinIds` and `onAncestralLand`; holdings are on the agent's `owns` edges with `acquiredTick`.
- **That it was taken up / finished / abandoned:** the existing `ambition_assigned` event and the lifecycle's completion and abandonment events.

```ts
// Shape returned by __DEBUG.getDescent (a read model, not a trace)
interface DescentReadout {
  actorId: string;
  descentCultureIds: string[];
  descentCultureNames: string[];
  ancestralRuinIds: string[];
  onAncestralLand: boolean;      // current region's historical culture ∈ descentCultureIds
  holdsOldBanner: boolean;       // an active pursues edge to ambition_raise_the_old_banner
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `backstoryStrata` missing, not an array, or holding malformed entries | `getDescentCultureIds` returns `[]`; the gate fails closed; the drive is never offered |
| A snapshot built without `descentCultureIds` (older caller, fixture) | Gate fails closed; every other template scores exactly as before |
| The agent's position, hex or region cannot be resolved | Both conditions return `false` (never a measured negative) |
| No elder ruin of the descent culture survives (transformed, removed) | `agent_at_ancestral_ruin` is `false`; the drive can still be abandoned by settling away. Census-visible |
| `owns` edge without a numeric `acquiredTick` (pre-THR-1297 world) | That edge does not count |
| A region with several historical cultures | Lowest id, the writer's own tie-break (NFP #3) |
| Culture node unresolvable for the label | The chronicle's own fallback words (*"the old blood of a people long gone"*) |
| The heir dies holding the drive | Existing lifecycle; a soft drive has no succession |

## Rulebook impact

- [ ] This plan does not change a rule of play. **Unchecked: it does.** It adds a drive and states a rule about which old harms count as wrongs.
- [x] The paragraph is part of this ticket's scope; the executor lands it in the build PR, in `Docs/canon/rulebook.md` § 10.7, after **What a grudge is**, as `[IMPL]` with file references:

> **An old fall is not a wrong** [IMPL — THR-1658; `ambition_raise_the_old_banner` in `src/data/ambition-templates.ts`, the descent gate in `src/engine/ambitionSelection.ts`]. Some mortals descend from an empire that fell long before anyone living was born. A hero of that blood, when free to want something new, may come to want the old land under their hand again: to walk the stones their forebears left and take a piece of the old ground for themselves. It is a want, not a vendetta. Nobody living is blamed for an empire's fall, so it names no culprit and carries no heat. Wars in living memory are different: the kin of a commander who fell in one can hold a true grievance against the Realm that won.

The quick-reference card needs no line (drives are not enumerated there). The executor confirms at pickup.

## Vision audit

- [x] No Vision premise is contradicted. The past now *does something next* (`Vision/00-north-star.md` — the world does something next; the pleasure is witnessing), and a want born of history compounds with ruins and holdings already on the board (`Vision/01-core-loop.md` — consequences compound). The god is not involved; mortals want things on their own, which keeps the god's role as nudger.
- [x] D2 keeps *narrative over mechanical perfection*: a vendetta against a Realm for a fall a thousand years ago would read false.
- [x] No Vision edit is needed.

## Three-pillar check

- [x] Engine: a gate, two conditions, one label, one read module.
- [x] Content: one template with milestones, profile and prose; one rulebook paragraph.
- [x] UI: the provenance line on the existing intent section, the debug accessor; HexMapV2 N/A with rationale.
- [x] Wiring connects them; no new phase.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Ruin reach and label stem are named constants; floors and affinities live on the template |
| 2. Inspectability | PASS with note | No new trace type; `getDescent()` and the existing ambition accessors answer every question; the re-evaluation stays silent as it is for every drive |
| 3. Determinism | PASS | No new randomness; lowest-id tie-breaks; sorted readers |
| 4. Fail-soft | PASS | Every unresolvable input reads `false` or fails the gate closed; no throws |
| 5. Narrative over mechanical perfection | PASS | D2 and D3 are both narrative calls: no false vendetta, no exile's return for someone who never left |
| 6. Additive over destructive | PASS | Optional fields, new union members, one new template. `reclaim_homeland` untouched |
| 7. Performance budget | PASS | The gate is one array-length check per template per re-evaluation; the conditions run only for the 0–3 holders per world on the 15-tick pass (each: one ruin list filter, one `owns` scan). DW5 records ms/tick |

## Done when

- [ ] **DW1** — **Gate and template.** `ambition_raise_the_old_banner` is in `AMBITION_TEMPLATES` with `requiresDescent: true`. `passesEligibility` refuses it for a snapshot with no descent and for one without the field; accepts it for a snapshot with descent that passes the floors. Ambition schema/content tests pass (`valuePair` membership, cell ids exist, milestone prose keys match).
- [ ] **DW2** — **Conditions, unit-tested** (`src/engine/__tests__/descent.test.ts` or beside the existing condition tests):
   - `agent_at_ancestral_ruin` true on the hex of an elder ruin of the agent's descent culture; false on a ruin of another culture; false with no descent; false when position is unresolvable.
   - `agent_took_ancestral_ground` true for an `owns` edge acquired at or after `windowStartTick` on a Place on the old land; **false for one acquired before** (the seed-7 case); false off the old land; false with no window.
   - Writer and reader agree: a test on a **generated** world asserts that for every descended mortal, `historicalCultureOfRegion` of their home region equals their descent culture (the lift in § Engine).
- [ ] **DW3** — **The path end to end, on a generated world** (heavy lane): an heir with a freed slot receives the drive at the next re-evaluation, its `pursues` edge carries no `grievance` and carries `mintedByLabel` naming the empire; no mortal without descent ever holds it; the t0 decider headcount and THR-1657's t0 mints are unchanged against `main`.
- [ ] **DW4** — **UI**, Playwright at 1920×1080 on `?view=game&seeded&size=medium`, four-part evidence: a screenshot of an heir's sheet showing the drive with *"Because of the old blood of …"* (reach it by `window.__DEBUG.tick(n)` until an heir holds it, or by assigning it through the existing debug ambition lever if one exists — record which); the console; `window.__DEBUG.getDescent(<heir>)` with `holdsOldBanner: true`; a UI-Laws line citing 1, 13/14, 17, 21, 33, 37, 56. If no heir takes it up within the run, record `Browser-verify substitution: <route> — <reason>` and cover the label in the DW3 test.
- [ ] **DW5** — **Census, with a kill criterion.** Extend `readers/descent-homeland.ts` and rerun seeds 42, 99, 7, medium, **300** ticks; before/after in the PR body: heirs; heirs with a free slot at a re-evaluation tick; drives taken up; `old_stones` and `old_ground` met; completed; abandoned; where each claim landed (old land or not); ms/tick.
   **Kill criterion:** if no heir takes the drive up on any seed, ship anyway (the path is test-proven) and name the starving stage (no free slot at a re-evaluation tick, or outscored). If heirs take it up but `old_stones` is never met while heirs stood on ancestral-ruin hexes between checks, set `OLD_BANNER_RUIN_REACH_HEXES` to 1 and record both runs. Do not touch re-evaluation cadence or slot rules here.
- [ ] **DW6** — **Docs in the same PR:** the rulebook paragraph; the interface-map row (`scripts/interface-contracts.ts` + `npm run generate-interface-map`); the systemic wiring guide (two new milestone condition types and the `requiresDescent` gate, for content authors); the wiki page whose `sources` glob matches (`check:wiki-freshness:blocking` names it); `Docs/plans/wiring-checklist.md`.
- [ ] **DW7** — `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` (engine touched), the 30-tick CLI smoke, both freshness gates last.

## Coordination block

**Suggested model:** opus — small engine surface, but two condition semantics (window, hex reach) and a writer/reader lift that must stay byte-identical for worldgen's draw order.

**Parallel-safe with:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572) (spell data and power runtime); [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687) (`encounterFilterPipeline.ts`); [the lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686) (candidate walk and leads, not ambitions).

**Mutex with:** any open ticket editing `src/engine/ambitionTick.ts`'s re-evaluation block or `src/engine/graphConditions.ts`'s condition switch (both edited here); any ticket editing `worldPast.ts` S1e descent (the predicate lift).

**Files to touch:**
- Create: `src/engine/descent.ts`, its test.
- Edit: `src/types/ambition.ts` (template field, two union members); `src/engine/ambitionSelection.ts` (snapshot field, gate clause); `src/engine/ambitionTick.ts` (snapshot fill, refill label); `src/engine/graphConditions.ts` (two cases); `src/engine/worldPast.ts` (import the lifted predicate — no behaviour change, draw order untouched); `src/engine/worldPastWords.ts` (export `empireWords`); `src/data/ambition-templates.ts`; constants file; `src/debug-bridge.ts` / `.d.ts`; `scripts/interface-contracts.ts`; `Docs/audits/2026-09-25-living-world-data/readers/descent-homeland.ts`; docs per DW6.

## Notes for the executor

- **Do not touch `ambition_reclaim_homeland`** (D3). It is the exile's drive and stays minted by `holding_seized`.
- **Reported, not chased — `reclaim_homeland`'s `followers` milestone is dead.** It asks for three `loyalty` ties; across three worlds no decider holds one (`loyalty` is canonical in `bond-basis.ts` but nothing writes it). A separate small finding; do not fix it here.
- **Reported, not chased — `bond` is written as a basis but is not canonical** (29–35 decider ties per world carry `basis: 'bond'`; `CANONICAL_BOND_BASES` lacks it, so `bondBasisWord` warns and `bondModifiers` cannot match it). Same: a finding, not this ticket.
- **Keep the descent predicate lift behaviour-neutral.** `worldPast.ts` S1e consumes one draw per mortal in a fixed order; importing `historicalCultureOfRegion` must not change which mortals get descent. DW2's generated-world test plus an unchanged `readers/past.ts` descent count prove it.
- **No t0 mint** (D4). If a later ticket wants heirs to start with the drive, it must free a slot or displace a want, which is a different decision.

## Intent-judge verdict

**Allow** (2026-10-03, cold spawn on `fable`, Reversible confirmed; ~20 line-anchored substrate claims verified against source). Findings:

- One GAP (dimension 3): the Wiring table named a `getAgentDetail` bridge accessor that does not exist. Fixed inline: the row now names `getDescent()`, the existing ambition accessors and the sheet's `IntentSection`.
- Note: D2 (*an empire's fall centuries ago is not a wrong done by anyone living*) is the one meaning-level call; it rides the lane report's *Decided for you* as a veto line in game terms.
- Note: the Vision files live in the vault, not the worktree; the judge checked the Vision claims against CLAUDE.md NFP 5.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-03*

### NFP audit

**PASS-with-notes.**

- **1 Tunability:** PASS. Two named constants; floors, affinities and cooldown on the template; the abandonment dwell reuses `EXILE_ACCEPTED_DWELL_TICKS`.
- **2 Inspectability:** PASS with a note. No new trace type; `getDescent()`, the existing ambition accessors and events answer the questions. The re-evaluation stays silent, so a non-assignment leaves no causal trail beyond census counts.
- **3 Determinism:** PASS. Pure reads, lowest-id tie-breaks, sorted readers, the seeded scorer kept; the predicate lift is declared draw-order-neutral and DW2 tests it.
- **4 Fail-soft:** PASS. Every unresolvable input returns `false` or fails the gate closed; nothing throws.
- **5 Narrative:** PASS. D2 and D3 are explicit narrative calls.
- **6 Additive:** PASS with a note. Optional fields, new union members, one template; `reclaim_homeland` untouched. The `worldPast.ts` predicate lift refactors a draw-order-sensitive writer, declared behaviour-neutral and test-guarded.
- **7 Performance:** PASS. One length check per template per 25-tick pass; conditions only for 0–3 holders per world on the 15-tick pass; DW5 records ms/tick.

### Three-pillar audit

**PASS.**

- **Engine / Content / UI:** all present and substantive. Encounter templates "None" with a reason; HexMapV2 N/A with rationale; Playwright named.
- **Required sections:** none missing. Blast Radius is conditional and absent (no file ≥100 importers; the plan's own grep counts are in the action proposal).
- **Wiring:** covers module, phase, UI component, GameState field, trace and debug visibility, and adds the accessor row to the checklist.
- **Substrate:** opens with the inventory; every row states its disposition; the two green-field claims carry grep evidence; reuses `agent_away_from_origin` rather than duplicating it. No duplication.

### Vision audit

**PASS-with-notes.**

- **Premises:** north star extended (the past produces a want); core loop "consequences compound" confirmed; narrative over mechanical perfection confirmed; god/protagonist separation consistent ("the god is not involved").
- **Contradictions:** none.
- **Notes:** the drive has no encounter content of its own and relies on the deferred ruin-content lane (THR-1598) for the witnessing half at the ruins; `03-design-tensions.md` and `taste-profile.md` are not cited and were not checked.
