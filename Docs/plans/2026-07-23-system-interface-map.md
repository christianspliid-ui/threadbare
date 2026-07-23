---
status: proposal
---

# System Interface Map — contract registry, liveness generator, and stewardship protocol

**Date:** 2026-07-23 · **Session:** Fable design session (interactive, user-directed)
**Companion:** `Docs/canon/interface-map.md` (the artifact itself, seeded in the same PR)

## Problem

We can answer "does subsystem X exist?" (`systems-inventory.md`, generated) and "who imports
file Y?" (codesight), but not **"which cross-system contracts does X participate in, and do
they still function?"** Features leak precisely at that layer: a producer keeps writing data
whose consumer was rewritten away, tests still assert the write, and the game silently loses
richness. The user named two suspects; the audit confirmed the pattern:

### Audit findings (2026-07-23, evidence-grade)

**Attachments — engine alive, five contracts leaked.** Runtime: possesses edges grow 7→82
over 120 ticks (seed 42, medium); rewards, slots, effect ticking, character-sheet display all
live. But:

1. **Items → capability tiers: LEAKED.** `computeRawScore` (domainCapability.ts:71–82) reads
   `domainContributions` off possession nodes — and every entry in
   `reward-attachment-catalog.ts` / `starter-attachments.ts` writes `domainContributions: {}`.
   Items cannot move the tiers shown on the Prowess tab or used by encounter eligibility.
2. **Edge `modifiers {iron:0.10}`: LEAKED.** Written by `seedAttachments`, `rewardPool`,
   `attachmentTierAdvancement`; read only via `modifiers.ts`, whose sole production caller is
   `visibility.ts` for `los_range`. "+0.15 star" on the Starweave Cloak does nothing.
3. **Edge `grants[]` (item-granted abilities): LEAKED.** Zero production read sites; only
   tests assert the write.
4. **`onUseTriggers` (breakage, curse-on-critical-failure): LEAKED.**
   `attachmentTriggers.ts` is a complete, tested resolver with **no production importer**
   (tooltip display reads the raw data; nothing fires triggers at resolution).
5. **`activatedEffects` / `ActivatedAbility`: LEAKED.** Typed, authored in
   `artifact-templates.ts`, consumed by no engine system.

The live mechanical path is the generic effect system (`effects[]` → `effectWalker` →
`collectTestShapers` in `unifiedActionResolution.ts`) — the 2026-03-31 redesign wired the
new path and the four legacy contracts were never either migrated or retired. Classic drift.

**Ambitions — engine alive and deeply coupled, UI-side partially dark.** pursues edges
32→225/120t; `phaseAmbitionProgress` completes milestones; `applyAmbitionBoost` biases
encounter scoring; motive receipts carry ambition provenance; faction ambitions render in
`FactionSheet`. But the character-sheet `JourneyTab` gates display behind
`interactionDepth ≥ 2` (`agentKnowledge.ts:100`), which hides ambitions for nearly every
agent — the user experiences this as "ambitions disappeared from the UI" — and
`ChronicleTab` § Completed Ambitions is an unimplemented placeholder.

**Diagnosis:** every leak is a *write/read asymmetry across a subsystem boundary*. That is
mechanically detectable — which is what this plan builds.

## Substrate inventory

Nothing proposed here exists. Greps: `interface-map|interface-contracts|generate-interface`
→ 0 hits across `Docs/canon/`, `scripts/`, `src/engine/`, `systems-inventory.md`. Adjacent
substrate **extended, not duplicated**:
- `scripts/generate-systems-inventory.ts` — same generated-canon pattern; the new generator
  is a sibling, sharing its SUBSYSTEMS registry as the subsystem name authority.
- **Codesight** (`.codesight/graph.md` + MCP, SessionStart-regenerated) — the advisory
  session-time import lens; already the design workflow's Step 0.5 (blast radius). Step 0.7
  complements it: 0.5 asks "who imports these files", 0.7 asks "which design-level
  contracts flow through them, and are they alive" — file imports cannot see property-bag
  contracts, which is where 3 of the 5 attachment leaks live. **Not a generator input:**
  `.codesight/` is gitignored and its hook doesn't run in CI; the generator does its own
  import grep for determinism.
- **Ubiquitous Language** (`Docs/ubiquitous-language/`, dashboard `?view=ul`) — naming
  authority; contract `ulTerms` reference UL entries, new concepts go through the existing
  UL-proposal flow, and the LEAKED report joins the same weekly drift-scan family as
  `lint-ul-vs-systems`.
- `check:generated-freshness` — the enforcement hook the generated section plugs into.

## Design

Three pieces, in dependency order:

### 1. Curated contract map (lands with this plan — done)

`Docs/canon/interface-map.md`: per-subsystem contract tables — design intent, mechanism
(grep keys), consumer, badge (🟢 LIVE / 🟠 PARTIAL / 🔴 LEAKED / ⚪ UNAUDITED). Seeded with
the two audited subsystems; the rest are explicitly ⚪ with an audit-on-touch rule. Rows are
grep-verifiable by hand until the generator exists — no unverifiable prose claims allowed.

**Growth path (decided now, before the ≤200-line canon rule collides with audit-on-touch):**
once the registry lands (§2), the registry is the **single source of truth** for contract
rows; the generated file emits the full tables (intent included); the curated canon page
shrinks to protocol + three-lens orientation + pointers, and each hand-audited table moves
into the registry as its subsystem is seeded. Interim state (tables living in the curated
page) is acceptable only until then. The page also gets a row in `Docs/canon/README.md`'s
canon-page index (schema requirement).

### 2. Contract registry + liveness generator (executor ticket)

- `scripts/interface-contracts.ts` — typed registry, one entry per contract row:
  `{ id, producerSystem, consumerSystem, intent, ulTerms?: string[], mechanism: { kind:
  'node-prop' | 'edge-prop' | 'function' | 'event' | 'trace', symbols: string[], module?:
  string }, writeSites: glob[], readSites: glob[], verifiedLive?: { date, evidence },
  badgeOverride?: { badge: 'LEAKED', reason, deferralTicket }, deferralTicket?: string }`.
  Sites are *expected* locations; the generator verifies. `ulTerms` name the UL entries the
  contract relates ("Possession modifies Domain Capability") — the UL stays the naming
  authority; a contract introducing an undeclared concept routes through the existing
  UL-proposal flow. `ulTerms` is **optional in v1** (no UL-lookup tax on seeding; required
  from the first UL-dashboard integration onward).
  - **SUBSYSTEMS sharing:** the subsystem-name authority is extracted from
    `generate-systems-inventory.ts` into a shared **non-entry** module both generators
    import. Never import the inventory generator's entry file — esbuild bundling rewrites
    `import.meta.url` and defeats entry guards, so a "read-only" import can silently run the
    120-tick sim (the THR-686 failure class).
- `scripts/generate-interface-map.ts` (`npm run generate-interface-map`) — **detection is
  downgrade-only.** Static analysis can prove a contract dead; it can never prove one
  alive. Both audit headline leaks are *value-level* (catalogs write `domainContributions:
  {}` — the symbol greps green) or *argument-level* (`modifiers.ts` has a genuine production
  reader that only ever asks for `los_range`) — a write+read symbol match would have
  re-badged both LIVE. So:
  - **Tier 1 — module orphan check** (self-contained import-statement grep; `.codesight/`
    is gitignored and its SessionStart hook doesn't run in CI, so codesight is an advisory
    session-time lens, **never** a generator input — determinism, NFP #3). When
    `mechanism.module` is set, zero production importers → LEAKED. Catches leak class 4
    (on-use triggers) in one lookup.
  - **Tier 2 — symbol asymmetry check** (word-boundary-anchored greps — bare `grants`
    collides with `grantsActionIds`/`grantsTraitWhileHeld`; the THR-614 seam-2 error class —
    across `src/` excluding `__tests__`; always report the **total** hit count alongside the
    capped site listing so over-broad symbols are visible). Write-only → LEAKED (producer
    orphan); read-only → LEAKED (consumer starving); neither → UNWIRED.
  - **LIVE is never auto-assigned.** A row shows LIVE only from `verifiedLive` (a dated
    human verification with evidence, invalidated when its symbols' site sets change) —
    otherwise the best a passing row shows is UNVERIFIED-OK. `badgeOverride` pins a row
    LEAKED (with reason + ticket) when a production read site exists but doesn't count:
    display-only readers (tooltips), documented-dead components (`AgentDetailPanel.tsx`).
  - **Tier 3 (v2, the real fix for value-level deadness) — runtime flow probes.** Optional
    per-contract predicate evaluated against the same 120-tick headless run
    `generate-systems-inventory` already boots (outside prebuild, same cadence): "≥1
    possesses-edge target with non-empty `domainContributions`", "≥1 trigger-fired trace".
    Only a runtime probe can promote to LIVE mechanically; until then promotion stays human.
  - Emit `Docs/canon/interface-map.generated.md` (full contract tables incl. intent + badge
    summary; per-UL-term index deferred to v2), registered in `STATIC_GENERATED_PATHS` —
    the freshness gate hard-fails unregistered prebuild writes.
- Wire into `prebuild` + `check:generated-freshness` (blocking, per THR-690). **The
  load-bearing enforcement is explicit, not implied by the diff:** the generator **exits
  non-zero when any contract classifies LEAKED without a `deferralTicket`/`badgeOverride`
  ticket reference** (ticket format validated, `THR-\d+`). The freshness diff alone would
  pass an executor who kills a read site and commits the regenerated now-LEAKED map;
  the exit code is what turns CI red.
- **Drift-scan alignment (v2):** once a standing LEAKED backlog exists, surface it as
  `drift-scan` Linear issues in the Friday scan alongside the `lint-ul-vs-systems` family —
  same reporting channel the retro already reads. CI ratchet catches *regressions*; the
  drift scan carries the *backlog*. Deferred so v1 ships small.
- **Ratchet, not big-bang:** registry starts with the ~20 audited attachment/ambition
  contracts. Known-LEAKED entries carry `deferralTicket` so the build is green from day one;
  removing a ticket reference without fixing the contract fails.
- **Coverage cadence:** audit-on-touch alone lets cold subsystems fester (Secrets & Favors
  has been DORMANT indefinitely — exactly where leaks live longest). The Friday drift scan
  seeds **one audit ticket per week**, highest-suspicion subsystem first (DORMANT badge >
  oldest-untouched), until the ⚪ list is empty.

### 3. Protocol wiring (executor ticket, exact edit text)

- **CLAUDE.md § Design workflow checklist**, after Step 0.6: `- [ ] **Step 0.7 -
  Interface impact check (mandatory for any subsystem listed in
  Docs/canon/interface-map.md — audited or ⚪ UNAUDITED)** — for an audited subsystem,
  enumerate its contracts; for an UNAUDITED one, this plan writes its contract table
  (audit-on-touch: verify with greps, don't transcribe intentions) — UNAUDITED is a
  to-do marker, never an exemption. The plan doc must include an "## Interface impact"
  table: contract → preserve / extend (name the new producer or consumer) / add (register
  the row in the same change) / retire (explicit, user verdict if player-facing). A plan
  that adds a cross-system write without naming its production read site is incomplete — a
  "later" consumer requires a Deferral-labeled issue cited in the row.`
- **`lint:plan-doc`**: add a check — a plan doc naming any mapped subsystem without an
  `## Interface impact` section gets flagged. Honor-system gates decay in this repo
  (THR-686 gate theater); the lint makes Step 0.7 nag mechanically. (Advisory, matching the
  lint's current status.)
- **CLAUDE.md § Per-system required sections**: add `Interface impact` to the required
  inline list.
- **CLAUDE.md § Definition of Done**: `- [ ] **Update the interface map** — if the change
  adds, retires, or reroutes any cross-system read/write named in
  Docs/canon/interface-map.md, update the row (and interface-contracts.ts once it exists) in
  the same PR. Retiring a contract deletes or repoints the tests that assert its dead side —
  green tests on a dead contract are the pathology this map exists to kill; a
  LEAKED-with-ticket contract's asserting tests carry the ticket reference in a comment.`
- **`.claude/skills/design-session/SKILL.md`** Step 1: add Step 0.7 line mirroring the above.
- **`Docs/canon/process.md`**: pointer row to the new canon page.

### Remediation backlog (each its own ticket; **not** in scope here)

Four need a **user verdict** (creative calls, chat-reviewed — framings corrected per the
2026-07-23 forked Fable review, which found the originals under-evidenced):

- **(a) Should items move capability tiers again — and through which substrate?** Not a
  simple "repair vs retire": `anomaly-reward-catalog.ts` was *deliberately migrated off*
  `domainContributions` onto `effects[]` on 2026-04-06, so the empty `{}` fields read as a
  half-finished migration, and "fill domainContributions back in" would silently reverse a
  prior design direction. Note trait-type bestowals (Patron's Backing, Ruin Seeker) already
  carry non-empty contributions via the `has_trait` walk — the gap is possession items
  specifically. Power-budget warning: items already shape resolution rolls via effects[]
  test shapers; tier contributions would be a second, stacking power channel. Options: (1)
  finish the migration — an effects[] primitive that feeds `computeRawScore`, one stat
  substrate; (2) fill `domainContributions` for signature items only; (3) retire the tier
  contract, items shape rolls only. Recommend **(1)** — restores "a legendary blade makes
  its bearer mightier on the sheet" without a parallel stat path.
- **(b) Item breakage/consumables/curse-triggers — wire or retire, and on which substrate?**
  Wiring the legacy `attachmentTriggers.ts` resolver as-is would reintroduce a parallel
  path beside the effects[] architecture that replaced it — re-creating the drift this plan
  diagnoses. Options: (1) re-express on-use triggers as effect primitives (extend the
  effects[] vocabulary with on-outcome triggers), migrating authored content; (2) wire the
  legacy resolver as-is. Recommend **(1)**; the authored content ports.
- **(c) `activatedEffects` (player-activated item powers): implement vs park.** Recommend
  **park explicitly** — real feature, needs its own design ticket; delete nothing.
- **(d) Ambition visibility.** Correction: `JourneyTab.tsx:33–35` already gates on
  `interactionDepth ≥ 2` **OR** knowledge ≥ `'known'` — a knowledge path exists. The real
  questions: is `'known'` too high a bar / accrual too slow for ambitions to surface in
  normal play (playtest-check as part of the ticket), and should the ChronicleTab
  "Completed Ambitions" placeholder be implemented. Recommend **lower the knowledge bar for
  the primary ambition + implement the ChronicleTab list**; keep secondary ambitions gated
  deeper.

Technical-only: (e) retire edge `grants[]` — migrate the 3 authored uses to
`grantsTraitWhileHeld`/`effects[]` **and delete the tests asserting the dead writes**
(`seedAttachments.test.ts:75–76,142`); (f) stop `attachmentTierAdvancement` writing dead
edge modifiers once (a) resolves the canonical stat substrate.

### User verdicts — human gate satisfied via chat review 2026-07-23

Christian verdicted all four calls in chat (plain-language review per THR-608):

- **(a) YES — items move capability tiers again, via option (1)**: finish the 2026-04-06
  migration — an `effects[]` primitive feeding `computeRawScore`; do **not** resurrect
  bare `domainContributions` fills. **Plus a UI requirement:** the character sheet shows a
  simple magnitude indicator next to the capability prose — the same dot-scale visual
  language used for spheres (reuse the shared `StepDots` primitive,
  `src/components/shared/StepDots.tsx`, or the sphere-alignment dot pattern; 1–5 or 1–10
  dots, executor picks whichever the existing sphere display uses).
- **(b) AGREED** — re-express on-use triggers (breakage/consumables/curses) as effect
  primitives; port the authored content; do not wire the legacy resolver.
- **(c) AGREED** — park `activatedEffects` explicitly as its own future design ticket;
  delete nothing.
- **(d) AGREED** — lower the knowledge bar for seeing a mortal's *primary* ambition
  (mechanism exists, tuned invisible); implement the ChronicleTab Completed Ambitions list;
  keep secondary ambitions gated deeper.

## Three-pillar check

- **Engine:** N/A — generator + registry live in `scripts/` (build-time, not tick loop).
  Remediation tickets (a),(b),(e),(f) carry their own Engine pillars when designed.
- **Content:** N/A — no templates/prose. Remediation (a),(b) will touch catalogs.
- **UI:** N/A — docs + build tooling. Remediation (d) carries the UI pillar.
- **Wiring:** the generator wires into `prebuild` + `check:generated-freshness`; the
  protocol wires into CLAUDE.md, design-session skill, process canon (§3 above).

## Constants

| Name | Default | Purpose |
|---|---|---|
| `INTERFACE_MAP_EXCLUDES` | `['**/__tests__/**', '**/*.test.*']` | What never counts as a production site |
| `MAX_SYMBOL_HITS_REPORTED` | 5 | Cap per-row site listing in generated output |

## Tracing

N/A — build-time tool; output is the generated file itself. (NFP #2 is served by the map:
it *is* an inspectability artifact.)

## Fail-soft table

| Failure | Behavior |
|---|---|
| Registry symbol matches nothing | Row badge UNWIRED + build warning — never a crash |
| Grep tool unavailable in sandbox | Generator exits non-zero with the PowerShell fallback command printed (known rg limitation) |
| Registry entry malformed | Skip row, emit it under a `## Registry errors` heading in output |
| Known-LEAKED row without `deferralTicket` | Freshness check fails (this is the ratchet working) |

## NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — excludes/caps named constants |
| 2 Inspectability | PASS — the deliverable is an inspectability surface; badges carry evidence |
| 3 Determinism | PASS — pure static analysis of the working tree |
| 4 Fail-soft | PASS — table above; generator never blocks a build except via the explicit ratchet |
| 5 Narrative > mechanics | PASS w/ note — remediation recommendations favor restoring narrative-rich couplings (item breakage, visible ambitions) |
| 6 Additive | PASS — new files + checklist lines; no refactors |
| 7 Perf budget | PASS — build-time only |

## Executor action items

1. Land `scripts/interface-contracts.ts` seeded from the canon page's audited rows —
   known-LEAKED rows carry `deferralTicket`; hand-verified LIVE rows carry `verifiedLive`
   citing this plan's audit; extract the shared SUBSYSTEMS module (non-entry, §2).
2. Land `scripts/generate-interface-map.ts` + npm script; register output in
   `STATIC_GENERATED_PATHS`; wire `prebuild` + `check:generated-freshness`; verify the
   non-zero-exit ratchet (LEAKED without ticket) actually fails CI; commit first generated
   output and shrink the curated page per the growth path (§1).
3. Apply protocol edits (§3) to CLAUDE.md, design-session SKILL.md, process canon,
   `lint:plan-doc`; add the interface-map row to `Docs/canon/README.md`'s index.
4. File the six remediation tickets (§ backlog), tagging (a)–(d) as needing a user verdict
   surfaced via briefing, (e)–(f) as technical.
5. File the weekly coverage-cadence hook into the Friday drift scan (one audit ticket/week
   while ⚪ subsystems remain).

## Forked-audit verdicts

**2026-07-23 — independent Fable review (cold context, adversarial, spot-checked claims
against code).** Spot-checks: 4 audit claims confirmed, 1 confirmed-with-nuance
(trait-bestowals do carry `domainContributions`; possession items are the gap), 1 partially
refuted (JourneyTab has an existing knowledge-tier OR-gate the original framing missed).
Must-fix findings — all applied to this revision: (1) Tier-2 write+read symbol matching
would have false-promoted both headline leaks to LIVE → detection is now downgrade-only,
LIVE requires `verifiedLive` or a Tier-3 runtime probe, `badgeOverride` pins
display-only/dead-component readers; (2) codesight is gitignored + hookless in CI → removed
as a generator input, advisory-only; (3) Step 0.7 text exempted the 22 ⚪ subsystems →
audit-on-touch folded into the binding checklist text; (4) remediation (a)/(d) reframed on
corrected evidence (2026-04-06 effects[] migration precedent; existing OR-gate); (5) canon
≤200-line growth path decided (registry becomes source of truth). Opportunities folded in:
Tier-3 runtime probes (v2), `lint:plan-doc` section check, dead-contract test rule in DoD,
word-boundary symbols + total hit counts, weekly coverage cadence, v1 scope trims (`ulTerms`
optional, per-term index + drift-scan reporting deferred). Reviewer's overall verdict:
framework sound, diagnosis correct, layering additive; ship after the above.

**Gate rationale (intent-judge / design-audit-pipeline):** the standard Step 8.5/8.6
subagent gates were satisfied by a heavier substitute in this session: a full adversarial
cold-context Fable review (above — spot-checked claims against code, attacked enforcement
holes, checked governance consistency) **plus** direct interactive user review of intent and
all creative verdicts in chat (recorded in § User verdicts). Re-running the lighter
subagent gates on top would duplicate coverage already obtained; recording that trade-off
here per the skip-with-rationale rule.
