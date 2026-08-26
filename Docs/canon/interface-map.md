---
domain: interfaces
last_reviewed: 2026-07-23
reviewer: claude-code
ul_shards: [Graph, Agents, Encounters, Cosmology]
status: live
---

# Canon — System Interface Map

> Who consumes what, across subsystem boundaries — the contract layer between the systems
> inventory ("what exists") and the rulebook ("how it plays"). Load this **whenever a plan
> touches a subsystem that other subsystems read from or write to** — i.e. nearly always.

**This page carries the protocol. The rows live in
[`interface-map.generated.md`](interface-map.generated.md)**, generated from
`scripts/interface-contracts.ts` by `npm run generate-interface-map`. Edit the registry,
never the generated file.

## Why this page exists

`Docs/canon/systems-inventory.md` answers "does system X exist?" It cannot answer "who
depends on X, and does that dependency still function?" Features leak exactly there: a
producer keeps writing data whose consumer was rewritten away (or vice versa), tests still
pass because they assert the write, and the game silently loses richness. The 2026-07-23
attachment audit found **five** such leaked contracts in one subsystem — all invisible to
tests, typecheck, and playtests.

**Three lenses, one stack — don't confuse them.**
1. **Codesight** (`.codesight/graph.md`, MCP) — *file-level imports*. Catches orphan modules
   (a resolver no production file imports). An import edge proves code linkage, **not** a
   live contract: `modifiers.ts` is imported (visibility) while item stat bonuses still flow
   nowhere. Data contracts riding graph node/edge *properties* never appear here at all.
   Advisory only — `.codesight/` is gitignored and its hook does not run in CI, so it is
   never a generator input.
2. **Systems inventory** (`systems-inventory.md`, generated) — *existence + tick wiring*.
3. **This map** — *contract semantics*: design intent ↔ mechanism ↔ consumer ↔ liveness.
   Contract intent uses **UL terms** (a contract is a relationship between UL terms, e.g.
   "Possession modifies Domain Capability"); an undeclared concept in a new contract goes
   through the existing UL-proposal flow.

## Badges

🟢 LIVE · 🟠 PARTIAL (works but a stated gap) · 🔴 LEAKED (one side dead — feature silently
lost) · ⚫ UNWIRED (neither side present) · 🔵 UNVERIFIED-OK (both sides grep clean, liveness
unproven) · ⚪ UNAUDITED (no contract row yet).

**Classification is downgrade-only — this is the load-bearing invariant.** Static analysis
can prove a contract dead; it can never prove one alive. Both headline leaks would have been
re-badged 🟢 by a naive "write site exists AND read site exists → LIVE" rule:
`domainContributions` greps clean while every catalog writes `{}` (*value-level* deadness),
and `modifiers` has a real production reader that only ever asks for `los_range`
(*argument-level* deadness). So:

- 🟢 LIVE comes **only** from a dated `verifiedLive` entry carrying its evidence.
- A mechanically passing row earns at most 🔵 UNVERIFIED-OK.
- `badgeOverride` pins a row 🔴/🟠 when a production read site exists but does not count —
  display-only readers (tooltips), documented-dead components (`AgentDetailPanel.tsx`).
- Mechanical deadness **beats** a stale `verifiedLive`, which is then reported as stale.

## Interface stewardship protocol (binding for design sessions)

1. **Step 0.7 — Interface impact check.** After the substrate-existence check (Step 0.6),
   find every subsystem your plan touches in this map. The plan doc must carry an
   `## Interface impact` section: one row per touched contract with an action —
   `preserve` / `extend` (name the new consumer/producer) / `add` (new contract → register
   the row in `scripts/interface-contracts.ts` in the same change) / `retire` (explicit,
   with a user verdict if player-facing). `npm run lint:plan-doc` flags a plan that names a
   mapped subsystem with no such section (advisory).
2. **No producer without a consumer.** A plan that adds a write (new property, edge, event,
   trace meant for cross-system use) must name the production read site in the same plan —
   or open a `Deferral`-labeled Linear issue and cite it in the contract row. "Something
   will read this later" without a ticket is how features leak.
3. **Executors update rows they touch.** DoD: if your change adds, retires, or reroutes any
   read/write named here, update the registry row in the same PR. **Retiring a contract
   deletes or repoints the tests asserting its dead side** — green tests on a dead contract
   are the pathology this map exists to kill.
4. **Audit-on-touch.** ⚪ UNAUDITED subsystems get their contract rows written by the first
   design session that touches them — verify with greps, don't transcribe intentions.
   **UNAUDITED is a to-do marker, never an exemption from Step 0.7.** Cold subsystems no
   session touches get swept by a weekly audit ticket from the Friday drift scan.
5. **The ratchet.** A 🔴 LEAKED contract must carry a `deferralTicket`. The generator exits
   non-zero otherwise, failing `prebuild` and therefore CI — the freshness diff alone would
   pass an executor who kills a read site and commits the regenerated, now-LEAKED map.
6. **Player-loop chain (mandatory when the subsystem has player verbs).** A player-facing
   contract is a four-link chain, and each link is its own contract row in the registry:
   **verb authored** (template exists) → **verb reachable** (starter or beat grant — an
   ungranted card is unreachable *by construction* under THR-613/THR-501; check
   `__DEBUG.listUnreachableActions()`) → **effect wired** (resolution/GraphOps actually
   fire) → **world visibly responds** (a scene, chronicle entry, or map change the player
   can see). A break at any link is a leak with a ticket. A design that strengthens
   simulation without closing this chain ships background richness the player never
   touches; a verb without a world response ships a button that lies. Found 2026-07-23:
   `action.secrets.plant_secret` / `reveal_secret` / `hex.incite_exodus` break at link 2;
   the four granted economic verbs (`loc.bless_harvest`, `loc.blight`, `loc.open_markets`,
   `loc.reveal_vein`) break at link 4 — no economic term in encounter scoring.
   Method + evidence: `Docs/audits/2026-07-23-simulation-coupling-assessment.md`.

## Audited subsystems

**Attachments, Items & Possessions** and **Ambitions & Initiatives** — 20 contracts, audited
2026-07-23 (THR-717). Current badges and per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

Standing remediation backlog (user-verdicted 2026-07-23, see
`Docs/plans/2026-07-23-system-interface-map.md` § User verdicts): **THR-718** items→tiers via
an `effects[]` primitive + StepDots magnitude indicator · **THR-719** on-use triggers as
effect primitives · **THR-720** `activatedEffects` parked · **THR-721** ambition visibility +
ChronicleTab completed list · ~~**THR-722** retire edge `grants[]`~~ (done 2026-07-24 — the
edge property is deleted and its authored payload re-expressed as `effects[]` `trait_grant`;
the intent's row is now `attachment-trait-grant-effects`, still LEAKED because the *consumer*
is missing, tracked by **THR-737**) · ~~**THR-723** dead stat path~~ (done 2026-08-06 —
`attachmentTierAdvancement` now scales the artifact's `stat_contribution` effects, the live
substrate `computeRawScore` reads, clamped to `ITEM_STAT_BAND_LEGENDARY`; it no longer scales
Reach-domain edge `modifiers`, while non-Reach keys like `los_range` keep working. Both rows
stay 🔴 LEAKED for the halves THR-723 deliberately did not take: the resolver still has **no
production caller**, a design call deferred to **THR-996**, and the reach-keyed *seed* writes
in `gameInit.ts`/`seedAttachments.ts` remain, deferred to **THR-997**).

One contract added since that audit, **`attachment-effect-event-raises`** (THR-1239,
2026-08-25) — game events reaching the event-triggered effect primitives (`reactive`,
`until_event`, `stacking`, `transform`, one-shot `resource_manipulate`). It is 🟢 LIVE and was
never LEAKED, but it earns a line here for *how* it was broken: the consumer half
(`processEffectEvent`) was fully live and correct, and the producer half was almost entirely
absent — outside a single `encounter_outcome` raise inside the orchestrator, no site in the
engine ever constructed an `EffectEvent`, so the whole executor family was unreachable in
normal play while every part of it read as wired. **A one-sided contract with a healthy
consumer is the hardest shape for this map to catch**, because every symbol an audit greps
for exists. Producers are now `phaseMovement`, `battleResolution`, `orchestrator`,
`phaseDoom` and — since THR-1244, 2026-08-26 — `conditionProxyEvents` raising from the three
aftermath condition writers, all through one `raiseEffectEvent`, and each raise emits
`effect.event_raised` carrying its site — including when nothing was listening, which is the
signal that separates a live-but-unheard producer from an unwired one.

The condition producer is worth a line of its own, because it is a **third** shape of
one-sidedness this map should learn to name. `damaged` / `healed` had no producer not through
oversight but *by construction*: the game has no per-agent damage model, so there was no
hit-point subtraction to raise from, and three trigger families sat behind a number that does
not exist anywhere in the codebase. An audit grepping for producers and finding none would
have been correct and useless — the answer was not "wire the missing call" but "decide what,
in this game's own vocabulary, being hurt *is*". A wound is a condition with a countdown, so
that is the proxy. **The generalisable warning: when a contract's producer half is missing,
check whether the thing it would produce exists in the domain at all before filing it as
unwired work.** A fourth writer of the same edge (`actionTriggerPayloads`) remains silent and
is ticketed as **THR-1257**, together with the tag-vocabulary mismatch that would make wiring
it *silently wrong* rather than merely incomplete if the two were done apart.

Its mirror image landed a day later: **`rule-overrides-reach-owning-sites`** (THR-1241,
2026-08-26) — the *read* half of what THR-1240 opened. Where the event contract had a healthy
consumer and no producer, this one had a healthy producer and **eleven of thirteen keys with no
consumer at all**. The store kept every `ActiveRuleOverride` correctly, `getActiveRuleOverride`
folded them correctly, and nothing asked: an artifact could promise `death_prevented` and the
mortal wearing it still died, because the only function that decides a death never read the key.
Five keys had shipped catalog content making a promise the engine could not keep. Every symbol an
audit greps for existed on both sides — the same blindness, entered from the other end, which is
why the two rows sit together here rather than one being filed as a repeat of the other.

The fix is one shared reader (`ruleOverrideConsumers.ts`) called from the single site that owns
each rule, because the alternative — eleven inline reads — is eleven chances to disagree about the
neutral, the fold, or the trace, and an inline `?? 1.0` at a `*_bonus` site is a permanent bug no
test catches, since the number it produces is plausible. `doom_rate_multiplier`, the one key that
*did* have a consumer, was migrated onto the same reader: its hand-rolled scan saw only
attachment-declared overrides, folded unclamped, and ignored duration and cooldown state, so the
single wired key was also the single disagreeing one. One partial reach is stated rather than
hidden — `backlash_severity_multiplier` reads inside `evaluateBacklash`, whose caller
`activateSpell` still has no production caller, so that key is live in code and goes live in play
when spell activation does.

**Personality & Emergent Traits** — first slice, 2 contracts, audited 2026-07-26 (THR-786),
audit-on-touch triggered by the trait-predicate unification. `trait-predicate-resolution` is
🟢 LIVE: all six trait-predicate read sites (encounter filter pipeline, effect-predicate
context builder, `graphConditions`, ambition snapshot eligibility, spell prerequisites,
item-granted keys) route through one `resolveTraitPredicate` / `collectBearerTraitRefs`, held
by an unchanged-behavior contract suite. `trait-ref-authoring-vocabulary` is 🔴 LEAKED and
**measured, not assumed**: `__DEBUG.validateTraitRefs()` reports 62 authored trait refs that
resolve to no trait definition, because authored refs are bare snake_case keys while every
definition uses `trait.<category>.<kebab>` ids / Title Case names / `#tags` — two
vocabularies that have never intersected. Remediation: **THR-800**. Trait *minting*, decay,
and display rows are still unwritten (waves 2–3, THR-790/THR-791).

**Dealt hands** — 1 contract, written 2026-08-25 (THR-1247), **LIVE since 2026-08-26 (THR-1254)**.
`repertoire-deals-into-encounter-hand` covers the Repertoire supplying most of an encounter's
hand: the encounter authors 0–2 specials and declares a fill, and `dealHand` mints the rest
from cards the god already holds. It was badged **PARTIAL** through two tickets for one
narrowing reason at a time — first that the play-profile corpus was thin (THR-1247), then
that no *shipped* template declared `ActionStep.deal`, so nothing travelled the path in a
real run (THR-1248). Badging LIVE on a wired path alone would have been the THR-614 error
class again, which is why the override outlived the code by two tickets.

What retired it is a shipped encounter, not an argument: **The Unfinished Rite**
(`encounter.delve.the_unfinished_rite`) is registered in both catalog arrays and its step 0
declares `deal`, so `check:encounter-live` can and does return `proved` for it. The golden
exemplar could never have discharged this — it is registered in no pool, and an unregistered
template never advances a step. The evidence worth carrying forward is that the *same* step
composes a different hand per god: darkness/order is dealt Follow The Book, Hide The Deed and
Open The Ledger where force/matter is dealt Throw Full Weight and Find What Remains, with the
two authored specials constant across both. That is the contract's intent sentence
demonstrated rather than asserted, and it is what a corpus-wide `deal` rollout now rests on.

The row is worth reading for **which read sites it names**, because that is where the design
nearly went wrong. It names two: the stage adapter *and* `unifiedActionResolution.ts`. The
plan specified only the adapter — and resolution never receives the hand the player saw. It
re-derives its step from the template, where `nudges` holds the authored cards alone, and
`collectNudgeModifiers`, `selectActiveRider`, `dispatchNudgeCommitments` and
`collectNudgeBandProse` each resolve a committed id against that list and skip what they
cannot find. A dealt card would have rendered, priced, charged, and then contributed nothing
at all — a contract with a live producer and a consumer that silently drops its operand,
which is the exact shape this map exists to make visible. It is sound to re-derive because
dealing is pure and zero-PRNG; that determinism is load-bearing, not a nicety.

**Nudge card dispatch** — 4 contracts, written 2026-07-30 (THR-885) and extended 2026-08-09
(THR-886), audit-on-touch triggered by the card-system engine.
`nudge-card-grants-dispatch-to-host-systems`, `nudge-card-cost-channels-detection-and-doom`,
`nudge-hand-runtime-filters-and-sphere-discount`, and
`compulsion-card-plants-agent-decision-bias` are all wired and test-covered but
deliberately **not** badged LIVE: no shipped card authors a `grants` block or a cost channel,
because card content lands under **THR-883**. Badging a path nothing travels is the THR-614
error class, so the rows carry `deferralTicket: THR-883` until the first authored hand ships.

Three of the four needed a host-side addition rather than a new path, and the distinction is
the point: card grants reuse the existing `EncounterAftermathReactionEffect` vocabulary
(`emit_omen`, `remove_condition`, `spawn_artifact`, `hidden_mark`, `favor_creation`) through
the existing applier, so five of the six dispatch hooks cost no new machinery at all. The
exceptions — `assign_ambition`, `applyRawDetectionDelta`, and `plant_compulsion` — exist
because the capability genuinely was missing: reactive ambition templates had no assignment
path outside `ambitionTick` (THR-812 / THR-726), and every detection writer priced by
choice-cost band, which can only *raise* pressure. Both were added to the owning module, not
beside it.

The sixth hook, **The Compulsion**, was the one that needed a design call before it could be
wired at all (THR-886). Its apparent host, `buildCompulsionEvent`, takes the decision
pipeline's `ScoredCandidate[]` — a list that exists only mid-`phaseAgentDecision` and that
aftermath cannot obtain, so THR-885 stopped rather than synthesize fakes to fit the signature.
Christian resolved it 2026-08-09: the card plants a *weight*, not a candidate menu, and a
weight **is** available at the aftermath seam. So `plant_compulsion` writes a per-agent
`PlantedCompulsion` and `phaseAgentDecision` folds it into the same `combinedBias` the omen
path already feeds — one reader, not two. `premonitionCompulsion` is untouched, which keeps
the pick-one-of-three vision on the god's own premonition turn where it already lives. The
carrier is deliberately **not** `state.emittedOmens`: an omen is addressed to a place and
catches whoever passes, a compulsion to a person and travels with them, and that difference
is the card ("steer them, not the world").

Known dead code: `AgentDetailPanel.tsx` is an orphaned pre-`AgentProfileModal` sheet — do
not "fix" ambition display there.

## Unaudited subsystems (audit-on-touch)

Contract rows not yet written for: War & Armies · Factions & Succession · Rival Schemes ·
Doom/Journey · Mandate · Essence & Divine Economy · Encounters & Dilemmas (core) · Culture ·
Economy & Prosperity · Ruins & Delves · Stealth & Detection ·
Attention & Chronicle · Omens & Foreshadowing · Strategic Projects · Ascendant Beats ·
Movement & Colocation · Reputation & Influence · Secrets & Favors (DORMANT) ·
Effects & Conditions (partially covered) · Agent Lifecycle · Intelligence & Knowledge ·
Spheres & Quintessence — plus the **init-time systems the tick-phase inventory cannot see**:
Worldgen (map + history generation) and Encounter Seeding (seeds/hidden marks, THR-697), both
confirmed real by the 2026-07-23 archive sweep. ⚪ First design session to touch one writes
its rows (protocol §4). The wiki projection (`public/system-interface-map-reference.html`)
draws one box per subsystem listed here — a row without a box there is a wiki bug.

## Current spec
- **Subsystem existence + tick wiring:** `Docs/canon/systems-inventory.md` (generated)
- **Subsystem name authority:** `scripts/subsystems-registry.ts` (shared by both generators)
- **Contract rows (source of truth):** `scripts/interface-contracts.ts`
- **Generated liveness report:** `Docs/canon/interface-map.generated.md`
- **Import-level blast radius:** `.codesight/graph.md` + codesight MCP (advisory)

## Active design plans
- `Docs/plans/2026-07-23-system-interface-map.md` — this page's origin: audit findings, the
  liveness generator, protocol wiring, and the remediation tickets.

## Rejected approaches
- ❌ Hand-maintained interface diagrams with no grep keys — undetectable drift (the reason
  this page exists). Every row carries verifiable symbols.
- ❌ Write-site + read-site symbol match ⇒ LIVE. Would have re-badged both headline leaks
  green. Detection is downgrade-only; see Badges above.
- ❌ Codesight as a generator input — gitignored, hookless in CI, non-deterministic.
- ❌ A wall-clock field in the generated output — makes every parallel PR a merge conflict
  (THR-714, learned the hard way on `ul-dashboard.generated.json`).

## Open questions
*(none — the four launch questions were verdicted by the user via chat review 2026-07-23;
see the plan doc § User verdicts.)*

## Last-reviewed
2026-08-06 by Claude Code (THR-723 implementation). Rows regenerate mechanically; this page's
protocol is reviewed monthly. Implementation correction to the original audit, carried from
2026-07-23 (THR-717): the `attachment-tier-advancement` row was badged 🟠 PARTIAL on the
assumption advancement runs — Tier 1 shows `attachmentTierAdvancement.ts` has **zero
production importers**, so it never runs at all.

THR-723 (2026-08-06) repointed the resolver's output onto the live `stat_contribution`
substrate and corrected the row's `readSites`, which had claimed `orchestrator.ts` — a
transcribed intention that was never a real import, and the kind of unverified read site this
registry exists to catch. The row stays LEAKED: making a resolver correct-if-called does not
make it called. Wiring is THR-996; the surviving reach-keyed seed writes behind
`attachment-edge-modifiers` are THR-997.
