---
domain: interfaces
last_reviewed: 2026-07-23
reviewer: cowork
ul_shards: [Graph, Agents, Encounters, Cosmology]
status: live
---

# Canon — System Interface Map

> Who consumes what, across subsystem boundaries — the contract layer between the systems
> inventory ("what exists") and the rulebook ("how it plays"). Load this **whenever a plan
> touches a subsystem that other subsystems read from or write to** — i.e. nearly always.

## Why this page exists

`Docs/canon/systems-inventory.md` answers "does system X exist?" It cannot answer "who
depends on X, and does that dependency still function?" Features leak exactly there: a
producer keeps writing data whose consumer was rewritten away (or vice versa), tests still
pass because they assert the write, and the game silently loses richness. The 2026-07-23
attachment audit found **five** such leaked contracts in one subsystem — all invisible to
tests, typecheck, and playtests.

**A contract row is grep-verifiable.** Each row names its mechanism symbol(s). To re-verify
a row, grep the symbol and check both a production write site and a production read site
exist (tests don't count). A row that fails the check is a leak — fix it or flag it, never
ignore it.

**Three lenses, one stack — don't confuse them.**
1. **Codesight** (`.codesight/graph.md`, MCP) — *file-level imports*. Catches orphan modules
   (a resolver no production file imports). An import edge proves code linkage, **not** a
   live contract: `modifiers.ts` is imported (visibility) while item stat bonuses still flow
   nowhere. Data contracts riding graph node/edge *properties* never appear here at all.
2. **Systems inventory** (`systems-inventory.md`, generated) — *existence + tick wiring*.
3. **This map** — *contract semantics*: design intent ↔ mechanism ↔ consumer ↔ liveness.
   Contract intent uses **UL terms** (a contract is a relationship between UL terms, e.g.
   "Possession modifies Domain Capability"); an undeclared concept in a new contract goes
   through the existing UL-proposal flow.

**Badges:** 🟢 LIVE (production write + read verified) · 🟠 PARTIAL (works but a stated gap)
· 🔴 LEAKED (one side dead — feature silently lost) · ⚪ UNAUDITED (not yet verified).

## Interface stewardship protocol (binding for design sessions)

1. **Step 0.7 — Interface impact check.** After the substrate-existence check (Step 0.6),
   find every subsystem your plan touches in this map. The plan doc must carry an
   `## Interface impact` section: one row per touched contract with an action —
   `preserve` / `extend` (name the new consumer/producer) / `add` (new contract → add the
   row to this map in the same change) / `retire` (explicit, with a user verdict if
   player-facing).
2. **No producer without a consumer.** A plan that adds a write (new property, edge, event,
   trace meant for cross-system use) must name the production read site in the same plan —
   or open a `Deferral`-labeled Linear issue and cite it in the contract row. "Something
   will read this later" without a ticket is how features leak.
3. **Executors update rows they touch.** DoD: if your change adds, retires, or reroutes any
   read/write named here, update the row (badge, symbols) in the same PR.
4. **Audit-on-touch.** ⚪ UNAUDITED subsystems get their contract table written by the first
   design session that touches them — verify with greps, don't transcribe intentions.
   **UNAUDITED is a to-do marker, never an exemption from Step 0.7.** Cold subsystems no
   session touches get swept by a weekly audit ticket from the Friday drift scan.
5. **Badges can only be downgraded mechanically.** Static checks prove deadness, never
   liveness (a symbol can grep green while its payload is `{}` or its only reader asks for
   one attribute). 🟢 LIVE requires dated human verification or a runtime flow probe. Once
   the contract registry lands, it — not this page — is the source of truth for rows, and
   the tables here move to the generated file.

## Audited: Attachments (items, conditions, blessings, agreements, retainers)

Design docs: `2026-03-10-attachment-system-design.md`, `2026-03-31-generic-effect-system-design.md`,
`2026-04-05-effect-primitive-architecture.md`. Runtime health (seed 42, medium, 120t): possesses edges 7→82.

**Outbound (what attachments do to other systems):**

| Contract (design intent) | Mechanism (grep keys) | Consumer | Status |
|---|---|---|---|
| Items shape action resolution rolls | node `effects[]` → `collectAttachmentEffects` → `collectTestShapers` | `unifiedActionResolution.ts` | 🟢 LIVE |
| Items grant traits while held | node `grantsTraitWhileHeld` | `encounterScoring.ts` (treasure-map/ruin_seeker gate) | 🟢 LIVE |
| Effects tick, decay, stack, expire | `effectTick` (phase 2a.4), `effectShellRuntime` | orchestrator | 🟢 LIVE |
| Slot caps suppress overflow | `attachmentSlotResolver`, edge `active:false` | `effectWalker` (single suppression seam) | 🟢 LIVE |
| Character sheet shows items | `agentAttachments.ts` → `AttachmentsTab` | `AgentProfileModal` | 🟢 LIVE |
| Items raise capability tiers | node `domainContributions` → `computeRawScore` | `domainCapability.ts` → Prowess tab, eligibility | 🔴 LEAKED for **possession items** — catalogs write `{}` empty (trait-type bestowals like Patron's Backing DO carry contributions via `has_trait`). Note: `anomaly-reward-catalog.ts` deliberately migrated off this field onto `effects[]` (2026-04-06) — the empties read as a half-finished migration, not accidental loss. **→ THR-718** |
| Items modify attributes | possesses-edge `modifiers {iron:…}` → `collectModifiers` | `modifiers.ts` — production reads **only `los_range`** (`visibility.ts`) | 🔴 LEAKED — written by `seedAttachments`, `rewardPool`, `attachmentTierAdvancement`; capability attributes never queried. **→ THR-723** (substrate via THR-718) |
| Items grant abilities | possesses-edge `grants[]` | — | 🔴 LEAKED — written at seeding, zero production read sites. **→ THR-722** |
| Items break/trigger on use | node `onUseTriggers` → `attachmentTriggers.ts` | — (tooltip display only) | 🔴 LEAKED — resolver has no production caller; breakage/consumption authored but never fires. **→ THR-719** |
| Player-activated item powers | node `activatedEffects` (`ActivatedAbility`) | — | 🔴 LEAKED — typed + authored in `artifact-templates.ts`, no engine consumer. **→ THR-720 (parked)** |
| Tier advancement strengthens items | `attachmentTierAdvancement.ts` → edge `modifiers` | → the dead modifiers path above | 🟠 PARTIAL — advancement boosts a stat nothing reads. **→ THR-723** |

**Inbound (what feeds attachments):**

| Contract | Mechanism | Producer | Status |
|---|---|---|---|
| Encounters grant rewards | `assembleRewardPool` → `rewardPool.ts` instantiation | encounter aftermath / `unifiedActionResolution` | 🟢 LIVE |
| Worldgen seeds starters | `seedAttachments.ts`, `starter-attachments.ts` | worldgen | 🟢 LIVE |
| Conditions/bestowals as trait edges | reward `has_trait` edges w/ node `domainContributions` | `rewardPool.ts` | 🟢 LIVE (trait nodes DO feed `computeRawScore`) |

## Audited: Ambitions & Initiatives (agent-level)

Runtime health (seed 42, medium, 120t): pursues edges 32→225, 182 active; milestone events firing.

| Contract | Mechanism (grep keys) | Consumer | Status |
|---|---|---|---|
| Agents acquire ambitions (worldgen, birth, re-eval) | `assignInitialAmbitions` ← `worldSeed`, `agentLifecycle`, `ambitionTick` | `pursues` edges | 🟢 LIVE |
| Ambitions progress + complete | `phaseAmbitionProgress` (15-tick cadence), milestones | events → alert notifications | 🟢 LIVE |
| Ambitions bias encounter choice | `applyAmbitionBoost` → `encounterScoring` | agent decision pipeline | 🟢 LIVE |
| Ambitions explain motives | `ambitionBoost` term → `motiveReceipt` provenance | foreshadowing receipts | 🟢 LIVE |
| Faction ambitions drive faction action | `factionAmbitions.ts` → `FactionSheet.activeAmbition` | faction phases + UI | 🟢 LIVE |
| Player sees an agent's ambitions | `JourneyTab` — gated `interactionDepth ≥ 2` **OR** knowledge ≥ `'known'` (`JourneyTab.tsx:33–35`) | `AgentProfileModal` | 🟠 PARTIAL — both gate paths exist, but thresholds/accrual rates keep ambitions hidden in normal play; reads as "the feature disappeared". **→ THR-721** |
| Ambitions strand | `getAmbitionsStrand` → `StrandView` | `useAgentInteraction` | 🟢 LIVE (wired; verify visually on next UI pass) |
| Completed-ambitions history | `ChronicleTab` § Completed Ambitions | — | 🔴 LEAKED — placeholder text, never implemented. **→ THR-721** |

Known dead code: `AgentDetailPanel.tsx` is an orphaned pre-`AgentProfileModal` sheet — do
not "fix" ambition display there.

## Unaudited subsystems (audit-on-touch)

Contract tables not yet verified for: War & Armies · Factions & Succession · Rival Schemes ·
Doom/Journey · Mandate · Essence & Divine Economy · Encounters & Dilemmas (core) · Culture ·
Personality & Traits · Economy & Prosperity · Ruins & Delves · Stealth & Detection ·
Attention & Chronicle · Omens & Foreshadowing · Strategic Projects · Ascendant Beats ·
Movement & Colocation · Reputation & Influence · Secrets & Favors (DORMANT) ·
Effects & Conditions (partially covered above) · Agent Lifecycle · Intelligence & Knowledge ·
Spheres & Quintessence — plus the **init-time systems the tick-phase inventory cannot see**:
Worldgen (map + history generation) and Encounter Seeding (seeds/hidden marks, THR-697), both
confirmed real by the 2026-07-23 archive sweep. ⚪ First design session to touch one writes
its table (protocol §4). The wiki projection (`public/system-interface-map-reference.html`)
draws one box per subsystem listed here — a row without a box there is a wiki bug.

## Current spec
- **Subsystem existence + tick wiring:** `Docs/canon/systems-inventory.md` (generated)
- **Import-level blast radius:** `.codesight/graph.md` + codesight MCP
- **This page:** cross-system *contracts* and their liveness

## Active design plans
- `Docs/plans/2026-07-23-system-interface-map.md` — this page's origin: audit findings,
  planned generator (`generate-interface-map` write/read asymmetry check), protocol wiring,
  remediation tickets for the leaked attachment contracts and ambition visibility.

## Rejected approaches
- ❌ Hand-maintained interface diagrams with no grep keys — undetectable drift (the reason
  this page exists). Every row must carry verifiable symbols until the generator lands.

## Open questions
*(none — the four launch questions were verdicted by the user via chat review 2026-07-23;
see the plan doc § User verdicts. In short: items DO move tiers again via an `effects[]`
primitive feeding `computeRawScore` + a StepDots-style magnitude indicator beside the
capability prose; on-use triggers are re-expressed as effect primitives; `activatedEffects`
parked explicitly; primary-ambition knowledge bar lowered + ChronicleTab completed list
implemented. Remediation tickets carry the details.)*

## Last-reviewed
2026-07-23 by cowork (Fable design session — manual audit of Attachments + Ambitions;
independently reviewed same day by a second cold-context Fable agent, which spot-checked the
audit claims against code — corrections applied to the ambition-gate and
`domainContributions` rows). Review trigger: monthly; regenerate badges when
`generate-interface-map` lands.
