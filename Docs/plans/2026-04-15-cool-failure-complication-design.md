# Cool Failure & Complication Outcome Pass — THR-20 Design

> **Date:** 2026-04-15
> **Status:** In Design
> **Issue:** [THR-20](https://linear.app/threadbare/issue/THR-20/tb-106-cool-failure-and-complication-outcome-pass)
> **Project:** Thematic Pressure & Living World
> **Depends on:** Shared resolution/outcome ladder (✅), encounter and unified action pipelines (✅)

---

## Problem Statement

Failure in the simulation is boring. The 5-tier outcome ladder exists (`critical_success → success → success_at_cost → failure → critical_failure`) but failure tiers produce dead air:

- **`failure`:** growthMultiplier 1.0, no quintessence effect, narrativeTag 'setback', significanceBoost 0. Mechanically, nothing happens.
- **`critical_failure`:** quintessence penalty, narrativeTag 'catastrophe'. A number goes down.
- Only the "proving slice" (~15 templates) gets differentiated consequences. Everything else returns `DEFAULT_CONSEQUENCE` (literal no-op).

**The result:** When an agent fails, the player reads "Failed" and nothing changes. The world doesn't react. No one notices. There's no story. Failure should be the *most interesting* thing that happens — it's where drama lives.

**Design goal:** Replace flat negation with **costly forward motion**. Every failure should change something: the world, the agent, or both. The player should sometimes *prefer* the failure outcome because it created a more interesting story than success would have.

---

## Core Concept: Complication Taxonomy

Instead of "failure = nothing happens," failure now selects from a **complication** — a concrete narrative consequence that creates forward pressure. Complications are data-driven, per-reach, and contextual.

### The Complication Ladder

The existing 5-tier outcome ladder stays. But failure tiers now route through a complication selector:

| Outcome Tier | Current Behavior | New Behavior |
|-------------|-----------------|-------------|
| `critical_success` | Growth boost + Q reward | **Unchanged** (already interesting) |
| `success` | Default (no-op) | **Unchanged** |
| `success_at_cost` | Reduced growth + Q penalty | **Enhanced:** Attach a *minor* complication alongside the success |
| `failure` | No-op | **Complication:** Select 1 complication from the contextual pool |
| `critical_failure` | Q penalty only | **Severe complication:** Select 1 severe complication + Q penalty |

### Complication Categories

Complications are organized by what they change. Each category has multiple concrete instances. The selector chooses based on action reach, location context, agent state, and active omens.

| Category | What Changes | Examples | Reach Affinity |
|----------|-------------|---------|---------------|
| **Witness** | Someone saw the failure | A rival agent gains leverage; a faction notes incompetence; reputation shifts | Heart, Shadow, Gold |
| **Scar** | The agent carries a mark | Temporary condition attachment (shaken, humiliated, wounded, indebted) | Iron, Flesh, Heart |
| **Rival Attention** | A rival or faction takes notice | Rival god gains awareness; hostile faction increases attention; bounty possible | Shadow, Iron, Star |
| **Debt** | A cost is deferred, not avoided | Resource loss, favor owed, obligation created (via `relates_to` edge with `basis: 'debt'` agreement property) | Gold, Heart, Veil |
| **Collateral Success** | Something else happened instead | Unintended discovery, accidental alliance, wrong-target benefit | Eye, Star, Shadow |
| **Location Fallout** | The place is changed | Unrest increase, prosperity dip, sublocation damage, hex corruption tick | Stone, Iron, Force-sphere |
| **Broken Trust** | A relationship is damaged | Trust decay on `relates_to` edge, faction reputation loss, bond weakened | Heart, Shadow, Gold |
| **Partial Progress** | The goal advanced, but wrong | Partial step completion (50% progress preserved), shifted ambition direction | Eye, Gold, Star |
| **Worsening Convergence** | The doom clock noticed | Doom acceleration micro-tick, omen beat injection, sphere pressure spike | Veil, Star, any at high doom |

---

## Engine Pillar

### Data Model

```typescript
// ─── Complication Template (content-authored) ───────────────
interface ComplicationTemplate {
  id: string;                              // e.g., 'complication.witness.faction_notes'
  category: ComplicationCategory;
  name: string;                            // "Faction Takes Notice"
  /** Which reaches this complication naturally pairs with */
  reachAffinity: ReachDomain[];
  /** Severity: 'minor' for success_at_cost, 'standard' for failure, 'severe' for critical_failure */
  severity: 'minor' | 'standard' | 'severe';
  /** Contextual requirements — complication only available when these conditions are met */
  requires?: ComplicationRequirement;
  /** Graph operations to apply */
  effects: ComplicationEffect[];
  /** Prose template for the complication narrative */
  proseTemplates: string[];
  /** Significance boost for the TickEvent */
  significanceBoost: number;
}

type ComplicationCategory =
  | 'witness' | 'scar' | 'rival_attention' | 'debt'
  | 'collateral_success' | 'location_fallout' | 'broken_trust'
  | 'partial_progress' | 'worsening_convergence';

interface ComplicationRequirement {
  /** Requires other agents present at the location */
  witnessesPresent?: boolean;
  /** Requires an active faction relationship */
  factionRelationship?: boolean;
  /** Requires doom stage at or above */
  minDoomStage?: number;
  /** Requires active omen of a specific category */
  activeOmenCategory?: OmenCategory;
  /** Requires agent to have a specific attachment type */
  hasAttachmentType?: string;
  /** Requires location to be a settlement (not wilderness) */
  atSettlement?: boolean;
}

// ─── Complication Effects ───────────────────────────────────
type ComplicationEffect =
  | { type: 'attachment'; templateId: string; duration: number }
  | { type: 'trust_decay'; magnitude: number; target: 'random_present' | 'faction_leader' }
  | { type: 'reputation_delta'; factionScope: 'local' | 'all_present'; delta: number }
  | { type: 'unrest_delta'; delta: number }
  | { type: 'prosperity_delta'; delta: number }
  | { type: 'doom_micro_tick'; magnitude: number }
  | { type: 'sphere_pressure'; sphere: 'action_sphere'; magnitude: number }
  | { type: 'partial_progress'; fraction: number }
  | { type: 'relates_to_create'; basis: 'debt' | 'bond' | 'rivalry'; targetSelection: 'random_present' | 'faction' }
  | { type: 'rival_awareness'; delta: number }
  | { type: 'quintessence_delta'; delta: number }
  | { type: 'discovery'; discoveryType: 'location' | 'sublocation' | 'information' };

// ─── Complication Result (runtime) ──────────────────────────
interface ComplicationResult {
  templateId: string;
  category: ComplicationCategory;
  severity: 'minor' | 'standard' | 'severe';
  prose: string;                 // Resolved prose with placeholders filled
  effects: ComplicationEffect[]; // What was applied
  /** For chronicle/trace */
  narrativeTag: string;
}
```

### Context Contract: `ComplicationContext`

The current `computeOutcomeConsequence()` signature only receives `(templateId, outcome, actorId, tick)`. Complication selection needs richer context. A new `ComplicationContext` interface carries everything the selector needs, assembled at the call site in `unifiedActionResolution.ts` where all this data is already in scope:

```typescript
interface ComplicationContext {
  /** The action being resolved */
  action: UnifiedAction;
  /** The template being executed */
  template: UnifiedActionTemplate;
  /** The step that just resolved */
  stepIndex: number;
  /** Actor's current location ID (resolved from located_at edge) */
  locationId: string | null;
  /** Whether the location is a settlement */
  atSettlement: boolean;
  /** IDs of other agents at the same location (for witness checks) */
  presentAgentIds: string[];
  /** Actor's faction IDs (from member_of edges) */
  factionIds: string[];
  /** Active omen state (for synergy scoring) */
  activeOmenCategory: OmenCategory | null;
  /** Current doom stage (0-4) */
  doomStage: number;
  /** Actor's existing attachment template IDs (for stacking checks) */
  existingAttachments: string[];
  /** Current location unrest (for diminishing returns) */
  locationUnrest: number;
  /** Seeded PRNG */
  rng: () => number;
  /** World graph (for effect application) */
  graph: WorldGraph;
}
```

**Assembly site:** In `unifiedActionResolution.ts` at the existing `computeOutcomeConsequence()` call site (~line 866). All required data is already available in scope: `action`, template lookup via `getUnifiedTemplateById`, graph for edge queries, `gameState.omenState`, `gameState.doom`. The function signature becomes:

```typescript
export function computeOutcomeConsequence(
  templateId: string,
  outcome: StepOutcome,
  actorId: string,
  tick: number,
  context?: ComplicationContext,  // optional for backward compat
): OutcomeConsequence
```

When `context` is provided and outcome is a failure tier, the complication selector runs. When absent (legacy callers), behavior is unchanged.

### Complication Selection Pipeline

Runs inside `computeOutcomeConsequence()` when `context` is provided (extended, no longer proving-slice-only):

1. **Determine severity:** `success_at_cost` → minor, `failure` → standard, `critical_failure` → severe.
2. **Build candidate pool:** Filter `COMPLICATION_TEMPLATES` by:
   - Severity matches
   - Reach affinity includes the action's reach (or is universal)
   - Requirements met (witnesses present, at settlement, etc.)
3. **Score candidates:** Base score = reach affinity match (1.0 if primary reach, 0.5 if secondary). Bonus modifiers:
   - Active omen category matches complication category: +0.3
   - Agent already has a scar-type attachment: -0.5 on scar category (avoid stacking)
   - Location already has high unrest: -0.3 on location_fallout (diminishing returns)
   - Doom stage ≥ 3: +0.2 on worsening_convergence
4. **Select:** Weighted PRNG selection from top 3 candidates.
5. **Apply effects:** Execute graph ops, emit attachments, adjust state.
6. **Generate prose:** Select from template pool, fill placeholders.
7. **Return `ComplicationResult`** alongside the existing `OutcomeConsequence`.

### Extension to `OutcomeConsequence`

```typescript
interface OutcomeConsequence {
  growthMultiplier: number;
  quintessenceEvent: QuintessenceEvent | null;
  narrativeTag: string;
  significanceBoost: number;
  /** NEW: Complication attached to this outcome (null for success tiers) */
  complication: ComplicationResult | null;
}
```

### Orchestrator Integration

No new phase needed. Complication selection happens inside the existing action resolution flow (Phase 2a unified action progress). The complication's effects are applied immediately after step resolution, before the next step begins. This means a complication from step 1 can affect step 2's context.

### New TickEvent Type

```typescript
// Add to TickEvent.type union:
| 'complication'  // A failure produced a concrete consequence
```

### Trace Types

Add `'complication_selection'` to the `TraceCategory` union in `src/types/trace.ts`. Trace extends `TraceBase`:

```typescript
interface ComplicationSelectionTrace extends TraceBase {
  category: 'complication_selection';
  actionId: string;
  actorId: string;
  stepIndex: number;
  outcome: StepOutcome;
  severity: 'minor' | 'standard' | 'severe';
  candidates: { templateId: string; score: number }[];
  selected: string;
  reason: string;
}
```

---

## Section 9: Content Benchmark Moments

These benchmark moments define the quality bar for all complication templates. Every template authored during implementation must meet or exceed the emotional specificity, forward-hook quality, and prose texture demonstrated here.

**Content quality bar:** *Every complication must make the player think "oh no — oh, that's actually interesting" rather than "the system says something went wrong." If the complication prose could be replaced with "Failed" and the player would lose nothing, the template isn't done.*

### Benchmark 1: The Witness (Golden Scenario)

**Setup:** Kael Thornweaver, the player's First, is in the market district of Ashenmere. He's been rising — three successful social encounters in a row, reputation growing among the merchant houses. The player has been nudging him toward recruiting Voss, a cautious wine merchant with connections to the Council of Scales. This feels like the next step in Kael's arc: from wandering hedge-mage to someone with real allies.

**Trigger:** The player chose "Appeal to ambition" on a Heart-reach recruitment action targeting Voss. Risky — Kael's Heart capability is tier 4 (Earnest), adequate but not commanding, and Voss is cautious by nature. The step resolves as `failure`. The complication selector picks `witness.agent_leverage` — witnesses are present (Voss's apprentice Mira is in the back room), and the reach affinity matches (Heart).

**The moment (what the player reads):**

> *The words came out wrong. Kael could hear it himself — the pitch too eager, the promises too large for a man who counted every grape before pressing. Voss's expression shifted from curiosity to something worse: pity. He set down his wine cup with the careful finality of a man ending a conversation.*
>
> *In the doorway to the storeroom, Voss's apprentice Mira stood very still. She'd heard everything — the clumsy flattery, the name of the Ascendant, the offer that Voss was now quietly declining. Mira's eyes met Kael's for a moment. Then she turned and walked toward the guild quarter, quickly, with purpose.*

**Player's internal response:** "Oh no. Mira heard. Who is Mira connected to? Why did she walk toward the guild quarter?" The failure didn't just stop Kael's plan — it created a *new actor* with *dangerous knowledge*. The player's immediate instinct is to check Mira's relationships, to wonder if the Iron Pact scouts will hear about this. The story just got more complicated in a way that's more interesting than "Voss said yes" would have been.

**Forward hook:** Mira now has the `knows_secret_of` edge seed (Kael's divine connection mentioned during the pitch). This creates leverage that could surface in a future social scene, an extortion encounter, or a faction intelligence event. The player can't un-ring this bell — but they could try to get to Mira before she talks.

**Emotional condition:** Kael is *exposed*. Not just "failed" — exposed. Someone knows something about him that he didn't choose to reveal, and they're carrying it somewhere he can't control.

---

### Benchmark 2: The Scar (Mundane Scenario)

**Setup:** Serafina, a secondary protagonist, is attempting a routine Iron-reach patrol action at the settlement perimeter. Nothing dramatic — she's done this before. The player is in quick-turn mode, scanning statuses, about to advance. This is the 80% case: a background action on a normal tick.

**Trigger:** Patrol action resolves as `failure`. The complication selector picks `scar.shaken` — standard severity, no special requirements, Iron reach affinity. This is the most common complication: a simple condition attachment.

**The moment (what the player reads):**

> *The path along the eastern wall was familiar — every stone, every shadow. But tonight the shadow moved wrong. Serafina's sword was out before she thought about it, thrust hard into darkness that turned out to be a thorn bush and a startled fox. She stood there afterward, breathing too fast, blade still raised against nothing. Her hands weren't quite steady when she sheathed it.*

**Player's internal response:** Even in quick-turn mode, this prose gives texture. It's not "Patrol failed" — it's a small window into Serafina's state. She's jumpy. The player might not stop and dive deep, but the next time they check Serafina's status and see "shaken" as a condition, they'll remember this moment. And if she's still shaken when a *real* threat arrives two ticks later, the player will feel the connection: "she's not at her best because of that night on the wall."

**Forward hook:** The `shaken` attachment (5 ticks) reduces Iron capability by one tier for its duration. Mechanically small. Narratively, it means Serafina enters her next combat encounter already frayed. If that encounter matters, the player will wish she'd been steady. The mundane failure echoes forward.

**Emotional condition:** *Rattled.* Not injured, not humiliated — just shaken. A human condition everyone recognizes. The time you jumped at nothing and couldn't laugh it off.

---

### Benchmark 3: Collateral Success (Cool Failure)

**Setup:** Kael is attempting an Eye-reach investigation at the ruins outside Ashenmere, searching for evidence of ley-line corruption connected to the doom clock (Breach archetype, stage 1). The player invested essence to boost this action — they *want* the answer. The doom-echo omen "Thin Places" is active, adding atmospheric tension.

**Trigger:** Investigation resolves as `critical_failure`. The complication selector picks `collateral.wrong_discovery` — Eye reach affinity, severity severe. The omen synergy bonus boosted `worsening_convergence` candidates too, but the PRNG selected collateral success. Sometimes failure finds the wrong thing.

**The moment (what the player reads):**

> *The ley-lines told Kael nothing. He knelt at the convergence point for an hour, hands pressed to cold stone, reaching for the pattern — and the pattern wasn't there. Whatever corruption ran beneath Ashenmere, it didn't speak through this ruin.*
>
> *But the ruin spoke for itself. In scraping away moss from the convergence marker, Kael uncovered older stonework beneath — not the masonry of this age, but something far older, carved in a script that predated the settlement by centuries. The words were illegible, but the shape was unmistakable: a ward. Someone, a very long time ago, had tried to seal this exact place shut. And the seal was cracked.*

**Player's internal response:** "The investigation failed — but this is *better* than what I was looking for." Kael didn't find the ley-line corruption. He found evidence that this place has been dangerous before, that someone ancient tried to contain it, and that the containment is failing. The player now has a *different* question — one they didn't know to ask — and it connects to the Breach doom archetype in a way that feels earned, not forced. The player might actually be *glad* the investigation failed.

**Forward hook:** A `discovery` effect places a new information node in the graph — ancient ward site, cracked seal, pre-settlement origin. This seeds future encounters: an archaeological expedition, a faction that wants the ward restored, or a doom escalation event where the crack widens. The doom clock didn't advance, but the player now understands *why* the Breach is coming through *here*.

**Emotional condition:** *Unsettled discovery.* The feeling of looking for one thing and finding something that makes the original question irrelevant. Not failure — *reorientation*.

---

### Benchmark 4: Worsening Convergence (Severe Failure at High Doom)

**Setup:** Late game, doom stage 3. The Breach omen "Something Stirs Beneath" is active. Kael attempts a Veil-reach ritual to reinforce a protective ward at the settlement shrine. The player is heavily invested — this is a deliberate move against the doom clock. Failure here matters.

**Trigger:** Ritual resolves as `critical_failure`. The complication selector picks `convergence.doom_echo` — doom stage ≥ 2 requirement met, Veil reach affinity, omen synergy bonus from active Breach omen pushes convergence category to top score. Severity: severe.

**The moment (what the player reads):**

> *Kael spoke the words of binding. The ward brightened — for a moment, the shrine hummed with sealed power, and the cracks in the old stone seemed to close. Then the light turned wrong. Not dimmer — deeper. The ward wasn't drawing power from Kael's ritual. It was drawing power from the breach itself, pulling the very thing it was meant to hold back through the channels Kael had opened.*
>
> *The ground beneath the shrine groaned. A hairline fracture split the flagstone floor, running from the ward-stone to the eastern wall. And in the silence that followed, from somewhere beneath the settlement, something exhaled.*
>
> *The Breach has noticed this place.*

**Player's internal response:** Dread. Not frustration — dread. The player tried to fix the problem and made it worse. The prose makes it visceral: they can feel that the ritual backfired, that the doom clock didn't just tick — it *arrived at this location*. The settlement shrine, which was supposed to be a bulwark, is now a weak point. The player's next thought is immediate: "I need to get Kael out of there" or "I need to double down and try again" — either way, they're engaged with the consequence, not angry at the failure.

**Forward hook:** Doom micro-tick (0.5 acceleration), sphere pressure spike on Force, and the location gains a "breach-touched" condition that modifies all future encounters at this location. The shrine sublocation is now narratively marked — it could become the site of a climactic encounter later. The player's failed defense became the doom's foothold.

**Emotional condition:** *Horror of good intentions.* You tried to help and the help became the weapon. A deeply human experience — the feeling that your effort made things worse.

---

### Emotional Condition Mapping

Every complication category should surface specific human conditions the player recognizes:

| Category | Mechanical Effect | Human Conditions Surfaced |
|----------|------------------|--------------------------|
| **Witness** | trust_decay, reputation_delta | Exposed, vulnerable, watched, caught, ashamed |
| **Scar** | condition attachment | Rattled, wounded, humbled, haunted, marked |
| **Rival Attention** | rival awareness, faction attention | Hunted, noticed, targeted, in someone's sights |
| **Debt** | obligation edge, resource loss | Indebted, beholden, compromised, owing |
| **Collateral Success** | discovery, accidental bond | Surprised, reoriented, accidentally connected, unsettled discovery |
| **Location Fallout** | unrest, prosperity change | Guilty (this place suffered for my failure), responsible, reckless |
| **Broken Trust** | relationship decay | Betrayed (the agent feels it), isolated, disappointed, let down |
| **Partial Progress** | half-complete, shifted direction | Frustrated, redirected, "close but not enough," incomplete |
| **Worsening Convergence** | doom tick, sphere pressure | Dread, horror of good intentions, helpless acceleration, "it's getting worse" |

---

## Content Pillar

### Complication Templates (~60–80 total)

Organized by category × severity. Each template needs 3–4 prose variants.

**Witness complications (8 templates):**

| ID | Severity | Requires | Effect | Prose Sample |
|----|----------|----------|--------|-------------|
| `witness.agent_leverage` | standard | witnessesPresent | trust_decay toward present agent | "Others were watching. {witness} saw everything — and {witness} will remember." |
| `witness.faction_notes` | standard | factionRelationship | reputation_delta -5 local | "Word reaches the {faction} — another failure under their banner." |
| `witness.public_shame` | severe | atSettlement | attachment 'humiliated' 8 ticks, reputation_delta -10 | "The whole settlement saw. They'll be talking about this for a long time." |
| `witness.quiet_note` | minor | witnessesPresent | trust_decay -0.02 | "Someone noticed. A quiet glance, quickly looked away. But noticed." |

**Scar complications (8 templates):**

| ID | Severity | Requires | Effect | Prose Sample |
|----|----------|----------|--------|-------------|
| `scar.shaken` | standard | — | attachment 'shaken' 5 ticks | "{name} walks away unsteady, hands not quite still." |
| `scar.wounded` | severe | reach Iron/Flesh | attachment 'wounded' 10 ticks, Q -0.03 | "Blood on {possessive} hands — {possessive} own, this time." |
| `scar.humbled` | minor | — | growthMultiplier 0.8 for 3 ticks | "A small humiliation, quickly buried. But the sting lingers." |

**Collateral Success complications (6 templates):**

| ID | Severity | Requires | Effect | Prose Sample |
|----|----------|----------|--------|-------------|
| `collateral.wrong_discovery` | standard | reach Eye | discovery 'information' | "The search failed — but {name} found something else entirely." |
| `collateral.accidental_bond` | standard | witnessesPresent | edge_create 'relates_to' random_present | "In failing together, {name} and {witness} found unexpected common ground." |
| `collateral.unintended_gift` | minor | — | partial_progress 0.3 | "Not what {name} intended, but not nothing either." |

**Worsening Convergence complications (4 templates):**

| ID | Severity | Requires | Effect | Prose Sample |
|----|----------|----------|--------|-------------|
| `convergence.doom_echo` | severe | minDoomStage 2 | doom_micro_tick 0.5, sphere_pressure | "The failure ripples outward — and something in the deep dark answers." |
| `convergence.thread_fray` | standard | minDoomStage 1 | Q -0.02 | "Another thread frays. The weave grows thinner." |

*(Full template set authored during implementation. Target: ~8 per category × 9 categories = ~72 templates at 3 severities.)*

### Prose Guidelines for Complications

Complications are written in **Threadbare voice** — present tense, close third person, sensory and specific. They must:

1. **Name what changed**, not just what went wrong. "Word reaches the guild" not "you failed."
2. **Imply forward motion.** Every complication sentence should make the player wonder "what happens next?"
3. **Reference context.** Use `{name}`, `{witness}`, `{location}`, `{faction}`, `{omen_atmosphere}` (if active omen). Never generic.
4. **Scale with severity.** Minor = a sentence. Standard = 2 sentences. Severe = 3 sentences with a hook.

---

## UI Pillar

### Complication Display in Encounter/Action Resolution

When a step resolves with a complication, the existing resolution display is extended:

- **Current:** "Step 2: Failed" (flat text, grey)
- **New:** "Step 2: Failed — *{complication prose}*" (complication prose in amber/warm tone, italicized)

For severe complications, the complication gets its own line with a small icon indicating the category (witness eye, scar slash, debt coin, etc.).

### Chronicle Integration

Complications with `significanceBoost ≥ 0.5` appear in the chronicle as **interlude annotations** on the parent action's chronicle entry. They don't create their own entries — they enrich the failure's entry.

Example chronicle entry:
> *"Kael attempted to recruit the merchant Voss to his cause. The pitch fell flat — Voss saw through the flattery. But others were watching. A faction captain noted the failure, and word spreads."*

### Alert/Toast System

- **Minor complications:** No toast. Appears only in the action resolution UI and chronicle.
- **Standard complications:** Brief toast notification: `"⊘ {complication.name}"` (e.g., "⊘ Faction Takes Notice"). Fades after 3s.
- **Severe complications:** Persistent toast that requires dismiss: `"⊘ {complication.name} — {one-line summary}"`. Amber border.

### Debug Panel

Existing action resolution traces in the Debug Panel now show complication selection details — candidates, scores, selected template, applied effects.

---

## Wiring Section

| Module | Orchestrator Phase | UI Component | GameState Flow | Traces | Debug | Player Controls |
|--------|-------------------|--------------|----------------|--------|-------|-----------------|
| Complication selector | Inside Phase 2a (action resolution) | Action resolution display, toasts | `OutcomeConsequence.complication` returned from `computeOutcomeConsequence()` | `complication_selection` | Visible in action trace detail | N/A (complications are world response) |
| Complication effects | Same phase, applied after selection | Attachment indicators, trust UI | Effects modify graph edges, nodes, attachments via existing APIs | Existing attachment/trust/reputation traces | Existing debug surfaces | N/A |
| Complication prose | `enrichProse()` for template resolution | Chronicle, action resolution UI | Prose templates in `COMPLICATION_TEMPLATES` | Existing prose traces | N/A | N/A |
| Omen interaction | Phase 2a reads `omenState` for scoring bonus | N/A (indirect) | Active omen category influences complication scoring | In `complication_selection` trace | N/A | N/A |

---

## Constants Table (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `COMPLICATION_MINOR_WEIGHT` | `0.4` | Probability of selecting a minor complication on success_at_cost (vs. no complication) |
| `COMPLICATION_REACH_AFFINITY_SCORE` | `1.0` | Score bonus for primary reach match |
| `COMPLICATION_REACH_SECONDARY_SCORE` | `0.5` | Score bonus for secondary reach match |
| `COMPLICATION_OMEN_SYNERGY_BONUS` | `0.3` | Score bonus when active omen matches complication category |
| `COMPLICATION_DIMINISHING_PENALTY` | `-0.5` | Score penalty when agent already has same-category complication active |
| `COMPLICATION_DOOM_CONVERGENCE_BONUS` | `0.2` | Score bonus for worsening_convergence at doom stage ≥ 3 |
| `COMPLICATION_SCAR_MAX_STACK` | `2` | Max simultaneous scar-type attachments per agent |
| `COMPLICATION_TOAST_SEVERITY_THRESHOLD` | `'standard'` | Minimum severity to show toast notification |
| `COMPLICATION_CHRONICLE_SIGNIFICANCE` | `0.5` | Minimum significance for chronicle annotation |
| `COMPLICATION_TOP_CANDIDATES` | `3` | Number of top-scored candidates for weighted PRNG selection |

---

## Fail-Soft Table (NFP #4)

| Failure Case | Fallback |
|-------------|----------|
| No complication templates match context | Return existing `DEFAULT_CONSEQUENCE` (no complication). Log trace. |
| Complication references absent witness | Skip witness-specific effects; use generic prose variant |
| Complication references absent faction | Skip faction effects; fall through to next candidate |
| Attachment template not found | Skip attachment effect; log warning |
| `success_at_cost` with `COMPLICATION_MINOR_WEIGHT` roll fails | No complication — success_at_cost behaves as before |
| Edge creation target not found | Skip edge creation; prose still renders without witness name |
| Doom micro-tick on missing doom state | Skip doom effect; no-op |
| Multiple complications on same step (shouldn't happen) | Only first complication applies; trace logs the duplicate |

---

## NFP Compliance

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | All scoring weights, thresholds, stack limits are named constants. Complication effects use magnitude fields, not hardcoded values. |
| 2 | Inspectability | PASS | Selection trace logs all candidates + scores + reason. Applied effects visible in existing trace infrastructure. |
| 3 | Determinism | PASS | Selection uses seeded PRNG. Candidate scoring is deterministic. |
| 4 | Fail-soft | PASS | See table. Missing context → skip effect, never crash. No complication available → existing behavior. |
| 5 | Narrative over mechanical | PASS | Complications exist to create stories from failure. Every template is prose-first, effects-second. |
| 6 | Additive | PASS | Extends `OutcomeConsequence` with optional field. Removes proving-slice gate (all templates get consequences). No existing fields modified. |
| 7 | Performance | PASS | Complication selection is O(templates) per failed step. ~72 templates, scored once. Negligible. |

---

## Migration: Removing the Proving-Slice Gate

The current `isProvingSliceTemplate()` check means only ~15 templates get differentiated outcomes. This pass removes that gate — all templates route through the consequence system. The proving-slice families keep their existing specialized consequences; the new complication system layers on top for failure tiers.

**Migration steps:**
1. Remove `isProvingSliceTemplate()` guard in `computeOutcomeConsequence()`
2. Keep existing per-family consequence logic for success tiers
3. Add complication selection for failure/critical_failure/success_at_cost on all templates
4. Existing tests continue to pass (they test specific templates that still get their existing consequences)

---

## Implementation Scope Estimate

| Task | Pillar | Size |
|------|--------|------|
| `ComplicationTemplate` types + extend `OutcomeConsequence` | Engine | S |
| Complication selection pipeline | Engine | M |
| Effect application (attachments, edges, trust, reputation, doom) | Engine | M |
| Remove proving-slice gate, integrate with all templates | Engine | S |
| Omen synergy scoring (reads active omen state) | Engine | S |
| Complication templates (~72) with prose variants | Content | L |
| Action resolution UI enhancement (complication display) | UI | M |
| Toast system for standard/severe complications | UI | S |
| Chronicle complication annotations | UI | S |
| Tests (selection, effects, fail-soft, omen synergy) | Engine | M |

**Total estimate:** ~3 Claude Code sessions
