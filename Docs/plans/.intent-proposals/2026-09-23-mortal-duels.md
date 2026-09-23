# Action Proposal — mortal duels (Physical Conflict plan doc 5 of 6)

## intent_quote

Christian, chat, 2026-09-23:

> the learnings and direction here is good, make sure we also are prepared to integrate spells when we get those up and running. this is a large design as far as i can see at the level of encounters and undertakings?

> well i am going to bed. you have tons of tokens and time all night to work on this map, you have free roam to take the feature as far as you can design wise. also you can move elements of it into ready for dev so there is enough for our execution agent to work on tonight also. see you tomorrow

Charter rules 3 and 4 (Christian, 2026-08-26, map Notes): **"Two modes: NPC mode … and agent mode (fully fleshed agents, slightly deeper)"** and **"Agent-mode depth = opposed band-pairs + a mid-fight event table."**

## scope (what this plan does)

Agent mode, in three slices:
- **Opposed exchanges:** the opponent's roll is synthesized per step on the six-band ladder. The band-pair matrix drives both clocks (2 each). Both sides take nerve and concession checks.
- **The victor decides:** a mercy decision (spare or finish) through plan doc 1's guards and funnel; the opponent's own ending record.
- **Grudges boil over:** injury-class grudges trigger duels at colocation, scaled by the bolder side's courage, on a grudge-duel cooldown of their own, with both duellists held in place for the fight.

It carries out THR-1264, THR-1267 (mortal half) and THR-1266 (duel endings).

## scope (what this plan does NOT do — explicit non-goals)

- No UI; duels render through plan doc 4's header. A both-clocks addition is recorded against plan doc 4's F2.
- No road ambushes, assassinations or duels of honour (the v2 layer).
- No contestation-based round resolver.
- No conversion of the authored duel scenes (`social.challenge_duel`, `encounter.honor_duel`, `encounter.arcane_duel` and the two support-NPC duels). They are authored branching scenes, and converting them is its own design (E4, descoped).
- No new divine verbs: the god's cards act on its own threaded mortal only.

## impact_class

Reversible. The mode and fields are additive, and the one new template is spawn-only until E3's trigger. It is ruled design (charter rules 3–4).

## evidence cited

- **Linear issue:** THR-1258 (closed map); decision tickets THR-1264, THR-1267, THR-1266, THR-1532, THR-1531.
- **Vision premises invoked:** relationships become stories; the god is not the protagonist; emergence balanced by authored moments.
- **UL terms touched:** Grudge, Encounter. New term **Duel** (an agent-mode fight), seated by delegation.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §7 and §10.7, `Docs/canon/encounters.md`.
- **Prior work built on:** the THR-731 band opposition (`synthesizeBandCounter`), the THR-1438 grudge causes, and the plan docs 1–3 in this set.
- **Rejected approaches:** a contestation pairing, two independent fights, clock 3, a fixed kill chance. Reasons are in the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node or edge:** respected; this plan adds no new types.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (~475 importers) gets additive optional fields. The plan's own Blast Radius section covers `unifiedAction.ts` (501), `unified-action-templates.ts` (164) and `trace.ts` (134).

## kill criteria

- If E1's 400-duel CLI run misses any of THR-1264's four named classes (49 / 4 / 23 / 13) by more than 8 points, or two bold fixtures ever yield, stop and diagnose before merge.
- If any pair duels more than 3 times in 200 ticks, or more than 10% of grudge duels end `separated`, the eligibility is leaking: fix before tuning.
- If an `old_quarrel` grudge ever spawns a duel, that's a blocking defect.

## explicit user sign-off

N/A (Reversible). The charter and delegation are quoted above.

## author notes for the judge

- **After run 4 (Allow, 2 GAPs and advisories), folded in before commit:** G1: `fight.duel.grudge` registers in a new `FIGHT_ENCOUNTER_TEMPLATES` that `getAnyEncounterById` searches (not `SOCIAL_ENCOUNTER_TEMPLATES`, which it never reaches), with a test. G2: `fightCooldowns` stores expiry ticks, so the lair prune cannot cut the grudge cooldown; the amendment is on M4's ticket (THR-1547), with an E3 test. Advisories: the calibration resets state between duels and pins the weak raw clash at 15 (A1); E3 counts spawns only (A2); skip traces are bounded (A3); the opening line is the nerve step's prose, so no duel aborts before `fightState` exists (A4, also noted on FB7's ticket for `fight.lair.confront`); E2 fills `opponentEnding` and the blast row lists every opponent-side field (A5); unused salts (A6); the company holds for the duel (A7); the two senses of "standing" are told apart (A8).

- **Revised after run 3 (Revise, 2 required):** R1: E1's calibration now has six classes that sum to 100% (stronger by clock, weaker by clock, struck down, broke off, routed, yielded), targets 49 / 4 / 23 / 13 with the 11% remainder identified as routs (bold duellists never yield, so yielded is exactly 0), both fixtures' nerve reach pinned, the strong fixture as actor and complications off, and a diagnostic fallback if routs are not the remainder. R2: the busy set keys on `fightState?.opponentId ?? targetId` for any unresolved fight action (the opponent is busy from the spawn), company marches skip a duellist (`runGroupMovement`), and a `pickedThisPass` set stops two duels in one pass. Advisories: E2's `trace.ts` edit and mutexes, the stale Blast Radius row (E1 registers the template, via `SOCIAL_ENCOUNTER_TEMPLATES`), the constants' home; the one-sided grudge narrowed to `faction_war` plots and the wider UL Grudge amendment; the ally read excludes the opponent (a plan doc 2 rule); the avatar never duels; `createUnifiedAction`'s required inputs and the phase's new returns; the proposal's wrong template id fixed; the kill draw only after the guards (plan doc 1's order); "renown" is now "standing". Correction comments go to THR-1267 and THR-1264 at handoff.

- **Revised after run 1 (Revise, 12 findings):** a loser who yielded or routed is never finished, and the victor's mercy runs only over a beaten loser (`opponentLoss`); the god's own mortal is always the duel's actor; a new §2 sets out the opponent side (its inputs, harm, conditions, events, the clock mailbox and quarter), with complications drawn on the actor's step; `fightMode` and `opponentLoss` are on `fightState`, and E1 supplies F2's live both-clocks capture; the cooldown is plan doc 3's `FIGHT_TRIGGER_COOLDOWN_TICKS` under one pair-key rule, with one clamp, a stated courage scale and a `skipped` field on the trigger trace; the escalation roll has its own seeded sub-stream; 'advantage' replaces 'edge', and Duel is disambiguated from `encounterType: 'duel'`, with the UL Grudge entry amended; a Blast Radius section and kill criteria are in the plan, and E1's calibration is re-derived in THR-1264's categories; the substrate inventory names every duel-family encounter; **E4 is descoped** (the two authored duels are god-choice branching scenes, and converting them is its own design); the injury rule is the gate's own `isInjuryProvenance`, and the cancelling Old-wound advantages are recorded.

- **Revised after run 2 (Revise, 10 findings):** the loser's face lives in a new `fightState.opponentEnding` (E2), while `ending` stays the fighter's; the aftermath keys on the result only and faces reach the player through chronicle lines and chips; the mercy fork's trace fields moved to E2's `fight.ending` extension; both duellists need empty movement queues, and an unresolved fight's opponent joins the decision phase's busy set (one live fight per mortal), with an `opponent_gone` row for an opponent killed elsewhere and `separated` counted by E3's CLI; E3 is blocked by M4, M1 and E2, E1 by FB7 and FB6, and the `fight.duel.grudge` template moved into E1; the both-clocks capture is owed by whichever of E1/F2 lands second; E3 exports `isInjuryProvenance` (mutex with D1) and E1 is mutex with M2 (`unifiedAction.ts`); wiki pages are named per slice; the opponent's momentum, advantages, wounds, blows and harm have `fightState` fields; `pairCourage` is the bolder side's courage, and the one-sided `attempted_killing` grudge is recorded; the opponent roll has its own stream (`DUEL_OPPONENT_STREAM_SALT`); results rows for a double rout, a double yield and rout-before-yield; its own `GRUDGE_DUEL_COOLDOWN_TICKS` (80) with the per-pair pace derived; the yield share (11%) is calibrated and "stronger wins" excludes yields; Vision tension #2 is cited; the opening line's missing grudge cause is explained (no enrichment token).
- This doc depends on plan docs 1–3 being merged first. Their slices block these by design.
- The one cross-doc UI item (agent mode shows both clocks) is recorded here and assigned to plan doc 4's F2 scope, so it isn't lost between docs.
