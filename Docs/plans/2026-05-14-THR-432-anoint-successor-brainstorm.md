# THR-432 — Anoint Successor — Brainstorm Companion

**Date:** 2026-05-14 · **Author:** Cowork · **Plan doc:** `2026-05-14-THR-432-anoint-successor.md`

This is the dialogue layer behind the tight plan doc — the alternatives considered, the tensions surfaced, the Vision premises invoked.

## The premise

THR-400 deferred Anoint Successor because it needs a "succession subsystem that doesn't exist yet." The interesting discovery on opening the codebase: **there is no succession concept at all, because there is no *leadership* concept** — the faction leader is recomputed from reputation scores every time anyone asks. There is no seated leader, no leader-exit event, nothing to inherit. So this issue is not "add a verb" — it is "make leadership a thing that can be conferred, then let the player confer its future."

## Considered alternatives

**A. `will_succeed: successor → leader` (the issue's literal sketch).** Rejected. When a leader dies, `phaseAgentLifecycle` removes the node *and all its edges* — the succession edge would be destroyed at the exact moment it matters. Pointing the edge at the faction instead makes it survive any exit cause. This was the single biggest design correction; everything else followed from it.

**B. No `leads` edge — just bump the successor's `member_of` reputation so score-derivation picks them.** Tempting (smallest blast radius, zero changes to leader-resolution functions). Rejected because: the anointment wouldn't *stick* — another member out-growing them by reputation next tick would silently un-inherit them; it conflates "reputation" (an evolving social score) with "is leader"; it isn't inspectable as "this person was anointed and inherited"; and it violates the load-bearing decision that relationships are edges. The `leads` edge is more work but it is the actual subsystem the issue asks for, and it is reusable (Schism's split-resolution will want it; a future retirement system will want it).

**C. A leader-exit *event* hooked into `phaseAgentLifecycle`.** Rejected — couples the lifecycle module to succession, and only catches death (schism removes `member_of` edges without removing the node; retirement doesn't exist yet). The snapshot-comparison approach in `phaseFactionSuccession` is cause-agnostic: it detects "the leader we last saw is no longer a living member," whatever caused it. Death works today; schism and retirement compose for free.

**D. Fire the inheritance encounter on *every* leader exit, anointed or not.** Rejected — most leader changes are unremarkable simulation churn (a low-rep member dies, the next one is leader). Reserving the ceremony — the `leads` edge + the encounter — for *anointed* succession keeps it special: the encounter only happens because the player wove the thread. Un-anointed exits still emit a trace (inspectability) but produce no scene.

## Tensions surfaced

- **Recency vs. primacy for re-anointing.** If you anoint A then later anoint B for the same faction, who inherits first? Settled on recency ("a god's current will supersedes") with primacy as a one-line flip if Christian prefers it. Flagged in plan §15.
- **Two leader-derivation functions disagree** (`factionNetwork.ts` uses leadership score, `phaseFactionActions.ts` uses raw reputation). Not fixed here — out of scope — but routing both through `getAnointedLeaderId` means the *authoritative* anointed case is consistent across them even while the *fallback* still differs. Pre-existing debt, left as-is.
- **`crudType` of the verb.** `anoint-champion` (the named companion) is `update`; Anoint Successor is `create` (it creates a `will_succeed` edge). Went with semantic correctness over companion-mirroring; flagged as low-risk for the executor to revisit.

## Vision premises invoked

- **Non-Negotiable #1 (god, not protagonist):** the verb's whole shape is "you choose *who*, never *when* or *whether*." The player weaves the thread; the simulation decides when the crown falls; the successor decides accept/refuse. This is the cleanest expression of indirect divine influence in the faction-verb set — it is *entirely* a condition set in advance, resolved by the world.
- **Non-Negotiable #2 (the thread is the substrate):** the verb is literally a thread metaphor — "an invisible thread of inheritance." The payoff lands as an encounter on the chosen mortal.
- **Cool failure:** "Refuse the mantle" is not a loss — it's a `refused_inheritance` mark, "the thread they cut," available to future content. A successor who walks away from a crown is a more interesting character than one who takes it.

## Why this one, this session

WSJF triage: of THR-400's three remaining undesigned deferrals, THR-432 is the cleanest — well-specified substrate in the issue body, no new Vision-level UX decision required, a clear companion pattern (`anoint-champion`), and the `leads`-edge subsystem is genuinely foundational (Schism will reuse it). THR-431 (Reveal Corruption) was explicitly *not* chosen: it needs a new Vision-level "suspicion mechanic / hidden-until-suspected" decision that warrants a brainstorm session with Christian before design — designing it autonomously would risk drifting the game's legibility model. THR-433 (Kindle a Calling) is designable but less foundational and slightly larger (per-faction latent-candidate authoring). Sequencing recommendation in the session handoff.
