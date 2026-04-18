# THR-166 · Craftsmanship Reputation Axis for Builders Fellowship

> **Deferred from:** THR-93 (Builders Fellowship migration, Done)
> **Parent project:** Encounter Format Migration
> **Label:** Deferral
> **Status (at plan time):** Ready for Dev (pre-existing state; this doc backfills the plan)

## Problem

The BF migration (THR-93) shipped with four placeholder tally keys — `bf.craft_work`, `bf.construction_work`, `bf.fellowship_work`, and `bf.master_craft` — as a v1 substitution for a proper craftsmanship reputation axis that did not exist in `src/data/reputation-trait-content.ts`. These tallies are being written by BF encounter aftermaths today, but nothing in the engine promotes them into a trait because `phaseReputationTraits.ts` iterates `REACH_DOMAINS` only. They are inert data.

The deferral asked for "a craftsmanship (or material_honor) reputation axis matching the existing axis pattern." That phrasing assumes the existing pattern can absorb a new axis — but the existing pattern is **load-bearing reach+polarity**, enforced by a template-literal type:

```ts
// src/types/agent.ts
export type ReputationTallyKey = `${ReachDomain}.${'positive' | 'negative'}`;
```

`ReachDomain = 'iron' | 'gold' | 'shadow' | 'veil' | 'heart' | 'eye' | 'stone' | 'star'`. Adding a ninth reach is a cosmology change, not a content change — it is rejected implicitly by the "do not invent node types without verification" rule.

So the real question this plan answers: **what does "craftsmanship axis" mean when the axes are locked, and what is the smallest narrow fix that (a) promotes the inert BF tallies into something visible, (b) doesn't distort the Nine Reaches cosmology, and (c) doesn't preempt the larger per-faction-standing redesign that BF + CG both gesture at?**

## Three design options

### Option A — Map BF tallies onto `stone.positive` (existing "Steadfast Builder" trait)

**What:** Treat `bf.*` as aliases that feed the same tally as `stone.positive`. Either rename the keys in `builders-fellowship-encounter-content.ts` to `stone.positive`, or add an alias layer in `encounterAftermath.ts` that forwards `bf.*` writes to `stone.positive`.

**Pros:**
- Zero engine change. Zero type change. Zero new constants.
- "Steadfast Builder" (`trait.reputation.stone.positive`) already reads *"Foundations laid by their hand do not crack."* That flavor is tight on the Builders fiction.
- Faction alignment in `factionReputation.ts` already keys BF to `stone: 'positive'`. Collapsing tallies onto `stone.positive` makes the alignment multiplier *actually fire*, which it doesn't today.

**Cons:**
- **Loses the tier structure the deferral asked for.** `bf.master_craft` was meant to promote differently from `bf.craft_work`. Collapsing them into one tally erases that.
- Dilutes "Steadfast Builder": now it promotes from generic stoneworking + BF craft events, which reads as the same thing even though the fiction is subtly different (stone = Foundation Sphere steadfastness; craft = made-objects pride).
- Doesn't match the deferral intent. The deferral explicitly said "add a craftsmanship axis" — Option A says "the axis you wanted already exists as stone; rename the tallies."

### Option B — Add a ninth reach to `ReachDomain`

**What:** Extend `ReachDomain` to include `'craft'` (or `'forge'`). Add two new reputation traits (`craft.positive`, `craft.negative`). Update the tally iteration in `phaseReputationTraits.ts` automatically via `REACH_DOMAINS`.

**Pros:**
- Matches the deferral literally: "matching the existing axis pattern."
- Promotion logic is free — the existing loop already iterates `REACH_DOMAINS`.
- Factions can align on it via the same `reputationAlignment` mechanism.

**Cons:**
- **Rejected cosmology change.** `ReachDomain` maps to the Nine Reaches — there are eight directional reaches plus power renown. Adding a ninth directional reach is a cosmology edit, not a content edit. Per CLAUDE.md: "No inventing node types without verification. If a conversation references a node type that doesn't exist in the current graph schema, stop and ask the human before creating it." Same rule applies to reach axes — they are foundational.
- Cascades into `ReachDomainCapability`, sphere-alignment checks, action verb resolution, prerequisite system. High blast radius.
- If we want per-profession axes, BF gets one, but so should Arcane Circle, Holy Order, etc. Either every guild gets a reach, or the Nine Reaches become arbitrary.

**Verdict:** rejected. Not the right lever for a content-layer deferral.

### Option C — Per-faction standing (new concept; out of scope for THR-166)

**What:** Introduce a separate faction-standing system, orthogonal to reach-polarity reputation. Each faction tracks its own standing axis with its own tiers, prose, and promotion logic.

**Pros:**
- Addresses BF + CG (and future guilds) holistically. The `cg.watch_work`, `cg.checkpoint_work`, `gate_duty.*` tally keys sitting dead in the aftermath path belong to this.
- Keeps Nine Reaches clean. Factions have their own progression; reaches have theirs.
- Matches the narrative intuition: "guild standing" and "moral reputation" are genuinely different things.

**Cons:**
- **Structural redesign, not a deferral close.** Needs its own design doc, its own three-pillar pass, its own human brainstorm because it touches UI (how is standing surfaced?), content (every faction needs a standing ladder), and engine (new promotion machinery, decay rules, modifier integration).
- Would invalidate THR-166 as scoped — the deferral is for a craftsmanship *reputation* axis, not a faction-standing system.

**Verdict:** valuable, but out of scope. **File as a separate follow-up.** See "Follow-up" below.

---

## Recommended approach — Option A+ (alias with one small extension)

Map BF tallies to `stone.positive` **with a small alias extension** that preserves the tier distinction between craft work and master craft. Specifically:

1. **Alias the common-tier BF tallies directly.** `bf.craft_work`, `bf.construction_work`, and `bf.fellowship_work` all collapse to `stone.positive` (+N delta preserved from the existing content). These are day-in-day-out work; they belong on the same axis as stone-sphere steadfastness.
2. **Lift `bf.master_craft` to a higher-weight stone.positive delta.** Instead of introducing a new trait, the master-craft entries already use delta=4 (vs. delta=1-2 for common). That weighting already expresses "bigger deal" without needing a distinct axis. Collapse to `stone.positive` with the delta preserved.
3. **Remove the "axis note" from `builders-fellowship-encounter-content.ts`.** The file header currently apologizes for the missing axis. After this change, no note is needed — BF writes to the canonical axis.
4. **Add one Builders-flavored reinforcement** via the Steadfast Builder trait's `scopeByLevel` prose (if the existing prose reads too stoneworking-narrow for a Builders promotion). Specifically: confirm `REPUTATION_TRAIT_DEFINITIONS[stone.positive].scopeByLevel` reads naturally when triggered by Builders Fellowship work. If it doesn't, broaden the Level 1-3 flavor by one or two words (not a rewrite).

This is Option A with a correctness check on trait flavor. It:
- Keeps Nine Reaches clean.
- Closes the inert-tally problem.
- Makes BF faction alignment actually multiply (Steadfast Builder trait + BF alignment on `stone.positive` = double-counting bug? No — alignment is trait-presence-based, not tally-based; see `factionReputation.ts:296`).
- Doesn't introduce new constants, new types, or new engine machinery.
- Leaves the deeper per-faction-standing design intact for Option C follow-up.

**Explicit rejection of the deferral's literal ask.** The deferral said "match the existing axis pattern" — Option A+ says the existing axis is already the right shape for this, and the problem was just that BF wrote to a key the engine wasn't listening to. No new axis needed.

---

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | Minimal | No new types, no new phase logic, no new constants. One-line audit of `phaseReputationTraits.ts` to confirm `stone.positive` tallies promote correctly when delivered via BF aftermath. |
| **Content** | Primary | Rewrite BF tally keys from `bf.*` to `stone.positive` in `builders-fellowship-encounter-content.ts` (~17 call sites per summary). Remove the header "axis note." Verify Steadfast Builder prose reads naturally when triggered from BF. |
| **UI** | N/A — no UI surface | Reputation tallies are not displayed in any current UI (verified — no `reputationTallies` references in `src/components/`). Trait assignment is visible via the existing trait system; the "Steadfast Builder" trait will appear on the agent's trait list once tallies cross the threshold. Debug inspection via `window.__DEBUG` eval on `node.properties.reputationTallies` and the agent's trait edges is sufficient for this pass. |

## Engine

**Required work:** None beyond verification.

**Verification steps (CC):**
- Run `npm test` — no new tests required; the existing `phaseReputationTraits.test.ts` exercises `stone.positive` promotion paths.
- Add one focused test in `phaseReputationTraits.test.ts` that seeds an agent with `reputationTallies: { 'stone.positive': 3 }` via BF-flavored context (i.e., after a BF encounter aftermath) and asserts the Steadfast Builder trait is assigned at level 1. This is a regression guard for the alias collapse, not new behavior.
- Eval in the CLI or debug bridge: after running 30+ ticks with active BF encounters, confirm `state.graph.getNode(<bf-actor>).properties.reputationTallies['stone.positive']` is nonzero.

**Constants table:** (no new constants)

| Name | Default | Purpose | Source |
| -- | -- | -- | -- |
| `REPUTATION_LEVEL_1_THRESHOLD` | 3 | Promotion to level 1 | Existing, `src/engine/phaseReputationTraits.ts` |
| `REPUTATION_LEVEL_2_THRESHOLD` | 8 | Promotion to level 2 | Existing |
| `REPUTATION_LEVEL_3_THRESHOLD` | 15 | Promotion to level 3 | Existing |
| `REPUTATION_TALLY_DECAY_PER_TICK` | 0.02 | Passive decay | Existing |

**Tracing:** existing `reputation_tally` effect kind and trait-assignment traces cover this path. No new trace types.

**Fail-soft table:** existing fallbacks in `phaseReputationTraits.ts` (missing `reputationTallies` → empty object; off-axis tally key → skipped in `REACH_DOMAINS` loop → dropped silently) are already correct for this change. Post-rename, there are no off-axis `bf.*` writes, so the silent-drop path becomes unused for BF. No new fail-soft cases introduced.

## Content

**Primary scope.** The rewrite is mechanical: find-and-replace the four BF tally keys with `stone.positive` in the BF content file.

**Files changed:**
- `src/data/builders-fellowship-encounter-content.ts` — replace 17 occurrences of `{ kind: 'reputation_tally', key: 'bf.*', delta: N }` with `{ kind: 'reputation_tally', key: 'stone.positive', delta: N }`. Preserve every `delta` value exactly — the weighting is already correct (common work = 1-2, master craft = 4).
- `src/data/builders-fellowship-encounter-content.ts` — remove the v1-substitution "axis note" from the file header comment.
- `src/data/reputation-trait-content.ts` — audit `REPUTATION_TRAIT_DEFINITIONS[trait.reputation.stone.positive].scopeByLevel` prose (if present) and `flavorText`. If the Level 1-3 descriptions read as exclusively stoneworking (e.g., "quarried," "chiseled"), widen by one or two words to include general craftsmanship (e.g., "the work of their hands endures"). **Do not rewrite.** If the prose already reads as general steadfast craft, leave it alone.

**Editorial check:** after the rename, BF encounter prose and Steadfast Builder promotion prose should both feel earned when they fire on the same event. If they read as "the agent did stonework" when the agent forged a ceremonial blade, the trait prose needs one pass of widening (see above).

**Do not:**
- Introduce `trait.reputation.craftsmanship.journeyman` or `trait.reputation.craftsmanship.master`. They would be orphan traits not participating in `ReachDomain` iteration and would require engine changes we've scoped out.
- Rewrite the Steadfast Builder trait entirely. Minimal prose touch only.
- Touch Civic Guard's `cg.*` or `gate_duty.*` tally keys. They are the same anti-pattern but belong to Option C (see Follow-up).

## UI

**N/A — no UI surface for reputation tallies today.** The only reputation-adjacent UI is the `reputationWord` summary on `AgentInfoCard.tsx`, which is a pre-existing higher-level summary unaffected by this change. Trait assignment surfaces through the existing trait list on the agent.

If CC encounters a gap — e.g., the agent panel doesn't show the Steadfast Builder trait after promotion — file it as a new issue rather than inlining a UI pass here.

## Wiring

**Wiring check:** no new orchestrator phase, modal, GameState field, trace category, or player control introduced. The existing pipeline (encounter aftermath → `reputationTallies` mutation → `phaseReputationTraits` promotion → trait edge added → agent's trait list) already fires end-to-end for `stone.*` tallies.

**Update `Docs/plans/wiring-checklist.md`:** not required for this change.

## NFP Compliance

| NFP | Status | Note |
| -- | -- | -- |
| 1. Tunability | PASS | All thresholds and decay rates are existing named constants in `phaseReputationTraits.ts`. |
| 2. Inspectability | PASS | `reputation_tally` traces already include `{ key, delta }`; post-rename, the key is the canonical `stone.positive`, making traces easier to correlate. |
| 3. Determinism | PASS | Pure data renames; no new PRNG usage. |
| 4. Fail-soft | PASS | Existing fallbacks unchanged. |
| 5. Narrative over mechanical | PASS with note | Risk: collapsing BF master craft into `stone.positive` may undersell the master-tier fiction. Mitigation: the delta=4 weighting preserves "bigger deal"; if trait prose feels flat, widen Steadfast Builder's scopeByLevel prose. |
| 6. Additive over destructive | PASS with note | This *is* destructive to the `bf.*` keys — they are renamed. Justified because those keys are inert (nothing reads them) and the migration to canonical keys resolves the deferral. No production data retention concern in a pre-production codebase. |
| 7. Performance budget | PASS | No hot-path changes. |

## Risks

**Risk 1: Steadfast Builder prose reads too stoneworking-narrow.** Mitigation: audit scopeByLevel and flavorText; widen by one or two words if needed. Don't rewrite.

**Risk 2: Double-count concern with BF alignment (`stone: 'positive'`).** The alignment multiplier (`factionReputation.ts:296`) checks trait presence, not tally value. Once the Steadfast Builder trait is assigned, the multiplier fires. This is *desired* — BF should multiply Steadfast Builder's downstream faction-reputation gain. No double-count because the multiplier is applied once per aftermath, not per tally.

**Risk 3: Test-suite red on main (ongoing impediment).** If the shared test suite is already red, CC should still run the targeted test (`npx vitest run src/engine/__tests__/phaseReputationTraits.test.ts`) and confirm the new regression test passes. The full-suite health is a separate, tracked problem.

## Follow-up (separate issue — not scoped here)

Per-faction standing system (Option C). Addresses the broader pattern: BF with `bf.*`, Civic Guard with `cg.*`/`gate_duty.*`, and future guilds (Thieves Guild, Arcane Circle, Holy Order, Lorekeepers, Underking Court) that will each want their own progression ladder independent of reach-polarity reputation. Requires its own three-pillar design, human brainstorm, and likely a new node type (`faction_standing` or similar) or edge type (`stands_with`). File as a separate Linear issue under the Social Systems Expansion or Content Architecture project.

## Definition of Done

- [ ] BF tally keys renamed to `stone.positive` (17 sites).
- [ ] File header "axis note" removed from `builders-fellowship-encounter-content.ts`.
- [ ] Steadfast Builder scopeByLevel/flavorText audited; widened only if stoneworking-narrow.
- [ ] Regression test added to `phaseReputationTraits.test.ts` asserting BF-flavored tallies promote Steadfast Builder.
- [ ] `npm test` and `npx tsc --noEmit` clean.
- [ ] Commit with `Fixes THR-166` in the body; auto-close fires on merge to main.
- [ ] Follow-up Linear issue filed for per-faction standing (Option C).
