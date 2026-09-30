# Package critic — Wolves at the Fold

templateId: encounter.town.wolf_winter_watch
packageVerdict: connected
packageLeaves: Holding the fold leaves the village thinking better of the mortal and marked Under Watch for a week, which makes quiet work there harder (the thing that stops the next drover staking carrion), plus the drover's secret to keep as a favour he owes or to spend by naming him; losing the fold leaves the village thinking less of the mortal, who may stay to help with the losses or take the reeve's side against the drover.

## Half A — anchoring

Chips appear only on the aftermath band pages (§ 14b). Steps 0 and 1 are `continue_weakened` and carry no chips of their own. Reaction effects are not chipped, which is lawful.

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| crit / success / s@c | BOND · reputation with {location} | The village's regard for the mortal, up: step 2 `successMetadata` `reputation_with $here` +0.06. Worst success-side net is +0.02 after steps 0 and 1 each write −0.02 on failure | `reputation_with` edge, 📍 named. Anchored on the counterparty `$here`, a location, 🔗 linked | Yes: "{location} thinks well of {actor} now." It names the village the chip is about. The noun uses `{location}`, not `{target}`, so THR-1685 does not apply | anchored |
| crit / success / s@c | BOON · Under Watch | The `trait.condition.location.under_watch` condition on the village: step 2 `successMetadata` `apply_condition` on `$here`, with an 84-tick duration and the Shadow step reader `LOCATION_WATCHED_SHADOW_PENALTY` | Attachment · condition, 🔗 linked, by its **template** id. Uses the same form as `ledger-by-lamplight` and `the-drowned-archive` | Yes: "quiet work in {location} is harder now." It names the bearer and states the condition's real effect, which is the Shadow penalty | anchored |
| failure | SCAR · reputation with {location} | The village's regard, down: step 2 `failureMetadata` −0.06, which always fires, because `failure` is reachable only through step 2's `fail_action` | As above | Yes: "{location} thinks less of {actor} now." This is the P3 stake, enacted | anchored |
| critical_failure | SCAR · reputation with {location} | The village's regard, down, from whichever step ended the night. Steps 0 and 1 each write −0.02 in `failureMetadata`; step 2 writes −0.06 | As above | Yes | anchored |

**Nothing to fold and nothing to bind.**
- `$here` always resolves. The envelope is `rural` only (hamlet, farmland, mining), and each of those is a place-tier location.
- Both cast members are lazily materialized and must persist.
- The scene fiction claims no state. The pack, the folds, the great fold, the carrion, the lanterns, the gate bar, the offer and the fee all stay in overviews and afterimages.
- The `hidden_mark` on `$cast:drover` is concealed by design and is correctly not chipped.

**Declaration notes for the implementer.** None of these blocks the pass. The packet names the anchors but not their exact declaration form, so write them as the precedents do:
- **Reputation chips (all five bands):** `stateNoun: { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`. Use the `bell-tower-shoring` form. Do not leave out `visualKind: 'location'`: the THR-1221 note in the anchor catalog records a shipped chip that rendered at the wrong tier because it was missing.
- **Under Watch chip:** `kind: 'trait'`, `category: 'boon'`, `direction: 'gain'`. Declare `stateNoun: { text: 'Under Watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' }`, plus a `concepts` entry with the same entity. Use the `ledger-by-lamplight` form, with the category flipped from `scar` to `boon` by editorial ruling 3.

**Advisory: the s@c overview and the step-0-miss path.** This is prose, not an anchoring issue.
- `success_at_cost` is reachable with step 0 failed ("found only tracks"). On that path the hidden mark is never written, yet the overview says "{actor} knows now that {cast:drover} staked the carrion".
- No chip claims that knowledge, and the "Keep the drover's secret" `favor_creation` is a real write either way, so no chip is dead.
- It is still the one place where the page asserts more than the world recorded. If a later pass wants it airtight, it can move the `hidden_mark` from step 0's `successMetadata` to step 2's `successMetadata`. The drover waits at the lane's end in step 2, so the mortal can plausibly learn the truth there. That is a systems choice, not something this pass requires.

## Half B — what it leaves behind

A win leaves four things. Later systems read each one, and the player can see each one:

1. **Village standing.** `reputation_with` the settlement rises. The Location Profile standing row reads it, and so does standing-gated content in that village.
2. **Under Watch on the village.**
   - It is a live location condition with a seven-day countdown on the place's sheet.
   - Unlike in `the-drowned-archive`, a reader now acts on it: the Shadow step penalty (THR-1483). Any later shadow-reach step in this village, including a drover's next scheme, is harder while the watch stands.
   - The chip clicks through to the condition's detail page.
3. **The drover's secret.**
   - A concealed `concealed_action` mark sits on a must-persist drover, and investigation-family resolutions can reveal it.
   - The success reactions turn it into something visible: either an `owes_favor` edge (the drover owes the mortal) or a worse bond with the drover plus more village standing.
4. **Named people who stay.** The reeve and the drover are both must-persist. Later bonds and favours have somewhere to land.

A loss is not solitary either:
- The village's standing falls on a row the player can open.
- The failure reactions move village standing, or the bonds with the reeve and the drover in opposite directions.

**Verdict: connected.**

PACKAGE PASS
