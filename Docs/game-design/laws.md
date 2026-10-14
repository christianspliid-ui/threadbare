# Game Design Laws — the rules every system keeps

> **Status:** binding. Opened 2026-10-14 at Christian's direction, in chat: *"fix and add the relevant game design principles to our relevant game design laws."* Chapter I came out of three videos he shared from the [candlesan](https://www.youtube.com/@candlesan) channel on loot tables, the marble bag, and ways to control randomness, checked against Threadbearer's own code and measurements.
>
> **What this file is:** the numbered law book for *how the game behaves*, the sibling of the UI Laws ([`Docs/design-system/laws.md`](../design-system/laws.md)), which govern how the game is shown. A law is checkable: a reviewer with a trace, a test or a measurement and this file can say "Law 2 violated" without re-deriving intent.
>
> **Provenance marks:** **[E]** = established and binding, with source. New proposals enter as **[P]** and are followed until Christian rules; his ratification (chat, dated) flips them to [E].
>
> **Loaded by:** every design pass on a system that rolls, draws or picks at random. `Docs/canon/design-governance.md` names this file in its checklist. Ticket Done-whens cite it by law number; a law does not need restating per ticket.

---

## I. Randomness and luck — Christian's direction, 2026-10-14

1. **[E] A number the designer sets is the number the player gets.** An authored chance (a rarity curve, a tier share, a crit rate) must be the rate players actually experience. If how many items exist, an encounter's filters, or what the mortal already owns can move that rate, that is a bug, not tuning. Check the experienced rate, never only the authored weight. *Motivating instance:* the reward draw set Legendary on a success at 5%, and live play paid about 1.5%. A critical success was set at 10% and paid about 4%, and a success's Mythic was set at 15% and paid about 7%. (Measured 2026-10-14 over 5,356 live draws; plan [`2026-10-14-luck-protection-and-tier-first-loot.md`](../plans/2026-10-14-luck-protection-and-tier-first-loot.md).)

2. **[E] Roll the class, then the thing.** When a draw has classes with their own odds (rarity tiers), roll the class first from its own table, then pick inside it. Never multiply a class's share into every item's weight. If you do, each item added to a class quietly raises that class's odds and lowers every other class's. *Established instance:* `drawTierFirst` in `src/engine/rewardPool.ts` is the one reward draw; the flat `drawFromPool` is for untiered pools only. *Known open instance:* a recipe's category shares (condition vs possession) are still folded into item weights inside a tier, so about 18% of multi-category prize draws land in a different category than the recipe says. Fixing that changes what kinds of rewards encounters hand out, so it waits for its own decision (plan § Deferred).

3. **[E] The rarest tier's chance is pinned.** Adding a new lower tier, retiring an item, or an encounter having nothing at some tier never changes the chance of the rarest tier. When the rolled tier has nothing eligible, the draw falls one tier *down*, and climbs only when nothing below is eligible. Leftover weight never goes to Legendary. *Instances:* `drawTierFirst`'s cascade; `seedRarityTier` (world generation), which used to hand any shortfall in a distribution to Legendary.

4. **[E] Random is not fair, and the player's own mortals get fair luck.** Rolls on a mortal the player holds by a thread (the First, and any later threaded mortal) come from a **marble bag**: each bag holds every slice of the d100 once, dealt in a seeded order. Each bag lands once in every tenth of the range, so the mortal's luck evens out to the odds it was shown instead of drifting: at steady odds a bag delivers them exactly, and over a run the success rate tracks the forecast. The long losing streaks plain dice allow are cut. Everyone else, including rival gods' mortals and the background world, rolls plain dice: nobody watches those rolls, and real swings are the world's texture. *Instance:* `src/engine/luck.ts`, used at the three places a mortal rolls (encounter steps, fights, undertaking checkpoints).

5. **[E] Choose the protection by the problem.**
    - **Marble bag:** a repeated event at known odds, such as a threaded mortal's step rolls.
    - **Predetermination:** one outcome the player tracks, with a worst case to rule out. The Legendary drought is the instance: each cycle fixes in secret, up front, the win by which the next Legendary will have arrived (between the 30th and 50th win today). Luck can bring it sooner.
    - **Progressive probability** (the odds rise after each miss): never on odds a chooser can see. Mortals pick challenges by their forecast (the 50–65% window). A rising bonus would be spent on a harder challenge instead of ending the streak.
    - **Fixed limit** (a visible "guaranteed by the Nth try"): only as a deliberate, visible feature, and designed so that saving the guaranteed result for the best target is either impossible or intended. Adopting one is Christian's call.

6. **[E] Protection stays lighter than the player's own tools.** Luck protection removes only the long streaks. Short bad runs stay, because answering bad luck is what the nudge cards are for (the `no_crit_fail` and `floor_at_cost` riders). If a protection ever makes a card pointless, the protection is too strong.

7. **[E] Protection is invisible unless it is the feature.** No surface names the bag or the deadline, and the forecast shows the true odds. Making a protection visible is a design decision with its own law-5 review, not an implementation detail.

8. **[E] Luck's memory is game state: seeded, saved, traced.** Store it as counts on the holder (the bag's order and the deadline are re-derived from the world seed, the holder's id and those counts), never as a stored shuffled list. A protection draws on its own named stream and never changes how many values a shared stream consumes. Every protected roll and every Legendary cycle emits a trace (`luck.bag_roll`, `luck.legendary_cycle`). (NFP #2 Inspectability, #3 Determinism.)

---

## Enforcement

- **Machine gates:** `src/engine/__tests__/rewardTierFirst.test.ts` (Laws 1–3: each tier lands at its curve share whatever the pool holds; each outcome curve sums to 1; an empty tier falls down; the Legendary deadline holds), `src/engine/__tests__/luck.test.ts` (Laws 4 and 8: every slice once per bag, the forecast odds exact over each bag, the losing streak capped, the shared stream aligned, only the player's mortals protected), `src/engine/__tests__/rarity.test.ts` (Law 3 in world generation). A law a machine can check gets its check in the same PR that first relies on it.
- **Design passes:** a plan that adds a random draw names which law-5 tool it uses (or "plain dice", with the reason) and how Law 1 is measured.
- **Change protocol:** amending a law takes one line in `Docs/changelog.md` naming the law number. Laws marked [P] are ratified or vetoed by Christian in chat; the mark then changes to [E] with the chat date as source.
