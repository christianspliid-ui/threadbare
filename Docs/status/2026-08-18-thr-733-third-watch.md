### THR-733 — company drama, subject 3 of 4: The Third Watch (the romance)

**The cadence is now evidence, not a plan.** Three passes have each shipped one subject
composition-complete, and the corpus has moved `191 · clean 6` → `192 · clean 7` →
`193 · clean 8` → **`checked 194 · clean 9 · failing 0 · on ratchet 185`**. The scoping fact
underneath still holds and needs no re-deriving: a new `encounter.*` id cannot join
`RETROFIT_PENDING` (the ratchet only ever shrinks), so each subject owes the **full
Composition Contract** on the day it lands. One subject per pass is what that costs. The
ticket stays In Dev with the slow-burn betrayal remaining.

**Subject shipped — The Third Watch.** Two of the company have become something to each
other, everybody can see it, nobody has said it, and the watch list has come out the same way
eleven nights running. One **Heart** step ("Settle what they are"), a five-card hand spanning
spirit/life/time/darkness plus one common option, five authored outcome bands.
`check:encounter` verdict: **clean, systems `cast, rewards, seeds, conditions, reputation`** —
five against a quota of three. The corpus's **ninth** composition-complete template.

**The design problem this subject actually posed, and the answer.** Both prior checkpoints
flagged it in advance: romance "has to earn a company frame rather than being a two-person
moment with an audience". The ticket's own framing — "Heart encounters between members during
downtime" — would permit a two-hander, and a two-hander would be the wrong template in this
file, because `actorAffinities: ['group']` would then be decoration rather than a claim. So
the subject is **not** whether the pair love each other. That is settled offscreen and is
nobody's business. The subject is **what the pair is to the company**: who covers whom, who
can be sent out alone, and who will not make the cold call when the company needs it made.
The watch list is the company's own machinery producing the evidence, which is what keeps the
frame honest — and it is why a company of one cannot draw this, having no rotation and nobody
to be told.

**Heart, and the axis is the fork.** Gold went to the dispute (who the company will *follow*).
Here the axis is Sworn ↔ Renegade: the same bond either sworn into the company and
reorganised around, or kept private and running underneath everything the company does. The
`darkness` card is where that shows mechanically — "Keep It Between Them" narrows the audience
rather than the truth, and a deliberate settlement among the people it concerns is still a
settlement, which is why it is a legitimate boost to a step that asks what the pair *is* and
not how loudly it is announced.

**Settings disjoint from both prior subjects, and the assertion falsified before it was
trusted.** `urban + sacred`, against the gate's `ruin + stronghold` and the dispute's
`wayside + rural`. Subject 2 made disjointness an enforced property rather than a preference;
this pass widened that test to assert **in both directions at all three places** — each place
draws exactly its own subject and neither of the other two — so a template that silently
widens its envelope fails by name. Falsified by giving The Third Watch a `ruin` setting **with
an opening supplied**, which turned exactly that test red with the intended message
(`encounter.company.third_watch must not be drawn at the ruin`) before reverting to green. The
opening was supplied deliberately: subject 2 recorded that omitting it trips the
opening-per-class guard instead, which is a genuine red proving a different rule.

**Two real defects the gates caught, neither cosmetic.**

1. **A card with no failure-band payoff.** "Steady the Hands" paid off on `success` and
   `success_at_cost` — and `success_at_cost` is not a failure band. The god's hand must be
   traceable in failure at any size, because a card that vanishes on a loss makes failure read
   as punishment, which inverts the design. Rewritten so the card answers the loss on its own
   terms: the hands stayed steady all evening, and steady hands were not the difficulty.
2. **A purpose line over the ceiling.** "Settle what they are to the company" is seven words
   against `REACH_PURPOSE_MAX_WORDS` 4. Cut to **"Settle what they are"** — which is also the
   better line, because "settle" is what the `darkness` card argues for and "to the company"
   was doing work the prose already does.

**One comment corrected against the gate rather than left to drift.** The block comment
claimed six connected systems, counting the `bond_change` on the good bands. `check:encounter`
scores five and does not count it. The `bond_change` is a real, inspectable write and stays —
it is what "the one who heard them say it will vouch for this company" actually means — but
the comment now says five and records explicitly that the sixth is deliberately not claimed. A
comment that counts higher than the gate is drift nobody re-measures.

**Law 56 across four bands, and the anchor rule from subject 2 applied rather than
rediscovered.** The `critical_success` chip is a BOND backed by two real writes (a
`condition_attachment` and the `bond_change`) and anchors its concept to the cast member the
edge is written to. The `success_at_cost` chip claims `exhausted` — a state actually attached
— because the condition vocabulary has no word for a job quietly moved off you, and that fact
stays in the `overview` where scene facts belong. The `failure` chip is a PATH backed by the
planted seed, anchored to `$actor` rather than to the seed, since a seed has no node to open
until it fires. The `critical_failure` chip reports the `hidden_mark` on the cast witness and
**not** the `reputation_tally` the same reaction writes, because a tally renders only in the
designer's `TalliesDebugTab` and a chip reporting it claims a quantity the player cannot
inspect.

**Evidence.** 1033 files / **16,807 tests green** (exit 0, redirected — never piped through
`tail`); the company-drama suite went 17 → **25 tests**. Typecheck ratchet **OK — 3160,
unchanged from baseline**, so no refresh and no end-of-run re-run owed. `npx vite build` ✓
11.02s. `check:encounter --all` → `checked 194 · clean 9 · failing 0`. 30-tick CLI smoke:
tick 30, 384 agents, 46 events, exit 0. No browser evidence owed and **no exemption claimed**:
`src/data/**` and `Docs/**` only, so the UI-pillar trigger does not fire.

**What remains.** One subject: **the slow-burn betrayal**. Both prior checkpoints flagged it
as the likeliest to want a threshold-fired pool rather than a drawn template, and that reading
has firmed up — the dispute took the "drawn scene about company cohesion" slot and
betrayal-as-process fits a cohesion threshold better than a single fork. If it only works that
way, the coordination block's standing instruction applies: **split it into its own Deferral**
rather than growing an engine change into this content sweep. Settings still unused by this
file: `arcane`, `battlefield`, `stronghold` and `rural` as sole declarations.
