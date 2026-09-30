# Encounter Pipeline: The Comet Disputation
> Scale: short | Slug: comet-disputation | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-1, slot 4 (THR-1678)

**Verdict: PASS WITH REVISIONS** (every edit applied in `comet-disputation-revised.md`).

The design is sound and it is the pleasure the brief asked for: a courteous rival, a whole town turned out, and a fork that belongs to the mortal. The god only leans it through the two step-0 specials. The hand, band coverage and consequence wiring are all correct. The prose had three real defects:

1. **Step 1 was false when step 0 failed.** Both fork narratives said the champion's chart shows the course "as {actor}'s does". Step 0 is `continue_weakened`, so a mortal whose chart "has a gap in it" still reaches step 1 and reads that their own chart is sound.
2. **The pages repeated and contradicted themselves** (trigger 35). The failure overview paraphrased the reputation chip under it. Every chip's cause clause retold the overview. The Seeker critical overview mocked "the college's chart", which is the chart that won the argument for the agent.
3. **Seam echoes on every boundary** (trigger 22): "charts its course" → "charted the comet's course", "at dawn" ×4 running into "At dawn the council sits…", "after an hour" → "after a long hour", and "thanked the college" → "thanked the college".

All three are local prose fixes and none is structural, so this is PASS WITH REVISIONS, following the `well-sinking` precedent (triggers fired and were fixed in the same pass).

---

## 1. Prose Quality

**Opening.** It follows the skeleton and is plain. Four problems:
- "must dispute the comet" needs two readings, because you dispute a claim, not a comet. [EDITORIAL REWRITE] "must argue the comet's meaning".
- "Tonight {actor} charts its course." follows "the college's first reader", so *its* first reads as the college. [EDITORIAL REWRITE] "Tonight, through haze, {actor} charts the comet's course." This also establishes the haze, which **Part The Clouds** acts on. Before the rewrite the card's target was never in the prose before the hand (Q8).
- P3 was 20 words. [EDITORIAL REWRITE] "The council will follow the winner, and the loser's name as a star-reader will suffer."
- The total is now 79 words (11 + 53 + 15).

**Step 0 afterimages.**
- The success afterimage repeated the spine's verb and object across the seam.
- Three bands said "at dawn", immediately before step 1 opens "At dawn…".
- "came down off the wall" referred to a wall the prose never introduced.
- "away from the town" names class scenery in a city.
- The critical_failure afterimage ("found the mistake only at dawn") implied the mortal goes on to the disputation. A step-0 `critical_failure` ends the action (`unifiedActionLifecycle.ts:205`: critical_failure forces `fail_action` whatever the step's failBehavior), so this line leads straight to the aftermath.

All five afterimages were rewritten (edits 5–7).

**Step 1 narratives.** These are the fork's continuations.
- "as {actor}'s does" is false on the step-0-failure path (edit 1).
- "{actor} holds it up" follows "the comet", so *it* is ambiguous.
- "argues from the sky alone" is compressed.
- "the steps of the town hall" introduced steps, while every band fragment says "the square".

[EDITORIAL REWRITE] Seeker: "At dawn the council sits in the market square, and half of {location} comes to watch. {cast:champion} reads the college's doctrine: every comet brings plague. But the champion's own night chart lies open on the table, and it shows the comet leaving. {actor} holds the chart up for the council to see." Sentinel ends "{actor} leaves the chart where it lies and argues from their own reading of the sky."

**Aftermath overviews.**
- "the fair will go ahead" is a future promise the engine never makes true (7b). It now states the ruling instead: "The gates stay open for the fair" / "the spring fair is called off".
- Every overview started "The council…", the same subject and shape as the afterimage directly above it. Overviews now lead with the gates.
- Specific fixes are listed in edits 11–16.

## 2. Branch Seduction Audit

- **Seeker (hold the chart up).** The fantasy is exposure: the college refuted in its own hand. It protects truth told in public. The god wants it for a bigger public win (+0.08 standing). Seeker also costs the rival's courtesy, which the success_at_cost overview now states.
- **Sentinel (leave it lying).** The fantasy is mercy to a rival who is not an enemy. It protects the champion's name. The god wants it for a smaller win plus a favour owed by the college's first reader, which is a real, persistent `owes_favor` edge. The Sentinel critical_failure is the arm's sting: the chart that would have won stayed on the table, and the revised overview says so without needing step 1 to have been read.
- The asymmetry is real on both sides: more standing against an ally who owes. Neither arm is obviously right. **KEEP 2.**

## 3. Branch Count Assessment

Two arms on one binary axis (`revelation_discretion`) at short scale. **KEEP 2.**

## 4. Scale Discipline Check

Short: two steps (the reading, then the meeting) and one fork, with no reactions. The size matches the declared scale.

## 5. Inspiration Anchor Honesty

- **Seed dice (contest, doctrine faction, neutral).** Honest, and it visibly shaped the scene: a courteous opponent bound by an orthodoxy they privately doubt is what makes Sentinel tempting.
- **hook.underground_city.** A thin drift: "an institution with its own politics" is carrying most of the weight. It is recorded and the alternatives' rejection is reasoned, so it is acceptable, but it did not change the encounter.

## 6. Aftermath Payoff

The aftermath is actor-centred. Four things carry it: the gates, the fair, the town's standing, and the champion's debt. Both critical bands land plainly. On the Seeker side the doctrine becomes the joke of the market; on the Sentinel side the champion's thanks come in person.

## 6b. Page read, as the player meets it

I read each band as one text: overview, then chips in scar · bond · boon · path order. Short scale has no reactions. What follows is the **revised** page, with the draft's defect noted where one existed.

**Seeker (`positive`)**

- **critical_success.**
  - "The gates stay open for the fair. By noon the college's doctrine was the joke of the market."
  - BOND · REPUTATION WITH {LOCATION} — "{location} thinks better of {actor}'s star-reading."
  - PATH · AMBITION — "{actor} is pursuing Chase the Wonder now."
  - *Draft defect, conflict:* "the college's chart was the joke" mocked the chart that proved the agent right. *Draft defect, repetition:* "the square was repeating {actor}'s reading" and the standing chip told one fact twice. The clause was cut.
- **success.**
  - "The gates stay open. The college lost in public, on its own chart."
  - Chips as above.
  - Clean. *Draft defect, repetition:* the PATH cause "Won the argument over the comet" retold the overview. The cause clause was removed.
- **success_at_cost.**
  - "The gates stay open for the fair. {cast:champion} left the square without a word to {actor}."
  - Chips as above.
  - Clean. *Draft defect, seam:* "after a long hour of argument" echoed the afterimage "after an hour of the college's objections".
- **failure.**
  - "The gates are shut on the college's word, and the spring fair is called off."
  - SCAR · REPUTATION WITH {LOCATION} — "{location} trusts {actor}'s star-reading less."
  - SCAR · COMPULSION — "{actor} is restless to explore for a while."
  - *Draft defect, repetition:* "today the name it trusted was the college's" paraphrased the chip "trusts their star-reading less". The overview clause was cut and the chip carries the fact. *Draft defect, 7b:* "will wander after its course" promised a direction the `explore` compulsion does not enact.
- **critical_failure.**
  - "The gates are shut, the spring fair is called off, and the council thanked the college before the whole square."
  - Chips as failure.
  - Clean, and true on the step-0 critical_failure path too, where step 1 never ran. *Draft defect:* "a chart nobody would look at" disagreed with the afterimage, in which the council called it a forgery, so they had looked.

**Sentinel (`negative`, and the fallback)**

- **critical_success.**
  - "The gates stay open for the fair. {cast:champion} found {actor} after the vote and thanked them for leaving the chart on the table."
  - BOND · REPUTATION WITH {LOCATION}
  - BOND · A FAVOUR OWED — "{cast:champion} owes {actor} a favour."
  - PATH · AMBITION
  - Clean: the thanks is the scene and the chip is the mechanic.
- **success.**
  - "The gates stay open. The college's chart was never mentioned, and {cast:champion} knows {actor} kept it quiet."
  - Chips as above.
  - Clean. *Draft defect:* "knows who kept it that way" had `way`, a natural indefinite banned in outcome fields (trigger 15).
- **success_at_cost.**
  - "The gates stay open for the fair. {cast:champion} left the square knowing {actor} had held back."
  - Chips as above.
  - Clean. The draft had the same "long hour" seam as Seeker.
- **failure.**
  - "The gates are shut on the college's word, and the spring fair is called off. {cast:champion} took the win and never mentioned the chart."
  - SCAR · REPUTATION
  - SCAR · COMPULSION
  - Clean. The added sentence is the arm's own sting, not a repeat. The draft's overview was a word-for-word copy of the Seeker failure overview, with the same chip paraphrase.
- **critical_failure.**
  - "The gates are shut, and the council thanked the college before the whole square. {cast:champion}'s own chart showed the comet leaving, and it went back to the college unread."
  - Chips as failure.
  - Clean, and self-contained: it introduces the chart itself. This matters because this band is reachable from a step-0 critical_failure, where the reader never met the chart. *Draft defects:* "The chart that would have won it" referred to a chart that path never introduced, and its "thanked the college" echoed the afterimage above it.

**Verbosity:** none remains. Every overview is one or two sentences, and each chip adds one state the overview does not carry.

## 7. Dilemma Energy

The fork is genuine and the tension is legible. The god's lean has a mechanism: clear sight inclines the mortal to speak out, and long thought to keep quiet. The god's posture shows in which step-0 card it plays, not in any choice of ending.

## 8. Experience Differentiator Gate (answered independently)

| # | Answer | Evidence |
|---|---|---|
| 1 | YES (after edit 2) | P1 place and time · P2 events and the named accusation · P3 one contest stake · 79 words |
| 2 | YES | No sensation or camera work. "half of {location} comes to watch" establishes the crowd that Hush acts on |
| 3 | YES (after edit 2) | Haze, night, crowd, champion, argument, comet: every card's target is in the prose. The haze was missing in the draft |
| 4 | YES | "The college says the comet means plague; the agent must beat its champion before the council or lose their name and the town its fair." |
| 4b | YES (after edits 1, 5–7, 11–13) | See § Echo / seam check |
| 5 | YES | Verb + noun titles, 1–2 sentence effect lines, no flavor quote. Specials name their scene targets, which is lawful for a special |
| 6 | YES (after edit 8) | Every line states what the god does and why it moves the odds. Every card has an essence price |
| 7 | YES | All six specials carry a `failure` fragment. No Δ ≥ 0.15 |
| 8 | YES (after edit 2) | See Q3 |
| 9 | YES | Step 0: clear sky vs more time. Seeker: the crowd vs the rival. Sentinel: the mortal's own voice vs the sky's evidence |
| 9b | YES | 2 specials + `deal` on step 0 and on both arms. The fork is `decidedBy: revelation_discretion`, and the god only leans through `poleLean` |
| 10 | YES | Banded overviews on both arms |
| 11 | YES | Named cast (`{cast:champion}`) and the town. Nouns are `reputation with {location}`, `ambition`, `a favour owed`, `compulsion`: all sheet words |
| 11b | YES (after edits 11–16) | § 6b. The draft failed: repetition on both failure bands and a conflict on Seeker critical_success |
| 12 | N/A | Short scale |
| 13 | N/A | Short scale |
| 14 | YES | Emotions → residue image: an empty step, an untied chart, a pale comet, no people |

## 8b. Narrator's checklist (12 questions, answered independently)

1. **P1 arrival with real names?** YES, weakly. It states place and time ("{actor} is in {location} on the fourth night of the comet") but not how they came. That is lawful for `why here: chance`.
2. **P2 events with costs paid?** YES. The college has already named the agent a false reader, which is the cost already paid.
3. **P3 one stake shape?** YES. Contest: the council follows the winner, and the loser's name suffers.
4. **≤80 words?** YES, 79.
5. **Readable aloud as a report?** YES.
6. **Facts stated, not encoded?** YES.
7. **Every sentence serves challenge, test or outcome?** YES. The haze sentence now has a job.
8. **Nothing referred to before it is introduced?** YES after edits. Draft breaches were "the wall", "the steps", and the Sentinel crit-fail "chart" on the step-0 path.
9. **One named person per beat?** YES. The champion is the only named NPC.
10. **Stake restatable in one sentence?** YES.
11. **Cards verb + noun, spell-like?** YES after edit 8.
12. **An opening per declared class?** YES. `urban` only, one opening.

## Echo / seam check (sentence against sentence)

| Seam | Draft | Fix |
|---|---|---|
| spine → step 0 success afterimage | "charts its course" → "They charted the comet's course" | "The chart was done before morning." |
| step 0 afterimages/fragments → step 1 | "at dawn" (success_at_cost, critical_failure, Part success "until dawn") → "At dawn the council sits…" | dawn removed from every step-0 outcome line |
| step 0 failure base → Part failure fragment | "Cloud came in…" + "…while cloud rolled in from the west" | "The haze thinned overhead, but the western sky stayed thick." |
| Sentinel failure base → Steady failure fragment | "The council found the doctrine easier…" + "…the council found the doctrine simpler" | "{actor} stayed calm and exact to the end, but the council stopped listening halfway." |
| Sentinel step 1 → Brighten fragments | "At dawn…" + "flared at dawn" ×2 | dawn removed |
| step 0 afterimage → step 1 narrative | "moving east, away from the town" + "moving east and away" | step 1 now says "shows the comet leaving" |
| Seeker crit afterimage → overview | "laughed at the doctrine" + "the joke of the market" | afterimage: "…and voted before the college could object" |
| Seeker success afterimage → overview | "the college's own chart" + "on its own chart" | afterimage: "The council read the champion's chart and took {actor}'s side." |
| sac afterimages → sac overviews (both arms) | "after an hour of…" + "after a long hour of argument" | overviews: "The gates stay open for the fair." |
| Sentinel crit-fail afterimage → overview | "thanked the college" ×2 | afterimage: "The council asked {actor} to stop before the argument was done." |
| every afterimage → its overview | "The council…" + "The council…" (repeated shape) | overviews lead with "The gates…" |

## Automatic REVISE triggers (all 35)

| # | Trigger | Draft | Note |
|---|---|---|---|
| 1 | No approach prose | clear | Spine before step 0; arm narratives before step 1 |
| 2 | Generic god-verbs | clear | Part, Slow, Hush, Unsettle, Steady, Brighten are all specific |
| 3 | No thread integration | clear | Named cast, the agent as target, the Guiding/Proud trait variant |
| 4 | Missing reaction choices | clear | Short scale |
| 5 | Reporter prose | clear | Every band says what changed (gates, fair, standing, debt) |
| 6 | No concept art | clear | Evocative residue image |
| 7 | Hand outside 4–8 / >2 specials | clear | 2 specials + deal 4 on each nudge-bearing step |
| 8 | <4 spheres / no common option | clear | The composed hand is the dealer's guarantee; specials span light, time, order, chaos, mind |
| 9 | Nudge with no failure fragment | clear | All six carry `failure`; none big-delta |
| 10 | Uncovered StepOutcome | clear | Step 0, Seeker and Sentinel each cover all six across their two specials |
| 11 | Digit or % in effectLine | clear | |
| 12 | Trait-hook step skipped / dead ref | clear | Four answers recorded; refs for Pass 3 to verify live |
| 13 | Nudge payoff in base text | clear | Base "Cloud came in" is what happens with no god; Part only counters it |
| 14 | Option instructs the mortal | clear | The leans act on sky and time, not orders |
| 15 | Detector hit | **hit → fixed** | `way` in the Sentinel success overview. Nothing else found in outcome fields: no someone, something, nothing, anything or thing. The one "not…but" budget is unused |
| 16 | Scene-bespoke card face / flavor quote | clear | Specials may name their targets (spec § 3b); no quotes |
| 17 | Mood instead of mechanism | **hit → fixed** | "A clear sight argues for speaking out" / "Long thought argues for keeping quiet" stated a mood. Now "makes them readier to…" |
| 18 | Envelope / class scenery in spine | **hit → fixed** | "away from the town", "town hall" in an urban envelope that includes cities → `{location}` / "market square" |
| 19 | Two riders / unjustified rider | clear | No riders |
| 20 | Unpriced zero-essence / dead grant | clear | All priced; no grants |
| 21 | Family type-composition clone | clear | Boost + Whisper / Boost + Stumble / Boost + Omen; the batch report audits it |
| 22 | Seam echo | **hit → fixed** | See § Echo / seam check (11 seams) |
| 23 | Static factor line | clear | None authored (Pass 3: derive factors, do not author static ones) |
| 24 | Agent as bystander | clear | The agent is the accused |
| 25 | Announced outcome mechanics | clear | P3 states the stake as a fact |
| 26 | Design-block breach | clear | Chart, gates, fair and doctrine all used; axis named; the promise (comet's meaning) is paid off in step 1 |
| 27 | Title glance test | clear | Complication and subject both in the title |
| 28 | Crux | clear | One sentence |
| 29 | Unreadable compression | **hit → fixed** | "dispute the comet", "argues from the sky alone", ambiguous "its" / "it" / "they" in the spine and two effect lines |
| 30 | Invented shape | clear | Danger–Confrontation–Aftermath with the confrontation forked (THR-894) |
| 31 | Invented game state | clear | The accusation and the agent's public claim are scene-local premise, not asserted world standing |
| 32 | Non-sheet chip noun | clear | `reputation with {location}` (enriched; 3 words; `cunning-fair` precedent), `ambition`, `a favour owed`, `compulsion` |
| 33 | Chip >15 words / retells overview | **hit → fixed** | Cause clauses "Won/Lost the argument over the comet" retold the overview; dropped |
| 34 | Unenacted later-world promise | **hit → fixed** | "the fair will go ahead" and "wander after its course" → present-tense rulings and "restless to explore" |
| 35 | Page repeats / conflicts | **hit → fixed** | § 6b: both failure bands (paraphrase) and Seeker critical_success (conflict) |

## 9. Verdict

**PASS WITH REVISIONS**, applied. None of the hits is structural. The fork, hands, band coverage and consequence wiring are untouched.

## 10. Revision Summary: edits applied

1. **Step 1 narratives, both arms.** Removed "as {actor}'s does" (false after a failed step 0). The chart now "shows the comet leaving". "holds it up" became "holds the chart up". "argues from the sky alone" became "argues from their own reading of the sky". "steps of the town hall" became "market square", which introduces the square the fragments use.
2. **Opening.** "dispute the comet" became "argue the comet's meaning". The ambiguous "its course" became "the comet's course". The haze is now established ("Tonight, through haze…"), which grounds Part The Clouds. P3 tightened. 79 words.
3. **Section 3 and Section 12** synced to the new prose.
4. **Step 0 critical_success / success afterimages.** Spine seam removed, and "the town" became `{location}`.
5. **Step 0 success_at_cost afterimage.** Removed the unintroduced "wall" and "at dawn".
6. **Step 0 failure afterimage.** "their chart" became "the chart" (a plain subject).
7. **Step 0 critical_failure afterimage.** Rewritten to lead straight into the aftermath, because a step-0 critical_failure ends the action. The spine seam and "at dawn" were removed.
8. **Effect lines.** Part and Slow now state the pole lean as a mechanism. Hush lost its ambiguous "they". Unsettle lost its ambiguous "they". Steady dropped "under scorn", which contradicted the neutral disposition.
9. **Part The Clouds fragments.** success "until dawn" became "all night"; failure lost its cloud echo.
10. **Steady The Voice fragments.** success "nobody interrupted" became "and was heard to the end"; failure lost its echo of the base line.
11. **Brighten The Tail fragments.** Removed the repeated "at dawn".
12. **Seeker afterimages.** critical and success rewritten against the overview echo, and made true on every step-0 path.
13. **Sentinel critical_failure afterimage.** Removed "thanked the college", which echoed the overview.
14. **All ten overviews.** They lead with the gates, and the future-tense fair became a present-tense ruling. The success_at_cost "long hour" echo was cut. Seeker critical_success: conflict and repetition removed. Sentinel success: `way` removed. Both failure bands: the chip paraphrase was cut, and Sentinel failure gained its own sentence. Both critical_failure bands are now true on the step-0 critical_failure path.
15. **Fallback overview.** "how it went" became "The council has ruled on the gates before the whole square."
16. **Chips.** Dropped both cause clauses (retelling). The compulsion detail became "{actor} is restless to explore for a while." (7b). "their star-reading" became "{actor}'s star-reading" (antecedent).
17. **Self-audit** gained editorial rows and a Pass 3 carry-forward list.

**Should fix (Pass 3, systems lane — not applied here):**
- `ambition_chase_the_wonder` sits in `EVENT_MINTED_AMBITION_TEMPLATES` (`ambition-templates.ts:1751`), not `AMBITION_TEMPLATES` as §5 claims. The aftermath path resolves it: `assignAmbitionToActor` → `findAmbitionTemplateById` searches both. Correct the label, and confirm `check:encounter` liveness agrees.
- The `a favour owed` chip must carry **no** `stateNoun.entityId`. `chipStateNounWordingViolations` rejects a `$cast:` anchor; use `tooltipId: 'ui.favour_owed'` as `fair-bout.ts` does.
- Confirm which aftermath variant renders when step 0 critical-fails and the fork step never runs. Both critical_failure overviews were written to be true either way.

**Consider:** success_at_cost pays exactly what success pays. The brief's band table asks that the mortal "carries something" at that band. A smaller standing gain at success_at_cost would honour it without a new effect.
