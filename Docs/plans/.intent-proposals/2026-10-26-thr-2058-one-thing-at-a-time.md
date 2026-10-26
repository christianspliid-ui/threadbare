# Action proposal — 2026-10-26-thr-2058-one-thing-at-a-time

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (THR-1611, the design lane's mandate)

The ticket itself (THR-2058, filed by the cold-playtest lane from round 5, 2026-10-26), verbatim:

> **Design question.** After the first chapters, in what order does a new player meet Doom, the Mandate, Investiture and the rivals, one at a time, each when it first matters, and which of the top bar's numbers (Attention, the four map tabs, Needs-you count) should a player in their first fifteen minutes not see at all?

> **Recommended direction.** 1. Stage the minute-ten unlocks the way THR-1837 staged the panels: one arrival per chapter, each with a one-line "what this means for you" and the number it moves. 2. Drive the essence arrow from refill minus upkeep (the rate the pour screen promised), not from window net; check whether the spend flash ever clears. 3. Name ○ in the legend and print only the tiers that appear on the current hand. 4. Show Slight / Clear / Great and Scar / Bond / Boon / Path as words with a short meaning on the aftermath, not as symbols. 5. Hide Attention and the map tabs until their first use; make the Needs-you pill count only waiting items.

> **Fixed when** at most one round-6 tester lists the pools/upkeep, Attention, the map tabs, the pip legend, or Doom / Mandate / Investiture / Rivals under "never understood", and no tester names the minute-ten arrivals as a reason to quit.

> **Done when** this ticket's implementation tickets are filed into this milestone (*Cold playtest · round 5*) and this ticket is closed by the design pass.

## scope (what this plan does)

Designs two build slices. S1 replaces "a gift reveals its panels at once, and the 200-tick ceiling reveals every waiting panel at once" with an arrival queue: after the bond, panels whose trigger fired arrive one per closed First chapter (idle fallback 36 ticks), each toast carrying the panel's one-line caption. Rivals and the four map lenses join the queue, and the Attention gauge is hidden because nothing spends Attention (measured). S2 makes readouts truthful: the essence arrow reads the refill band (current direction), the ▼ spend mark reads only the player's spends (and its timer bug is fixed), the card legend prints only the hand's pip shapes and names ○, the aftermath legend gains short meanings, and the Needs-you number counts only waiting + held rows.

## scope (what this plan does NOT do — explicit non-goals)

- No change to spine gift timing, doom, mandate, rival or income rules.
- Does not wire an Attention spend (filed as a deferral; a mechanic decision).
- Does not recolour Fated (reserved for Christian under THR-1980).
- Does not address path words on God's Will labels (THR-2057 item 1, THR-2059).
- Does not add a tutorial or glossary (rejected by THR-1807).
- "The number it moves" on each arrival is interpreted as the caption naming what the panel measures, not a numeral (Law 13).

## impact_class

Reversible — UI pacing and readout changes behind named constants; no state shape migration (one optional view-model field, UI-held ledger).

## evidence cited

- **Linear issue:** THR-2058
- **Vision premises invoked:** north star "the player must be able to weigh the cost of a nudge"; non-negotiable #3 (mechanics through prose, never numbers) — via `game-design-direction`
- **UL terms touched:** Doom, Mandate, Investiture, Rival, Attention, Needs you, Dominion — no new terms
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md` (Laws 13, 40, 49, 53, 56, 57, 58)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md`, `Docs/plans/2026-10-12-thr-1808-post-bond-reveal.md`
- **Rejected approaches considered and dismissed:** tick-only spacing, re-spreading gifts only, raising the ceiling, ledger in GameState, wiring an Attention spend here, rewording the Attention caption (brainstorm companion)

## load-bearing decisions touched

- "The world graph is mutated in place — never key change detection on graph identity": the queue keys on `chapterArchive` records and ticks, not graph identity.
- "Engine caches are owned per session": the ledger is held per-session in the React hook, not module scope.

## high-impact files touched (from Codesight)

None with ≥100 importers (`ui-content.ts` 36, `frame-registry.ts` 14, `openingReveal.ts` 12, `map-lenses.ts` 12; measured by grep of production imports).

## kill criteria

- Round 6: if a tester still names Doom / Mandate / Investiture / Rivals as arriving together or as a reason to quit, the queue's pacing unit (one per chapter) is wrong — try per-gift spacing or a per-pressure-surface cap.
- If testers report panels arriving "too late" or never seeing Doom within their session, lower `OPENING_REVEAL_ARRIVAL_IDLE_TICKS` or reorder the table.
- If anyone lists the essence arrow or ▼ again while a pool refills, the direction reading is not the cause; revisit the row layout.
