# Action proposal: The pool says how full it can get, and the sheet says what grew (THR-2143)

## intent_quote

THR-2143 was filed by the cold-playtest lane from round 6, under the shared Linear user. Its design question and recommended direction, verbatim:

> **Design question.** Where does the player read the cap, the refill and the upkeep of a pool as a number, and how does an Aftermath gain show on the sheet the moment the player opens it?

> 1. The essence tooltip names the cap ("holds up to 55: 50, plus 5 for each thread") and says upkeep comes from the deepest sphere, with the per-day amount.
> 2. An Aftermath gain marks the sheet row it touched (a ▲ beside the word until the player has seen it), even when the word did not change.
> 3. A lean shows on the sheet as a drift ("leaning Scheming") beside Nature, and the axis gets one word per pole.
> 4. Grey Fated stays Christian's ruling. Add a short meaning to the badge's tooltip ("sure, fate needs no help") rather than change the colour.

> **Fixed when** at most one round-7 tester lists upkeep, refill or the cap under "never understood", and no tester says the Aftermath and the sheet disagree about a gain.

The period focus, from Christian in chat on 2026-11-01, as recorded in the design-lane skill:

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules"

Christian answered the one reserved fork in chat on 2026-11-02 (recorded in `Design/user-actions.md` on the `ops` branch), after the design lane asked whether a pool's limit should show as a number — (a) words only, (b) the hover names it, (c) the row shows "53 / 55":

> "feel free to update the sphere essence pool UI to be easier to read and understand. i would suggest a tooltip to describe details (b) + C"

**User sign-off line:** Christian chose (b) + (c), chat 2026-11-02. The plan records it as a dated Law 13 amendment in the same PR.

## scope (what this plan does)

The plan changes how existing state reads on the god rail's essence rows, the person sheet (reach tiles and Nature) and the meeting fate line. It touches no rule.
- The essence bar ends at the live cap.
- The row reads "53 / 55" and the hover opens "Holds up to 55: 50, and 5 more for the mortal you have threaded." (Christian's (b) + (c)); the hover also says when and why upkeep is taken, with the payers counted in words.
- `Docs/design-system/laws.md` Law 13 gains a dated amendment recording Christian's limit exception (balance exception widened to the limit; rates unchanged).
- A reach tile shows the Aftermath's ▲ cluster for three days after a chapter grew it, with a hover that explains an unchanged word.
- Nature shows a meeting lean as a chip, and switches to the axis registry's pole words.
- The fate line says "leans … now".
- The Fated hover gains a first sentence in Christian's words.

## scope (what this plan does NOT do — explicit non-goals)

- No upkeep amount or rate on screen. This departs from the ticket's item 1, because of the Law 13 per-tick-rates ruling (THR-1426).
- No "until seen" state. This departs from item 2: a deterministic three-day window instead.
- No change to the Fated colour (reserved to Christian).
- No economy change (starting pools, cap formula, upkeep order).
- Card tags and pip colours (2/3 testers, no direction in the ticket) were filed and designed separately (THR-2146, built as THR-2147).
- The personality row's `intimate` gate is unchanged.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2143
- **Vision premises invoked:** north star (weigh the cost of a nudge); non-negotiable #3 (mechanics through prose); PC-6
- **UL terms touched:** none new. The value-pair pole words follow the axis registry (`Docs/ubiquitous-language/Agents.md` value pairs; THR-524 vocabulary)
- **Canon pages consulted:** `Docs/design-system/laws.md` Law 13 (pool-balance exception 2026-08-06; per-tick rates 2026-09-10; visibility parity 2026-08-16), Law 15, Law 56; `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md`, `Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md`
- **Rejected approaches considered and dismissed:** see the brainstorm companion's table

## load-bearing decisions touched

- "Relationships between entities are graph edges": the lean is read from the existing thread edge's `meetingChoiceRecord`, with no new property.
- "The world graph is mutated in place": nothing here keys on graph identity; all reads are render-time.

## high-impact files touched (from Codesight)

None with ≥100 importers. Measured with `git grep` on import paths: `ui-content.ts` 43, `agentDetail.ts` 25, `Section.tsx` 11, `godSheet.ts` 10.

## kill criteria

- A round-7 tester again lists upkeep, refill or the limit under "never understood". Next step: if upkeep is the item, ask him whether an upkeep amount may show despite the rates ruling.
- A tester says the sheet and the Aftermath disagree about a gain. Next step: lengthen the window or add per-viewer "seen" state.
- The Nature vocabulary switch draws a "new words I don't know" complaint. Next step: revert to `VALUE_LABELS` behind its fallback.
