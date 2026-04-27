# THR-32 — Reputation-Gated Encounter Content (First Tranche + Pattern Library)

**Linear issue:** THR-32 (TB-089)
**Project:** Content Architecture (status: Now, priority: High)
**Labels:** Content (+ Engine for contract test)
**Priority:** Medium (P3)
**Effort size:** M (first-tranche: 5 templates, ~1.5–2 days with encounter-pipeline skill)
**Status:** Todo → Ready for Dev

## Problem

The reputation trait system shipped 2026-03-31 (see `Docs/plans/2026-03-31-reputation-trait-system-design.md`). Sixteen reach-polarity traits (`trait.reputation.<reach>.<positive|negative>` across iron, gold, shadow, veil, heart, eye, stone, star) plus `trait.reputation.power.renown` accumulate on agents via encounter-outcome tallies, decay at 0.02/tick, promote through three levels (Whispered → Known → Legendary), and carry a `ReputationEffects` payload that declares which encounter template IDs they should *unlock* or *block*.

**That payload is unused.** `ReputationEffects.encounterGates.unlocks` and `.blocks` are populated on every trait definition in `src/data/reputation-trait-content.ts`, but **zero encounter templates in the repo declare `requiredTargetTraits` or `blockedByTraits`.** The gate fields exist on `UnifiedActionTemplate` (`src/types/unifiedAction.ts:559`), the filter pipeline checks them (`src/engine/encounterFilterPipeline.ts`, Stage 3), `phaseReputationTraits` (orchestrator phase 8.15) decays and assigns traits correctly — the engine is complete. The content layer is empty.

As a result, reputation is currently a **silent, read-only** system. A player who has accumulated the "Feared Champion" trait at Legendary tier sees exactly the same encounter pool as a player with no Iron reputation at all. The trait tiers appear nowhere in encounter filtering, no authored encounter surfaces different prose based on a trait, and the accumulation loop has no gameplay payoff — reputation feeds into itself and nothing else.

This issue closes that loop by authoring the **first tranche of reputation-gated encounters** (five templates) plus a **pattern library** for the remaining 5–15 (delivered by follow-up issues, below).

## Goal

Five shipped `UnifiedActionTemplate` encounters that demonstrate every gating pattern, plus an authoring rubric the encounter-pipeline skill can follow for the remaining templates. By end of THR-32, a player with `trait.reputation.iron.positive` at level 2 sees encounter doors open that were closed before; a player carrying `trait.reputation.shadow.negative` finds doors close; prose acknowledges the reputation by name; and completion of each gated encounter feeds back into the tally that gates it (reinforce or shift).

**Non-goals:**
- **No engine changes.** Gate fields, filter stage, and trait phase are all live. The only engine touch is one contract test verifying end-to-end gate behavior.
- **No UI changes.** Filtered-out encounters are already silent; unlocked encounters already surface through the existing encounter notification path. Recognition visibility is delivered purely through authored prose via existing enrichment placeholders.
- **No new trait definitions.** The 17 existing traits are the complete vocabulary for gating.
- **No follow-up tranches in this issue.** Issues THR-32a and THR-32b (to be created on hand-off) track the middle-5 and final-5 batches and unblock once the first tranche ships.
- **No migration of legacy `EncounterTemplate` content.** All new content is `UnifiedActionTemplate`. Migration of the 115 legacy templates to also declare gates is out of scope — handled by the Encounter Format Migration project on a per-template basis.

## Design decisions

### D1. Scope THR-32 to a five-encounter "pattern library," not the full 10–20.

The encounter-pipeline skill runs a four-stage authoring process (Draft → Editorial → Systems Audit → Implementation) per encounter. Ten to twenty full pipeline runs in a single issue is too coarse — failure-to-ship risk dominates, and the first few templates will teach us patterns the later ones should absorb.

Five templates is the sweet spot: enough to demonstrate every gate pattern (single-required, single-blocked, required+blocked, multi-trait-AND, tier-sensitive), small enough to finish in one work session, and large enough to seed a rubric. CC ships THR-32 as a closed, verifiable increment; the remaining 5–15 follow in THR-32a/THR-32b under the same rubric.

Rejected: single-encounter MVP. One template doesn't prove the *range* of gate patterns, which is the whole point of the authoring rubric.

### D2. Gate pattern matrix — each first-tranche template exercises one distinct pattern.

Every encounter in the first tranche fills exactly one cell in the matrix below. This ensures the rubric covers the full vocabulary before we scale out.

| Encounter (slug) | Reach | Scale | Gate pattern | Required | Blocked | Polarity push |
|---|---|---|---|---|---|---|
| `warlords-tribute` | Iron | medium (3 beats, 2 branches) | **required-positive** | `trait.reputation.iron.positive` (L2+) | — | choices reinforce *or* push to negative pole |
| `shadow-court-audience` | Shadow | medium (3 beats, 2 branches) | **blocked-by-negative** | — | `trait.reputation.shadow.negative` (any L) | outcomes feed positive pole tally |
| `pilgrims-offering` | Heart | short (2 beats, 0 branches) | **required + blocked** | `trait.reputation.heart.positive` (L1+) | `trait.reputation.heart.negative` (any L) | reinforces positive pole |
| `the-veiled-consultation` | Veil | long (4 beats, 3 branches) | **multi-trait AND** | `trait.reputation.veil.positive` (L2+) AND `trait.reputation.eye.positive` (L1+) | — | branches feed different reaches |
| `the-stones-judgement` | Stone | medium (3 beats, 2 branches) | **tier-sensitive** (L3-only) | `trait.reputation.stone.positive` (L3) | — | rare encounter, reinforces Legendary standing |

**Reach distribution rationale:** five of eight reaches represented (Iron, Shadow, Heart, Veil, Stone). The remaining three (Gold, Eye, Star) become the core of THR-32a, which can cover them plus one revisit of an interesting reach. No mandate to hit all eight — pattern coverage is the gate, not reach parity.

**Scale distribution:** one short, three medium, one long. Mirrors the distribution on existing UnifiedActionTemplate encounters and avoids concentrating risk in long-form encounters that the pipeline editorial stage rejects more often.

### D3. Every gated encounter feeds its own gate — the tally loop closes per encounter.

A reputation-gated encounter that does not affect the tally it gates is a dead-end: the player passes through it once and the reputation stays frozen. The design rule is:

- **Reinforcing outcome** (the "safe" branch) — emits `{ kind: 'reputation_tally', key: '<reach>.<same-polarity>', delta: 1 }` on success. Confirms and deepens the reputation that unlocked the door.
- **Contrary outcome** (the "dramatic" branch) — emits `{ kind: 'reputation_tally', key: '<reach>.<opposite-polarity>', delta: 1 }` on success, and optionally `{ delta: -1 }` on the original polarity. Creates a genuine inflection point: keep walking the path or flip the coin.
- **Failure** — no tally delta by default (failure is not reputation-changing). Exception: a dramatic failure can leak the opposite-polarity tally at `delta: 1` if the failure is *observed* (e.g., witnesses present in the support bundle).

This turns each encounter into a small referendum on the reputation that gated it. Determinism is preserved because all deltas are template-declared, not randomly assigned.

Rejected: fixed positive-reinforcement on all outcomes. That would make reputation a one-way ratchet, incompatible with the "doom identity" and "cool failure" design principles (see `Docs/plans/2026-04-16-game-design-direction.md`).

### D4. Prose recognition uses existing enrichment placeholders — no new tokens.

The player needs to *feel* that reputation matters. That's a prose problem, not an engine problem. Every first-tranche template uses the `{title}` placeholder (the system already resolves it to the highest-tier reputation trait display name — e.g. "Feared Champion", "Beloved", "Oracle") in at least one of:

- **The opening beat** — an NPC or narrator references the title directly ("The warlord's guards part for the Feared Champion without a word.").
- **An approach card** — the choice text reflects how the trait shapes the option ("As Beloved, plead for their life — your word carries weight tonight.").
- **A success outcome** — the prose confirms the reputation earned the result ("They obey because you are the Oracle. It will not last a third time.").

Enrichment is conditional: if the enrichment context has no matching trait, the placeholder falls back to a neutral string (existing behavior in `proseEnrichment.ts`). This means the same template reads cleanly even in edge cases where the gate was somehow bypassed. Fail-soft NFP #4 applies without code changes.

**Rejected:** adding a `{reputation:<reach>.<polarity>}` placeholder. The existing `{title}` already resolves the agent's dominant reputation, which is what prose authors want. Adding reach-specific tokens adds vocabulary without adding expressiveness for this tranche; revisit if a future template needs to reference a *non-dominant* reputation explicitly.

### D5. Concept art direction is declared but art generation is pipeline-stage-4 work.

Each template in the draft declares `illustrationUrl` and `illustrationAlt` strings pointing at the target filename (`/art/encounters/<slug>.webp`) and an alt description. The pipeline's implementation stage generates the art via the image-generation skill. Design doc lists the art brief (one sentence per encounter) so the draft stage has enough to declare the placeholder; generation is a ticketed implementation step, not a blocker.

### D6. Contract test — one test, one purpose: verify the gate fires end-to-end.

Add `src/engine/__tests__/reputation-gated-encounters.test.ts` that seeds an agent with one reputation trait at one level, runs the filter pipeline against the tranche of five templates, and asserts exactly the right subset is visible. Covers:

- Required-positive gate opens when trait is present at min level, stays closed below.
- Blocked-by gate closes when trait is present at any level.
- Multi-trait AND gate closes if any required trait is missing.
- Tier-sensitive gate opens only at exact tier.
- Combined required+blocked gate respects both.

The test doubles as an acceptance contract for CC during authoring — if the filter doesn't filter, the template spec is wrong. Determinism is enforced via seeded agent state. One test file, one purpose.

### D7. Prose is authored against the Threadbare aesthetic, not a generic fantasy tone.

See `.agents/skills/prose-content-systems/SKILL.md` and the game design direction doc. Each template is drafted with the encounter-pipeline skill, which enforces:

- No reporter prose (mechanics never visible in narrative text).
- Approach cards on every player-facing step.
- Concrete god-verbs ("steady", "withdraw", "whisper"), never "help" / "say".
- Thread integration (the encounter touches at least one live thread — discoverable via the agent's recent TickEvents).
- Per-branch prose blocks that diverge tonally, not just mechanically.

CC is responsible for enforcing these via the pipeline's editorial gate; this design lists each template's premise and beat structure, not its prose copy.

## Pillars

### Engine pillar — N/A (foundation live); one contract test added

The reputation trait system (`phaseReputationTraits`, 8.15), the reputation tally flow (`reputation_tally` aftermath effect), the gate filter (`filterByPrerequisites`, Stage 3 of 7), and the trait definition payload (`ReputationEffects` on every trait in `reputation-trait-content.ts`) are all live as of 2026-03-31. **No engine code changes.**

One new contract test file (see D6) verifies the gate fields fire end-to-end against the first tranche. This is the Engine deliverable: proof that the content integrates with the engine as designed.

Tracing: the existing `encounter_filtered` trace category already emits a `reason` field. No new trace types.

Constants: no new constants. The five traits and tier thresholds referenced by the templates are already defined in `src/engine/reputationConstants.ts` and `src/data/reputation-trait-content.ts`. Nothing is hard-coded in the template files — every trait ID, min-level, and tally key is a reference to an existing constant or a declared trait ID.

### Content pillar — five templates + authoring rubric

Deliverables, in order:

1. **Five new files under `src/data/encounters/`:**
   - `warlords-tribute.ts` (Iron, required-positive)
   - `shadow-court-audience.ts` (Shadow, blocked-by-negative)
   - `pilgrims-offering.ts` (Heart, required + blocked)
   - `the-veiled-consultation.ts` (Veil, multi-trait AND)
   - `the-stones-judgement.ts` (Stone, tier-sensitive L3)

2. **Registration in `src/data/unified-action-templates.ts`** — add each import and append to the template array (existing pattern — see `flawed-steel.ts` registration).

3. **Concept art** — five `.webp` files under `public/art/encounters/`. Generated via image-generation skill during pipeline stage 4. Art direction brief listed inline below.

4. **Authoring rubric** — a short README at `src/data/encounters/REPUTATION_GATED_README.md` (new) capturing the six rules: gate matrix, tally-back pattern, `{title}` enrichment requirement, contract-test coverage, concept-art naming, and pipeline stages used. This is what THR-32a/THR-32b will follow.

5. **Contract test** — `src/engine/__tests__/reputation-gated-encounters.test.ts`, covering all five gate patterns against seeded agent states.

**Per-template specification:**

#### C1. `warlords-tribute` — Iron, required-positive, medium

**Gate:** `requiredTargetTraits: ['trait.reputation.iron.positive']` at min level 2 (Known). Triggers when the agent enters a settlement where a warlord NPC is present and recognizes them.

**Support bundle:** materialize one warlord NPC (faction: iron-reach warband or mercenary company) + optional tribute artifact. Use existing NPC role `warlord` or `captain`.

**Beat 1 (opening):** The warlord's hall. Recognition prose uses `{title}` — "The Feared Champion has arrived" / "They part for you without a word." Approach card offers: (a) *Accept the tribute* (safe, reinforces Iron positive) — (b) *Refuse the tribute and demand their oath instead* (dramatic, pushes toward Iron negative via a hard demand).

**Beat 2 (resolution):** The warlord either submits (a-branch) or defies (b-branch). Seeds a follow-up encounter at 15-tick delay either way — `warlord-breaks-oath` (b-branch only) or `warbands-payment-arrives` (a-branch).

**Beat 3 (aftermath reaction):** Authored choice card — keep the tribute (gold resource delta) or redistribute it to the settlement (feeds local wealth + minor Heart positive tally).

**Tally effects:**
- a-branch success → `{ key: 'iron.positive', delta: 1 }`
- b-branch success → `{ key: 'iron.negative', delta: 1 }` + `{ key: 'iron.positive', delta: -1 }` (the agent *squandered* Feared Champion standing)
- Failure (warlord refuses / fight breaks out) → `{ key: 'iron.negative', delta: 1 }` if witnesses present.

**Hidden marks:** a-branch plants `betrayal` mark on the warlord's lieutenants (future reveal surface). b-branch plants `debt` mark on the agent (they now owe the oath-breaking reputation).

**Seed chain:** feeds `warlord-breaks-oath` (existing stub template — to be authored in THR-32a if not already present) at +15 ticks.

**Art brief:** A warlord's hall: smoke-dimmed banners, an armored figure seated on a raised chair, braziers burning tallow. A second figure — the agent — stands in the foreground, unshadowed. Threadbare aesthetic: parchment palette, desaturated reds and bone-white, painterly but not photographic.

#### C2. `shadow-court-audience` — Shadow, blocked-by-negative, medium

**Gate:** `blockedByTraits: ['trait.reputation.shadow.negative']` (any level). Blocks when the agent has accumulated Infamous reputation. Triggers when the agent enters a noble court sublocation (existing type).

**Support bundle:** one court NPC (noble, senior). Optional audience of 2–4 court members (atmospheric, not interactive).

**Beat 1 (opening):** The court receives the agent. Recognition is implicit — this encounter only exists *because* Shadow negative is absent. The prose avoids naming the rep (avoids negative-space tell); instead, the courtier's welcome is measured and polite, which the player reads as unusual for a god-agent. Approach card: (a) *Present yourself honestly* (safe, reinforces Shadow positive — Enigmatic) — (b) *Drop a veiled threat in polite phrasing* (dramatic, risks Shadow negative tally).

**Beat 2 (resolution):** The court either trusts the agent (a-branch) and grants a favor, or becomes wary (b-branch) and the encounter ends cold. No third beat — short resolution.

**Tally effects:**
- a-branch success → `{ key: 'shadow.positive', delta: 1 }` + opens a related encounter (noble-commissions-task) at +20 ticks.
- b-branch success → `{ key: 'shadow.negative', delta: 1 }`.
- Failure (social miscue) → `{ key: 'shadow.negative', delta: 1 }` and plants a `concealed_action` hidden mark on the agent (the court saw through the act).

**Hidden marks:** b-branch success → no mark (the courtier *accepts* the veiled threat and files it). a-branch success → plants `secret_knowledge` mark on the court ally that can reveal later.

**Seed chain:** a-branch → `noble-commissions-task` at +20 ticks. b-branch → no seed (the door closes).

**Art brief:** A polished marble audience chamber, narrow windows admitting cold light. Two figures facing each other: the courtier seated, the agent standing, equal in composition. Threadbare parchment palette: bone, sea-green, soft gold. Quiet, watchful atmosphere — not opulent.

#### C3. `pilgrims-offering` — Heart, required + blocked, short

**Gate:** `requiredTargetTraits: ['trait.reputation.heart.positive']` at level 1 (Whispered) AND `blockedByTraits: ['trait.reputation.heart.negative']`. Triggers when the agent passes through any settlement with a shrine sublocation.

**Support bundle:** one pilgrim NPC (devotee, civilian role). Optional offering artifact (small — flowers, coin, cloth).

**Beat 1 (opening):** A pilgrim approaches and offers something of personal value, believing the agent to be the Beloved. Recognition: `{title}` references "Beloved." No branch — the encounter is a single resolution step. Approach card: (a) *Accept graciously* (reinforces Heart positive) — (b) *Decline and bless them instead* (feeds Heart positive + minor Star positive if Star rep is also present).

**Beat 2 (aftermath reaction — authored choice):** Carry the offering with you (gains a small attachment artifact — `pilgrim-offering`, existing content type) or leave it at the shrine (feeds the settlement's heart score).

**Tally effects:**
- a-branch success → `{ key: 'heart.positive', delta: 1 }`.
- b-branch success → `{ key: 'heart.positive', delta: 1 }` + (if Star positive present) `{ key: 'star.positive', delta: 1 }`.
- Failure case (agent essence too low to accept) → no tally change, but plants `debt` hidden mark (the pilgrim remembers the refusal).

**Hidden marks:** a-branch with attachment-keep → plants `secret_knowledge` mark on the pilgrim (they will recognize the agent later, carrying the small cloth scrap the agent accepted).

**Seed chain:** no forced seed. Optional: +25 tick soft seed for `pilgrims-return` only if the a-branch attachment is still carried.

**Art brief:** A roadside shrine: a cairn of white stones, faded cloth tied to branches above. A kneeling pilgrim offering a bundle in cupped hands. The agent's shadow falls across the cairn, but their face is not shown. Palette: ash-grey stone, faded saffron cloth, a slip of warm light through cloud.

#### C4. `the-veiled-consultation` — Veil + Eye, multi-trait AND, long

**Gate:** `requiredTargetTraits: ['trait.reputation.veil.positive', 'trait.reputation.eye.positive']` — both must be present (Arcane Sage AND Oracle). Min level 2 on Veil, 1 on Eye.

**Support bundle:** one sage NPC (mage-scholar role) + one sealed artifact (consulted item). Optional library sublocation as backdrop.

**Beat 1 (opening):** A sage approaches with a sealed text — a question only the agent can answer because of their combined reputation. Recognition explicit: "The Arcane Sage who also sees — it had to be you." `{title}` falls back to whichever of the two traits is higher-tier.

**Beat 2 (interpretation):** The agent reads the text. Approach card: (a) *Interpret plainly and risk what comes* (safe, Veil-leaning) — (b) *Withhold half the truth as leverage* (dramatic, Shadow-leaning) — (c) *Refuse the reading* (pushes Veil negative, rare).

**Beat 3 (consequence):** The sage either acts on the interpretation (a), owes the agent a future favor (b), or spreads word that the Oracle refuses (c). Seeds different follow-ups.

**Beat 4 (aftermath reaction — authored choice):** Copy the text for your own records (grants an attachment — scroll fragment) or return it unmarked (reinforces sage's trust).

**Tally effects:**
- a-branch → `{ key: 'veil.positive', delta: 1 }` + `{ key: 'eye.positive', delta: 1 }`.
- b-branch → `{ key: 'shadow.positive', delta: 1 }` (cunning) + `{ key: 'veil.positive', delta: -1 }` (the sage trusts less next time).
- c-branch → `{ key: 'veil.negative', delta: 1 }` + `{ key: 'eye.negative', delta: 1 }`.
- Failure → plants `forbidden_contact` hidden mark if the text's subject is dangerous.

**Hidden marks:** b-branch plants `secret_knowledge` mark on the sage. c-branch plants `betrayal` mark on the sage's order.

**Seed chain:** a → `sage-returns-with-larger-question` at +30. b → `sage-calls-in-favor` at +40. c → `order-sends-replacement-diviner` at +25.

**Art brief:** A narrow room lit by a single oil lamp. An elder figure in veil-grey robes unrolls a parchment across a low table; the agent's hand rests at the edge of the scroll. Ink traceries on the parchment glow faintly. Palette: deep indigo, lamp-amber, scroll-cream. A single candle, no larger flame.

#### C5. `the-stones-judgement` — Stone, tier-sensitive L3-only, medium

**Gate:** `requiredTargetTraits: ['trait.reputation.stone.positive']` at level 3 (Legendary) exactly. A rare encounter that only surfaces for Steadfast Builders at world-renown tier.

**Support bundle:** a settlement elder NPC + two disputing parties (adversarial NPCs from competing factions). Settlement must be a town or city tier.

**Beat 1 (opening):** The elder calls the agent to arbitrate. Recognition strong — "Only the Steadfast Builder's word will close this." Approach card: (a) *Rule for the older claim* (reinforces Stone positive — preservation) — (b) *Rule for the transforming claim* (dramatic — pushes Stone negative tally despite being the narratively correct call for some worlds).

**Beat 2 (resolution):** The ruling takes effect. Settlement prosperity shifts accordingly. No third beat other than a brief "it is done."

**Beat 3 (aftermath reaction — authored choice):** Record the judgement in settlement lore (grants a small Culture boost) or let the ruling fade into memory (no lasting effect).

**Tally effects:**
- a-branch → `{ key: 'stone.positive', delta: 2 }` (reinforces Legendary — high-yield because the encounter is rare).
- b-branch → `{ key: 'stone.negative', delta: 1 }` + `{ key: 'stone.positive', delta: -1 }`.
- Failure (elder rejects the ruling as biased) → `{ key: 'stone.negative', delta: 1 }` + plants `betrayal` mark on the elder.

**Hidden marks:** a-branch plants `secret_knowledge` mark on the losing party (they remember, they wait). b-branch plants `debt` mark on the agent (they have taken from the past).

**Seed chain:** Both branches → `losing-party-returns-generation-later` at +50 ticks (long-horizon seed, landmark encounter).

**Art brief:** Open market square, a rough stone slab between two crowds. The agent stands on the slab, elder behind them, the two disputing parties flanking. Wind-whipped banners in the background. Palette: weathered stone, faded earthen reds and deep browns. Wide composition — the agent is central but not large. A judgement, not a speech.

---

**Authoring rubric** (`REPUTATION_GATED_README.md`):

1. **Every template declares at least one gate** (`requiredTargetTraits`, `blockedByTraits`, or both). No gated encounter leaves the gate field empty.
2. **Every template emits at least one `reputation_tally` aftermath effect** that references the gating reach. The gate must feed itself.
3. **Every template uses `{title}` at least once** in prose — opening, approach card, or success outcome.
4. **Every template declares `illustrationUrl` + `illustrationAlt`** pointing at `/art/encounters/<slug>.webp`. The actual art is generated during pipeline stage 4.
5. **Every template is registered in `unified-action-templates.ts`** — no dangling imports.
6. **Every template is covered by the contract test** — add to the fixture array in `reputation-gated-encounters.test.ts`.

### UI pillar — N/A (prose-only surfacing); debug visibility via existing channels

No new UI components. No new modals. No new toasts. The encounter surfaces through the existing `NarrativeLog` + `ToastStack` pipeline like every other encounter; the gate operates silently during filtering (`encounter_filtered` trace is already emitted by the filter stage).

**Player-facing visibility:** entirely via prose enrichment. The `{title}` placeholder is the single surface through which the player senses their reputation is working.

**Debug visibility:** the existing `DebugPanel → Encounters` tab shows filtered-out encounters with their `reason`. Reputation gate failures will already read as `reputation_gate_failed: trait.reputation.X.Y required/blocked`. No new debug panel work required — verify during implementation that the reason strings are useful.

**Chronicle/toast:** nothing new. The encounter firing is already logged; the player reads the prose and that's where recognition happens.

**Hex map:** no new signifiers. Reputation-gated encounters spawn at the same hex granularity as any other encounter.

## Wiring check

Per `Docs/plans/wiring-checklist.md`:

| Surface | This work wires? |
|---|---|
| 1. Orchestrator phase | No — uses existing `phaseEncounterProgressionV2` (2a.3) and `phaseReputationTraits` (8.15) |
| 2. GameState field | No new fields |
| 3. UI component | No new components |
| 4. Modal/overlay | No new modals |
| 5. Trace category | No new traces; uses existing `encounter_filtered` + `reputation_tally_updated` |
| 6. Player control | None |
| 7. Prose resolver | Uses existing `enrichProse()` with existing `{title}` placeholder |
| 8. Debug panel | No new inspector — existing Encounters tab surfaces filter reasons |
| 9. Test harness | **New contract test** `reputation-gated-encounters.test.ts` |
| 10. Content registry | **Updated** `unified-action-templates.ts` (five imports) |
| 11. README | **New** `src/data/encounters/REPUTATION_GATED_README.md` |

All other surfaces: unchanged. No checklist updates required beyond the two new file registrations above.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new magic numbers. Trait IDs, min-levels, and tally keys are all references to existing declared constants. |
| 2. Inspectability | PASS | `encounter_filtered` trace carries the gate-failure reason. `reputation_tally_updated` trace carries the delta source. No new trace types needed. |
| 3. Determinism | PASS | Tally deltas are template-declared (no PRNG). Contract test uses seeded agent state. |
| 4. Fail-soft | PASS | `{title}` placeholder has existing neutral fallback. If a template is registered but the filter somehow misfires, filter stage already emits `encounter_filtered` with a reason — doesn't throw. See fail-soft table below. |
| 5. Narrative over mechanical perfection | PASS | Gate matrix is narrative-first: each pattern exists because it produces a distinct *feel*, not for combinatorial completeness. |
| 6. Additive over destructive | PASS | Five new template files + one test + one README. No refactors. No existing encounter touched. |
| 7. Performance | PASS | Filter stage already runs per tick; five new templates add negligible work (gate check is O(1) per template per trait). |

## Fail-soft table

| Failure case | Behavior |
|---|---|
| `enrichProse()` receives no reputation context for `{title}` | Existing fallback: neutral substitution (`"the wanderer"` or similar). Prose still reads cleanly. |
| Template references a trait ID that isn't in the trait registry | Filter stage logs `encounter_filtered: unknown_trait`, encounter is silently excluded. No throw. Caught by contract test at author time. |
| Aftermath emits `reputation_tally` with unknown key | `phaseReputationTraits` logs a warning trace and skips the delta. Tick loop continues. |
| Concept art `.webp` file missing at runtime | Encounter still renders; illustration falls back to the default encounter silhouette (existing UI behavior). |
| Support bundle cannot materialize the required NPC | Encounter falls back to cold-open text (existing `encounter_materialization_failed` pathway). |

## Rollout

1. **CC pulls THR-32** — reads this plan, loads encounter-pipeline + prose-content-systems skills.
2. **Author the five templates** via encounter-pipeline stage-by-stage, one template at a time. Each goes Draft → Editorial → Systems Audit → Implementation. Commit each template in its own commit so review is tractable.
3. **Register all five** in `unified-action-templates.ts`.
4. **Write the contract test** against all five simultaneously. It should pass on first run if the templates are correctly declared.
5. **Write the README rubric** (`REPUTATION_GATED_README.md`).
6. **Run `npm test`, `npx tsc --noEmit`, `npx vite build`** — all must pass.
7. **Ship.** Commit body includes `Fixes THR-32`. Push, Vercel deploys.
8. **Create follow-up issues THR-32a (middle-5) and THR-32b (final-5)** referencing this plan's rubric. They unblock immediately.

## Acceptance

- [ ] Five `UnifiedActionTemplate` encounters exist at `src/data/encounters/<slug>.ts` with distinct gate patterns per C1–C5.
- [ ] All five registered in `unified-action-templates.ts`.
- [ ] All five use `{title}` enrichment at least once in prose.
- [ ] All five emit at least one `reputation_tally` aftermath effect referencing the gating reach.
- [ ] Contract test `reputation-gated-encounters.test.ts` exists and passes — verifies all five gate patterns.
- [ ] Concept art `.webp` files generated and present at `public/art/encounters/<slug>.webp`.
- [ ] `REPUTATION_GATED_README.md` exists and captures the six-rule rubric.
- [ ] `npm test` + `npx tsc --noEmit` + `npx vite build` all clean.
- [ ] Codex review run against the branch diff (per handover block).
- [ ] `project-status.md`, `project-history.md`, `changelog.md` updated.
- [ ] Follow-up issues THR-32a and THR-32b created.

## Open questions (none blocking)

- Should `pilgrims-offering` also plant a *positive* reputation mark on the pilgrim's family/settlement? Decision: defer to implementation judgement — the hidden mark system supports this but we don't want to over-specify the first tranche. If the pipeline draft agent wants it, fine.
- Is the 15-tick seed delay in `warlords-tribute` right, or should it be longer to let the tribute sit and breed tension? Decision: 15 is the repo default for "soon"; 30–50 is "long horizon." The warlord-breaks-oath beat should feel *fast* (the warlord breaks faith quickly), so 15 is right. If CC disagrees during drafting, overriding to 20 is acceptable — this is the narrative-over-mechanics NFP in action.
