---
domain: attachments
last_reviewed: 2026-05-05
reviewer: cowork
ul_shards: [Encounters, Agents]
status: live
---

# Canon — Attachments

> An **attachment** is anything that hangs off an actor and modifies what they can do — possessions, conditions, spells, powers, agreements, retainers. One graph-native model, one effect walker, one composable primitive vocabulary, six categories.

## Current spec

### The six categories

| Category | Backing edge | Examples |
|----------|-------------|----------|
| Possession | `possesses` → node | Arms, vestments, tomes, mounts, relics, consumables |
| Condition | `has_trait` → node (trait subcategory) | Wounds, diseases, curses, blessings, bestowed powers |
| Spell | `possesses` → spell node | Learned incantations, bound magics |
| Power | `possesses` → power node | Bestowed divine gifts (Spirit Sight, Bloodward) |
| Agreement | `relates_to` **edge** (no target node) | Oaths, pacts, debts, favours, treaties |
| Retainer | `bonded_to` → actor node | Squires, hired swords, bound spirits |

**Agreements are the only edge-backed attachment.** The effect walker (`src/engine/effectWalker.ts`) reads `node.properties.effects` for node-backed categories and `edge.properties.effects` for agreement edges. New effect-backed edge types must extend the walker explicitly — there is no general edge-attachment convention.

### Tier ladder

| Tier | Name | Source |
|------|------|--------|
| 1 | Mundane | Common loot, starting gear |
| 2 | Storied | Quest rewards, notable encounters |
| 3 | Mythic | Boss drops, divine gifts |
| 4 | Legendary | World-shaping artifacts |

### Slot caps and overflow

Per-subcategory slot caps prevent unbounded accumulation. Configured in [`src/data/attachment-slot-constants.ts`](../../src/data/attachment-slot-constants.ts) (`POSSESSION_CAPS`, `CONDITION_CAPS`).

- **Possession overflow** — surplus items become inactive and the agent attempts to sell or gift them (encounter-generating).
- **Condition overflow** — escalates into narrative consequences: 4th wound → incapacitation check; 3rd disease → mortality check; 3rd curse → corruption / `axiological_drift`; 3rd blessing → fading or `bestowed` upgrade; 3rd bestowed → rejection.
- **Quest items** — pinned, never auto-disposed, lost only through specific narrative outcomes; do not count against other slot caps.

### Effect primitive vocabulary

Authored attachments compose behavior from a category pool (~13 user-facing primitive shapes plus tier-2/3 stubs). The full mapping lives in [`Docs/attachment-primitive-reference.md`](../attachment-primitive-reference.md), keyed by story pattern (e.g. *"It gets stronger the more you use it"* → `stacking`).

Key shapes: `stacking`, `decay`, `conditional`, `cooldown`, `consumable_charge`, `tradeoff`, `test_shaper`, `prevent_loss`, `transform`, `reactive`, `trait_grant`, `until_event`, `aura`. Tier-2/3 stubs exist for `teleport`, `reveal`, `spawn`, `dispel`, `alter_terrain`, `compel`, `modify_rules` — designed in types, not all wired through the orchestrator (see Open questions).

### Modifier caps

Per-item modifier 0.15; global aggregate cap 0.30 (`EFFECT_MODIFIER_CAP` in [`src/data/effect-constants.ts`](../../src/data/effect-constants.ts)). Slot caps prevent diverse-reach hoarding from bypassing the modifier cap.

### Engine wiring

- **Effect walker** — [`src/engine/effectWalker.ts`](../../src/engine/effectWalker.ts) collects effects from `possesses` / `bonded_to` / `has_trait` edges (node-backed) plus agreement-bearing `relates_to` edges (edge-backed).
- **Aftermath integration** — `condition_attachment` is the authored `UnifiedActionTemplate` aftermath effect kind for applying a condition by template ID (auto-looks up default duration; triggers mid-encounter tier promotion when the template is `wounded`). See [`Docs/plans/2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md) §`condition_attachment`.
- **On-use triggers** — possessions can fire narrative effects during encounters via [`src/engine/attachmentTriggers.ts`](../../src/engine/attachmentTriggers.ts) `resolveOnUseTriggers()`; seeded PRNG, deterministic.
- **Reward pool** — `assembleRewardPool()` builds weighted pools from `categoryWeights` (possession / condition / curse / blessing / agreement) refined by `tagFilters` (slot tag, quality tag, reach tag). `drawFromPool()` is cumulative-weight PRNG selection.
- **Condition decay** — `decayConditions()` decrements `ticksRemaining` each tick; emits `RemovedCondition` trace at 0; permanent conditions use `ticksRemaining: null`.
- **Duplicate-gain policy** — `duplicate_gain_policy` on `PossessionNodeProperties`: `stack` | `refresh` | `ignore` | `flip` | `worsen`. Default `refresh`.

### Authoring entrypoints

- **Composable attachments (4-pass pipeline):** [`.claude/skills/attachment-pipeline/SKILL.md`](../../.claude/skills/attachment-pipeline/SKILL.md) (mirror at `.agents/skills/`). Pipeline: draft → editorial → systems audit → implementation. Mandates pre-reading `Docs/authoring-brief.md` (or fallback to systemic wiring guide + game-design-direction) before drafting.
- **In-encounter conditions:** UnifiedActionTemplate aftermath uses `condition_attachment` — see encounter authoring skills.
- **Quality tags as encounter loot signal:** `#trinket` (background tier 1–2), `#relic` (shaping / tier 2–3), `#artifact` (story-beat / tier 3–4). Quality tags compose with any slot tag.

### Key sources

- [`src/types/effects.ts`](../../src/types/effects.ts) — primitive type definitions
- [`src/types/attachments.ts`](../../src/types/attachments.ts) — `AttachmentTier`, `OnUseTrigger`, `RewardPoolRecipe`, `AgreementProperties`, `PossessionSubcategory`
- [`src/types/traits.ts`](../../src/types/traits.ts) — extended `TraitCategory` with `bestowed`; `TraitAssignmentProperties` carries `ticksRemaining` + modifiers
- [`src/data/effect-constants.ts`](../../src/data/effect-constants.ts) — caps, defaults
- [`src/data/attachment-slot-constants.ts`](../../src/data/attachment-slot-constants.ts) — `POSSESSION_CAPS`, `CONDITION_CAPS`
- [`src/engine/attachmentTriggers.ts`](../../src/engine/attachmentTriggers.ts) — on-use trigger resolution
- [`Docs/attachment-primitive-reference.md`](../attachment-primitive-reference.md) — story-pattern → primitive lookup card
- [`Docs/plans/attachments/`](../plans/attachments/) — pipeline outputs (drafts → editorial → systems → final per content batch)
- **Obsidian system page:** `TheFantasyWorldSimulator/Systems/Attachment System.md` (last updated 2026-03-18 — predates the 2026-04-05 primitive vocabulary and 2026-04-06 slot system; verify against `attachment-primitive-reference.md` before treating as current)

## Active design plans

- [`2026-04-05-attachment-primitives-proposal.md`](../plans/2026-04-05-attachment-primitives-proposal.md) — primitive vocabulary proposal. Status: `current`. The vocabulary documented in `attachment-primitive-reference.md`.
- [`2026-04-06-attachment-slot-system-design.md`](../plans/2026-04-06-attachment-slot-system-design.md) — slot caps + quality tags + reward pool recipe. Status: `current`.
- [`2026-04-06-attachment-slot-system-implementation-plan.md`](../plans/2026-04-06-attachment-slot-system-implementation-plan.md) — implementation phasing. Status: `implementation-log`.
- [`2026-03-10-attachment-system-design.md`](../plans/2026-03-10-attachment-system-design.md) — original unified-attachment system design. Status: `implementation-log` (shipped; superseded for primitive vocabulary by 2026-04-05).
- [`2026-03-10-attachment-system-implementation.md`](../plans/2026-03-10-attachment-system-implementation.md) — original implementation plan. Status: `implementation-log`.
- [`2026-03-16-attachment-detail-card-design.md`](../plans/2026-03-16-attachment-detail-card-design.md) + [`-implementation.md`](../plans/2026-03-16-attachment-detail-card-implementation.md) — UI detail card. Status: `implementation-log` (shipped).
- [`2026-03-16-placeholder-attachments-plan.md`](../plans/2026-03-16-placeholder-attachments-plan.md) — placeholder catalog. Status: `superseded` by primitive vocabulary work.

## Rejected approaches

- ❌ **Flat `+X to reach domain` modifiers as the only authoring vocabulary.** Pre-2026-04-05, ~98 of ~104 reward items did nothing but nudge a number. Replaced by composable primitive vocabulary; flat modifiers remain readable but new authoring uses `effects[]`.
- ❌ **Separate item / spell / buff / curse subsystems.** Unified by 2026-03-10 attachment system. All categories share one effect walker. Don't reintroduce per-category effect machinery.
- ❌ **Unbounded attachment accumulation.** Replaced by per-subcategory slot caps (2026-04-06). An agent carrying 10 swords broke fiction *and* bypassed the modifier cap via diverse-reach diversification.
- ❌ **Hand-authored attachment text outside the 4-pass pipeline.** Quality drifts; pipeline is the discipline (Threadbare voice + systems audit for caps, tier, slot conformance).
- ❌ **Pure LLM-generated attachment effects at runtime.** Effects are pre-baked with constraints; runtime resolves graph state, not text generation.
- ❌ **General-purpose effect-on-edge convention.** Only agreements (`relates_to` with `agreement: true`) carry effects on edges. New edge types do not gain attachment behavior automatically — the walker must be extended explicitly.

## Open questions

- **No UL shard exists for attachments.** Terms like `AttachmentEffect`, `AttachmentTier`, `Slot Tag`, `Quality Tag`, `Reward Pool`, `duplicate_gain_policy`, `condition_attachment` are referenced repeatedly across plans, code, and skills but never enter the Ubiquitous Language as canonical entries. UL-proposal candidate; until filed, this Canon page is the closest thing to a definitions surface for these terms.
- **Tier 2/3 primitives are partially wired.** `teleport`, `reveal`, `spawn`, `dispel`, `alter_terrain`, `compel`, `modify_rules` have type definitions and executor stubs but not all are wired into the orchestrator. Authoring against these primitives risks silently-no-op effects. Tracked in `2026-04-05-attachment-primitives-proposal.md`.
- **Agreement effects are partially shipped.** Walker support and reward-pool instantiation are documented in `2026-04-06-attachment-slot-system-design.md` § *Special Slot: Agreements* but implementation status of both seams must be re-verified before authoring agreements with effects. Until both ship, agreement effects remain design-only.
- **Obsidian `Attachment System.md` is dated 2026-03-18.** It predates primitive vocabulary (2026-04-05) and slot system (2026-04-06). Treat the vault page as overview-only; `attachment-primitive-reference.md` and the two 2026-04-06 plans are the live spec.

## Last-reviewed

2026-05-05 by Cowork. Review trigger: monthly, or when any linked plan moves to `superseded`, or when [`src/types/effects.ts`](../../src/types/effects.ts), [`src/types/attachments.ts`](../../src/types/attachments.ts), or [`src/data/attachment-slot-constants.ts`](../../src/data/attachment-slot-constants.ts) change shape.
