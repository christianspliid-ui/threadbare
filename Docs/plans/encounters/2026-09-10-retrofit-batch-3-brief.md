# Retrofit batch 3 — brief (THR-1130, the last of the fifteen)

> **lint_plan_doc:** exempt — a factory batch brief is an encounter-pipeline artifact
> (Stage 0), not a dated design plan doc. It has no Engine pillar, constants table,
> tracing or fail-soft table to declare, and never will; the design decisions it runs
> under were ruled on 2026-08-08, 2026-08-24 and 2026-08-25 and live in the spec and
> plan doc it links.

**Status:** drafted by the agent, **awaiting Christian's chat approval** (ruling 2 — a batch does not run until its brief is approved).
**Ticket:** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · **Plan:** [2026-08-08-encounter-factory-workflow.md](../2026-08-08-encounter-factory-workflow.md) §2 Stage 0 · **Spec:** [`nudge-authoring-spec.md`](../../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md)
**Predecessor:** [batch-2 brief](2026-09-04-retrofit-batch-2-brief.md) · [batch-2 report](batch-report-2026-09-09.md) · **Released by:** the director's batch-2 approval, 2026-09-09 19:55 UTC (*"Batch 2, run the six"*), and [THR-1222](https://linear.app/threadbare/issue/THR-1222) shipping the camp six the same night.
**Gate:** `npm run check:encounter -- <templateId>` · **Report:** `npm run encounter:batch-report -- <ids…> --brief Docs/plans/encounters/2026-09-10-retrofit-batch-3-brief.md`

Batch 1 shipped the slice six. Batch 2 shipped the camp six. **Batch 3 is the residue —
and it is one encounter, not six.** Every number below was measured this run
(`npm run check:encounter -- --all`, 206 templates), not carried from the batch-2 brief.

**The headline, stated before the detail because it changes what this brief asks for:
batch 3's single encounter draws a consequence hand that is unwirable 2-of-2, and the
swap budget is 1.** That is [THR-1446](https://linear.app/threadbare/issue/THR-1446),
filed by batch 2's own session. §2c carries the evidence. The brief is complete and ready
to run; the **run** should wait for that ticket.

---

## 0. What changed since batch 2 was briefed

- **Batch 2 landed clean.** All six camp templates now pass with **zero violations and
  zero warnings** (`checked 6 clean 6 failing 0 on ratchet 0 warnings 0`, this run). The
  card-name calibration batch 2 settled is available to this batch rather than being
  re-litigated by it.
- **The corpus moved under us.** 206 templates, **27 clean** (was 6 when batch 1 was
  briefed), 0 failing, 179 on the `RETROFIT_PENDING` ratchet. That is the designed state.
- **`shrine_offering`'s warning count fell from 10 to 4** with no work done on it — 20-odd
  ordinary imperative verbs entered `IMPERATIVE_VERB_LEXICON` with batch 2, which is the
  lexicon growing through use exactly as its own comment says it should. The batch-2 brief's
  reason for holding this template to batch 3 (*"it carries the most warnings of the
  seven (10), so it benefits from the six ahead of it settling the card-name calibration
  first"*) was sound and has now paid off.
- **[THR-1446](https://linear.app/threadbare/issue/THR-1446) exists and is `Ready for Dev`**
  (promoted 2026-09-10 06:56 UTC). It did not exist when batch 2 was briefed; batch 2
  discovered it by hitting it twice.
- **[THR-1053](https://linear.app/threadbare/issue/THR-1053) is still unruled**, now in
  `Todo` rather than `Idea`. It still gates the two slice-residue templates.

---

## 1. Portfolio — read, not re-derived

Per the spec's step 1 the portfolio is read from
[`2026-08-24-encounter-portfolio-assessment.md`](../../audits/2026-08-24-encounter-portfolio-assessment.md)
(THR-1215), not re-derived, and it answers this batch's category question in the negative
for the same reason it did for batch 2:

> **Running alongside:** THR-1130 retrofits the 15 nudge-era encounters to the contract.
> That is repair, not portfolio growth, and it does not compete with this list for
> category choice.

**So batch 3 rolls no category.** Its membership is fixed by ruling 8 — it is whatever the
fifteen have left. It authors no new encounter, and in particular it does not grow the camp
band, which the assessment names explicitly as *not* a gap.

---

## 2. Game design — all of it, before a word of fiction

### 2a. The measured starting state

`npm run check:encounter -- encounter.shrine_offering`, 2026-09-10:

| Template | Reach | Systems (quota 3) | Bands (floor 3) | Blocks failing | Warn |
|---|---|---:|---:|---|---:|
| `encounter.shrine_offering` | star / heart | **1** (rewards) | **0** | setting, cast, aftermath, systems | 4 |

The four failing blocks, verbatim from the gate:

- `[setting] declares no 'settings' — the envelope is what binds cast and openings`
- `[cast] no actor support binding — declare a 'supportBundle' actor spec, or an 'encounter.*' id whose setting class carries a family default`
- `[aftermath] no 'aftermathConfig' — the encounter has no authored ending`
- `[systems] connects to 1 game system(s) [rewards], under the quota of 3`

The four warnings: `intensifiers x1`, and three card names opening with `Let` —
`shrine.let_the_grain_show`, `shrine.let_it_fall_true`, `shrine.let_the_dark_come`.

**The two slice-residue templates are unchanged and still blocked.**
`slice.snow_on_the_pass` and `slice.riders_behind_caravan` fail on exactly one rule —
`change '<id>' declares no concepts (Law 2)` — which is
[THR-1053](https://linear.app/threadbare/issue/THR-1053), still unruled. Batches 1 and 2
both excluded them for the reason that still holds: if THR-1053 lands on option (b) the
work is discarded entirely. **Batch 3 authors no `concepts`.**

### 2b. Two findings that move the scope

**A. The prose is in better shape than the batch-2 precedent predicted.** Batch 2's §0
recorded that the camp seven *"were authored in July under v1 and carry in-situ prose
throughout; the re-pass is mandatory, not cosmetic."* That is true of the band as a whole
and **overstated for this template.** Read this run, `shrine_offering`'s step narrative is
already narrator-mode third person with a GM aphorism leading each beat — *"A god is owed
better than the cheapest item in the pack. {actor} turns the pack out onto a flat stone…"*,
*"An offering is placed, never dropped."* No second person, no inhabiting. The gate agrees:
zero register violations, one intensifier.

So the doctrine-v2 work here is **a pass for density and the three card names, not a
rewrite.** Saying so now is the honest scope statement; discovering it mid-batch would
invite padding the diff to match the precedent.

**B. The drawn hand cannot be wired, and this is the whole reason to wait.** See §2c. It is
a finding rather than a footnote because it converts batch 3 from "ready to run" into
"ready to run the moment THR-1446 lands", and because the alternative is knowingly
repeating a defect that has already been ticketed.

### 2c. The consequence hand — rolled, and unwirable 2-of-2

Rolled this run. Recorded here because `check:encounter` re-derives the hand from the
template id and fails a mismatch.

```
npm run draw:consequences -- encounter.shrine_offering
  template  encounter.shrine_offering      reach star      rarity 1
  hand      2 of 2 drawn
  ▸ thread  [weight 8 in star]   wire one of: thread_strengthen, thread_weaken, thread_break, thread_branch
  ▸ place   [weight 4 in star]   wire one of: spawn_unique_location, condition_attachment,
                                 apply_condition, remove_condition …with a location target (targetLocationId)
```

| # | Template | Reach | Drawn hand | Wirable here? |
|---|---|---|---|---|
| 1 | `encounter.shrine_offering` | star | `thread` (8) · `place` (4) | **neither** |

**`thread` — unwirable everywhere.** Checked against the engine this run, not argued from
the type. `thread_strengthen` / `_weaken` / `_break` / `_branch` take literal `ascendantId`
and `mortalId`; `SCENE_SENTINEL_FIELDS` in [`src/engine/encounterAftermath.ts`](../../../src/engine/encounterAftermath.ts)
holds only `targetAgentId`, `withAgentId`, `counterpartyId`, `debtorAgentId`,
`targetFactionId`, `factionId`, `targetSublocationId`, `targetLocationId` — so no `$actor` /
`$target` / `$cast:<key>` sentinel binds either field, and a template cannot know either
node id. The handler then does a raw literal lookup
(`state.graph.getOutgoingEdges(effect.ascendantId, 'thread')`) and skips with
`thread_mutation_skipped · reason: 'edge_missing'` when it finds nothing.

> **One correction to THR-1446's census, worth recording because it looks like a
> counterexample and is not.** The ticket states *"zero shipped templates author any thread
> effect"*. A grep does find thread effects in two files: `src/data/encounter-content.ts`,
> where the hit is batch 2's own `consequenceSwap.reason` string describing the problem, and
> [`src/data/encounters/examples/example.thread_bond_tested.ts`](../../../src/data/encounters/examples/example.thread_bond_tested.ts),
> which wires `ascendantId: 'self'` / `mortalId: 'actor'` — bare string literals, under an
> `@ts-ignore` and a header reading *"not a real game encounter"*. Those literals are not
> sentinels and name no node, so that example would skip on `edge_missing` too. **The
> census holds; the apparent counterexample is an illustrative file that has never run.**

**`place` — unwirable on this template.** It needs a condition kind carrying
`targetLocationId`, and `$target` binds a location only when the action targets one.
Verified in the CLI this run rather than assumed:

```
npm run cli -- --seed 42 --map medium
  spawn encounter @hero encounter.shrine_offering
  → { actorId: 'asc.archetype.chaos_0', targetId: 'asc.archetype.chaos_0', same: true }
```

`targetId === actorId`, so `$target` is an agent, the binder's location-kind check rejects
it, and the effect would no-op silently — the vacuous wiring the contract exists to
prevent. The family's only sentinel-free kind, `spawn_unique_location`, mints a new place
for leaving a comb on some stones, which is the wrong scale.

**Why this is a block and not a swap.** `consequenceSwap` is **one per template** by
design — the pressure valve for a hand that fights the *fiction*, not one that fights the
*engine*. This hand needs **two**. Batch 2 faced exactly this and spent two, on
`sharpen_blades` (`place → condition`) and `ward_the_camp` (`thread → condition`); that
overspend against a brief budgeting one is precisely what THR-1446 was filed to stop.
Authoring batch 3 now would be the third instance, committed knowingly, in the one batch
small enough that the cost of waiting is a single encounter.

**If the director would rather proceed anyway**, the honest shape is two recorded swaps
with the engine reason on each, traded into the highest-weight wirable families in `star`:
`story_seed` (10, via `encounter_seed`) and `condition` (4, via `apply_condition` on the
actor — the same destination batch 2 used twice). That is a real fallback, not a
gesture — it would pass the gate and the effects would land. It just spends the budget
twice and ships a recorded hand that does not describe what the encounter does.

### 2d. What this encounter owes

- **Setting envelope** — `settings` from the closed 8-class vocabulary
  (`rural` · `urban` · `stronghold` · `sacred` · `arcane` · `ruin` · `wayside` ·
  `battlefield`), replacing the current `locationTypes: ['shrine', 'temple', 'ruins']`,
  plus **one opening per declared class**. The honest envelope here is
  **`sacred` + `ruin`** — those `locationTypes` map to exactly that pair, and a roadside
  cairn argues for `wayside` as a third if the openings can carry it. Write toward the
  widest honest envelope (Christian's standing direction: flexibility by default, enforced
  by prose). A multi-class envelope inherits no cast default and must declare its own,
  class-honest across every declared class (THR-1044).
- **Cast** — ≥1 named scene actor as a real support binding, role-voiced inline (ruling 6).
  A shrine has an obvious one: whoever tends it, or the previous petitioner whose gift is
  still in the hollow. `{cast:*}` tokens only where the generated name earns something.
- **Rewards** — something persistent. `rewards` is the one system already wired; it clears
  the block but should be re-read against THR-973's bar rather than assumed sufficient.
- **Aftermath** — `aftermathConfig` with **≥3 `byOutcome` bands** (ruling 7 floor: success /
  failure / one extreme — *a floor, not a norm*). Currently zero.
- **Systems quota** — ≥3. `cast` + `rewards` + one condition family clears it, which is the
  `systems: cast, rewards, conditions` shape all six of batch 2's templates landed on.
- **Chip copy state-first** (THR-1205) — mechanic noun leads, endpoints in the detail, the
  **exact single-direction effect visible on the chip itself**, never in prose. No `mixed`
  polarity carrying a `gain` arrow. No authored `reputation_tally` chips — the gate fails them.
- **Register** — the god **sways, never decides** (THR-1166); currently passing, keep it there.
- **Prose** — density pass + the three `Let` card names (§5b). Not a rewrite (finding A).

---

## 3. Hooks and dice — deliberately not rolled, with the reason

The spec's step 3 rolls the Plot-Hook Draw and the five Seed Dice to generate story
candidates. **Batch 3 rolls neither, because it generates no premise.** `shrine_offering`
has one already — the ticket is a retrofit, and the dice exist to constrain invention, not
to re-invent shipped content. Rolling them would produce candidate premises the batch is
forbidden to use.

What carries over from doctrine v2 is the **opening skeleton** (P1 arrival · P2
situation-and-complication with costs already paid · P3 the problem, one stake shape), the
≤80-word opening budget, and rule zero. The rewritten openings — one per declared setting
class — each state their P3 stake shape from the Seed Dice stake table, so the batch report
can show stake variance **across the classes** rather than across six templates. That is
the only variance axis a one-encounter batch has, and it is the one ruling 1 can still be
served by.

---

## 4. Batch membership

**Batch 3 — one template:**

| # | Template | Reach | Tone target |
|---|---|---|---|
| 1 | `encounter.shrine_offering` | star / heart | devotional, given-at-cost, a real ledger entry |

**Conditionally two more:** `slice.snow_on_the_pass` and `slice.riders_behind_caravan` join
batch 3 **if and only if** [THR-1053](https://linear.app/threadbare/issue/THR-1053) rules
that `concepts` stands. If it rules the other way they need no work at all and batch 3 stays
a single encounter. Either way they are not authored on spec.

**Why batch 3 is below ruling 1's size of 6, and why that is not a waiver.** Ruling 1 sizes
a batch at six so the report can show variance across six. Fifteen does not divide into
sixes three times; 6 + 6 + 3 is the partition, and the 3 is only ever a 1 until THR-1053
rules. The ruling's *purpose* — make variance visible — is served here across the setting
classes instead (§3). Nothing is being exempted; the batch is the remainder.

**Not in any batch:** the `concepts` block (THR-1053), and the sequels — `grateful_kin` and
`full_moon_collection` both went through batch 1 and pass with zero violations, so the
long-held "sequel contract" artifact is not needed to close this ticket.

**This brief closes the fifteen.** With batch 3 run, ruling 8's scope — *"slice five AND the
camp seven (+ sequels)"* — is discharged except for whatever THR-1053 decides.

---

## 5. Decisions

**One for the director. One recorded as the agent's, open to veto.**

### 5a. For Christian — approve the batch, and one sequencing call (ruling 2)

Approve this brief and batch 3 runs the one encounter above. The question worth a yes/no:

> **Do we wait for [THR-1446](https://linear.app/threadbare/issue/THR-1446) before running
> batch 3?**
>
> **Recommended: yes.** The hand dealt is `thread` + `place`, and neither can be wired on
> this template — verified against the engine and in the CLI, not argued. Wiring them anyway
> costs two swaps against a budget of one, which is the exact overspend THR-1446 was filed
> to stop after batch 2 hit it twice. THR-1446 is `Ready for Dev` and is a 1–3 hour ticket;
> batch 3 is one encounter. Waiting costs a day and buys a hand that describes what the
> encounter actually does. The fallback — two recorded swaps into `story_seed` and
> `condition` — is real and documented in §2c if you would rather not wait.

**Sampling:** ruling 1's 2-of-6 cannot apply to a batch of one. `shrine_offering` **is** the
sample; it is also roster encounter #1 of the integrated-slice checkpoint
([THR-1220](https://linear.app/threadbare/issue/THR-1220)), so it was going to reach you
there regardless.

### 5b. Agent's call, recorded — the three `Let …` card names

Under the delegation rule (gate/test calibration is the agent's verdict, Christian
2026-08-12), decided rather than escalated — and decided the same way batch 2 decided it,
because consistency across the fifteen is the point of a calibration.

`shrine.let_the_grain_show`, `shrine.let_it_fall_true` and `shrine.let_the_dark_come` are
the last three of the batch-2 cohort of `Let …` names. Batch 2's ruling: **`Let` can open an
imperative, so it does not belong in the fragment list — but the doctrine's bar is
verb + noun as an *instruction*, and "Let the dark come" is a permission, not an
instruction.** They are a doctrine miss wearing a lexicon costume.

**Decision: rewrite the three; do not add `let` to the lexicon.** Identical to batch 2's
call, applied to the residue. Veto welcome — and a veto should change batch 2's eight too,
not just these three.

---

## 6. Sampling and exit

**Done for batch 3 when:** `encounter.shrine_offering` passes `check:encounter` with zero
exemptions and zero `RETROFIT_PENDING` entries; its recorded `consequenceDraw` matches the
hand the gate re-derives; the batch report is committed; and the sample verdict is recorded
on [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).

**Park, don't kill** (ruling 4) — if it fails the critic loop twice it parks with its
salvage note for human feedback rather than being redrafted.

**Then THR-1130 closes**, with the `concepts` residue tracked on THR-1053 rather than here.
