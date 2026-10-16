---
lane: tb-design-lane
run: 2026-10-16e
promoted: 0
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-16 (run e, ~16:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Outcome words that mislead](https://linear.app/threadbare/issue/THR-1860/outcome-words-that-mislead-completed-at-great-cost-with-no-cost-shown) — **every encounter aftermath now opens with what decided it**: the step, the Reach that carried or failed it, and whether your cards played into it. For example: "Kael won the Bridge Toll, at a price. The haggling on Gold nearly broke, and your cards held it." The counts and chips come after that line. ([its build ticket](https://linear.app/threadbare/issue/THR-1964/the-aftermath-opens-with-what-decided-it-one-cause-line-first-won-at-a)) *Veto:* **"open the aftermath with the story prose instead"**.
- Same ticket — **"completed at great cost" becomes "won, at a price", and that ending always names its price.** Every such win really costs the mortal something: they are worn down and learn half as much. Only the visible scar is left to chance. So when no scar was drawn, a row says "It took something out of Kael…". I did not drop the words when no scar was drawn, as the playtest note suggested, because that would hide a cost that is really there. *Veto:* **"only say 'at a price' when there is a scar"**.
- Same ticket — **the Notables panel says that finished agendas fade from the list**, so a falling count is no longer a mystery. **The Doom tooltip says The First's road follows the clock.** The "doom noticing" lines now say what slows the doom: finishing mandates. ([its build ticket](https://linear.app/threadbare/issue/THR-1965/notables-and-doom-say-why-a-fade-line-under-finished-agendas-the)) *Veto:* **"leave the doom lines as they were"**.

## Work

- **Claimed** [Outcome words that mislead](https://linear.app/threadbare/issue/THR-1860/outcome-words-that-mislead-completed-at-great-cost-with-no-cost-shown) (claim `2026-10-16e`).
  - The briefing held no vetoes, and you sent no new messages.
  - No wayfinder maps are open, and the build shelf is full (20 ready).
  - [The god's stake](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground) and [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937/plan-doc-undertakings-in-the-economy-what-mortals-found-build-and-open) are still waiting out the veto day on the plans they read. The first clears about 19:20Z today, the last about 01:50Z tomorrow.
  - This was the next warm-playtest finding that already had a recommended direction. It is the sibling of [the mortal's mid-game ticket](https://linear.app/threadbare/issue/THR-1859) from run d.
- **Measured** on main `dea197bf` before deciding:
  - The two words for this ending live in `unifiedActionResolution.ts:3563` and `aftermathWords.ts:932`.
  - The price on every such ending is a quintessence loss and half growth (`outcomeConsequences.ts:53, 65`). The scar draws 40% of the time.
  - The aftermath body puts the count sentence first (`EncounterVeil.tsx` from `:820`).
  - The finished-agenda fade window is 50 ticks (`composition-config.ts:16`).
  - The First's journey phase is read straight from doom progress (`journeyEngine.ts:55-61`).
  - [The screen frame plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1875-screen-frame.md) already holds this ticket's Notables tooltip words, and the builds reuse them.
- **Filed** two build tickets into the Warm playtest · round 2 milestone, both in Todo, unassigned, with coordination blocks:
  - [the aftermath cause line](https://linear.app/threadbare/issue/THR-1964/the-aftermath-opens-with-what-decided-it-one-cause-line-first-won-at-a)
  - [Notables and Doom say why](https://linear.app/threadbare/issue/THR-1965/notables-and-doom-say-why-a-fade-line-under-finished-agendas-the)
- **Decision record** posted on the ticket. The ticket went back to Todo, unassigned, blocked by the two builds. It stays open until warm round 3 checks its "Fixed when", the same as THR-1859.

## Escalations

None.
