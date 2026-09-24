# Action Proposal — Unwatched builders step back (THR-1523)

## intent_quote

> take a look at the linear board and the wayfinder map and see how far we got last night, then lets finish off what wasn't done and progress the next designs

(Christian, chat, 2026-09-24 07:44 local.) THR-1523 was one of the three designs the hourly briefing listed as waiting (*"the lane drafts THR-1523, THR-1526 and THR-1528 … design stays in chats with you"*).

The ticket poses options A–D and says the choice is *"not the executor's to settle"*. That makes it a design session's work. **The authority to decide is `Docs/canon/process.md` § User review interface rule 4** (`:53-57`): the 2026-09-10 ruling ("attention follows ambition", THR-1348) is an agreed outcome with stated acceptance tests, so choosing *how* to honour it is not a fork in what the game should mean. Per rule 4, *"A ticket author writing 'this needs a decision' does not make it Christian's decision"*, and when unsure the session presents the decision *"as made, with an invitation to veto"*. The veto is presented **in chat** (THR-608: Christian is chat-only), and the presentation is recorded on the ticket afterwards.

## scope (what this plan does)

The plan chooses option B, as **unwatched builders step back**. A spotlight mortal who holds an active strategic ambition becomes a demotion candidate when:
- every existing filter passes (deciding tier, not busy, not the avatar, no non-dormant thread, commands no army, holds no seat);
- they are not travelling (`movementState.movementQueue` empty);
- they are not followed (`state.followedAgentIds`);
- they are not deceased;
- they have gone unwatched and idle for `SPOTLIGHT_UNWATCHED_BUILDER_TICKS` (72). Their last activity is the latest of their last witnessed encounter, their own pull, their latest undertaking progress, and tick 0 (the floor).

The ambition-less candidates keep priority. Pulled mortals can go unwatched too, but are never pulled again. Turnover is capped at one unwatched demotion per 12-tick day. A lever, `SPOTLIGHT_UNWATCHED_BUILDERS_ENABLED`, turns the class off exactly.

The plan also corrects two defects the research found in the same module:
- **one pull per holder per batch**, in births and re-evaluation, which halves the double-counted refusals;
- **the retained dead never count** toward overflow, the allowance or either candidate class.

The rulebook sentence (`:419`) and UL Spotlight tier change with it.

## scope (what this plan does NOT do — explicit non-goals)

- It does not raise `SPOTLIGHT_AMBITION_PULL_MAX` or the overflow share (option D, rejected).
- It does not change the births writer's ambition pool (option C, rejected).
- It does not add a retry queue for refused holders.
- It does not fix THR-1562 (the reach-floor scale defect), which is filed separately and sequenced as a mutex.
- It does not write a chronicle line for a demotion (existing parity).
- It does not put pulled mortals on the hex map (a THR-1348 plan claim that is untrue; noted, out of scope).
- It changes no UI component. The Follow button's words are filed as THR-1573, blocked by this issue.

## impact_class

Reversible. The new candidate class sits behind `SPOTLIGHT_UNWATCHED_BUILDERS_ENABLED`; false restores today's candidate set less the retained dead, because the deceased correction is not gated (a corpse holding a slot is a defect in any mode). Both halves are pinned by tests. The two corrections are additive: the dedupe changes the count of trace entries, not behaviour, and the deceased exclusion only removes phantom slots.

## evidence cited

- **Linear issue:** THR-1523 (and its parent THR-1348).
- **Vision premises invoked:**
  - `Vision/00-north-star.md:15`: *"The player has a handful of mortals they know by name"*.
  - `Vision/00-north-star.md:47`: *"The player who saw one mortal's full arc is having a better time than the player who touched fifty."*
  - `Vision/01-core-loop.md:51`: *"the choice of whose story to witness is the player's"*.
- **UL terms touched:** Spotlight tier (`Docs/ubiquitous-language/Agents.md:37-47`, one clause added; *unwatched* is the game word); Ambition (read).
- **Canon pages consulted:** `Docs/canon/rulebook.md:419` (the "Attention follows ambition" rule being amended); `Docs/canon/process.md:53-57` (rule 4, the authority); `Docs/canon/rulebook-quick-reference.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-21-thr-1348-attention-follows-ambition.md` (the pull; its kill criteria and tick-cost ceiling carry over).
- **Interface contract:** `strategic-ambition-pulls-holder-into-spotlight` (`scripts/interface-contracts.ts:1081`), extended.
- **Rejected approaches considered and dismissed:**
  - A: freezes the spotlight.
  - C: no pool; loses seed 99's evidence; no age model.
  - D: does nothing at medium; breaks the tick-cost ceiling.
  - a retry queue: births refill slots anyway.
  - a demotion chronicle line: parity.
  - protecting by importance: importance is a rarity score, not the player's attention.

## load-bearing decisions touched

- **"Engine caches must be owned per session"**: not touched. The new key is a node property in the existing ledger, not a module cache.
- **"Relationships are graph edges, not property fields"**: the new `spotlightUnwatchedDemotedTick` is internal bookkeeping (a tick), beside the existing ledger keys, not a relationship.

## high-impact files touched (from Codesight)

`src/types/trace.ts`, 135 importers (`.codesight/graph.md`, 2026-09-24): two optional fields on one existing trace entry. The plan carries a Blast Radius section.

## kill criteria

- More than 30% of worldgen protagonists stepped back by tick 150 (seed 42 or 99): tune the constants, then re-measure.
- Any followed or threaded mortal demoted, or any mortal whose undertaking progressed inside the threshold: a filter bug.
- `census:undertakings` fails: lever off, back to the ticket.
- Tick cost more than +5% over main at medium: find the leak before tuning.

## explicit user sign-off

Not required (Reversible, and the fork is how to honour an agreed outcome). The decision is presented to Christian in chat on 2026-09-24, in game terms, with a veto invited; the presentation is recorded on THR-1523. A veto becomes a plan revision.

## author notes for the judge

- A research agent read every caller, the constants and the census scripts before this was drafted. Three of the ticket's premises were corrected: the swap pool is empty from tick 0; 9 of 10 standard templates are strategic; the refusal count double-counts. The plan states the corrected facts.
- **The floor and the undertaking term are the load-bearing details.**
  - The floor: the existing ordering treats never-witnessed as infinitely stale. That is right for ambition-less candidates, but for builders it would demote the whole worldgen cast on day one.
  - The undertaking term: a builder working off-screen is active, not "unwatched and idle".
- **THR-1562 interacts.** Fixing the reach-floor scale will change which mortals hold strategic wants. The plan sequences the two as a mutex and tells the executor not to tune against numbers THR-1562 will move.

## revision notes (second judge pass)

The first pass returned Revise. The plan was rewritten, and this proposal and the brainstorm now match it:
- **Authority** re-cited to process.md rule 4. The earlier citation of the 2026-09-11 delegation did not cover this ticket.
- **Veto** presented in chat, not on the ticket.
- **Interface impact** section added (the contract at `:1081`, extended).
- **Anchors** corrected: rulebook `:419`; Vision `00-north-star.md:15`, `:47`; `01-core-loop.md:51`.
- **Blast Radius** carries the importer count.
- **The class was renamed** from "stale" to "unwatched", and it gained the undertaking-progress term, so a builder whose work advances off-screen is never demoted.
- **The debug surfaces** (`debug-bridge.d.ts`, `scripts/cli.ts`) are in the files list.
