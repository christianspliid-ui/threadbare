# Brainstorm companion — master work reaches masters (THR-1757)

> Companion to [`2026-10-13-thr-1757-master-work-reaches-masters.md`](2026-10-13-thr-1757-master-work-reaches-masters.md). Design lane, run `dl-20261013-1918`, decided under delegation (`Docs/canon/process.md` § User review interface rule 4). Open to veto.

## The question as it arrived

THR-1742 measured why the best mortals in a craft rarely take on its hardest work: the work exists, it is near them, it passes every gate, and then the cap's fair draw cuts it from their shortlist four times in five. There is one master everyday template per reach, and the fair draw gives each template about a one-in-five chance of a slot. The ticket handed the design lane two routes and one sub-question: *does a cap reserve for the decider's own band count as "tuning to make the rung pass"?*

## Route 1 — more master content (chosen)

Author more master everyday encounters, one per reach per batch, re-measure after each batch, stop when the rung passes.

**For it.**
- It fixes the cause the audit names. The audit's word is *volume*: one template per reach against ~200 in the draw. More templates is the direct answer; nothing about the cap's behaviour is wrong.
- It keeps the THR-1687 ruling intact. That plan's D2 rejected exactly this kind of band reserve: *"it puts a difficulty preference into the cap, which is supposed to be a performance bound. Preference is scoring's job."* Its brainstorm adds the story reason: an expert who sometimes considers a novice chore and takes it is more alive than one who only sees her own band. A master reserve now would reverse a ruling that has held for twelve days and that Christian did not veto.
- Distinct templates also ease a second cut the probe could not: the cooldown removed own-master work on 17.5% of keep-all decisions, because the probe kept repeating the same eight templates. New templates have their own cooldowns.
- It is what the game is short of anyway. Eight master encounters across the whole world is thin for the people the realm sends for by name. More of them is more game, not a lever.
- It is cheap per batch. THR-1688's batch of eight ran in one executor run of about two hours (claimed 02:29, done 04:41 on 5 Oct).

**Against it.**
- 24 to 48 encounters is real authoring volume, three to six batches.
- Every template added to the draw dilutes every other template's chance a little (eight more on ~200 is ~4% per batch). The journeyman→novice and expert→journeyman rungs could drift. The plan answers this with a guard rail: each batch re-runs the whole invariant file, and a regression on an earlier rung stops the series with the numbers, rather than being tuned away.
- Projections are a model (`1 − (1 − q_K)^K`). The stop rule makes them ceilings, never quotas.

## Route 2 — a cap reserve for the decider's own band (not taken)

Add a Phase 1g to `capWithDiversity` that keeps a slot or two for work in the band the decider stands in.

**For it.** No content needed; the keep-all probe shows ~56% on the board, the same ceiling the content route reaches at K = 7. One PR.

**Against it — and why it is not merely cheaper.**
- It is the THR-1687 D2 rejection, re-asked. The existing reserves (branching, personal offer, social, journey goal, anomaly) each keep a *kind* of thing reachable — content that would otherwise be structurally invisible. A band reserve keeps a *difficulty*, chosen by the decider's own capability. That is a preference, and the forecast window in scoring already owns that preference. Two knobs pushing the same way make a mortal's choice unexplainable (NFP 2).
- It answers the sub-question the ticket asked. The reserve exists only because the rung fails; its size would be chosen by watching the rung. That is tuning the cap to make the rung pass, which the ticket's Done-when forbids. A content batch is not: the stop rule only decides when to *stop adding game*.
- It sands off texture. A master whose shortlist is guaranteed to hold master work stops being a person who sometimes takes the easy coin.

**What would change the call.** If Christian says masters should *always* see work worthy of them — that their standing should pull it to them — that is a fiction claim, and it belongs in the world (a summons, a commission, an appointment that seeks the master out), not in the cap. Such a ticket would be new content design, not this reserve.

## Route 3 — weight the fair draw by instance count or rarity (considered, not taken)

Give templates with fewer instances, or higher rarity, a better key in the own-hex hash draw.

Rejected: it is a band preference by proxy (master templates are rarer by construction, `rarityTier 2`), so it inherits all of Route 2's objections, and it would move every band's share at once.

## Route 4 — widen the scorer's top-five board (considered, not taken)

The board reads only the top five scored. Not the binding cut today (t = 0.95 at current volume); it becomes a second cut only once master work is plentiful (t 0.72–0.80). Touching it moves every mortal's choices, which is the agreed decision board's business (THR-1292), not this ticket's.

## Tensions held

- **Rung vs game.** The rung is a gauge, not the goal. The goal is that masters sometimes take on work worthy of them. The plan stops when the gauge passes, and records it if the last batch passes the rung but master work still reaches under half of master boards — a playtest note, not a reason to keep authoring.
- **Dilution vs coverage.** The fair draw makes the shortlist dumb on purpose; the price is that every band's reachability now scales with its share of the catalogue. That is a property worth stating in canon (the plan's S-last edit), so the next band brief sizes itself against it instead of rediscovering it.

## Vision premises touched

- *Narrative over mechanical perfection* (NFP 5): the master stakes live in who sits across the table, never in a rule gate (master brief, binding rows).
- *A living world of people with lives* (game-design-direction north star): masters who sometimes take the easy coin and sometimes the commission only they can do. Route 1 keeps both; Route 2 would remove the first.
