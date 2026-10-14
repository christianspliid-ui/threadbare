# Pass 3b — Package critic: The Salt Monopoly
> Slug: salt-monopoly | Date: 2026-10-14 | Cold critic, THR-1757 master batch 2, slot 2

templateId: encounter.town.salt_monopoly
packageVerdict: connected
packageLeaves: The mortal walks out holding the town's Gate Seal Case and with their standing in the town moved up or down, and on a win the rival salt house's factor is seated, by name, as the rival bidder when The Mill Lease finds the mortal later.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| `salt.cs/s/sac.seal_case` | the Gate Seal Case the clerk hands over with the licence | `attachment` (template id `reward_tools_instruments_gate_seal_case`), linked | yes — after the fix, step 1's success-side afterimages say the clerk gave `{actor}` "the seal case that stamps the town's salt at the gates"; chip title is the item's own name | anchored |
| `salt.cs/s/sac.town` | the mortal's standing with this town | `location` `$here`, linked | "{location} trusts {actor} with its trade" | anchored |
| `salt.f/cf.town` | the same standing, lost | `location` `$here`, linked | "{location} thinks less of {actor}'s word on money" | anchored |
| `salt.cs/s/sac.next_lease` | the seed carried by the mortal; the factor who will come back | carrier `$actor` (agent, linked); **added** concept `$cast:merchant` (agent, linked) | "{cast:merchant} will bid against {actor} for the next lease" — names both | anchored |

### The author's question: is the possession honest about what the mortal holds?

The brief asked for "the licence itself, or the pledge given for it". No licence item exists, so the author used the Gate Seal Case — a real possession whose catalog flavour is wax seals, chalk and a customs stamp, "how power hides in paperwork". The substitution is lawful and reads well, **with one correction**: the draft's chip claimed "{actor} carries the stamp that marks lawful salt" and called it "the licence-holder's stamp", but the licence-holder is the town, and no line of prose ever put the case in the mortal's hands. A player would have seen an item appear on the sheet with no moment that gave it to them.

Fixed: the town holds the licence (cs overview, s overview, sac overview all say so), and the clerk hands the mortal the gate seal case with it (step 1 cs / s / sac / near-miss afterimages). The chip now says only what is true — cause "Handed over with the licence", detail "{actor} holds the stamp for the town's licensed salt." The item's name, "Gate Seal Case", is explained in the prose by the salt being stamped at the town gates. The pledge half of the family is the sac reaction's `agreement.debt.minor` (counterparty the clerk), which the sac overview now poses directly ("someone must stand for it").

Half A: all chips anchored after the applied fixes.

## Half B — what it leaves behind

Three things, each read by something else and each visible:

1. **A Gate Seal Case** on the mortal's possessions — a live item with real effects (+Eye / +Gold, +Gold in social), so the next gold or social scene reads it.
2. **Reputation with the town**, up on a win, down on a loss — read by every `reputation_with` gate and by the reputation sheet line the chip names.
3. **On a win, a seed into The Mill Lease** with `inheritContext`. Traced in code (see the systems file § 4): the inherited `merchant` binding lands in the mill lease's `merchant` slot by key, so the same factor is the rival bidder there, named in its step-1 spine ("{cast:merchant} bids first …"). The player will recognise them — same name, same role, the grudge coming back — which is exactly the brief's "the losing house's factor does not forget". The cs/s reactions add a `bond_change` with that same factor, so the sequel's rival arrives already warmer or colder.

Verdict: **connected**.

## Fix-list (applied to the package)

1. Seal case chip: cause and detail rewritten to what the mortal actually holds.
2. Step 1 success-side afterimages (cs / s / sac, and a new near-miss line) hand the seal case over.
3. PATH chip: added `$cast:merchant` concept so the chip links the person who will return, not only the carrier.
4. Factor `spawnName` → "Edric Varne" so the inherited binding does not clash with the sequel's he/his prose.

PACKAGE PASS
