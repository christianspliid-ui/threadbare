# Border-perils — the fixed batch design (THR-1221)

> **lint_plan_doc:** exempt — batch design artifact for the Encounter Factory line, not a
> three-pillar plan doc. Its companion brief and the six draft packets in this directory
> are the same class.

**Companion to** `Docs/plans/encounters/border-perils-brief.md` (approved by Christian, chat, 2026-08-24).
**Written** 2026-08-24, before any prose existed, per the authoring-order ruling
(`nudge-authoring-spec.md` § Authoring order — *"clearly written first, and then you are
trying to mash it into a game"* is the rejected shape).

This file is the **constraint set**. The six drafts are written *inside* it. A draft agent
fills the spread; it does not renegotiate it.

---

## Reading of one brief line

The brief's variance table asks for "≥1 `quintessence`-reach step (zero users today)".
**There is no `quintessence` reach** — `ReachDomain` is the eight (`iron gold shadow veil
heart eye stone star`); the ninth was absorbed into Quintessence at TB-075 and Quintessence
is a *resource*, not a reach. The brief's own systems-quota section names
`quintessence_shift` in the same breath, so the line is read as: **≥1 step whose
consequence writes a `quintessence_shift`**. Assigned to encounter 5.

---

## The six — fixed design

| # | templateId | Title | Lead reach | Steps | Shape |
|---|---|---|---|---|---|
| 1 | `encounter.border.toll_of_blades` | The Toll of Blades | `iron` | 2 (iron → stone) | Danger–Confrontation–Aftermath |
| 2 | `encounter.border.the_sign_over_the_ruin` | The Sign Over the Ruin | `veil` | 2 (veil → eye) | Puzzle–Investigation–Resolution |
| 3 | `encounter.border.the_unclaimed_relic` | The Unclaimed Relic | `stone` | 1 (stone) | Single Test |
| 4 | `encounter.border.standing_the_line` | Standing the Line | `heart` | 3 (heart → gold → iron) | Personality Fork **+ Seeded Sequel parent** |
| 5 | `encounter.border.one_body_short` | One Body Short | `eye` | 1 (eye) | Single Test **— sequel payoff of 4** |
| 6 | `encounter.border.the_garrisons_price` | The Garrison's Price | `gold` | 2 (gold → shadow) | Opt-in Complication |

**Reach budget** (brief: all six leads distinct; `iron` and `veil` present; no reach more
than twice across all 11 steps): `iron` 2 · `stone` 2 · `eye` 2 · `gold` 2 · `veil` 1 ·
`heart` 1 · `shadow` 1 · `star` 0. ✓

**Step counts** (brief: two 1-step, three 2-step, one 3-step): #3 and #5 are 1-step;
#1, #2, #6 are 2-step; #4 is 3-step. ✓

**Decision shapes** (brief: ≥4 of 5): single test (#3, #5), consequence chain (#2),
fork (#4), opt-in (#6), sequel (#4→#5). **5 of 5.** ✓

**Fate-branching** (brief: ≥1 fork resolved by `poleLean`/`branchOnStep`, its content
debut): **#4**, on the axis named in its row below. The played hand's net lean picks the
pole; fate rolls how cleanly the chosen course goes.

**Sequel pair** (brief: seed + payoff both in-batch): **#4 seeds #5.** #4's consequence
draw returned `story_seed` on its own, so the pair is the draw's ask, not a bolt-on.
`encounter_seed` carries `templateId: 'encounter.border.one_body_short'` with
`inheritContext` so the cast crosses. #5 reads state #4 minted — prose rule 7 satisfied by
construction, which is the sanctioned home for earned history.

**Tone** (brief: at most two resolve grim; the combat encounter is not automatically the
grim one): grim = **#2** and **#5**. #1 is the combat encounter and resolves hard but not
grim.

---

## Setting envelope

Every encounter declares all four classes — `wayside`, `ruin`, `battlefield`, `stronghold`
— with **one opening each** and a setting-neutral spine. `urban`, `rural`, `sacred`,
`arcane` are excluded batch-wide.

Consequence: no encounter here inherits a THR-1044 family default (that needs a
single-class envelope), so **every template declares its own `supportBundle`**, and every
`reuseNpcRoles` / `supportRole` / `spawnName` must read correctly at all four classes.
Check the roles against `LOCATION_ROLE_ROSTERS` before declaring — a role seeded only at
strongholds is placeless on a wayside.

---

## The consequence draws (Step 0b — rolled before any premise)

Rolled on the final template ids. `check:encounter` recomputes each hand from the id, so
these are binding, not advisory. One recorded `consequenceSwap` per encounter is the only
valve.

| # | templateId | rarity | Drawn hand | Effect kinds that satisfy it |
|---|---|---|---|---|
| 1 | `toll_of_blades` | 2 | `secret`, `membership` | `hidden_mark`/`secret_discovery`/`favor_creation` · `membership_change` |
| 2 | `the_sign_over_the_ruin` | 3 | `condition`, `knowledge`, `movement` | `condition_attachment`/`apply_condition`/`remove_condition`/`attachment_grant` · `intelligence`/`spawn_clue` · `agent_relocation` |
| 3 | `the_unclaimed_relic` | 1 | `relationship`, `possession` | `bond_change` · `spawn_artifact`/`attachment_grant`/`reward_draw` |
| 4 | `standing_the_line` | 3 | `relationship`, `secret`, `story_seed` | `bond_change` · `hidden_mark`/`secret_discovery`/`favor_creation` · `encounter_seed` |
| 5 | `one_body_short` | 2 | `secret`, `thread` | `hidden_mark`/`secret_discovery`/`favor_creation` · `thread_strengthen`/`thread_weaken`/`thread_break`/`thread_branch` |
| 6 | `the_garrisons_price` | 2 | `relationship`, `thread` | `bond_change` · `thread_*` |

Family spread across the batch: `secret` ×4 · `relationship` ×3 · `thread` ×2 ·
`membership` · `condition` · `knowledge` · `movement` · `story_seed` · `possession`.
Nine distinct families, no single-family pile-up.

---

## The plot-hook draws (Step 0a)

Rolled per encounter; take recorded. The hook is a **starting point, not a contract** —
drift is expected, an unrecorded roll is not. `usedBy` gets stamped in
`src/data/content-eval/plotHooks.ts` at closeout.

| # | `plotHookRolled` | `plotHookTaken` | Themes of the take |
|---|---|---|---|
| 1 | `stronghold_mobilization`, `monster_eradication`, `natural_disaster` | **`stronghold_mobilization`** | conflict, power |
| 2 | `trade_war`, `celestial_sign`, `haunt_resolution` | **`celestial_sign`** | faith, discovery |
| 3 | `haunted_relic`, `masterwork_completion`, `long_road` | **`haunted_relic`** | discovery, faith |
| 4 | `impossible_choice`, `standing_the_line`, `market_collapse` | **`standing_the_line`** | protection, conflict |
| 5 | `puzzle_gauntlet`, `death_and_return`, `crowd_and_purse` | **`death_and_return`** | transformation, faith |
| 6 | `impossible_bargain`, `prophetic_investigation`, `scarcity_crisis` | **`impossible_bargain`** | bargain, scarcity |

Theme spread checked before drafting: conflict/power · faith/discovery · discovery/faith ·
protection/conflict · transformation/faith · bargain/scarcity. Two takes share
faith/discovery; none of the six shares a theme pair with more than one other. No re-roll.

---

## Per-encounter design rows

Each row is the binding design. The story is written to it.

### 1 · The Toll of Blades — `encounter.border.toll_of_blades`

- **Crux:** A war column has stopped across the agent's road and is taking what it needs from whoever passes.
- **Catalogs:** shape `Danger–Confrontation–Aftermath` · pressure `war` (undertone `fear`) · form `siege` · objective `endure` · stakes `standing` · system `movement + traits + conditions`
- **Steps:** 1 `iron` (the line does not move) → 2 `stone` (carryover; outlast what the first step cost)
- **Hand budget:** `heavy_hand`, **`stumble`**, `insurance`, `boost` (≤2), `fellowship`, `gambit`
- **Draw wiring:** `membership_change` (the column's banner takes the agent onto or off its rolls) · `favor_creation` (the secret family, wired as an owed favor from a serjeant who saw it)
- **Brief targets carried:** faction standing #1 of 2 · **cost channels + grants** #1 of 2 (THR-885) · capability `growth` on the critical-success band
- **Tone:** hard, not grim.

### 2 · The Sign Over the Ruin — `encounter.border.the_sign_over_the_ruin`

- **Crux:** Something impossible happened over this ruin in front of witnesses, and the readings are already hardening into sides.
- **Catalogs:** shape `Puzzle–Investigation–Resolution` · pressure `faith` (undertone `rumour`) · form `omen` · objective `reveal` · stakes `intel` · system `traits + conditions + movement`
- **Steps:** 1 `veil` (read what is actually over the ruin) → 2 `eye` (carryover; say it to people who have already decided)
- **Hand budget:** `whisper`, `omen`, **`veil`**, `boost` (≤2), `trait_card`, `mercy`
- **Draw wiring:** `spawn_clue` (knowledge) · `condition_attachment` (what reading it costs) · `agent_relocation` (movement — the crowd carries or drives the agent off the hex)
- **Brief targets carried:** **location/sublocation anchor** #1 of 2 — a chip anchors the ruin itself, not a person
- **Tone:** grim (1 of 2).

### 3 · The Unclaimed Relic — `encounter.border.the_unclaimed_relic`

- **Crux:** What the agent came for is here, and so is whatever has stopped everyone else carrying it out.
- **Catalogs:** shape `Single Test` · pressure `greed` (undertone `fear`) · form `discovery` · objective `recover` · stakes `item` · system `items/attachments + traits`
- **Steps:** 1 `stone` (endure the thing that keeps it)
- **Hand budget:** **`cache`**, `insurance`, `boost` (≤2), `undertow`, `balm`
- **Draw wiring:** `spawn_artifact` (possession — the relic is a real object with a real id) · `bond_change` (relationship — with whoever else is still in the ruin)
- **Brief targets carried:** **artifact spawn** (the brief's ≥1) · **location/sublocation anchor** #2 of 2
- **Tone:** not grim.

### 4 · Standing the Line — `encounter.border.standing_the_line`

- **Crux:** Someone who cannot fight is behind the agent, and the thing coming up the road does not have to stop.
- **Catalogs:** shape `Personality Fork` + `Seeded Sequel` (parent) · pressure `duty` (undertone `fear`) · form `rescue` · objective `protect` · stakes `relationship` · system `forks + carryover + traits`
- **Steps:** 1 `heart` (the fork's deciding step) → 2 `gold` / `iron` per pole → 3 the pole's resolution
- **Fate-branching:** `branchOnStep: 0`. Value axis **`mercy_ruthlessness`** — poles as concrete courses: *hold the road and let them past behind you* vs *break the pursuit before it arrives*. The mortal decides on their own axiological profile plus the net `poleLean` of the committed cards; fate rolls how cleanly. **This is `poleLean`'s content debut** — at least three cards in step 1's hand carry one, in both directions.
- **Hand budget:** `fellowship`, **`compulsion`**, `kindled_ambition`, `undertow`, `boost` (≤2), `mercy`, **`signature`**
- **Draw wiring:** `bond_change` (relationship — with the one who could not fight) · `hidden_mark` or `favor_creation` (secret) · **`encounter_seed` → `encounter.border.one_body_short`** with `inheritContext`
- **Brief targets carried:** **reified bond** (the brief's ≥1) · sequel parent
- **Tone:** not grim.

### 5 · One Body Short — `encounter.border.one_body_short`

- **Crux:** The agent is counting what the fight left on the ground, and the count is one short.
- **Catalogs:** shape `Single Test` (sequel payoff) · pressure `grief` (undertone `secret`) · form `death` · objective `solve` · stakes `seed` · system `traits + conditions`
- **Steps:** 1 `eye` (read the ground truly)
- **Hand budget:** `whisper`, `omen`, **`long_game`**, `boost` (≤2), `trait_card`
- **Draw wiring:** `secret_discovery` (secret) · `thread_weaken` or `thread_branch` (thread)
- **Brief targets carried:** **`quintessence_shift`** — the batch's one, and the reading of the brief's "quintessence-reach step" line. The body that is not there costs something that is not blood.
- **Sequel contract:** fires from #4's seed with `inheritContext`, so the cast crosses. Prose may read the history #4 minted, and **only** that history.
- **Tone:** grim (2 of 2).

### 6 · The Garrison's Price — `encounter.border.the_garrisons_price`

- **Crux:** The fort will open the road for the agent, and every price it names costs something the agent cannot get back.
- **Catalogs:** shape `Opt-in Complication` · pressure `debt` (undertone `duty`) · form `bargain` · objective `negotiate` · stakes `passage` · system `movement + traits`
- **Steps:** 1 `gold` (the terms) → 2 `shadow` (carryover; what the terms actually cost to keep)
- **Opt-in gate:** declining is cheap and legible — the long way round, a movement delay, no penalty beyond it. The engage/decline gate is agent-decided.
- **Hand budget:** `bargain`, **`favor`**, **`side_bet`**, `boost` (≤2), `gambit`, `heavy_hand`
- **Draw wiring:** `bond_change` (relationship — with the officer who set the price) · `thread_strengthen` or `thread_branch` (thread)
- **Brief targets carried:** faction standing #2 of 2 · **cost channels + grants** #2 of 2 (THR-885)
- **Tone:** not grim.

---

## Card-type allocation (the anti-convergence budget)

The brief's over-exposed-card table binds: `boost` **≤2 per hand**, **≥3 distinct types per
hand**, the batch uses **≥3 of the eight zero-use types**, **≥8 of 21 types across the
batch**, and **every card matching a library member sets `libraryCardId`**.

Allocated above, the batch reaches **all 21 types** and **all eight** zero-use types —
`stumble` (#1), `veil` (#2), `cache` (#3), `compulsion` + `signature` (#4), `long_game`
(#5), `favor` + `side_bet` (#6).

`libraryCardId` id scheme (`src/data/nudge-card-library.ts`): `card.<typeId>.core` ·
`card.<typeId>.signature.<sphere>` · `card.<typeId>.hunger.<hungerId>` · declared
variations. A card genuinely outside the library stays a one-off — a choice, recorded in a
comment, never the default.

**Why a pre-allocated budget rather than sequential drafting.** The pipeline drafts a batch
in sequence so encounter *n*'s critic can see what the batch already spent, which is how it
avoids authoring the same hand six times. This batch fixes the spend *up front* instead —
distinct reaches, distinct consequence hands, and the per-encounter card-type budget above
— so the anti-convergence purpose is served by the constraint set and the drafts can run
concurrently. Recorded here because it is a deviation from the skill's written order, and
the critics still check convergence per encounter.

---

## Systems quota

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`), counted from the authored manifest —
`cast` / `rewards` / `seeds` / `conditions` / `reputation` / `factions`. Prose counts for
nothing.

The brief's **avoid** list is binding: do not default to the uniform `trait` +
`reputation_tally` + `condition_attachment` + `encounter_seed` + `hidden_mark` stack that
company-drama applies identically to all four of its templates. `hidden_mark` only where the
fiction earns it.

## Anchors

Brief targets, allocated: `faction` ≥2 → **#1, #6**. `relationship` (reified bond) ≥1 →
**#4** (also #3, #6 by draw). `location`/`sublocation` ≥2 → **#2, #3**. `artifact` ≥1 →
**#3**.

**Avoid defaulting to `individual` agents as the only anchor kind** — the corpus's habit.
Every chip's referent must be a member of
`.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md`, and the prose must
name that particular object (Law 56: a chip with no state write behind it is rejected).

## Out of scope (from the brief, unchanged)

War/army mechanics · nudge pricing and essence balance (placeholder prices) · the
15-encounter retrofit (batch 2) · urban/civic/devotional content · any change to card
library membership.

---

## Findings from the drafting pass, and what the batch did about them

Three things the drafters found that the brief could not have known. All were verified in
source by the orchestrator before anything was decided on them; two drafters found the
first one independently.

### 1. The `thread` family is unwireable from an encounter aftermath — both holders swapped off it

`thread_strengthen` / `thread_weaken` / `thread_break` / `thread_branch` take literal
`ascendantId` and `mortalId`. Neither field is in `SCENE_SENTINEL_FIELDS`
(`src/engine/encounterAftermath.ts`), so `$actor` / `$target` / `$cast:` cannot bind — and
the ascendant node id is minted per run, so there is no literal an author could ever write.
The effect no-ops with `thread_mutation_skipped`. Corpus check: **zero** shipped templates
use any `thread_*` effect; the only example (`example.thread_bond_tested.ts`) is
`@ts-ignore`'d, registered nowhere, and writes `'self'`/`'actor'`, which resolve to nothing.

`check:encounter` passes the family regardless, because it checks *kind presence*, not
resolvability — so an encounter can obey its draw, satisfy the gate, and write nothing. That
is the Law 56 pathology exactly, one layer further down than the chip rule reaches.

Both holders take the spec's **one recorded swap** (§ The Consequence Draw). Swap-ins
verified against `CONSEQUENCE_FAMILY_WEIGHTS` for the ≥2-in-reach bar:

| # | Encounter | Reach | Swap | Weight | Why this family |
|---|---|---|---|---|---|
| 5 | `one_body_short` | `eye` | `thread` → **`omen`** | 4 | `emit_omen`; a death-and-return premise wants "what the sky says is coming", not a tie to the divine |
| 6 | `the_garrisons_price` | `gold` | `thread` → **`drive`** | 4 | `plant_compulsion` / `assign_ambition`; an honest ruinous price becoming something they cannot stop working at. Adds a 10th family to the batch |

Neither had spent its swap. The engine gap is **filed, not fixed here** — this is a Content
ticket whose own Done-when expects no engine files touched, and registering a `mortalId`
sentinel plus an `$ascendant` binding carries design questions (what `$ascendant` means, what
`thread_break` owes a player) that belong to a design pass.

Note for whoever takes that ticket: `emit_omen` is deliberately **excluded** from
`CHIP_BACKING_EFFECT_KINDS` — the module classifies it as scene dressing and says so — so #5's
omen is wired and unchipped by design, not by oversight.

### 2. Two persistent kinds could not back a Law 56 chip — fixed in this PR

`membership_change` and `agent_relocation` sat in `CAST_TARGET_PERSISTENT_KINDS` (whose
comment calls them "a durable fact written onto a specific someone") and were absent from
`CHIP_BACKING_EFFECT_KINDS`. Each is the **sole** satisfier of a consequence family —
`membership` and `movement` respectively — and the draw is binding, so an encounter that drew
one, wired it correctly, and chipped the result had the chip rejected as unbacked. Its only
remedies were to fold a real consequence into prose or disobey a gate-audited draw.

Fixed in commit `659962a9` with three tests. The third pins the two sets against each other
rather than asserting one kind's membership — written for `membership_change` alone, it went
red naming `agent_relocation`, which is how the second instance was found rather than guessed
at. Encounters 1 and 2 hold those two families.

### 3. Three card types have no library member at all — the brief's debut list overlaps them

Measured across `NUDGE_CARD_LIBRARY`: **37 members spanning 18 of the 21 types**.
`side_bet`, `signature` and `fellowship` have **zero**. The naming is a trap worth recording:
`card.<type>.signature.<sphere>` denotes a *signature member of another family*, not a member
of the Signature type.

This puts two of the brief's own instructions in tension for exactly these types. The brief
asks the batch to debut eight zero-use types — `side_bet` and `signature` among them — **and**
asks that every card matching a library member set `libraryCardId` "so the tally, twilight
harvest, and echo card finally receive data". A card of a memberless type cannot do both: it
is necessarily a one-off, and therefore invisible to `cardPlayTally` and the echo-card system,
which is the very gap the `libraryCardId` instruction exists to close.

The batch ships those cards as **recorded one-offs with reasons**, which the brief explicitly
permits ("a choice, not the default"). Library membership is out of scope for this batch by
the brief's own § Out of scope, so this is **surfaced to the director in the batch report**
rather than fixed. It is a finding about the library, not about the encounters.

### 4. `check:encounter` cannot see a fork's hands

`nudgeBearingSteps` / `plainSteps` filter out `ActionStepBranch`, so for encounter 4 the
machine gate audits **step 0's hand only** and counts one plain step. Four of its five hands
are inside branches and no automated gate will ever look at them. Those four were audited by
hand against the full checklist in the editorial pass, which is recorded there as the
substitute. Filed alongside finding 1.
