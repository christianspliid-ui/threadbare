# Retrofit batch 2 — brief (THR-1130, the camp six)

> **lint_plan_doc:** exempt — a factory batch brief is an encounter-pipeline artifact
> (Stage 0), not a dated design plan doc. It has no Engine pillar, constants table,
> tracing or fail-soft table to declare, and never will; the design decisions it runs
> under were ruled on 2026-08-08, 2026-08-24 and 2026-08-25 and live in the spec and
> plan doc it links.

**Status:** drafted by the agent, **awaiting Christian's chat approval** (ruling 2 — a batch does not run until its brief is approved).
**Ticket:** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · **Plan:** [2026-08-08-encounter-factory-workflow.md](../2026-08-08-encounter-factory-workflow.md) §2 Stage 0 · **Spec:** [`nudge-authoring-spec.md`](../../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md)
**Predecessor:** [batch-1 brief](2026-08-15-retrofit-batch-1-brief.md) · **Released by:** the director's batch-1 sample verdict, 2026-09-04 (*"the two examplars are accepted"*).
**Gate:** `npm run check:encounter -- <templateId>` · **Report:** `npm run encounter:batch-report -- <ids…> --brief Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md`

Batch 1 shipped the **slice six**. This brief covers **batch 2 — the camp six**, and it
is written in the order the 2026-08-24 ruling now requires: portfolio, then all of the
game design, then story. Every number below was measured this run
(`npm run check:encounter -- --all --json`, 206 templates), not carried over.

---

## 0. What changed since batch 1 was briefed

Batch 1's brief predates three rulings that now bind. This is not a footnote — it changes
the shape of the brief itself:

- **Authoring order (2026-08-24)** — portfolio → game design → hooks → candidates. Fiction
  written first and fitted to mechanics afterwards is *rejected on sight*. §1–§3 below
  follow that order literally.
- **Prose doctrine v2, rule zero (2026-08-25)** — narrate, never inhabit. The camp seven
  were authored in July under v1 and carry in-situ prose throughout; the re-pass is
  mandatory, not cosmetic.
- **The Seed Dice and the Consequence Draw** — consequence families are **drawn, not
  chosen**. The hands are rolled in §2 and recorded here, because the gate re-derives them
  from the template id and fails a mismatch.

---

## 1. Portfolio — read, not re-derived

Per the spec's step 1, the portfolio is read from
[`2026-08-24-encounter-portfolio-assessment.md`](../../audits/2026-08-24-encounter-portfolio-assessment.md)
(THR-1215) rather than re-derived. It answers this batch's category question directly and
in the negative:

> **Running alongside:** THR-1130 retrofits the 15 nudge-era encounters to the contract.
> That is repair, not portfolio growth, and it does not compete with this list for
> category choice.

**So batch 2 rolls no category.** Its membership is fixed by ruling 8. Two consequences
worth stating rather than leaving implicit:

1. **This batch must not grow the camp band.** The assessment names camp chores (33
   templates, the whole WS5 batch) as explicitly *not a gap*. Batch 2 brings seven existing
   encounters to contract; it authors no eighth.
2. **The drawn hands close portfolio gaps anyway** — see §2. The assessment's live
   mechanical gaps are *near-zero grants/costs channel users*, `conditions` at 1, and a
   single omen emitter in the whole game. The six hands drawn below force `omen` twice,
   `place`-with-`targetLocationId` once, `condition` wiring, `membership`, `movement` and
   `knowledge` into the corpus. Repair, run honestly, closes gaps growth was going to have
   to close later.

---

## 2. Game design — all of it, before a word of fiction

### 2a. The measured starting state

`npm run check:encounter -- --all --json`, 2026-09-04, 206 templates, **0 hard failures**
(185 on the `RETROFIT_PENDING` ratchet, the designed state). The fifteen-template retrofit
set:

| Template | Reach | Systems (quota 3) | Bands (floor 3) | Blocks failing | Warn |
|---|---|---:|---:|---|---:|
| `slice.unsafe_bridge` | — | 4 | 4 | **none — passes** | 0 |
| `slice.grateful_kin` | — | 4 | 3 | **none — passes** | 0 |
| `slice.swindled_family` | — | 4 | 3 | **none — passes** | 0 |
| `slice.swindler_found` | — | 5 | 4 | **none — passes** | 0 |
| `slice.bargain_at_crossroads` | — | 4 | 3 | **none — passes** | 0 |
| `slice.full_moon_collection` | — | 3 | 3 | **none — passes** | 0 |
| `slice.snow_on_the_pass` | — | 4 | 4 | aftermath¹ only | 0 |
| `slice.riders_behind_caravan` | — | 4 | 4 | aftermath¹ only | 0 |
| `sharpen_blades` | iron | **0** | **0** | setting, cast, rewards, aftermath, systems | 5 |
| `ward_the_camp` | veil | **0** | **0** | setting, cast, rewards, aftermath, systems | 6 |
| `offer_small_prayer` | star | 1 | **0** | setting, cast, aftermath, systems | 3 |
| `rest_and_reflect` | heart | 1 | **0** | setting, cast, aftermath, systems | 6 |
| `tend_to_wounds` | eye | 1 | **0** | setting, cast, aftermath, systems | 3 |
| `scout_the_perimeter` | eye | 1 | **0** | setting, cast, aftermath, systems | 4 |
| `shrine_offering` | star | 1 | **0** | setting, cast, aftermath, systems | 10 |

¹ `concepts`-only — see finding B.

### 2b. Four findings that move the scope

**A. Two of the ticket's named scope items are already discharged.** The 2026-09-04
release comment lists *"Swindled Family still owes a third band"* and *"sequel encounters
with no nudge hand are still out of scope"*. Measured today, neither survives:
`swindled_family` carries **3 bands** (`critical_success`, `success_at_cost`,
`critical_failure`) and passes with **zero violations**; both sequels — `grateful_kin` and
`full_moon_collection` — went through batch 1 and now pass with **zero violations** each.
The sequel-contract question does not need answering to finish this ticket. Both items are
struck from batch 2 rather than carried.

**B. The two slice residue fail on one disputed rule, not on authoring debt.**
`snow_on_the_pass` (6 violations) and `riders_behind_caravan` (4) fail *only* on
`change '<id>' declares no concepts (Law 2)` — the exact rule batch 1 excluded on the
evidence that the narrative linker already delivers Law 2 reachability unconditionally and
`concepts` merely decorates. [THR-1053](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)
still sits in **Idea**, unruled. **Batch 2 authors no `concepts`**, for the same reason
batch 1 did not: if THR-1053 lands on option (b) the work is discarded entirely.

So the real remaining authoring volume in this ticket is **the camp seven, and nothing
else**. The "remaining 9 of 15" in the release comment counts the two residue templates
that need a design ruling rather than an author.

**C. Batch 1's one escalated decision is closed and must not be re-asked.** That brief
parked on *"the 27 missing `generic.*` card plates: generate, or remap?"*. Measured across
all 206 templates today: **zero `images` violations**, corpus-wide. The library carries the
rows now. Batch 2 raises no art decision.

**D. Two-thirds of the camp seven's 37 warnings are a lexicon that grows by design.**
Split by disposition:

| Kind | Count | Disposition |
|---|---:|---|
| Opener is a genuine imperative absent from `IMPERATIVE_VERB_LEXICON` (`listen`, `wait`, `remember`, `walk`, `outlast`, `clean`, `trust`, `expect`, `stretch`, `admit`, `bank`, `feel`, `mean`, `true`, `even`) | 20 | **Add the words.** `doctrineV2Checks.ts:55-68` states the intent verbatim: a genuine verb missing *"costs one line of output and a one-word commit … it makes the lexicon grow toward completeness through use"*. |
| `Let …` openers | 8 | **Decision — see §5.** |
| Fragment/mood names (`A gap in the wind`, `One clean pull`, `Lamp over the table`) | 4 | **Real rewrites** to verb + noun. |
| Over the 4-word name budget | 2 | **Real rewrites.** |
| Intensifiers (weak words) | 3 | Fold into the doctrine-v2 prose re-pass. |

The headline "37 warnings" reads as prose rot and mostly is not. Roughly **9 card names**
need actual rewriting; the rest is lexicon maintenance or falls out of the prose pass.

### 2c. The consequence hands — rolled, not chosen

Run this batch, recorded here because `check:encounter` re-derives each hand from the
template id and fails a mismatch. **Every family must be wired in context.**

| # | Template | Reach | Drawn hand | Wire with | Anchor the chip points at |
|---|---|---|---|---|---|
| 1 | `sharpen_blades` | iron | `secret` (3) · `place` (4) | `favor_creation` · `apply_condition` + `targetLocationId` | 🔗 `agent` — whose steel was trued, and now owes for it · 🔗 `location` — the camp |
| 2 | `ward_the_camp` | veil | `thread` (6) · `omen` (8) | `thread_strengthen`/`_weaken` · `emit_omen` | 🔗 `agent` — the warder, thread to the ascendant · 📍 `hex`/`location` the omen reads over |
| 3 | `offer_small_prayer` | star | `drive` (8) · `movement` (7) | `assign_ambition`/`plant_compulsion` · `agent_relocation` | 🔗 `agent` — who now wants something · 🔗 `location` — where the prayer sends them |
| 4 | `rest_and_reflect` | heart | `story_seed` (7) · `movement` (4) | `encounter_seed` · `agent_relocation` | 📍 the seeded template + 🔗 `location` it fires at |
| 5 | `tend_to_wounds` | eye | `possession` (4) · `knowledge` (10) | `attachment_grant`/`reward_draw` · `intelligence`/`spawn_clue` | 🔗 `attachment` template node · 🔗 `agent` or `location` the knowledge is *about* |
| 6 | `scout_the_perimeter` | eye | `membership` (3) · `omen` (4) | `membership_change` · `emit_omen` | 🔗 `faction` (`$faction:<defId>`) — the company whose watch this is · 📍 `hex` |

Anchor kinds and their declaration forms are the catalog's, not invented here —
[`anchor-catalog.generated.md`](../../../.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md).
🔗 = the chip carries a live click; 📍 = a real resolvable object named in the sentence.
Both satisfy Law 56.

**The one hand that may need the batch's single recorded swap: `scout_the_perimeter`'s
`membership`.** A camp chore granting faction membership reads odd at first. **Author it
rather than swap it** — a caravan's watch roster *is* a membership, and standing up for a
perimeter watch is exactly how a traveller earns rank in the company they move with. That
is an honest wiring and it closes a gap. Swap only if the drafter finds no company faction
in scope at draft time; `consequenceSwap` then records the real reason, and the traded-in
family must hold weight ≥ 2 in `eye`. **One swap for the whole batch, or zero.**

### 2d. Per-encounter targets — what every one of the six owes

- **Setting envelope** — `settings` from the closed 8-class vocabulary, replacing the
  current `locationTypes: [...ALL_LOCATION_SUBTYPES]`, plus **one opening per declared
  class**. Write toward the *widest honest* envelope (Christian's standing direction:
  flexibility by default, enforced by prose). These are camp scenes — expect `wayside` /
  `rural` / `stronghold`, not all eight. A multi-class envelope inherits no cast default
  and must declare its own, class-honest across every declared class (THR-1044).
- **Cast** — ≥1 named scene actor as a real support binding, role-voiced inline (ruling 6),
  `{cast:*}` tokens only where the generated name earns something. The portfolio records
  **zero `{cast:*}` across the entire `encounter.*` family** — this batch is the first to
  change that number.
- **Rewards** — something persistent. The current `reputationDelta: 0.03`-class nudge does
  not clear THR-973's bar. `sharpen_blades` and `ward_the_camp` author from zero.
- **Aftermath** — `aftermathConfig` with **≥3 `byOutcome` bands** (ruling 7 floor: success
  / failure / one extreme — *a floor, not a norm*). All six currently author zero.
- **Systems quota** — ≥3. Cast + rewards + the two drawn families clears it on all six.
- **Chip copy state-first** (THR-1205) — the mechanic noun leads, endpoints in the detail,
  the **exact single-direction effect visible on the chip itself**, never in prose. No
  `mixed` polarity carrying a `gain` arrow. **No authored `reputation_tally` chips** — the
  gate now fails them.
- **Register** — the god **sways, never decides** (THR-1166); the detector is live and
  targets zero. All six currently pass it; keep them there.

---

## 3. Hooks and dice — deliberately not rolled, with the reason

The spec's step 3 rolls the Plot-Hook Draw and the five Seed Dice to generate story
candidates. **Batch 2 rolls neither, because it generates no premise.** All six encounters
have a premise already — the ticket is a retrofit, and the dice exist to constrain
invention, not to re-invent shipped content. Rolling them here would produce candidate
premises the batch is forbidden to use.

What *does* carry over from doctrine v2 is the **opening skeleton** (P1 arrival ·
P2 situation-and-complication with costs already paid · P3 the problem, one stake shape),
the ≤80-word opening budget, and rule zero. Each rewritten opening states its P3 stake
shape from the Seed Dice stake table so the batch report can show stake variance across the
six — the dice as a *vocabulary* for describing what is there, not as a generator.

If the director would rather batch 2 re-roll premises outright — treating the camp seven as
replaceable rather than repairable — that is a different and larger ticket, and it should
be said before this batch runs.

---

## 4. Batch membership, and what goes to batch 3

**Batch 2 — the camp six** (ruling 1: size 6):

| # | Template | Reach | Tone target |
|---|---|---|---|
| 1 | `encounter.sharpen_blades` | iron | craft, materials, patience |
| 2 | `encounter.ward_the_camp` | veil | threshold, unseen pressure |
| 3 | `encounter.offer_small_prayer` | star | devotional, small and sincere |
| 4 | `encounter.rest_and_reflect` | heart | interior, companionable |
| 5 | `encounter.tend_to_wounds` | eye | care, close attention |
| 6 | `encounter.scout_the_perimeter` | eye | watchfulness, threat read |

**Why this six, unchanged from the batch-1 brief's reasoning.** Reach coverage across the
seven is iron ×1, veil ×1, star ×2, heart ×1, eye ×2, so any six carries one duplicate. The
`eye` pair is the duplicate worth keeping — `tend_to_wounds` (care) against
`scout_the_perimeter` (threat) is the same reach at opposite tones, which is the
side-by-side variance ruling 1 asks the report to make visible. Holding `shrine_offering`
avoids pairing it with `offer_small_prayer`, the batch's one weak contrast. It also carries
the most warnings of the seven (10), so it benefits from the six ahead of it settling the
card-name calibration first.

**Batch 3 — the residue, three templates:** `shrine_offering`, plus `snow_on_the_pass` and
`riders_behind_caravan` *if and only if* THR-1053 rules that `concepts` stands. If it rules
the other way those two need no work at all and batch 3 is a single encounter.

**Not in any batch:** the `concepts` block (finding B), the sequels (finding A — they pass).

---

## 5. Decisions

**One for the director. One recorded as the agent's, open to veto.**

### 5a. For Christian — approve the batch (ruling 2)

Approve this brief and batch 2 runs the six above. The two questions worth a yes/no:

1. **Is repair-in-place still what you want here**, or has the camp band earned re-rolling
   from premises (§3)? Repair is what the ticket says and what this brief plans.
2. **Recommended sample, 2 of 6** — `ward_the_camp` (thinnest start; veil; the hand that
   forces the game's second omen emitter) and `tend_to_wounds` (eye; warmest tone; the
   `possession` + `knowledge` hand). That is your own recommendation from the 2026-09-04
   comment, and it remains the widest gap in the batch.

### 5b. Agent's call, recorded — the eight `Let …` card names

Under the delegation rule (gate/test calibration is the agent's verdict, Christian
2026-08-12), this is decided rather than escalated.

`Let` **can** open an imperative — "Let go", "Let it stand" — and `IMPERATIVE_VERB_LEXICON`'s
own membership rule is explicit that a word belongs in the fragment list *only if it cannot*
open one, because the two errors cost differently: a false "fragment" verdict tells an author
their correct name is wrong and names no remedy. By that rule `let` belongs in the lexicon.

**But the doctrine's actual bar is verb + noun as an instruction**, and "Let the edges blur"
is a permission, not an instruction — it tells the player to allow something rather than to
do it. The eight are a real doctrine miss wearing a lexicon costume.

**Decision: rewrite the eight, do not add `let` to the lexicon.** They are 8 of the 9 real
card-name rewrites this batch owes, and rewriting them is cheap and improves the cards.
Add the other 20 genuine verbs to the lexicon in the same PR. Veto welcome.

---

## 6. Sampling and exit

Per ruling 1 and Stage 5: the batch report renders all six side by side — shapes, reaches,
tones, **and this batch's stake shapes and drawn hands**, so variance is visible in the
mechanics as well as the prose. **2 of the 6** go to Christian in chat for verdict.

**Done for batch 2 when:** all six pass `check:encounter` with zero exemptions and zero
`RETROFIT_PENDING` entries; the batch report is committed; the 2-of-6 sample verdict is
recorded on THR-1130. **Park, don't kill** (ruling 4) — any encounter failing the critic
loop twice parks with its salvage note for human feedback rather than being redrafted.
