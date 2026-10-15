# Encounter Pipeline: The Gallows Pardon
> Scale: medium | Slug: gallows-pardon | Pass: editorial (cold critic, master-everyday-3 slot 3)
> Date: 2026-10-15 | Pipeline version: 2.0
> Judged: `gallows-pardon.package.json` (what ships), against `master-everyday-3-brief.md` row 3

## Verdict: PASS WITH REVISIONS

The encounter is the right shape: heart 0.76 → heart 0.80, a crowd then a judge, no rule gate, `relationship` + `story_seed` wired, the youth kept a role noun so a hanged youth leaves no ghost in the graph. The opening is narrator mode and the hanging is stated plainly. Five defects needed fixing before it ships. All are applied to the package.

1. **The success pages contradicted their own reaction (trigger 35, conflict).** Every success-side overview said "The youth is home with {cast:mother}", and the step-1 crit afterimage said "The youth walked home with {cast:mother}". The success bands inherit the fallback reactions (`band.reactions ?? variant.reactions`, `src/types/unifiedAction.ts:2340`), so the same page then offered **Walk the youth home**. A youth who is already home cannot be walked there.
2. **The failure page contradicted its own reaction (trigger 35, conflict).** The overview said "{cast:mother} went home alone", and the reaction under it was **Stay with the mother**: "stays at the gallows with the mother until the crowd is gone".
3. **The crit-fail overview was false on its step-0 route (trigger 35, conflict).** A step-0 critical failure ends the action. Its afterimage is "The crowd shouted {actor} down, and the hangman did not wait for a plea", so no plea was made. The overview then said "the master's plea had hurried the rope".
4. **The hanging was told twice at every failure seam (trigger 22).** The step-1 failure afterimage ends "The youth hanged at noon." and the failure overview opened with the same sentence. The crit-fail afterimages (both routes) and the crit-fail overview did the same.
5. **The opening told its stake twice (trigger 29 / verbosity).** "Unless the crowd turns, the hangman will not wait. First {actor} must win the crowd over and make the hangman hold back." These are one fact in two sentences.

Also fixed (should-fix): two card effect lines repeated a word of their own card name (spec § Prose doctrine v2, second exemplar, correction 2). The step-1 prose gave a reusable cast member a gendered pronoun. The PATH chip and seed label were rewritten to follow the systems retarget (systems finding 1: the `#tavern_night` seed could never fire).

## 1. Prose Quality

The opening skeleton holds: P1 is arrival with graph names, P2 states the situation with its cost already paid ("Half the town thinks he did not do it. The rest have come to watch."), and P3 names the one stake. Nothing is interior and nothing is camera work. The youth's death is one plain clause wherever it lands ("The youth hanged at noon."), never described. That is right for the brief's hardest failure.

Weak passages, rewritten:

- Step-0 P3: "Unless the crowd turns, the hangman will not wait. First {actor} must win the crowd over and make the hangman hold back." These two sentences carry one fact. `[EDITORIAL REWRITE]` "{actor} must win the crowd over first, or the hangman will not wait for a plea." Opening + spine is now 72 words (was 78).
- Step-1 spine: "with the sentence in his hand … before he gives the word". `justice` reuses any `noble` / `steward` in town (`reuseNpcRoles`), so "his" can be wrong on a reuse, and the corpus has no cast pronoun token. `[EDITORIAL REWRITE]` "…stands on the gallows steps holding the sentence. … {cast:justice} will hear one plea before giving the word."
- Step-1 crit afterimage: "…sent men to search the works again. The youth walked home with {cast:mother}." This is defect 1. `[EDITORIAL REWRITE]` "{cast:justice} tore up the sentence on the steps and ordered the bridge works searched again."
- Step-1 s@c afterimage: "told the crowd he did it against his own judgement" (pronoun). `[EDITORIAL REWRITE]` "…told the crowd the pardon went against the court's judgement."
- Press The Conscience crit fragment: "…for himself before he said another word." `[EDITORIAL REWRITE]` "{cast:justice} stopped the hangman and asked to see the lead and the youth's bed."
- Press The Conscience near-miss fragment: "kept the sentence in his hand while he thought." `[EDITORIAL REWRITE]` "…but kept hold of the sentence a long while."
- Press The Conscience effect line: "Press the weight of a sentence…" repeats the card name. `[EDITORIAL REWRITE]` "Lay the weight of a sentence on the one who must give it, so they hear the whole plea before deciding."
- Find The Right Words effect line: "Put a plea into words…" repeats the card name. `[EDITORIAL REWRITE]` "Shape a plea the listener cannot wave away, so even a hard judge has to answer it." Its image is moved from `generic.rumor` (gossip) to `generic.mercy` (a plea for a life).
- Success overviews (crit / success / s@c): "The youth is home…" `[EDITORIAL REWRITE]` "The youth lives, and the whole town knows who spoke for him at the gallows." · "The youth lives, and the rope at the crossroads hangs empty." · "The youth lives, though not everyone in {location} believes he is innocent."
- Failure overview: "The youth hanged at noon, and {cast:mother} went home alone. …" `[EDITORIAL REWRITE]` "{cast:mother} has her son's body to bury. A master's plea was meant to move the justice, and this one did not." The afterimage has already stated the hanging. The overview states what it leaves, and the second sentence states plainly why a master's failure costs more.
- Crit-fail overview: `[EDITORIAL REWRITE]` "{cast:mother} has her son's body to bury, and the crowd went home saying {actor} only hurried the rope." This is true on both routes.
- PATH chip (four bands) and seed labels: "The youth's people will stand {actor} a drink one evening" / "…will come looking for {actor} one evening". After the systems retarget, `[EDITORIAL REWRITE]` title "The Builders' Work", detail "The builders who worked beside the youth will send {actor} work." (11 words). Seed label: "The builders who worked beside the youth heard {actor} speak for him at the gallows, and have work for them."

## 2. Branch Seduction Audit

Linear, branch count 0. There is no fork. The mortal's stance lives in the aftermath reactions.

## 3. Branch Count Assessment

KEEP 0. Two beats (the crowd, then the justice) with `carryoverFactorLines` keyed on step 0's band give enough path dependence. "How the crowd was left" really changes the plea's odds.

## 4. Scale Discipline Check

Medium: two beats and reaction choices on both sides. Correct.

## 5. Inspiration Anchor Honesty

`hook.the_great_building` really shapes the scene: the stolen lead is bridge lead, the justice's reason ("the town wants the bridge works kept honest") is the building's, and a stone-carrier is the cheap example. After the seed retarget the sequel also comes from the building, because the builders the youth carried stone for send the master work. The anchor is now load-bearing at both ends.

## 6. Aftermath Payoff

Actor-centred, with faces: {cast:mother}, {cast:justice}, the town, and the builders. The success side ends warm, as the brief asks for slot 3: the youth lives and the rope hangs empty. The master carries an enemy on every success band (the justice argued down before the town). The failure side states the cost to the master's name in one plain sentence.

## 6b. Page read (after fixes)

**critical_success**
> The youth lives, and the whole town knows who spoke for him at the gallows.
- The Town's Thanks: {location} thinks better of {actor} now.
- The Mother's Trust: {cast:mother} trusts {actor} now.
- The Justice's Grudge: {cast:justice} resents being argued down before the town.
- The Builders' Work: The builders who worked beside the youth will send {actor} work.
> Walk the youth home: the mortal walks him to his mother's door; she will remember it. · Give the justice the credit: the justice will remember the courtesy.

Repetition: none. "The whole town knows who spoke" and "thinks better of" are two facts, the knowing and the regard. Conflict: none after fix 1. Routes: step-0 crit + step-1 success, or step-0 success + step-1 crit. The step-1 crit afterimage no longer sends the youth home, so the reaction is true on both.

**success**
> The youth lives, and the rope at the crossroads hangs empty.
- the same four chips · the same reactions

Clean.

**success_at_cost**
> The youth lives, though not everyone in {location} believes he is innocent.
- the same four chips · the same reactions

There are three routes: step 0 failure / near-miss / s@c then step 1 success, or step 1 s@c / near-miss. The overview is true on each. After step-0 failure ("{cast:mother} stopped believing {actor} could save her son") the Mother's Trust chip is still true: −0.06 then +0.12 nets +0.06. The town chip nets +0.04 after the step-0 −0.02. Tension, not conflict: the town both doubts the youth and thinks better of the master who saved him.

**failure**
> {cast:mother} has her son's body to bury. A master's plea was meant to move the justice, and this one did not.
- A Plea That Failed: {location} thinks less of {actor} now.
- The Mother's Blame: {cast:mother} blames {actor} for her son.
- The Builders' Work: The builders who worked beside the youth will send {actor} work.
> Stay with the mother: she will remember that much. · Say he was innocent: the town will not thank them for it.

Repetition: "her son's body to bury" and "blames {actor} for her son" give two facts, the loss and the blame. Conflict: none after fix 2. Seam: the afterimage states the hanging, and the overview no longer repeats it (fix 4).

**critical_failure**
> {cast:mother} has her son's body to bury, and the crowd went home saying {actor} only hurried the rope.
- Blamed for the Rope: {location} thinks less of {actor} now.
- The Mother's Blame: {cast:mother} blames {actor} for her son.
> Stay with the mother · Say he was innocent

The page is true on both routes (fix 3). The step-0 route plants no seed, so there is no PATH chip. That is an omission, never a false chip. The step-1 route does plant the seed, so there the page under-reports one write. That is lawful (Law 56 binds chips to writes, not writes to chips), and noted for systems.

## 7. Dilemma Energy

The hand asks four different questions: will the crowd hear (spirit pity), is there time (the time-slowed bell), will the judge weigh it (mind), and can the words be answered (the trait card). The reactions put real stances in front of the player. On the success side, a private kindness to the mother stands against giving the credit away to mend a grudge. On the failure side, comfort stands against keeping the case open at the town's expense. Both pairs are defensible.

## 8. Experience Differentiator Gate

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode skeleton ≤80 words | YES | 72 after fix 5 |
| 2 | Every sentence works | YES | no atmosphere-only line |
| 3 | Scene names what the hand acts on | YES | the crowd, the noon bell, the justice and his sentence, the plea |
| 4 | Retellable after one read | YES | |
| 4b | No seam echoes | YES (after fix 4) | the failure / crit-fail overviews no longer repeat "The youth hanged at noon" |
| 5 | Spell-style faces, no flavor quote | YES | |
| 6 | Mechanism effect lines; real prices | YES (after rewrite) | essence 2 ×3, trait card cost 0; no line repeats its card's name |
| 7 | Every card pays off in failure | YES | each special has ≥1 failure band; Slow The Hour covers both; no big-delta card |
| 8 | Card targets established in prose | YES | the crowd and hangman in the step-0 spine, the justice in the step-1 spine |
| 9 | Different questions | YES | |
| 9b | 4–8 composed hand, 2 specials + deal 3 | YES | both steps |
| 10 | Reflective aftermath | YES | |
| 11 | Actor-centred, sheet-word nouns | YES | `reputation with {location}`, `reputation` + cast concept, `seed` |
| 11b | Every page clean | YES (after fixes 1–3) | § 6b |
| 12 | Reaction choices | YES | |
| 13 | Philosophical stances | YES | |
| 14 | Evocative art direction | YES | an empty noose over a crossroads at noon, a coil of bridge lead below, no people |

## 9. Fix-list (all applied to `gallows-pardon.package.json`)

1. Success overviews (×3) now read "The youth lives…", and the step-1 crit afterimage drops "walked home with {cast:mother}". Walk the youth home is now true on every success route.
2. The failure overview drops "went home alone". Stay with the mother is now true.
3. The crit-fail overview says "{actor} only hurried the rope", which is true when the plea was never made.
4. The failure and crit-fail overviews no longer repeat the afterimage's "The youth hanged at noon."
5. Step-0 P3 merged into one stake sentence (78 → 72 words).
6. Step-1 spine, s@c afterimage and Press The Conscience crit / near-miss fragments no longer gender the reusable justice.
7. Press The Conscience effect line ("Press…" → "Lay…") and Find The Right Words effect line ("words" dropped) no longer repeat their card names. Find The Right Words image `generic.rumor` → `generic.mercy`.
8. PATH chip (four bands) retitled "The Builders' Work". The detail and both seed labels were rewritten to match the `#fellowship_errand` retarget (systems § 4).
9. Package `doc` block updated (word count, stated-stake line, seed rationale, tone line).

**Consider (not applied):** the mother is `must-persist` and matched by `supportRole`, so a second run of this encounter in the same town finds Agnes Thorne again with a son to hang. Rarity 2 at a master band makes this rare, and fixing it means changing delivery mode, which is outside the editorial lane.
