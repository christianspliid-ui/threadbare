# Attachment Slot System — Implementation Plan

> **For Claude:** Implement in order. Treat the design contracts below as frozen unless the current codebase makes one impossible. If something truly conflicts with the code, update this plan and the design doc together before changing runtime behavior.

**Goal:** Implement per-slot attachment caps, edge-backed agreement effects, typed slot-expansion, condition overflow handling, and slot-aware attachment UI without introducing new node types or bypassing the existing graph/effect/reward pipelines.

**Architecture:** Additive extension of the current attachment stack. Keep `categoryWeights` as the structural reward selector, add slot-aware resolution on top of the existing attachment graph, and make the shared effect walker the single suppression seam for inactive attachments.

**Spec:** [2026-04-06-attachment-slot-system-design.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-06-attachment-slot-system-design.md)

**Key current seams:**
- [attachments.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/attachments.ts)
- [effects.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/effects.ts)
- [effectWalker.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/effects/effectWalker.ts)
- [rewardPool.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/rewardPool.ts)
- [orchestrator.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/orchestrator.ts)
- [agentAttachments.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/agentAttachments.ts)
- [AttachmentsTab.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/tabs/AttachmentsTab.tsx)
- [AttachmentDetailView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/AttachmentDetailView.tsx)

---

## Frozen Contracts

- `SlotBonusEffect` is the only slot-expansion contract. Add it as effect type 39 in [effects.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/effects.ts). Do not revive `modify_rules` or stringly `slot_bonus:*` modifiers.
- `categoryWeights` remains the structural reward selector. `tagFilters` only narrows inside the chosen category.
- Agreements stay edge-backed on `relates_to`. Agreement effects live on `edge.properties.effects`, and their runtime identity is `edge.id`.
- `active: false` suppression happens centrally in `collectAttachmentEffects()`. No downstream consumer should need its own inactive check.
- Slot overflow traces use the existing `TraceBase` contract and registered `TraceCategory` values.
- Rollout is additive. Keep `subcategory` working during migration; add `slotTag` and compatibility helpers instead of hard-cutting old content on day one.

---

## Throughput Gate

Before changing runtime logic, verify the upstream pipeline is alive enough for slot caps to matter.

- [ ] Confirm reward granting currently produces instantiated rewards in at least one seeded encounter flow.
  - Primary seam: [rewardPool.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/rewardPool.ts)
  - Verification: existing reward tests plus a quick headless smoke test that records at least one reward in [rewardHistory.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/rewardHistory.ts)
- [ ] Confirm attachment effects still resolve on held artifacts and conditions before introducing inactive suppression.
  - Verification: current effect resolver/effect tick tests stay green before new assertions are added.

If either gate is dead, stop and repair that upstream seam first. Slot enforcement wired to a silent reward/effect path is functionally dead code.

---

## Delivery Slices

**Slice A — Core mechanics (must land together):**
- typed slot constants and effects
- agreement effect collection
- slot-cap enforcement
- reward pipeline support
- traces and tests

**Slice B — Player-facing inspection:**
- grouped attachments tab
- richer detail cards
- overflow visibility in aftermath/profile surfaces

**Slice C — World-facing polish:**
- disposal motivation hooks
- condition overflow narrative consequences
- Codex/debug affordances

If scope has to tighten, ship Slice A first, Slice B second, Slice C last. Do not ship UI without the mechanical core, and do not ship slot caps without traces/tests.

---

## File Plan

**New files**

| File | Responsibility |
|---|---|
| [attachment-slot-constants.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/attachment-slot-constants.ts) | Base caps, overflow thresholds, slot-priority constants |
| [agreement-reward-catalog.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/agreement-reward-catalog.ts) | Explicit edge-backed reward templates for agreement draws |
| [attachmentSlotResolver.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/attachmentSlotResolver.ts) | Slot counting, effective caps, slot bonus aggregation, victim selection |
| [conditionOverflow.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/conditionOverflow.ts) | Wound/disease/curse/blessing/bestowed overflow consequences |
| [phaseSlotCaps.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseSlotCaps.ts) | Per-tick enforcement phase and cascade loop |
| [effectWalker.slotCaps.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/effectWalker.slotCaps.test.ts) | Agreement + inactive suppression contract coverage |
| [attachmentSlotResolver.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/attachmentSlotResolver.test.ts) | Slot usage/effective-cap/unit tests |
| [conditionOverflow.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/conditionOverflow.test.ts) | Overflow consequence tests |
| [phaseSlotCaps.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/phaseSlotCaps.test.ts) | Orchestrator-facing enforcement tests |
| [AttachmentsTab.slot-groups.test.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/__tests__/AttachmentsTab.slot-groups.test.tsx) | Grouping/inactive-section UI tests |

**Existing files to modify**

| File | Changes |
|---|---|
| [attachments.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/attachments.ts) | Add `slotTag`, quality-tag helpers, reward recipe comments, compatibility mapping |
| [effects.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/effects.ts) | Add `SlotBonusEffect`, extend union, update docs/comments |
| [gameState.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/gameState.ts) | Clarify `effectStates` key contract; add any slot/debug runtime state only if truly required |
| [trace.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/trace.ts) | Register `slot_overflow`, `slot_disposal`, `condition_overflow`, `slot_expansion` |
| [effectWalker.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/effects/effectWalker.ts) | Skip inactive edges; add agreement-edge loop keyed by `edge.id` |
| [rewardPool.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/rewardPool.ts) | Preserve category axis, support agreement candidates, instantiate edge-backed rewards |
| [orchestrator.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/orchestrator.ts) | Wire `phaseSlotCaps` after reward-granting and before decision/visibility consumers that should see the resolved active set |
| [agentAttachments.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/agentAttachments.ts) | Return slot-group metadata, active/inactive flags, slot counts, agreement edge identity |
| [agentDetail.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/agentDetail.ts) | Surface grouped slot data into profile/info card payloads |
| [AttachmentsTab.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/tabs/AttachmentsTab.tsx) | Group by slot tag with `(count/cap)` headers and inactive section |
| [AttachmentDetailView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/AttachmentDetailView.tsx) | Show slot usage, active status, source/counterparty, history, overflow status |
| [AgentProfileModal.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/AgentProfileModal.tsx) | Keep detail overlay working with grouped slot data |
| [ProwessTab.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/tabs/ProwessTab.tsx) | Align possession/condition visibility with new slot metadata |
| [rewardHistory.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/rewardHistory.ts) | Optional: record whether a granted reward was immediately deactivated or instantiated as an agreement |
| [wiring-checklist.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/wiring-checklist.md) | Add the new phase/debug surfaces if they become canonical |

---

## Phase 1 — Lock the Data Contracts

- [ ] Create [attachment-slot-constants.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/attachment-slot-constants.ts).
  - Export `SLOT_CAPS`, `CONDITION_CAPS`, `MAX_DEACTIVATION_CASCADES`, `OVERFLOW_DISPOSAL_TIMEOUT_TICKS`, and any tie-break constants.
  - Keep every cap/threshold named. No inline numbers in resolver code.
- [ ] Extend [attachments.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/attachments.ts).
  - Add additive `slotTag?: string` to possession templates and condition templates.
  - Keep `subcategory` for compatibility, but add a single helper comment mapping legacy `subcategory -> slotTag`.
  - Add edge-property typing for `active`, `inactiveReason`, `overflowTick`, and agreement edge effect storage if those shapes are already centralized here.
- [ ] Extend [effects.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/effects.ts).
  - Add `SlotBonusEffect` as type 39.
  - Update the top-of-file effect count comments so the file stays truthful.
  - Touch any exhaustive switches that currently assume the union ends at 38.
- [ ] Update [gameState.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/gameState.ts).
  - Keep `effectStates` as `Map<string, EffectRuntimeState>`, but change the comment from “attachment node ID” to “attachment identity (node ID or agreement edge ID)”.
- [ ] Update [trace.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/trace.ts).
  - Register the four slot-system categories.
  - Add category-specific trace interfaces that extend `TraceBase`, not a parallel shape.

**Tests**

- [ ] Add or extend type-focused tests near the existing attachment/effect suites.
- [ ] Make sure no exhaustive-union compile errors remain after type 39 is added.

---

## Phase 2 — Make the Effect Walker the Single Source of Truth

- [ ] Update [effectWalker.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/effects/effectWalker.ts).
  - Skip any attachment edge where `edge.properties.active === false`.
  - Keep the existing node-backed loop for `possesses`, `bonded_to`, `has_trait`.
  - Add a second loop for `relates_to` edges where `edge.properties.agreement === true`.
  - Read agreement effects from `edge.properties.effects`.
  - Use `edge.id` as `attachmentId` and runtime-state key for agreement entries.
  - Use `agreementName ?? 'Agreement'` and `tier ?? 1` for source metadata.
- [ ] Update any helper that infers “does this agent use effects[]?” so it detects agreement edges as well.
- [ ] Audit downstream consumers for node-ID assumptions.
  - Resolver/tick/query consumers should continue to work if `attachmentId` is an edge ID.
  - Only patch code that actually assumes `attachmentId` can be looked up as a node.

**Tests**

- [ ] Add [effectWalker.slotCaps.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/effectWalker.slotCaps.test.ts).
  - Active node-backed possession contributes effects.
  - `active: false` possession contributes nothing.
  - Agreement edge contributes effects from `edge.properties.effects`.
  - Agreement runtime state is read from `effectStates.get(edge.id)`.
  - `hasEffectsFormat()` returns true for agreement-backed effects.

---

## Phase 3 — Build Slot Accounting and Cap Enforcement

- [ ] Create [attachmentSlotResolver.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/attachmentSlotResolver.ts).
  - Implement `resolveSlotTag()` that prefers `slotTag`, then falls back to legacy `subcategory` mapping.
  - Implement `collectAgentAttachmentInventory()` returning possessions, conditions, agreements, and inactive items in a normalized shape keyed by edge ID.
  - Implement `computeEffectiveSlotCaps()` using base caps plus active `slot_bonus` effects.
  - Implement `chooseOverflowVictim()` with the design priority: lower tier first, then older acquisition tick first, then seeded tie-break if needed.
  - Implement `enforcePossessionSlotCapsForAgent()` and `enforceConditionCapsForAgent()`.
  - Keep the resolver pure: return patch instructions plus trace payloads instead of mutating the graph inside low-level helpers.
- [ ] Create [conditionOverflow.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/conditionOverflow.ts).
  - Encode the per-slot behaviors from the approved design.
  - Reuse existing trait/reputation/quintessence seams where possible instead of inventing bespoke storage.
  - Fail soft: if a consequence target/template is missing, emit a trace and keep the overflowing condition rather than crashing.
- [ ] Create [phaseSlotCaps.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseSlotCaps.ts).
  - Iterate the relevant agents, run possession enforcement, then condition overflow.
  - Recompute caps in a fixed-point loop capped by `MAX_DEACTIVATION_CASCADES`.
  - Emit `slot_expansion` when active slot bonuses change a cap, `slot_overflow` when an item is deactivated, and `condition_overflow` for condition cap events.
  - First pass can scan all actors each tick; optimize to dirty-agent tracking only if profiling says this is hot.

**Tests**

- [ ] Add [attachmentSlotResolver.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/attachmentSlotResolver.test.ts).
  - Base caps apply with no bonuses.
  - `SlotBonusEffect` raises the correct cap.
  - Inactive slot-expander does not grant bonus slots.
  - Legacy `subcategory` still maps into the correct slot during migration.
  - Overflow victim selection is deterministic.
- [ ] Add [conditionOverflow.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/conditionOverflow.test.ts).
  - Wound/disease/curse/blessing/bestowed branches each fire the correct consequence path.
  - Missing templates or malformed tags fail soft.
- [ ] Add [phaseSlotCaps.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/phaseSlotCaps.test.ts).
  - Immediate overflow deactivates the right possession edge.
  - Cascade deactivation stabilizes within the configured cap.
  - The phase does not crash when an attachment is missing `slotTag`.

---

## Phase 4 — Preserve the Reward Axis and Add Agreement Rewards

- [ ] Create [agreement-reward-catalog.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/agreement-reward-catalog.ts).
  - Assumption for rollout: agreement rewards live in an explicit data catalog because agreements are edge-backed and cannot be discovered by scanning graph nodes.
  - Keep the template shape lightweight: `id`, `name`, `tier`, `tags`, `terms`, `effects`, optional default counterparty rules.
- [ ] Update [rewardPool.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/rewardPool.ts).
  - Keep `categoryWeights` as the first pass.
  - Continue scanning graph nodes for `possession`, `condition`, `curse`, `blessing`, `bestowed_power`, `spell`.
  - Add an explicit `agreement` candidate path sourced from the new agreement catalog.
  - Add `instantiateAgreementReward()` that creates a `relates_to` edge with `agreement: true`, `effects`, `tier`, `tags`, `active: true`.
  - Make sure reward history/debug output can report agreement rewards even though there is no instantiated node.
- [ ] Backfill reward-authored content.
  - Update existing reward catalogs, seeded attachment templates, and any tests/fixtures that should now carry `slotTag` and quality/context tags.
  - Start with [anomaly-reward-catalog.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/anomaly-reward-catalog.ts), then fix any failing reward tests/fixtures revealed by the suite.

**Tests**

- [ ] Extend existing reward pool/instantiation tests.
  - Agreement rewards draw when `categoryWeights.agreement > 0`.
  - `tagFilters` still refine within category.
  - Empty category weights still produce empty pools.
  - Instantiated agreement edges carry effects and `active: true`.

---

## Phase 5 — Wire Enforcement into the Tick Loop and Aftermath Paths

- [ ] Update [orchestrator.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/orchestrator.ts).
  - Wire `phaseSlotCaps` after reward-granting/progression phases and before systems that should observe the post-enforcement active set.
  - Keep the phase early enough that agent decision/visibility/debug traces see the resolved inventory state for the tick.
- [ ] Make reward/aftermath code path-safe.
  - When a reward is instantiated during encounter resolution, let the dedicated slot-cap phase handle deactivation rather than scattering ad hoc checks.
  - Preserve reward history entries even when the reward is immediately deactivated.
- [ ] Add the first disposal-motivation seam.
  - Minimal viable version: expose “has inactive overflow inventory” in a helper that agent scoring can read.
  - Reuse existing trade/social/offering encounters before inventing new systems.
  - If there is no natural disposal opportunity after `OVERFLOW_DISPOSAL_TIMEOUT_TICKS`, drop the item and trace it.

**Tests**

- [ ] Add or extend an orchestrator integration test proving:
  - encounter reward -> attachment granted -> slot phase deactivates overflow -> later effect consumers no longer see the inactive item.
- [ ] Add a disposal-timeout test for the drop fallback.

---

## Phase 6 — Surface Slot State to the Player

- [ ] Update [agentAttachments.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/agentAttachments.ts).
  - Return slot-group metadata: `slotTag`, `count`, `cap`, `active`, `inactiveReason`, `overflowTick`, `isPinned`, `counterpartyName`.
  - Use edge IDs for agreement entries instead of synthetic `${source}-${target}-agreement` IDs.
- [ ] Update [agentDetail.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/agentDetail.ts).
  - Preserve knowledge gating, but surface the richer slot-group structure into `AgentInfoCardData` / `AgentFullProfileData`.
- [ ] Update [AttachmentsTab.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/tabs/AttachmentsTab.tsx).
  - Group rows by slot tag with `(count/cap)` headers.
  - Hide empty groups.
  - Add a muted inactive section at the bottom.
  - Show agreements as their own group using the edge-backed data.
- [ ] Update [AttachmentDetailView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/AttachmentDetailView.tsx).
  - Show slot tag, active/inactive state, current slot usage, overflow reason, source encounter, counterparty for agreements, and duration/cure details for conditions.
- [ ] Update [AgentProfileModal.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/AgentProfileModal.tsx) and [ProwessTab.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/tabs/ProwessTab.tsx) as needed.
  - Keep the detail overlay working with the richer attachment payload.
  - Make overflowed conditions/rewards clickable from the same surfaces that already support attachment detail.

**Tests**

- [ ] Add [AttachmentsTab.slot-groups.test.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/__tests__/AttachmentsTab.slot-groups.test.tsx).
  - Headers show `(count/cap)`.
  - Empty groups are hidden.
  - Inactive items render in a separate muted section.
  - Agreement entries render correctly from edge-backed data.
- [ ] Extend detail-view/profile tests for active/inactive states and agreement metadata.

---

## Phase 7 — Debugging, Codex, and Optional Polish

- [ ] Start with traces and existing debug surfaces before adding a bespoke UI tab.
  - The four new trace categories should be enough to inspect most failures early.
- [ ] If time permits, add a lightweight slot-report helper to the debug bridge rather than inventing a second debug stack.
  - Suggested shape: `window.__DEBUG.getSlotReport(agentId)` returning slot counts, inactive items, and active slot bonuses.
- [ ] Codex is a separate polish slice unless the repo already has a natural encyclopedia/menu seam ready.
  - If implemented now, make it read from the same attachment aggregation layer used by the profile modal.
  - Do not fork a second attachment data model just for the Codex.

---

## Test Strategy

Use the existing `src/engine/__tests__/` style for engine work and `src/components/Game/__tests__/` for UI work. Add contract coverage where two real modules meet.

**Must-have tests**

- [ ] effect walker contract: node-backed + edge-backed + inactive suppression
- [ ] reward pool contract: category axis preserved, agreements instantiate as edges
- [ ] slot resolver unit tests: caps, bonuses, victim selection, migration fallback
- [ ] orchestrator integration: reward -> slot phase -> inactive effect suppression
- [ ] UI grouping tests: grouped counts/caps, inactive section, agreement rows

**Verification commands**

- [ ] `npm test`
- [ ] `npx tsc --noEmit`
- [ ] `npx vite build`
- [ ] `npm run cli -- --seed 42`
  - Then smoke test enough ticks to confirm rewards, overflow traces, and no tick crashes.

**Manual verification**

- [ ] `?view=game` at 1920×1080
- [ ] profile modal attachments tab shows grouped counts/caps
- [ ] overflowed item appears inactive and no longer contributes effects
- [ ] clickable aftermath reward/condition opens detail overlay with slot state

---

## Wiring Checklist

| Surface | Expected wiring |
|---|---|
| Orchestrator | New `phaseSlotCaps` runs after reward-granting/progression and before downstream consumers rely on active attachment state |
| GameState flow | Reuse existing graph edges and `effectStates`; only add state if a graph-backed approach is impossible |
| Traces | `slot_overflow`, `slot_disposal`, `condition_overflow`, `slot_expansion` emitted from slot enforcement/consequence code |
| Debug visibility | Existing trace feed first; debug-bridge helper optional |
| UI rendering | `AttachmentsTab`, `AttachmentDetailView`, `AgentProfileModal`, and any aftermath surface consume grouped slot data |
| Player controls | Existing click-to-open attachment detail stays the main entry point; Codex/debug controls are optional follow-on |
| Prose pipeline | Only new narrative text shown to the player should go through existing prose/enrichment seams; slot traces themselves stay structured |
| Throughput gate | Reward and effect pipelines must be alive before slot enforcement is declared complete |

If any new surface becomes permanent during implementation, update [wiring-checklist.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/wiring-checklist.md) in the same slice.

---

## Recommended Commit Boundaries

1. `feat(attachments): add slot-cap types, constants, and trace contracts`
2. `feat(effects): support inactive suppression and agreement edge effects`
3. `feat(attachments): add slot resolver and condition overflow enforcement`
4. `feat(rewards): support agreement reward instantiation and slot-aware backfill`
5. `feat(ui): group attachments by slot and show inactive state`
6. `test(attachments): add slot-cap contract and integration coverage`

These are guidance, not a mandate. Keep each commit coherent and test-backed.

