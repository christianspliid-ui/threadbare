# Brainstorm companion — the board reads the place (THR-2071)

Companion to [`2026-10-26-thr-2071-board-reads-the-place.md`](2026-10-26-thr-2071-board-reads-the-place.md). Design lane run 2026-10-26g.

## Vision premises engaged

- **The world does not wait for the god** (Law 13). A mortal in a busted province or a haunted town should act like someone living there. Today the place shapes the shortlist and then drops out of the choice.
- **The game never promises what the world will not do** (Law 45). A place trait the player can read ("Haunted") implies uncanny scenes for the people there. That implication is only half kept today.
- **Simple frameworks, richness in connections** (Law 42). One seam that carries every context term, rather than one pull per system.

## The finding that reshaped the ticket

The ticket reads "`scoreUnifiedBoard` never reads `finalScore`". Measured, `finalScore` is the shortlist gate: the top 5 by `finalScore` are the only encounters the board sees. So the context terms already work as an *offer* filter. What they lack is a say in the *pick*. That changes the fix from "make the board honour finalScore" to "carry the context into the pick, and leave the offer alone".

## Alternatives considered

| Option | Why not |
|---|---|
| Board reads `finalScore` directly | `finalScore` folds in novelty, the share ceilings, the curator, the doom/omen bias and familiarity. Those are the world deciding what to show, and the board already has its own variety penalty. Also changes the currency undertakings are compared in. |
| One pull per term (THR-2067 shape, `1 + W × term`) | Seven constants and trace fields for one idea. And the absolute form is too faint: an economic row of 0.03 leans ×1.03. THR-2040's larder term failed its census in exactly that range. |
| Ratio form without a cap | A scene with base 0.02 and one reputation bonus of 0.06 would lean ×4. The prototype hit the ×2 cap on 12.6 % of winners, so the cap binds and is needed. |
| Normalise pulls across the shortlist (mean pull = 1) | Keeps the encounter-vs-undertaking balance by construction, but the measured share moved only 6.27 % → 6.67 %, so the extra machinery buys nothing. |
| Put exploration and the doom bias on the board too | Both are the largest terms (exploration 0.4 on 67 % of shortlisted candidates). They are pacing: they decide what the world puts in front of a mortal. Moving them would change what the doom clock means, which is not this ticket's call. They stay where they are. |
| Include the god's steering verbs now | They were zero on all three headless worlds, so their effect could not be sized. Split to THR-2073 with a census that casts the verb. |

## Tensions

- **Window vs pull.** A ×2 pull can lift a half-fit candidate past an in-window one. That is the reach `roleAffinityPull` already has, and the window still multiplies first. If a future census shows mortals drifting out of the 50–65 % band, the cap is the knob.
- **Reputation is nearly everywhere** (68 % of shortlisted candidates). It nudges most picks a little. That is its shipped intent (THR-641), now honoured.
- **Faction boosts stay weak** after the change (8.0 % of mixed boards won vs 40.1 % share). They mostly sit on low-value faction scenes that lose on value. The pull is honest about that rather than forcing them.

## Measurements

Prototype branch [`proto/thr-2071-board-context`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2071-board-context). Scripts `scripts/_scratch-board-terms.ts` (term sizes, board-vs-finalScore disagreement) and `scripts/_scratch-board-ctx.ts` (on/off via `CTXW`). Seeds 42/99/7 × 240 ticks, medium, on `main` @ 5c02b28e. Both arms ran about 3 minutes each.
