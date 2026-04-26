# Wound System Decision — Phase 0, Group E

**Issue:** THR-117
**Status:** Design (Cowork) — Ready for Dev
**Date:** 2026-04-17
**Depends on:** THR-110 (enrichProse wiring, done), THR-111 (aftermath tracing, done)
**Blocks:** THR-118 (wiring-guide correction pass), Phase 4 combat migrations (THR-103/104/105/107)

---

## TL;DR — Decision

**Reframe and narrow-wire.** The wound system isn't missing; it's misframed. What looks like a "ghost subsystem" in the wiring guide is actually a *condition subcategory* that is already wired end-to-end (slots, duration, trait, overflow → incapacitation, UI, glyph). The authoring gap is narrow: the legacy `EncounterTemplate.appliesWound` flag has no peer in the `UnifiedActionTemplate` aftermath surface.

Recommended path:

1. **Keep** the existing wound-as-condition-subcategory mechanics — they are load-bearing and work.
2. **Strike** wound language that implies a distinct subsystem; rewrite it as "condition subcategory."
3. **Wire** a single narrow aftermath effect kind — `condition_attachment` — that lets `UnifiedActionTemplate` aftermath apply any condition (wounded, exhausted, terrified, blessed, …) and that automatically triggers the mid-encounter promotion trigger when the applied condition's subcategory is `wound`.

This preserves the load-bearing "failure wounds → story beats" pressure pipeline and retires the ghost in ~1 new aftermath kind + ~1 doc correction pass, instead of ~1 full subsystem build.

**Effort:** **S–M.** One aftermath effect kind, one executor, one trace extension, guide rewrite, ~30 lines of tests. No new node type, no new UI panel.

---

## Part 1: What actually exists today (evidence)

The THR-117 ticket claims "a grep of the engine shows no end-to-end implementation today." That was based on a search for a *distinct* "wound system." The real picture, from the code:

### Wounds are a condition subcategory — fully wired

| Piece | Where | Status |
|---|---|---|
| Slot cap (`wound: 3`) | `src/data/attachment-slot-constants.ts:36` | ✅ Wired |
| Condition trait `trait.condition.wounded` | `src/data/condition-trait-content.ts:46` | ✅ Wired |
| Duration constant (`CONDITION_WOUNDED_DURATION = 24`) | `src/data/condition-trait-content.ts:25` | ✅ Wired |
| Domain contributions (iron −0.08, stone −0.04) | `src/data/condition-trait-content.ts:55` | ✅ Wired |
| Attachment glyph (`✕`) | `src/components/Game/attachmentGlyphs.ts:22` | ✅ Wired |
| ProwessTab / AttachmentsTab surfacing | `src/components/Game/tabs/*` | ✅ Wired |
| Codex categorisation | `src/components/Codex/codexRegistry.ts:210` | ✅ Wired |

### Overflow → incapacitation is wired

`src/engine/conditionOverflow.ts` implements `resolveWoundOverflow()` — when active wounds exceed the cap of 3, a sigmoid d100 roll is compared against `WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4`. Failure yields a `scar` consequence trait. Emits a `condition_overflow` trace with `overflowEvent: 'incapacitation_check'`. Tests exist in `src/engine/__tests__/conditionOverflow.test.ts`.

### Wound application has two live paths today

**Path A — Legacy `EncounterTemplate.appliesWound: boolean`** (`src/types/encounter.ts:103`)
- Set on outcome bodies in `src/data/tavern-encounter-content.ts`, `social-scene-templates.ts`.
- Read by `src/engine/encounter.ts:557` which returns `woundApplied: boolean`.
- `src/engine/orchestrator.ts:405` uses it as a **mid-encounter promotion trigger** (Tier-1): on wound, an encounter promotes from `background → shaping`. This is the **load-bearing** piece — wounds drive attention/chronicle visibility.

**Path B — Complication attachment (`condition.wounded`)** (`src/data/complication-templates.ts:128`)
- A post-step complication fires the attachment template `condition.wounded` with a duration, producing an attachment that counts against the `wound` slot.
- Also fires via anomaly rewards (`src/data/anomaly-reward-catalog.ts:126`) and rewardPool `content_grant` effects.

### The gap: `UnifiedActionTemplate` has no wound/condition affordance

`EncounterAftermathReactionEffect` has 7 kinds: `reputation_score`, `reputation_tally`, `clearance_gate_tag`, `recent_event`, `encounter_seed`, `hidden_mark`, `intelligence`. None apply a condition. None signal "this outcome wounded the actor," so migrated templates cannot trigger the mid-encounter promotion that is Path A's whole point.

Content authors migrating Phase 4 combat content (monster, army, mercenary, borderland — 126 templates total) will hit this gap immediately: they need failure outcomes that wound, but have no authoring surface for it. Without remediation they will either (a) drop the wound mechanic in migration — silently losing attention/chronicle pressure on combat failures — or (b) plant a `content_grant: ['condition.wounded']` attachment grant, which applies the condition but **does not trigger mid-encounter promotion**.

### What the wiring guide says (the ghosts)

`Docs/plans/2026-04-16-systemic-wiring-guide.md:461` lists `appliesWound` as a generic outcome-level field without labelling it legacy-only. Line 470 lists `content_grant` as an aftermath effect kind — it is not in the `EncounterAftermathReactionEffect` enum at all. Neither section tells an author (a) that wounds are conditions or (b) which authoring surface applies them.

---

## Part 2: Scenario evaluation — does the mechanic earn its keep?

Three benchmark scenarios. For each, "does the authoring surface support it?" under the three options.

### Scenario S1 — Monster encounter, "The Bearclaw's Teeth" (combat failure)

*Player-facing:* The hero duels a great northern bear. On failure, they stagger home bleeding — the story gets louder for a few ticks (other agents comment, the chronicle marks it), and if this is the third wound this week they collapse in the field.

| Option | Supports it? |
|---|---|
| **A — Full wound subsystem** | ✅ Yes, but needs severity model, healing mechanics, wound-UI panel — a lot of scaffolding for the same end result. |
| **B — Strike entirely** | ⚠️ Condition attachment applies, but mid-encounter promotion is lost. The "chronicle gets louder" beat silently degrades. |
| **B′ — Reframe + narrow-wire (recommended)** | ✅ `condition_attachment: wounded` aftermath effect applies the condition *and* triggers mid-encounter promotion; overflow pipeline already handles the "third wound = collapse" beat. |

### Scenario S2 — Tavern bar fight, "Broken Bottle" (social encounter with physical stakes)

*Player-facing:* Hero insults the wrong drunk. On the worst branch, they wake up in an alley with a split lip — bruised, marginally weaker, but the story moved: the bouncer now owes them a favour.

| Option | Supports it? |
|---|---|
| **A** | ✅ Yes — but this reads as overkill for a tavern scene. |
| **B** | ⚠️ Works mechanically (attachment grant) but the narrative weight (story beat, chronicle entry) degrades because promotion doesn't fire. |
| **B′** | ✅ Same surface supports both monster combat and bar fight. `condition_attachment: wounded` unifies the authoring hook. |

### Scenario S3 — Healer treating a wounded patient, "Stop the Bleeding"

*Player-facing:* Healer tends to a wounded NPC. The wound is on the *target*, not the actor.

| Option | Supports it? |
|---|---|
| **A** | ✅ Yes, via target selection. |
| **B** | ⚠️ Attachment grant always goes to the actor via rewardPool; applying a condition to a non-actor target is clunky today. |
| **B′** | ✅ `condition_attachment` carries `targetAgentId` (consistent with how `encounter_seed` and `hidden_mark` already do), solving actor-vs-target cleanly. This also bridges with THR-114 (multi-target aftermath). |

### Scenario S4 — Prose author writing a Phase 3 social encounter

*Author-facing:* They want the agent to leave the scene "marked — not bleeding, but changed." Currently that's a `hidden_mark`; wounds are the wrong tool.

| Option | Supports it? |
|---|---|
| **A** | ❌ Having a wound subsystem next to hidden_mark tempts misuse. |
| **B** | ✅ No confusion — wounds are just conditions. |
| **B′** | ✅ Clean separation: hidden_marks for information/social residue, condition_attachment for physical/state change. |

**Conclusion:** A distinct wound subsystem (Option A) is not load-bearing. The condition subcategory plus a single new aftermath effect kind (Option B′) covers every scenario at lower complexity.

---

## Part 3: Three-pillar design

### Pillar 1 — Engine

#### New aftermath effect kind: `condition_attachment`

Added to `EncounterAftermathReactionEffect` union in `src/types/unifiedAction.ts`:

```ts
| {
    readonly kind: 'condition_attachment';
    /** Attachment template id from condition-trait-content. e.g. 'condition.wounded'. */
    readonly templateId: string;
    /** Who receives the condition. Defaults to action.actorId (same fallback as other kinds). */
    readonly targetAgentId?: string;
    /**
     * Optional duration override in ticks.
     * If omitted, uses the template's default duration.
     */
    readonly durationOverride?: number;
    /**
     * Optional severity/stack count. Defaults to 1.
     * Conditions with cap-reachable subcategories (wound, disease, curse, blessing, bestowed)
     * will fire the existing overflow pipeline naturally.
     */
    readonly stackCount?: number;
  }
```

#### Executor — `applyConditionAttachmentEffect`

New branch in `src/engine/encounterAftermath.ts` (`applyEncounterAftermathReaction` switch):

1. Resolve `targetAgentId` (default to `action.actorId`, same rules as the other 7 kinds — THR-114 makes this consistent).
2. Look up the template in `condition-trait-content` / `attachment registry`. Fail-soft: emit `encounter_aftermath_effect` trace with `success:false`, `failReason:'template_missing'`, continue.
3. Instantiate the attachment (reuse existing attachment instantiation utility used by complication templates — `src/engine/complications.ts` or the reward-pool path; pick whichever is already the canonical application path).
4. Emit `encounter_aftermath_effect` trace with `effectKind:'condition_attachment'`, template id, target, stack count, resulting attachment edge id.
5. Return a `woundApplied` flag upward if the template's subcategory is `wound` — the orchestrator already handles the mid-encounter promotion and does not need to change.

#### Promotion wiring (minimal)

`src/engine/orchestrator.ts:408` currently reads `result.woundApplied` from `resolveEncounterStep`. The unified pipeline's equivalent is the `applyEncounterAftermathReaction` call site in the unified adapter (`src/engine/buildUnifiedEncounterStageModel.ts` + the unified step resolver). Extend the return shape to include `woundApplied: boolean` (true when any `condition_attachment` effect resolved to a `wound`-subcategory template targeting the actor). Feed it into the existing `checkMidEncounterPromotion` call the same way legacy does.

No new promotion logic. Reuses `src/engine/attentionTier.ts:89`.

#### No new node types

`EncounterAftermathReactionEffect` is a discriminated union type, not a node. No `graph.ts` schema changes.

#### Constants table

| Constant | Default | Purpose | File |
|---|---|---|---|
| `CONDITION_WOUNDED_DURATION` | `24` | Default wound condition duration (2 game days) — unchanged | `src/data/condition-trait-content.ts` |
| `WOUND_INCAPACITATION_CHECK_DIFFICULTY` | `0.4` | Overflow roll threshold — unchanged | `src/data/attachment-slot-constants.ts` |
| `CONDITION_CAPS.wound` | `3` | Wound slot cap — unchanged | `src/data/attachment-slot-constants.ts` |
| `CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT` | `1` | **New.** How many stacks an unspecified aftermath condition_attachment applies | `src/data/attachment-slot-constants.ts` |

No new tunable magic numbers beyond the default stack count. Existing numbers keep their current defaults.

#### PRNG callouts

- Attachment instantiation uses the existing seeded attachment id generator. No new PRNG surface.
- The incapacitation overflow roll still uses the existing seeded pipeline.

#### Trace shape additions

Extend the existing `EncounterAftermathEffectTrace` payload (`src/types/trace.ts:835`) to carry the new effect kind in its union. No new trace **category** — `encounter_aftermath_effect` already covers it. Executor emits one entry with `effectKind: 'condition_attachment'`, `effectDetail: { templateId, targetAgentId, stackCount, attachmentEdgeId }`.

#### Fail-soft table

| Failure case | Behaviour |
|---|---|
| `templateId` is unknown | Skip effect, emit trace with `success:false`, `failReason:'template_missing'`. Continue aftermath chain. |
| Target agent node missing | Skip effect, emit trace with `failReason:'target_node_missing'`. |
| Target is deceased/removed | Skip effect, emit trace with `failReason:'target_not_eligible'`. |
| Slot cap would overflow | **Do not block** — apply the attachment and let the next tick's overflow pipeline fire `incapacitation_check` (this is the intended system behaviour, not an error). |
| Duration override non-positive | Fall back to template default, emit trace with `warn:'duration_override_invalid'`. Still apply. |
| `stackCount > cap` | Apply up to cap; overflow handler takes over. Emit trace with detail of requested vs applied count. |

Tick loop never throws — every branch emits trace, returns state, moves on. Aligns with NFP #4.

### Pillar 2 — Content

#### Documentation / skills to update

1. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** (coordinated with THR-118, which is the correction-pass issue):
   - Replace the `appliesWound` entry in the Outcome-Level Fields table (line 461) with a paragraph labelled **"Legacy only — see `condition_attachment` aftermath effect for UnifiedActionTemplate"**.
   - Rewrite the Aftermath Effect Types table (line 466 onward): remove the ghost `content_grant` row (it belongs to attachment/spell effects, not aftermath); add the new `condition_attachment` row.
   - Add a new subsection **"Conditions and wounds"**: state plainly that wounds are a condition subcategory; list the five subcategories (wound, disease, curse, blessing, bestowed); name the relevant constants (cap, duration, overflow check); link `resolveConditionOverflow`.
   - Add a "How to verify this capability" line pointing to `src/engine/__tests__/conditionOverflow.test.ts` and the new aftermath test (Pillar 3 below).

2. **`.agents/skills/template-encounter-rewrite/`**, **`prose-content-systems/`**, **`encounter-pipeline/`**, **`attachment-pipeline/`**: each gets a one-paragraph update telling authors to use `condition_attachment` aftermath (not a mythical wound effect) and reminding them that wounds trigger overflow / incapacitation for free.

#### New content (none mandatory)

The new aftermath effect is a tool; no catalog growth is required in this issue. Authors will use it in Phase 2–4 migrations as they hit outcomes that should wound, exhaust, terrify, or bless the actor.

#### Phase 4 migration readiness (the reason this unblocks combat content)

Once this ships, Phase 4 combat templates (THR-103/104/105/107) can author failure outcomes like:

```ts
aftermath: {
  reactions: [{
    id: 'mauled',
    label: 'Mauled',
    effects: [
      { kind: 'condition_attachment', templateId: 'condition.wounded' },
      { kind: 'recent_event', message: '{name} staggers home, bleeding and quiet.', significance: 0.5 },
      { kind: 'encounter_seed', encounterFamily: 'recovery', delayTicks: 6, seedLabel: 'the weight of last week' },
    ],
  }],
}
```

...and the encounter automatically:
- Applies the wounded condition,
- Triggers mid-encounter promotion to `shaping` tier (chronicle gets louder),
- Accumulates toward the overflow cap (third wound → incapacitation),
- Feeds the wound into the existing prose/UI pipeline (glyph, ProwessTab, AttachmentsTab).

### Pillar 3 — UI

#### Surfaces — nothing new

Wounds already surface as:
- **ProwessTab** (`src/components/Game/tabs/ProwessTab.tsx`) — shows wound, disease, injury, poison subcategories under a combined "Prowess-affecting" bucket.
- **AttachmentsTab** (`src/components/Game/tabs/AttachmentsTab.tsx`) — filtered by subcategory including wound.
- **AgentDetailPanel** / **AgentProfileModal** tests confirm rendering.
- **Codex** (`src/components/Codex/codexRegistry.ts`) — categorised under condition rewards.
- **Attachment glyph** (`✕`) — rendered by `attachmentGlyphs.ts:22`.

No new React components needed. No new modals, panels, or overlays. The aftermath application path plugs into the same attachment pipeline those views already consume.

#### Notifications / chronicle

Already covered by the existing `recent_event` aftermath effect (authors compose the message) and by the `condition_overflow` → `incapacitation_check` trace which produces its own chronicle beat when a wound overflows. No new notification plumbing.

#### HexMap signifiers

N/A — wounds are per-agent state, not a hex-level or location-level concept. Existing agent iconography carries it (glyph on attachment card, not on hex).

#### Debug inspection

DebugPanel already shows attachments and traces. Extend the **aftermath effect filter** in DebugPanel to include `condition_attachment` as a visible kind (single-line change to the filter enum in the trace-filter config). This is a nice-to-have, not a blocker — the category `encounter_aftermath_effect` already covers it.

Reference: wiring update lands in `Docs/plans/wiring-checklist.md` per the Definition of Done.

---

## Part 4: Wiring checklist entry

Add to `Docs/plans/wiring-checklist.md` under "Aftermath effect kinds":

| Effect kind | Orchestrator phase | UI surface | GameState field | Traces | Debug visibility | Prose pipeline |
|---|---|---|---|---|---|---|
| `condition_attachment` | `applyEncounterAftermathReaction` (called from `orchestrator.ts` after unified step resolution) | ProwessTab, AttachmentsTab, AgentDetailPanel — existing | `state.graph` attachment edges | `encounter_aftermath_effect` + `condition_overflow` (downstream) | DebugPanel "Aftermath effects" filter — extend | N/A (enriched via downstream `recent_event` effects) |

---

## Part 5: Load-bearing decisions carried forward

- **Wounds are a condition subcategory, not a distinct subsystem.** Future work that proposes a "wound system" should be asked what it adds over conditions + overflow + attachments. If the answer is nothing, use existing surface.
- **Aftermath effect kinds apply state changes; hidden_marks carry information.** Do not conflate. A social humiliation is a hidden_mark, not a wounded condition.
- **The mid-encounter promotion pipeline is the contract between wounds and chronicle visibility.** Any future change to wound application MUST route through `checkMidEncounterPromotion` via a `woundApplied` signal. Skipping this silently downgrades combat drama.
- **Aftermath authoring surface grows via typed effect kinds only.** Do not expose free-form graph helpers (createSublocation etc.) from aftermath — that's the THR-115 Group C conversation.

---

## Part 6: NFP Compliance

| NFP | Status |
|---|---|
| 1. Tunability | **PASS** — one new constant (`CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT = 1`), reuses four existing ones. |
| 2. Inspectability | **PASS** — reuses `encounter_aftermath_effect` trace category; attaches templateId, targetAgentId, stackCount, attachmentEdgeId. |
| 3. Determinism | **PASS** — attachment instantiation uses the seeded attachment-id generator that overflow already uses. |
| 4. Fail-soft | **PASS** — 6 failure modes enumerated, each emits trace and continues. Never throws. |
| 5. Narrative over mechanical perfection | **PASS** — preserves the "failure wounds → story beat" emotional pipeline which is what the wound mechanic is actually for. |
| 6. Additive | **PASS** — adds one new effect kind; zero removals from existing kinds; legacy `appliesWound` can coexist until its call sites migrate. |
| 7. Performance budget | **PASS** — attachment instantiation is already a hot path; adds one O(1) branch to the aftermath switch. |

---

## Part 7: Acceptance criteria

- [ ] `EncounterAftermathReactionEffect` gains `'condition_attachment'` variant in `src/types/unifiedAction.ts`.
- [ ] Executor branch in `src/engine/encounterAftermath.ts` applies the attachment, emits trace, and surfaces `woundApplied` upward when the template is wound-subcategory.
- [ ] Unified adapter + orchestrator wire `woundApplied` from the new pathway into `checkMidEncounterPromotion` with the same contract as the legacy path.
- [ ] Unit tests: template-missing, target-missing, target-deceased, cap-already-full (applies + overflow fires next tick), non-wound condition (promotion does not fire).
- [ ] Integration test: migrated "mauled" aftermath reaction promotes a `background` encounter to `shaping` on application.
- [ ] Wiring guide updated per Pillar 2 section (coordinated with THR-118).
- [ ] Wiring checklist updated with the new row.
- [ ] `CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT` added to `attachment-slot-constants.ts` with default `1`.
- [ ] No dead `appliesWound` references remain in the wiring guide's UnifiedActionTemplate-facing sections (legacy sections may still reference it, labelled as legacy).

---

## Part 8: Not in scope (explicit non-goals)

- A severity tier model beyond stack count.
- Per-wound healing mechanics distinct from duration + existing healer encounters.
- Retirement of the legacy `EncounterTemplate.appliesWound` — it keeps working; call sites migrate lazily as their content is migrated in Phase 2–4.
- Wound visuals on HexMap (agents that are wounded do not glow; the attachment glyph on the agent card is the signifier).
- Multi-target aftermath (tracked in THR-114); this design uses `targetAgentId` with actor fallback so it composes cleanly with THR-114 once that lands.

---

## Part 9: Three-pillar check

- [x] **Engine pillar** — new aftermath kind, executor, promotion wiring, constants, traces, fail-soft.
- [x] **Content pillar** — wiring-guide rewrite, skill updates, authoring example.
- [x] **UI pillar** — no new components; existing ProwessTab / AttachmentsTab / glyph / chronicle paths carry it. DebugPanel filter extension noted.
- [x] **Wiring section** — orchestrator phase, UI surfaces, GameState flow, traces, debug visibility, prose pipeline, wiring-checklist update.
