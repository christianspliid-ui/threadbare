# Encounter Pipeline: The Sin-Eater
> Scale: short | Slug: sin-eater | Pass: editorial
> Date: 2026-10-15 | Pipeline version: 3.0 (factory line) | Batch: master-everyday-3, slot 8 (THR-1840)

**Verdict: PASS WITH REVISIONS** — the design is sound and the fork is a true value fork, but the draft packet is under-authored (no purpose lines, no afterimages, two success sentences standing in for ten band overviews, no chip captions), carries one opening seam echo, frames the revelation arm as a crowd-persuasion test instead of a veil test, puts placeholders in chip nouns, and leaves `success_at_cost` uncovered by the positive arm's specials. Every defect is textual and is fixed inline in `sin-eater-revised.md`; no structural change, no binding fact changed.

---

## 1. Prose Quality

**Opening (§10).** Narrator mode, three paragraphs, 73 words. It is the right shape. Two defects:

- **Seam echo (trigger 22).** P2 ends *"Bread and salt lie on his chest."* and P3 opens *"{actor} must eat the bread and salt before the household"*. The same image sits on both sides of the boundary.
- **"A rich wool merchant"** collides with slot 2 (*The Wool Staple*) in the same batch and adds nothing the test uses. Cut "wool".

`[EDITORIAL REWRITE]` (70 words):

> {actor} arrives in {location} at dusk, sent for by the parish.
>
> A rich merchant lies dead in his hall, to be buried at dawn. His eldest, {cast:eldest}, has paid for a sin-eater so his father goes to the grave clean. Bread and salt lie on the dead man's chest.
>
> {actor} must eat it all before the household and take every sin. A sin-eater who leaves a sin behind is not sent for again.

"Sent for" returns in P3 on purpose: it ties the stake to the arrival. It sits two paragraphs apart, so it is a callback and not a seam echo. I did not write "sent for by name" into P1, because that asserts a standing with the parish that no state backs (rule 7). The master cost stays in the design block.

**Step-1 narratives (§12).**

- *Revelation.* *"{cast:wronged}, still keeps a stall in the market"*. The wronged cast can be reused from `weaver` or `smith`, and the rural opening may have no market. Changed to *"still lives here"*. The P3 *"{actor} must make the parish believe the dead man's own words"* states the task, but it gives no cost and it tests persuasion (heart), not veil. See § 5 below.
- *Discretion.* The heir stops the bier with no reason given. Why would someone who "has never known" ask what was on the chest? This is also where the rolled `suspect_or_cause` role should appear. Added: word of a paper under the bread has reached the heir. P3 gave the task (*"see the merchant into the ground clean, and tell the parish no lie"*) but not the cost. Added a stated fact: *"A burial that falters sends the dead down unclean, and the parish blames the sin-eater."*

**Missing authored surfaces (blocking for transcription).** The draft's narrator answer 8 says "the paper is found in every step-0 afterimage", but no afterimage exists. There are no purpose lines. §13 has two success sentences in place of ten band overviews, and §15 has no chip captions. The revised packet authors all of them: three purpose lines, fifteen afterimages, ten overviews, and every chip caption.

**Fragments.**

- Ease The Dead `failure` read *"The rite closed, and the bearers swore the bier grew heavy at the gate."* On the failure band the rite does **not** close (the base says the burial words were fumbled). That is a conflict. Rewritten.
- Stir The Conscience `critical_failure` read *"{actor} read the paper aloud in the hall before the bread was finished."* It reveals the confession to the household on a band where the action then ends, so the revelation goes nowhere. Rewritten to stay on the bread.
- Stir `failure` and the new step-0 failure afterimage both said the household *saw* the leftover bread. That was a repetition, so the fragment was trimmed.
- Positive arm: no special covered `success_at_cost`, though §17 claims "specials alone cover cs/s/sac/nm/f/cf on every step". Added a Steady The Voice `success_at_cost` fragment.

**Effect lines.** Every line opens with a lexicon verb and none repeats a content word from its name. One edit: Ease The Dead *"Settle a restless spirit toward rest"* is redundant ("settle… toward rest"). It now reads *"Settle a restless spirit, so a burial rite closes without a fault."*

**Description.** *"…and someone has to decide whether it goes into the grave with him."* The indefinite hides the actor, and the decision is the sin-eater's. Now *"…and the sin-eater must decide whether it goes into the grave with him."*

**Stakes line.** The top-level `risk: be called a forger before the whole parish` is the positive arm's step-1 risk. Step 0's risk, which every run faces, is the P3 stake. It now reads `risk: leave a sin on the dead, and not be sent for again`.

## 2. Branch Seduction Audit

The branch is agent-decided on `revelation_discretion`. The player never picks a branch, and the god can only lean before the bread is eaten (Seal The Lips / Stir The Conscience). That is lawful, not the authored-futures model.

- **Revelation.** This mortal cannot hold a wrong without naming it. The god watches a sin-eater turn their own rite into testimony, swearing by the rite that the sin lay under the bread, while the household brands them a forger. It protects justice and gives the wronged heir the truth. The cost is the household's enmity and, on failure, the name.
- **Discretion.** This mortal keeps the faith of the trade. The god watches them carry a poisoner's sin for life and answer the heir without lying (*"His sins are mine now."*, added). It protects the rite and the parish's trust in it. The cost is the heir's trust.

Both arms earn their place. Neither is a strawman: the heir's question makes discretion costly, and the forgery charge makes revelation costly.

## 3. Branch Count Assessment

**KEEP 2.** A personality fork on one value axis has exactly two poles.

## 4. Scale Discipline Check

Short scale, one test plus one forked step, two cast. The beat count matches. The draft disagreed with itself on time ("one evening" in §2, "died before dawn" in §3, burial "at dawn" in the opening). The revised file says "one night, dusk to the dawn burial".

## 5. Is the discretion arm's test truly veil? Is the revelation arm's?

- **Discretion: yes.** It closes a burial rite and keeps a secret without lying over a grave. Both are veil's ground (the dead, rites, what is hidden).
- **Revelation: not as drafted.** "Make the parish believe the dead man's own words" in front of a crowd, with `presence`/`social` deal tags, is a heart persuasion test wearing a veil label. That is design-block breach class 26 ("a step whose prose does not test its declared reach"). The fix keeps the beat and moves the test onto the rite. {actor} swears *by the rite* that the paper lay under the bread, and the step asks whether the rite's word holds against the household's forgery charge. The new purpose line is *"Swear by the rite"*. The deal tags are left to Pass 3: the editorial lane does not touch systems, but `['lore', 'social']` would match the reframed test better than `['presence', 'social']`.

## 6. The `suspect_or_cause` reading

The design block reads the rolled role as the household and heir suspecting the sin-eater of forgery or of selling silence, never as history. That reading is honest, but the draft carried it only in the revelation arm (the household's forgery charge). The revised discretion arm carries it too: the heir has heard of the paper and stops the bier, and on `success_at_cost` and `failure` believes the sin-eater was paid for silence. No history is asserted on either arm.

## 7. Inspiration Anchor Honesty

They are honest. The folk custom gives the rite and the cost to the eater. `hook.sacred_crime` gives the confession under the bread. The drop of `relic_awakening` is recorded with its reason.

## 8. Aftermath Payoff

The consequences are actor-centred. The drive and the place condition both land on the success side of each arm, so the mortal leaves with what the sin did to them (an ambition, or a compulsion to work for others) and the parish keeps a mark of how the burial went. Chip nouns are fixed in the revised file:

- `BOND · {cast:wronged}'s trust` shipped a placeholder in `stateNoun`, which renders as literal braces (spec § Consequences 0c.1). It is now `a bond` on gain and `a bond soured` on loss. The person is named in `detail`.
- `AMBITION · Uncover Ancient Secrets` was given a scene title instead of the sheet word. It is now `PATH · ambition`.
- `PATH · compulsion (driven to help others)` is now `PATH · compulsion`.
- Reputation keeps `reputation with {location}`, the corpus form (110 uses) for a location anchor.

**Law 56 / route caveat, for Pass 3.** A step-0 `critical_failure` ends the action before the branch runs, so the aftermath lands on the **fallback (negative)** variant. The draft's limit of critical failure to a reputation chip on both arms is correct for that reason, and the negative `critical_failure` overview is now written to read true on both routes (the bread never finished, or the burial words lost). **If a step-0 pole can be recorded as `positive` even on a step-0 critical failure**, the positive `critical_failure` overview ("tore the paper… called them a forger") would be false on that route. Pass 3 must confirm the routing or fall the positive critical-failure overview back to route-neutral text.

## 9. Page read (THR-1474)

Each band is assembled as overview, then chips in scar · bond · boon · path order. There are no reactions (short scale).

**Revelation, critical_success**
> {cast:wronged} learned how the partner died, with the whole parish listening at the lych-gate.
> - BOND · a bond — {cast:wronged} trusts {actor} now.
> - BOON · reputation with {location} — The parish takes {actor}'s word over a rich house's.
> - PATH · ambition — {actor} wants to know what else the rich have buried.

Clean. Each block adds one fact: the truth told, the heir's trust, the parish's standing, the new want.

**Revelation, success**
> {cast:wronged} knows now how the partner died, and the household buried the merchant with half the town watching.
> - (same three chips)

Clean. The overview tells the burial and the chips tell the state.

**Revelation, success_at_cost**
> {cast:wronged} knows now how the partner died. The household names {actor} a forger to anyone who will listen.
> - (same three chips)

There is no conflict. The parish believed the paper (the reputation gain holds), and the household is the cost. The draft gave no overview here, so I checked whether "names a forger" contradicts the reputation gain. It does not: the boon chip names the parish and the overview names the household.

**Revelation, failure**
> The household called {actor} a forger to the priest's face, and the priest took their side.
> - SCAR · Under Watch — The household set the watch on {location}; quiet work there is harder now.
> - SCAR · reputation with {location} — The parish trusts {actor}'s word on the dead less.

Clean. A draft version of this overview also said the household "has the watch out", which repeated the Under Watch chip. It was cut before it shipped.

**Revelation, critical_failure**
> The household called {actor} a forger before the whole parish, and the parish believed them.
> - SCAR · reputation with {location} — The parish trusts {actor}'s word on the dead far less.

This is borderline. "The parish believed them" and "trusts… less" are the cause and the change, and they are not told twice. They are accepted. See the route caveat in § 8.

**Discretion, critical_success**
> {cast:wronged} let the bier pass, and the parish praised the rite.
> - BOON · A Tended Shrine — Rites for the dead in {location} go more easily now.
> - BOON · reputation with {location} — The parish trusts {actor} with its dead.
> - PATH · compulsion — Driven to set the sin right, {actor} works for others for a time.

The praise and the reputation boon sit close together. The overview reports the parish's act and the chip reports the standing change, so this is not a repetition. Clean.

**Discretion, success**
> {actor} kept the paper, and carries the merchant's sin now, as the rite says.
> - (same three chips)

Draft risk: the draft's success sentence *"{actor} carries the sin now"* sat beside a compulsion caption drafted as *"…while the sin sits on them"*. That was a paraphrase repetition, so the caption was rewritten to the drive itself ("set the sin right… works for others").

**Discretion, success_at_cost**
> {cast:wronged} left the gate sure that {actor} was paid for silence.
> - (same three chips)

Clean. The heir's belief is prose only, and no bond write fires on this band, which matches the design block.

**Discretion, failure**
> The parish says the merchant went down unclean.
> - SCAR · a bond soured — Sure {actor} was paid for silence, {cast:wronged} no longer trusts them.
> - SCAR · reputation with {location} — The parish trusts {actor} with its dead less.

Clean. A fuller draft overview ("…and that the fault was the sin-eater's") would have told the reputation chip's fact twice, so it was cut.

**Discretion, critical_failure** (also the step-0 critical-failure route)
> The merchant went into the ground with his sins still on him.
> - SCAR · reputation with {location} — Blamed for an unclean burial, {actor} is trusted with the parish's dead far less.

Clean, and true on both routes.

**Verbosity.** None remain after the rewrites. No `[page]` overlaps of four words exist between any overview and its chips. This was checked by hand, and `check:encounter` will confirm it.

## 10. Dilemma Energy

There is real tension. Both poles are defensible: justice for a poisoned man's heir against the faith of a rite a whole parish leans on. The god's posture shows in which pole it leans before the bread, and the god cannot take the decision away from the mortal. The god's helplessness after the lean is the point of the shape.

## 11. Experience Differentiator Gate

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode skeleton, ≤80 words | **YES** (revised) | 70 words: arrival · dead merchant, paid rite, bread and salt · eat it all, or not be sent for again |
| 2 | Every sentence does challenge/test/outcome work | **YES** | No interior sensation. "kept their eyes on the bread" (Seal fragment) is a reported act, not camera work |
| 3 | Scene prose names what the hand acts on | **YES** | the mortal's conscience/silence (step 0), the listening parish and the reading (positive), the dead man's burial and the questioning heir (negative) |
| 4 | Player can retell situation and stakes after one read | **YES** (revised) | Both arms now state their cost (forger / unclean burial blamed on the sin-eater) |
| 4b | No seam echoes | **YES** (revised) | Draft: "Bread and salt" across P2→P3 (fixed). Afterimages were written to avoid the opening's "take every sin", "eat it all", "dead man's chest" and "leaves… behind" |
| 5 | Spell-style card faces, no scene-bespoke prose | **YES** | Seal The Lips, Stir The Conscience, Wake Old Grief, Steady The Voice, Ease The Dead, Soften Hard Words: all generic to any rite, crowd, burial or questioner |
| 6 | Effect lines state mechanism; prices real | **YES** | Pole leans stated as leans; scene effects stated as "so…" results; essence 1–2 on every card |
| 7 | Every card pays off in failure | **YES** | Each special has ≥1 of `failure`/`critical_failure`; none is big-delta |
| 8 | Every card's target established before the hand | **YES** | The listeners (parish at the lych-gate), the dead, the heir, all named in the step narrative |
| 9 | Cards answer different questions | **YES** | silence vs conscience; the crowd's memory vs the reader's voice; the burial vs the questioner |
| 9b | Composed 4–8 hand per nudge-bearing step; no player-picked branch | **YES** | 2 specials + `deal` 3 on each of three steps; branch agent-decided |
| 10 | Reflective aftermath landing | **YES** (revised) | Ten overviews authored |
| 11 | Chips actor-centred, `stateNoun` a sheet word | **YES** (revised) | `a bond` / `a bond soured` / `ambition` / `compulsion` / `A Tended Shrine` / `Under Watch` / `reputation with {location}` |
| 11b | Every band's assembled page clean | **YES** (revised) | § 9 above |
| 12 | Medium+ reaction choices | **N/A** | Short scale. A reaction would re-decide what the mortal decided |
| 13 | Reactions as stances | **N/A** | — |
| 14 | Concept art evocative, two-question method | **YES** | A burden and a truth that weighs like bread → an empty plate, crumbs, salt, a folded paper, a burnt-down candle, no people. It shows residue, not the act |

No NO answers remain in the revised packet.

## 12. Revision Summary

**Must fix (applied):**

1. Opening P2→P3 seam echo ("bread and salt"). "wool" cut.
2. Revelation step reframed onto the rite (veil): swear by the rite that the paper lay under the bread. Stake stated.
3. Discretion step: a reason the heir stops the bier (`suspect_or_cause`). Stake stated.
4. Authored purpose lines, all 15 afterimages, 10 overviews, and every chip caption.
5. Chip nouns: no placeholders. Sheet words only.
6. Ease The Dead `failure` fragment contradicted its band. Stir `critical_failure` revealed the confession on a dead-end band.
7. Positive arm `success_at_cost` coverage (Steady The Voice fragment added).

**Should fix (applied):**

8. `stall in the market` → `lives here` (cast reuse and rural setting).
9. Description "someone" → "the sin-eater". Stakes `risk` matched to the step-0 stake.
10. Time consistency (one night, dusk to dawn).
11. Self-audit row on special coverage corrected.

**Consider (left to Pass 3, systems lane):**

- Positive deal tags `['presence','social']` → `['lore','social']` to fit the reframed veil test.
- Confirm a step-0 critical failure lands on the fallback (negative) aftermath variant (§ 8 caveat).
- `Seal The Lips` is a darkness Undertow and `Stir The Conscience` a spirit pole-lean. The brief caps `card.undertow.signature.darkness` and `card.kindled_ambition.signature.spirit` at once per batch. These are authored specials, not those library ids, but confirm with slot 5 and slot 4. Also confirm the "Kindled Ambition" typing of a pole-lean card (it behaves as an Undertow).
- Verify the trait refs `trait.personality.veil.virtue` / `trait.core.core_integrity.vice` against `validateTraitRefs()`.
- Confirm Under Watch fires on the positive arm's `failure` band only, not on `critical_failure` (the ladder and Law 56 chips assume this).
