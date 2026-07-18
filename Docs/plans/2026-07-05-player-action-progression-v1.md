# Player Action Progression v1 — In-Run Capability Growth & Unlock Cadence

**Date:** 2026-07-05
**Author:** Cowork
**Status:** In Design → Ready for Dev (phased multi-session core, mirrors THR-611)
**Linear:** THR-613 (design kickoff / umbrella) · Project: Action System & Unlocks
**User directive (2026-07-04):** "more robust player action progression."
**Predecessors:** THR-390 (action audit verdicts), THR-499/503/509/517 (Ascendant Beats + reach gate + `unlock_action` grant path, shipped), THR-611 (Divine Economy essence sources — coordinate), 2026-03-18 tier-promotion doc (agent-side tier-crossing pattern reused god-side).
**Folds:** THR-64/65 overlap = shared tier-crossing-vignette infra (agent ascension ladder stays THR-64; this plan builds the shared "a tier crossing fires a prose beat" mechanism the god and later agents both use).

---

## 1. Problem

The pieces of player progression exist but don't compose into a *felt* curve. Domain Capability tiers gate reach templates, Ascendant Beats grant within-run unlocks, and the reach gate hides cards outside the ascendant's two permanent reaches — but nothing makes the player's action palette **visibly deepen over a run**. There is no answer to "how does an Iron-god at tick 200 command more than the same god at tick 20?" beyond passively accreting essence.

Three concrete gaps:

1. **No god-side capability growth.** Agents grow their Domain Capability by doing encounters (2026-03-18 encounter-experience accumulation). The *ascendant* has a Domain Capability tier too (load-bearing: "ascendants use the same prerequisite system as agents") but nothing raises it in-run. The tier is set at remembrance and frozen. So tier-gated templates never become *newly* reachable through play.
2. **Two parallel dispensers risk.** Ascendant Beats grant unlocks; essence-source milestones (THR-611) grant source verbs; discovery (elder magic) grants Foundation cards. Without a unifying spine these read as three unrelated pop-ups, not one progression.
3. **No legible locked-state grammar.** The player cannot tell "I can't do this *yet* (deepen this run)" from "I can't do this *this run* (wrong identity, permanently locked)". Both currently just… aren't in the drawer.

## 2. Design spine — one curve, three axes, one dispenser

The player's power grows along **three axes**, all surfaced through **one dispenser** (the shipped Ascendant Beat Director + `unlock_action` grant path). No new grant mechanism; no competing "level-up" popup.

- **Axis A — Reach depth (vertical).** The ascendant's Domain Capability tier in each of their **two permanent reaches** rises over the run, unlocking deeper tier-gated templates *in the same reach*. Earned by divine activity in that reach.
- **Axis B — Palette breadth (horizontal).** New named cards granted as one-off unlocks: investment-beat rewards (spend essence), essence-source milestones (THR-611), and discovery (elder magic / Deep Eye Clue→Delve).
- **Axis C — Sustained commitment (Control).** Control-slot cap scales with tier (already derived); the sustained controls themselves get a dedicated UI surface (THR-390 verdict #5).

**The unifying claim:** *a tier crossing is a kind of beat.* When Axis A crosses a boundary, the Director fires a **Deepening Beat** — a prose vignette addressed to the god that (a) narrates the growth, (b) grants the tier-up, and (c) optionally offers a card choice. Axis B unlocks are **Investment / Milestone / Discovery beats** on the same Director, deduped so at most one progression beat resolves per tick. One spine, many triggers.

### 2.1 Expected shape of a run (tunable targets, not hard gates)

| Phase | Ticks (balanced) | Primary reach | Secondary reach | Felt result |
|---|---|---|---|---|
| Early | 1–60 | Tier start → +1 | start | First Deepening beat; 1–2 breadth unlocks |
| Mid | 60–200 | +1 → +2 | +1 | Signature reach-gated power reachable; sustained controls active |
| Late | 200–500 | +2 → +3 | +1 → +2 | Full identity palette; apex cards via milestone/discovery |

Target: **≥3 distinct tiers crossed across the two domains over tick 1→500** (aligns with THR-64 exit criterion 1, god-side). The secondary reach deliberately lags the primary — identity has a lead axis.

## 3. Engine pillar

### 3.1 God-side reach practice accumulation

Mirror the agent `encounter_experience` mechanism (2026-03-18 §Decision 1) on the ascendant, additively, honoring "ascendants use the same prerequisite system as agents."

- **State:** `ascendant.properties.reachPractice: Partial<Record<ReachDomain, number>>` (property bag on the ascendant node — **no new node/edge type**).
- **Accrual:** in the action-resolution phase, when the player resolves an action whose template carries a `reach`, add `PLAYER_PRACTICE_PER_ACTION × difficultyScaling × (1 − currentCap × DIMINISHING_RETURNS_FACTOR)` to `reachPractice[reach]`. Shaping an encounter in a reach (via divine intervention on a reach-typed step) accrues the same. Practice only accrues in the **two permanent reaches** — activity in a locked reach is impossible to initiate anyway (reach gate), so this is automatically satisfied.
- **Feeds capability:** `computeDomainCapability` for the ascendant reads `reachPractice[reach]` as an additive raw-score term (same sigmoid, one source of truth — no parallel XP number). Diminishing returns are intrinsic to the sigmoid + the DR factor, giving "easy to start, hard to master."

### 3.2 Tier-crossing detection → Deepening beat enqueue

New leaf tick phase `phaseAscendantProgression` (inserted after resolution, before the Director's beat-selection phase):

1. For each of the ascendant's two domains, derive `newTier = ceil(capability × 10)` (existing `domainCapability.ts` derivation).
2. Compare against `ascendant.properties.reachTierSnapshot[reach]` (persisted last-seen tier).
3. On an upward crossing, enqueue a **Deepening beat** via the shipped Director offer path (`unlock_action`-capable beat) — **not** a bespoke modal. Update the snapshot. Fail-soft: never enqueue more than one Deepening beat per tick; extra crossings queue for subsequent ticks.

The Director already dedups against onboarding/living-world/investment beats (THR-499). Deepening beats join that priority pool with **highest** progression priority (an earned milestone outranks an ambient beat).

### 3.3 Unlock grant path — reuse only

All three axes grant through the **shipped `unlock_action` aftermath** (THR-500/517). A Deepening beat's reaction grants: (a) the tier-up is already applied by 3.2; (b) if the beat offers a card, the chosen `unlock_action` reveals it. Investment/Milestone/Discovery beats are pure `unlock_action`. **No net-new grant mechanism.** Essence-source milestone beats (Axis B) are authored to fire from THR-611's source-tier transitions (coordinate — THR-611 already grants source verbs through beats; this plan adds the *milestone* trigger that fires a breadth beat at N controlled / first Flowering source).

### 3.4 Control-slot exposure + release op

Control-slot cap already scales with tier. Add (if absent) a `release_control` graph op so the player can retire a sustained control from the new UI (3.C), refunding nothing but freeing the slot and stopping `perTickCost`. Fail-soft: releasing a contested control resolves it as abandoned (rival, if any, wins the contest next tick).

### 3.5 Constants (NFP #1) — `src/data/player-progression.ts` (new)

| Constant | Default | Purpose |
|---|---|---|
| `PLAYER_PRACTICE_PER_ACTION` | 0.4 | Base reach-practice per resolved reach-typed action |
| `PLAYER_PRACTICE_DIFFICULTY_SCALE` | {trivial 0.2 … deadly 1.5} | Reuse agent difficulty bands |
| `PLAYER_DIMINISHING_RETURNS_FACTOR` | 0.7 | Match agent DR for curve parity |
| `PLAYER_PRACTICE_ENCOUNTER_SHAPE` | 0.4 | Practice from shaping a reach-typed encounter step |
| `DEEPENING_BEAT_MAX_PER_TICK` | 1 | Dedup cap |
| `SECONDARY_REACH_PRACTICE_MULT` | 0.7 | Secondary reach accrues slower (identity lead axis) |
| `MILESTONE_SOURCES_FOR_BEAT` | 3 | Controlled essence sources that fire a breadth beat (coordinate THR-611) |

All exposed via the CMS tunables registry (`src/components/CMS/registry.ts`).

### 3.6 Tracing (NFP #2)

```ts
interface PlayerPracticeTrace   { category: 'ascendant.progression.practice'; turn: number; reach: ReachDomain; delta: number; total: number; }
interface PlayerTierUpTrace     { category: 'ascendant.progression.tier_up'; turn: number; reach: ReachDomain; fromTier: number; toTier: number; }
interface DeepeningEnqueueTrace { category: 'ascendant.progression.deepening_enqueued'; turn: number; reach: ReachDomain; beatId: string; }
interface ControlReleaseTrace   { category: 'ascendant.progression.control_release'; turn: number; controlId: string; contested: boolean; }
```

Register all in `TRACE_CATEGORIES`.

### 3.7 Fail-soft (NFP #4)

| Failure | Fallback |
|---|---|
| `reachPractice` missing on legacy save | Treat as 0; lazy-init on first accrual (income/tier unchanged) |
| `reachTierSnapshot` missing | Seed from current derived tier on first phase run; no spurious tier-up beat |
| Director full / another beat this tick | Deepening beat re-queues next tick; snapshot already advanced so no double-fire |
| Tier crosses ≥2 boundaries in one tick | Emit one beat, advance snapshot by one; remaining crossings queue |
| `unlock_action` targets an already-revealed card | No-op reveal (idempotent, shipped behavior) |

## 4. Content pillar

### 4.1 Deepening beats — one per reach (8), prose-first (THR-609 plain register)

Each is an `EncounterTemplate`-format Ascendant Beat addressed to the god, in the shipped beat content file. Voice = Threadbare plain register, **never "+1 tier"**. Example (Iron, tier 2→3):

> *The Weave has learned the shape of your will in iron. Where once your urgings only leaned on a captain's resolve, now whole shield-walls stiffen when you turn your gaze to them. Something in the world has decided you are to be obeyed in this.*
>
> — grants the tier-up; offers a choice of one tier-3 Iron card (or "hold" — banked, offered again next Deepening).

The eight cover Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star so **no identity ships with a dead Deepening path** (correctness under the two-domain lock, same property that governs the reach-signature matrix). Each beat's card offer draws from that reach's tier-appropriate `unlockable-generic` / `reach-gated` pool.

### 4.2 Milestone & discovery breadth beats

- **Essence-source milestone beat** (coordinate THR-611): fires at `MILESTONE_SOURCES_FOR_BEAT` controlled sources or first Flowering source; grants an economy-flavored breadth card. Authored to hook THR-611's source-tier transition, not a new trigger system.
- **Discovery beat**: reuse the shipped Ruins/Delve pattern (THR-390 rec #10) — Clue → Delve → grants a Foundation-sphere card. No new content system; this plan just names it as the third breadth path so it reads as part of one spine.

### 4.3 Chronicle + IPK

- Tier-up writes a chronicle entry ("Your hand in {reach} deepened").
- Locked-state hint strings (for 5.B): `"Deepen your {reach}"` / `"Not this incarnation"` — authored, not code-formatted.

## 5. UI pillar

### 5.A Covenants panel — sustained-control surface (THR-390 verdict #5)

A dedicated surface, **separate from the ActionDrawer**, for ongoing Control commitments (they are claims/covenants, not actions). Lists each active sustained control: target, per-tick cost/income (plain register, no raw floats), contestation status, and a **Release** control (→ 3.4 `release_control`). Home: a persistent tab in the ascendant bar / god dashboard. 1920×1080, `flex-1 overflow-y-auto`, viewport-contract compliant. **Browser-verify: Playwright DOM** (no WebGL).

### 5.B ActionDrawer locked-state grammar — three visible states

> **SUPERSEDED (2026-07-18, Slice 3b-tail, human-reviewed design call).** The "acquirable this run" middle state is **not** rendered in the live ActionDrawer — surfacing every unlock-gated in-reach card there floods the drawer under the empty THR-501 starter floor, and touching `getTargetActionSlots` carries live-gameplay blast radius. Instead the full three-state catalog lives in the **Codex** (`?view=codex`; in-game overlay), reachable pre-filtered from the character sheet + Signatures readout. The drawer's card population is unchanged. The three states below still describe the *grammar* — they now render as Codex card badges (`codexEntryRunState`, `src/components/Codex/codexRunState.ts`), keyed on `requiresReach` (not the `reach` tag). Table retained for the state definitions.


| State | Meaning | Render |
|---|---|---|
| **Available** | Prereqs met | Normal card |
| **Acquirable this run** | In your two reaches, gated by a tier you can still reach *or* a card you can still earn | Dimmed card + lock + prose hint ("Deepen your Iron") — "not *yet*" |
| **Locked this incarnation** | Reach outside your two permanent domains | **Not in the live drawer**; visible only in a codex/"other paths" view with "Not this incarnation" — "not *this run*" |

The distinction is prose-first and readable without a stat sheet, consistent with the shipped prerequisite-visibility gating. The reach gate already hides identity-locked cards from the drawer; this plan adds the *acquirable-this-run* middle state + the codex "other paths" view so the permanence is legible rather than invisible.

### 5.C Deepening beat modal

Reuse the shipped Ascendant Beat / story-beat modal. Renders the tier-up vignette + optional card-choice cards. No new modal surface. **Browser-verify: Playwright DOM** for the modal; the beat is triggered via `__DEBUG` beat-enqueue for the screenshot.

### 5.D Ascendant-bar progression readout

Compact always-visible readout: the player's **two reaches + current tier name** (prose tier names, not 1–10), so the player always knows their identity and depth. This is the anchor that makes the whole curve legible at a glance.

### 5.E DebugPanel — progression tab

`reachPractice` per domain, current vs snapshot tiers, pending Deepening queue, control-slot usage. `__DEBUG.getAscendantProgression()` bridge.

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Module | Orchestrator | UI | GameState flow | Traces | Debug | Player control |
|---|---|---|---|---|---|---|
| reach-practice accrual | resolution phase hook | ascendant-bar readout | `reachPractice` bag | `progression.practice` | progression tab | — (passive) |
| tier-crossing → beat | `phaseAscendantProgression` (new) | Deepening modal | `reachTierSnapshot` | `tier_up`, `deepening_enqueued` | pending queue | card choice in beat |
| Covenants panel | (reads controls) | new tab | existing control edges | `control_release` | control usage | Release button |
| locked-state grammar | — | ActionDrawer + codex view | prereq eval | — | — | — |

## 7. Phasing (single multi-session core, mirrors THR-611)

Ship as slices under THR-613, keeping it **In Dev** between hourly runs with a slice ledger; do **not** proliferate P1..P5 issues.

- **Slice 1 (Engine substrate):** `reachPractice` accrual + `phaseAscendantProgression` tier-crossing detection + snapshot + traces + `__DEBUG` bridge + constants. Deepening beat *enqueue* wired to Director (grant path reused). Engine-only → browser-verify exempt; CLI smoke + contract test (a run crossing a tier fires exactly one enqueue).
- **Slice 2 (Content):** 8 Deepening beats + card-offer pools + chronicle entries + milestone/discovery beat hooks (coordinate THR-611).
- **Slice 3 (UI — legibility):** ActionDrawer three-state grammar + ascendant-bar readout + Deepening modal wiring. Playwright browser-verify.
- **Slice 4 (UI — Covenants):** sustained-control panel + `release_control` op. Playwright browser-verify.
- **Deferred tail (own issues):** THR-64 agent ascension ladder (adopts this plan's tier-crossing-vignette infra); secondary-sphere keying; apex-card content expansion.

## 8. NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all thresholds/mults named in `player-progression.ts` + CMS registry |
| 2 Inspectability | PASS — 4 trace categories + DebugPanel tab + `__DEBUG` bridge |
| 3 Determinism | PASS — accrual is deterministic; beat dedup is order-stable; no unseeded randomness |
| 4 Fail-soft | PASS — §3.7 table; legacy saves lazy-init, no spurious beats |
| 5 Narrative over mechanical | PASS — tier-ups are prose beats, never "+1"; locked-state is prose-first |
| 6 Additive over destructive | PASS — property bags on ascendant node, reuse `unlock_action` + Director + tier derivation; zero new node/edge types |
| 7 Performance budget | PASS — accrual O(1)/action; progression phase O(2 domains)/tick; no per-tick allocation |

## 9. Three-pillar check

Engine (§3) ✓ · Content (§4) ✓ · UI (§5) ✓ · Wiring (§6) ✓. No pillar N/A.

## 10. Coordination

- **Mutex with THR-611** on the **Ascendant Beat Director / beat-enqueue wiring** and `unlock_action` grant path (both add beats that grant cards). Serialize the beat-Director touch; the two can otherwise proceed in parallel (THR-611 = essence sources; this = progression). Slice 2's milestone beat explicitly depends on THR-611 Slice-2+ source-tier transitions landing.
- **Parallel-safe with** the Game Manual Wiki issues, THR-575/576 (docs), THR-614 (autonomous notables — different files).
- **Rulebook impact:** adds a "Player Progression" subsection to `Docs/canon/rulebook.md` (Axis A/B/C spine, Deepening beats, two-domain permanence legibility). In scope for Slice 3.
