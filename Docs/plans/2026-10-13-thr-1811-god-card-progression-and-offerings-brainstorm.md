# Brainstorm companion — God cards carry their progression as data, and the world offers them (THR-1811)

Companion to [`2026-10-13-thr-1811-god-card-progression-and-offerings.md`](2026-10-13-thr-1811-god-card-progression-and-offerings.md). Design lane, run 2026-10-13a. The grill-me pass was answered against evidence (no person present): the THR-1770 and THR-1794 decision records, Christian's ruling on THR-1770, the shipped Dominion core and the beat substrate.

## Vision premises engaged

- **Each god is its own.** The whole point of Christian's ruling: today's gifts give two gods 3.8 of the same first five cards. The offering takes that to 0.38, and one switch takes it to 0.03.
- **Attention is the spend.** Only essence that flowed into a sphere because the god spent pays for a card. A hoarding god sits at its cap and earns nothing to buy with.
- **Prose carries mechanics.** The tier and the rung never show as numbers. Growth is a beat with words; price is a word.
- **Sphere-tinted cards are loved.** Card faces are reused as they are.

## Alternatives considered

### Which cards the world may offer
The first draft believed the drawer hides cards outside the god's two spheres. The intent judge read `targetActions.ts:458-465`: the sphere gate only counts; the card still shows and casts from its own sphere's pool. So nothing bought off-sphere is wasted, and the choice below is about distinctness, not correctness.

| Option | For | Against | Verdict |
|---|---|---|---|
| **Every market card the reach gate allows (THR-1794 as decided)** | Decided with Christian present; widest choice; 0.38 / 0.52 shared, far below today's 3.77 | Two gods still share some early cards | **Chosen** |
| Only sphereless and in-sphere cards | Measured 0.03 / 0.05 shared, card count unchanged (54.7 vs 55.0 held at day 90) | Re-opens a settled attended decision; narrows a narrow god (Shepherd 49 cards, 3 at tier 4) | Built as a switch, `OFFERING_IN_SPHERE_ONLY`, default off |

### When the offering rises
| Option | Verdict |
|---|---|
| Its own timer every 9 ticks, beside the cadence | Rejected: two beats due at once, one slot (`BEAT_MAX_PENDING` 1); one would starve |
| **A kind in the existing cadence draw, weight 8** | Chosen: one cadence, ~9 ticks as THR-1770 modelled; story beats (introductions, deliveries) can still win a draw |
| Replace the cadence draw entirely | Rejected: introductions and deliveries are story, and NFP 5 puts story first |

### What happens to an ignored offering
Without an expiry, a pill nobody opens holds the one slot forever, and every rung gift and milestone waits behind it. It passes at a day boundary (at least 6 ticks after it rose), so the footer *"They pass when the day turns"* is literally true. Entering pauses the world, so an open offering cannot expire under the player. A passed offering writes no chronicle line: at about one offering a day, a "you let them pass" line would be daily noise (PC-5).

### How often
The ticket and both models use 9 ticks (`MARKET_EVERY`), and every price was tuned on it. THR-1770's option text said "every few days"; with 12 ticks a day, that was loose. The plan keeps the 9-tick cadence the numbers rest on and says *each day* on screen, which is true.

### Where the spend is recorded
| Option | Verdict |
|---|---|
| Decrement `essenceEarnedBySphere` | Rejected: the attunement marks and the rungs read it; buying would un-grow the god |
| **A separate spent ledger; spendable = earned − spent** | Chosen: additive, and the earned counter keeps its "spending never un-earns it" rule |

### The word on screen
"Omen" already means an omen track (UL), a card the god holds (`divine.omen`) and a panel the reveal plan (THR-1837) shows at *A Path Opens*. A player who has just met the Omens panel would read "three omens rise" as three warnings. *Three powers stir* says what they are. The code says *offering*, after the rulebook's new line *"from what the world offers"*.

### The price words
The mock's *within reach / a stretch / beyond you yet* had two faults: *within reach* is already the Codex badge for "you may yet hold this", so one card could read two ways (PC-6), and *a stretch* hid the double price. *Paid from Spirit / From Life, at double / Beyond you yet* says who pays and what it costs, with no number.

### Where the data lives
| Option | Verdict |
|---|---|
| A side table keyed by id | Rejected: Christian asked for metadata on the actions, and a side table can drift from the catalog |
| **Inline `progression` on each template** | Chosen; the ported script reads the templates, so there is one source |

## Tensions

- **A narrow god's top tier is thin.** Under the gate, the Shepherd can be offered only 3 tier-4 cards. The gate's sphere × tier warnings already flag the catalog holes; authoring them is a content pass, out of scope.
- **The cadence is shared.** Early in a run, introductions and deliveries take some draws, so offerings rise a little less often than modelled. The kill criterion watches it.
- **Mutex with two shelf items.** THR-1837 and THR-1750 both touch files this plan edits. Order on the shelf decides; nothing here depends on them.

## Veto lines offered

- *"Only offer me cards in my own spheres"* — `OFFERING_IN_SPHERE_ONLY` on.
- *"Call them omens"* — the screen word goes back to the mock's.
- *"Offerings shouldn't wait for story beats"* — the offering gets its own interval.
