# Package critic — Blamed for the Tithe Barn

templateId: encounter.town.tithe_barn_raid
packageVerdict: connected
packageLeaves: Clearing the mortal's name leaves the village thinking better of them, the reeve trusting them, the god's thread stronger and a good-luck omen about old passages opening across the country; quietly returning the grain leaves a stronger thread and a hidden mark (they know the carved passage under the tithe barn) that pulls them toward later shadow and settlement work until it surfaces; any failure leaves the village calling them the tithe thief, the reeve trusting them less, a thinner thread and a bad-luck omen.

## Half A — anchoring

Chips per band, both arms (`fallback` = the Confessor pages, so it carries the same chips). Step 0 is `continue_weakened` with no aftermath, so it has no chips.

| Arm · band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| Confessor · crit / success / s@c | BOND · reputation — "The Reeve's Regard" | the reeve's regard and trust toward the mortal (`bond_change $cast:reeve`, +0.12 sentiment, +0.1 trust, on `successMetadata`) | `relates_to` edge, 📍 named; endpoint `$cast:reeve` is an individual agent, 🔗 linked (must-persist, spawned `steward`). Noun is `reputation` + `ui.reputation_with`, the THR-1685 workaround, as in ledger-by-lamplight | yes: "{cast:reeve} no longer counts {actor} a suspect" names the reeve and the mortal | anchored |
| Confessor · crit / success / s@c | BOND · reputation with {target} — "Cleared in the Village" | the village's regard for the mortal (`reputation_with $here` +0.05) | `reputation_with` edge, 📍 named; counterparty `$here` (THR-1446 sentinel, `sceneSentinels.ts`) is a location, 🔗 linked via `entityId: '$here'`, `visualKind: 'location'` | yes: "{location} thinks better of {actor}". The noun's `{target}` is enriched (`buildAftermathConsequences.ts:705`) and on a board draw it resolves to the settlement, which is what the chip means (THR-1685 note) | anchored |
| Confessor · crit / success / s@c | BOND · thread | the god-to-mortal thread (`thread_strengthen $ascendant`/`$actor`) | `thread` edge, 📍 named, with the tooltip `ui.thread` (live, used in `encounter-content.ts`) | yes: "The thread to {actor} runs stronger", with a cause clause | anchored |
| Confessor · failure / crit fail | SCAR · reputation with {target} — "Lower in the Village" | the village's regard, down (`reputation_with $here` −0.08, `failureMetadata`) | as above | yes: "{location} thinks less of {actor}" | anchored |
| Confessor · failure / crit fail | SCAR · reputation — "The Reeve's Doubt" | the reeve's bond, down (`bond_change $cast:reeve` −0.15, trust −0.12) | as above | yes: "{cast:reeve} trusts {actor}'s word less" | anchored |
| Confessor · failure / crit fail | SCAR · thread | the thread, down (`thread_weaken`) | as above | yes: "The thread to {actor} runs thinner" | anchored |
| Puppeteer · crit / success / s@c | BOND · thread | the thread, up (`thread_strengthen`) | as above | yes | anchored |
| Puppeteer · crit / success / s@c | PATH · hidden mark — "The Passage Under the Barn" | the `secret_knowledge` mark on the mortal (`hidden_mark`, target `$actor`, label "the carved passage under the tithe barn", revealFamilies shadow + settlement) | a GameState record whose anchor form is the tooltip `ui.hidden_mark` (live). Same form as cunning-fair and one-body-short, which both passed | yes: "{actor} knows of the carved passage under the tithe barn". The sentence names the mark's own label and its bearer, so it claims only what the mark records | anchored |
| Puppeteer · failure / crit fail | SCAR · reputation with {target} (`$here`) | village regard, down (`failureMetadata`) | as above | yes | anchored |
| Puppeteer · failure / crit fail | SCAR · reputation (reeve) | reeve bond, down | as above | yes | anchored |
| Puppeteer · failure / crit fail | SCAR · thread | thread, down | as above | yes | anchored |

Nothing to fold and nothing to bind. Every chip is backed on its own band by the arm's `successMetadata` / `failureMetadata`, and every referent resolves: the two cast members are must-persist, `$here` is the scene's place, and the thread and hidden mark sit on the mortal.

Notes, none of them blocking:
- **The passage is not a world object, and the chips were written with that in mind.** Only the hidden-mark chip mentions it, and that chip's referent is the mark on the mortal, not the passage. The mark carries the passage as its label, the same way cunning-fair's "coin in the widow's house" passed. No chip claims the passage exists on the map.
- **Some writes carry no chip, and that is lawful.** These are `bond_change $cast:elder` (down on the Confessor success, up on the Puppeteer success) and the three `emit_omen` effects. They show up in the overviews ("a loaf on {actor}'s pack", "a sign of good luck"), which are prose and claim no state.
- **The reeve's "reputation" chip is backed by `relates_to`, not by a `reputation_with` edge.** That is the batch's sanctioned THR-1685 workaround, and the noun matches the tooltip the ledger-by-lamplight precedent uses. When THR-1685 lands, the noun should become `reputation with {target}` anchored on `$cast:reeve`.
- **`nudge-authoring-spec.md` § 0c has gone stale.** It still says a `stateNoun` is not enriched, but `buildAftermathConsequences.ts:705` does enrich it. The THR-1685 note in the brief is the one that is correct. This affects the spec, not this encounter.

## Half B — what it leaves behind

It leaves four kinds of state that later systems read, and the player can see each one:

1. **Village standing** (`reputation_with` the settlement, both directions). The player sees it on the Location Profile's standing row.
2. **A bond with a named reeve**, Aldric Venn or whoever the scene reused. The player sees it on both sheets.
3. **The thread**, on every band of both arms. The player sees it on the thread row.
4. **Either an omen or a hidden mark.**
   - An `emit_omen` fires on three of the four arm-sides. The omen agenda (`phaseOmenAgenda`) picks it up as a global sign that the old passages are opening or unlucky.
   - On the Puppeteer success it is a hidden mark instead. The mark raises the odds of shadow- and settlement-family encounters for this mortal, and its label is spoken in the chronicle when one of them reveals it.

The thin spot is the elder. Maud Ashby's bond moves on both successes, but no chip reports it, and no sequel is planned to use it.

PACKAGE PASS
