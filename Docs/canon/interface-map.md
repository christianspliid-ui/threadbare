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
ChronicleTab completed list · **THR-722** retire edge `grants[]` · **THR-723** dead stat path.

Known dead code: `AgentDetailPanel.tsx` is an orphaned pre-`AgentProfileModal` sheet — do
not "fix" ambition display there.

## Unaudited subsystems (audit-on-touch)

Contract rows not yet written for: War & Armies · Factions & Succession · Rival Schemes ·
Doom/Journey · Mandate · Essence & Divine Economy · Encounters & Dilemmas (core) · Culture ·
Personality & Traits · Economy & Prosperity · Ruins & Delves · Stealth & Detection ·
Attention & Chronicle · Omens & Foreshadowing · Strategic Projects · Ascendant Beats ·
Movement & Colocation · Reputation & Influence · Secrets & Favors (DORMANT) ·
Effects & Conditions (partially covered) · Agent Lifecycle · Intelligence & Knowledge ·
Spheres & Quintessence. ⚪ First design session to touch one writes its rows (protocol §4).

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
2026-07-23 by Claude Code (THR-717 implementation). Rows regenerate mechanically; this page's
protocol is reviewed monthly. Implementation correction to the original audit: the
`attachment-tier-advancement` row was badged 🟠 PARTIAL on the assumption advancement runs —
Tier 1 shows `attachmentTierAdvancement.ts` has **zero production importers**, so it never
runs at all. Remediation remains THR-723.
