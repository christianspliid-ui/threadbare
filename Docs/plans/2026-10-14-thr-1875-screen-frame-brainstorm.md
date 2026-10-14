> **title:** `The screen frame — brainstorm companion — THR-1875`
> **linear_issue:** THR-1875
> **companion_to:** `Docs/plans/2026-10-14-thr-1875-screen-frame.md`
> **created:** 2026-10-14

# The screen frame — brainstorm companion

This file records the alternatives considered, the tensions weighed and the Vision premises the plan leans on. The plan doc is the contract; this file explains why it looks the way it does.

## How this started

THR-1828 decided the frame on 2026-10-12 (design lane, veto window waived by Christian's 2026-10-14 request to write the carve-up now). Two laws ratified the same morning changed what "build the decision" means. Law 57 forbids the decision's fixed cap of 12 Needs-you rows and its "the hand scrolls inside itself first". Law 58 turns "a top bar with these buttons" into "a list of top-bar entries with a test". The plan's job was to keep every one of THR-1828's calls and re-express it as entries, limits and seams the other four carve-up plans can plug into in any order.

## First-pass framing I considered

"One build: rebuild the top bar, the two rails and Needs you in one ticket." Measuring the moves showed the single build cannot be cut cleanly. World-Soul leaves the top bar only once the Chronicle can hold it. Attention leaves only once the god rail can hold it. And the top bar cannot reach one row at 1920 until both have left. So a single PR would carry everything, and any split by *component* would leave a datum in two places or in none for a while. The split by **home**, where each slice builds a home and removes the old one in the same PR, has no such window. That is the plan's § F1.

## Alternatives considered

### Slicing

- **A. Three slices by home, top bar last (chosen).** Each move is atomic; slices 1 and 2 are independent; the top bar's one-row check runs once the room exists.
- **B. Top bar first, keeping World-Soul and Attention in it until their homes land.** Rejected: the width budget at 1920 (1,787 px with every item) has 133 px spare. World-Soul alone is up to 336 px, so the bar would wrap and break the 1080p map-share floor (§ F11) for as long as the slices took.
- **C. One ticket.** Rejected for review size and for the mutex it would put on every frame file at once, while THR-1876 and THR-1877 want parts of the frame early.

### Needs you's limit (today's ruling)

- **Capacity from named constants (chosen).** Rows are one line, so capacity is arithmetic over `NEEDS_YOU_ROW_H_REM`, the group headers and 60vh. The fold is deterministic and testable in Node (13 rows at 1080p, 16 at 1440p).
- **Capacity by measuring the rendered rows.** It handles wrapped rows, but it needs a layout pass before the fold settles, and the result depends on fonts in a test. Rejected: the ruling asked for the row height and the limit as constants.
- **Two-line rows.** Rejected: halves capacity for the rare long line; the row's tooltip carries the full line (hover tier, outside Law 57's membership).

### Where a News row goes when it lapses

- **"Lives on in the Chronicle" (THR-1828's words).** Not true today for mandate, faction-outcome and revelation alerts (0 Chronicle writes in their producers). Writing those lines is engine and content work outside the frame, so it is filed as THR-1896, and no frame string promises the Chronicle until it lands.
- **No lapse; rows stay until opened.** Rejected: an ignored count grows without bound and stops meaning "needs you".
- **Lapse only in the VM, keeping the router's count cap of 12.** Rejected: the 13th alert would still drop silently at the source, a Law 49 breach the frame would make visible. The router now trims by the same age, with a counted safety cap.

### The beat offer

- **Keep the floating pill and also list the offer in Needs you.** Rejected: one fact in two places (PC-6), and the pill sits at the top centre where the Find field now goes.
- **Retire the pill and drop the THR-1809 raise.** Rejected: the raise is tested behaviour that answered a round-3 complaint (gifts hidden behind a surface the player opened).
- **Re-home the offer to a Waiting row and lift the Needs-you pill instead (chosen).**

### Avatar arrival

- **Register it as an interrupt (THR-1828's words).** Rejected on the registry's own contract: each `isOpen` mirrors a surface that renders, and closing an entry resumes the clock. An arrival has no surface, and the player, not the game, resumes it.
- **A named pause (chosen).** The time control names it and Needs you lists it, which are the decision's two goals.

### The hand at the rail's limit

- **Scroll inside itself first (THR-1828, THR-1820 § 2).** Superseded by Law 57's order: grow, then go progressive (Law 36), then scroll only inside what is left.
- **A compact one-line card form before grouping.** Considered as a middle step. Rejected: a third state to test for little gain, and it hides the target words players need to pick a card.
- **Group by target kind (person, place, land).** Considered; card-first means the god knows what they want to cast, and the sphere is the tint they already read and the pool they pay from. Group by sphere (chosen).
- **THR-1827's strip fallback.** Kept as the kill criterion, as THR-1828 kept it.

### What the hand is called on screen

- **"Your hand" (the decisions' word).** Rejected for the label: the UL defines a hand as per-step and encounter-level (`Encounters.md` § Repertoire), and an encounter plays its own dealt hand of nudge cards. A rail header saying "Your hand", and THR-1829's rest line "Your hand is in play on the Stage", would tell the player the rail's map cards are in play during an encounter (PC-6).
- **"Your works".** Rejected: the UL's Work is the object an undertaking leaves behind, and the Threads rows already use the word that way.
- **"Your cards" (chosen),** with "the hand" kept as the design-doc name and the naming question filed on THR-1882.

### When the top bar is short of room

- **Hide the lowest-priority item.** Rejected: a control that vanishes when the bar is full is the "silently missing" failure Law 58's fallback rule exists to prevent, and THR-1834 says top-bar items always carry their word.
- **Ellipsize everything evenly.** Rejected: the words that matter (labels) would be cut along with the words that can wait (a stage name, an omen's name).
- **A fixed yield order that moves secondary text into tooltips (chosen):** centre slot, time status tail, doom stage name, omen name, then the direction line's short form. The worst reachable state (every item revealed while the opening direction line is still up) is 2,103 px before yielding and 1,713 after, at 1920.

### The hand's press before the Inspector exists

- **No press until THR-1876 arms cards.** Rejected: a row that looks pressable and does nothing is Law 25's "silently inert", which is today's defect (the Actions rows' `onFire` is unwired).
- **Open the card's Codex entry (chosen).** A real, useful press that THR-1876 replaces through one provider.

### The Chronicle tabs

- **"Years" = everything older than the current year.** Rejected: at a year's turn Now would empty at once.
- **Now = a rolling four-season window; Years = the whole Chronicle by calendar year, shown once it spans two years (chosen).** The two tabs are two views of one list, like a feed and its archive, so one entry may appear in both. The tab appears when it would show something Now does not (Law 25).
- **The Ledger tab as a pure button that opens the reader.** Rejected: a tab must select a panel (WAI-ARIA tabs, THR-1885). The tab lists chapters and opens the reader at one.

### The strip while the Inspector is docked

- **A strip press unfolds the rail beside the Inspector.** Rejected: rails + Inspector leave the map 35% at 1080p, far under the 0.45 floor.
- **A strip press closes the Inspector and unfolds the rail.** Kept as a kill criterion: it loses the player's subject.
- **A flyout over the Inspector's edge (chosen).** It is transient, so the budget is untouched, and Esc closes it first.

### The date

- **"Season · year, day N" (the mock).** Rejected: the game has no calendar day, and THR-1747 forbids deriving one from the attention clock.

## Tensions weighed

- **Law 13 and the speed readout "2×".** A numeral, but a control setting, not a world magnitude; THR-1828 fixed it, and today's World Pulse shows the same. Recorded, not changed.
- **Law 57 and one-line rows that ellipsize.** The list's width is its fixed limit, and the full line is one hover away. The alternative (two-line rows) halves capacity.
- **Law 58 and components.** Lists are data in `src/data/` for Node tests; components sit in exhaustive `Record` maps, so a missing component is a type error rather than a runtime blank.

## Vision premises leaned on

- `01-core-loop.md`: "one story at a time, not a dashboard". Counts the god does not act on leave; moments queue named behind the one on screen.
- THR-1823 direction B, "the map is the table": the map-share floors at both screens, and the one-row bar that protects them.
- `02-non-negotiables.md`: "mechanics surface through prose, never numbers". Counts and pool balances only; elapsed words, never ticks.
