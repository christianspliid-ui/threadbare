# Package critic — The Widow's Dream (slot 6, slug cunning-fair)

templateId: encounter.town.cunning_fair
packageVerdict: connected
packageLeaves: A true reading of the widow's dream gives the mortal a talisman drawn from the world's #talisman items (a better one on the best ending), raises their standing in the town or village where it happened, strengthens the god's thread to them, and leaves a hidden mark (they know there is coin in the widow's house) that steers them toward shadow and settlement work until it surfaces; a wrong reading lowers that standing and thins the thread.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {location} (crit, success, success_at_cost) | the mortal's standing with this settlement | `location` via `$here`, linked | yes: `{location}` enriches to the settlement's name (in the noun and the detail), and it is set up in the P3 stake "loses trade in {location}" | anchored |
| BOND · reputation with {location} (failure, critical_failure; loss) | same edge, down | location, linked | yes | anchored |
| BOND · thread (three success bands) | the ascendant ↔ mortal thread, strengthened | `thread` edge, named (tooltip `ui.thread`) | yes: "The thread to {actor}" | anchored |
| SCAR · thread (two failure bands) | the same thread, weakened | thread, named | yes | anchored |
| PATH · hidden mark (three success bands) | the `secret_knowledge` mark on the mortal | tooltip `ui.hidden_mark` (a GameState record, so a tooltip is its anchor form, as in one-body-short) | yes: "there is coin in the widow's house", the thing the band's overview shows coming down the chimney | anchored |
| PRIZE (engine, three success bands) | the drawn `#talisman` item | possession, linked (the drawn template) | the engine names it | anchored |
| growth · veil reach (fallback only) | veil reach | reach, named | yes | anchored |

No fold and no bind. The widow is not cast and no chip claims her. She is scene fiction and lives only in the overviews, which is correct. `{cast:rival}` appears in the overviews but carries no chip, because nothing is written onto the rival.

Fixed in this pass (applied before this verdict): the hidden mark's `revealFamilies` was missing, so the PATH chip pointed at a write no system read. The chip was anchored but dead downstream, and it is now read by `evaluateMarkReveals` / encounter scoring. The chip sentence's overclaim ("what coin the widow keeps") now says only what the mortal saw. The reputation chip wording no longer implies different magnitudes over one fixed write.

## Half B

What it leaves behind:

- a **possession**, drawn by tag and scaled by band, that the player sees as the PRIZE chip and on the sheet;
- a **Location reputation** edge with the settlement, which settlement standing and later location-gated draws read. The player sees it as the place-named BOND/SCAR chip with a link to the town;
- a **thread** change, which the Threads panel shows;
- on a win, a **hidden mark** that raises the score of `shadow`-family and `settlement`-family encounters for this mortal. When one resolves, the reveal speaks "the coin in the widow's house" aloud in the chronicle, and otherwise it decays into a quiet chronicle line.

A player will recognise the talisman, the standing and the thread straight away. The mark is recognised later, when the reveal line names it. **connected**.

PACKAGE PASS (FIX applied: the hidden mark given reveal families and an honest label, and the reputation chip magnitudes normalised)
