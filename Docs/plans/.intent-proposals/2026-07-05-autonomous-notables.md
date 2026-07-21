# Intent proposal — THR-614 Autonomous Notables & War (rescoped)

**User's verbatim asks:**
- (2026-07-04) "making core unthreaded npcs autonomous to simulate a living world, like faction leaders, nation leaders, armies etc."
- (2026-07-05 rescope) "i want war to land so i can evaluate real gameplay, so please scope for full gameplay."

**What the rescoped plan proposes:** promote the fully-designed TB-073 conflict system from a deferred ceiling into in-scope core. War = the game's existing divine-intervention loop applied to conflict: faction ambitions raise armies under notable commanders; armies march and lose cohesion; colliding armies form a battle node carrying momentum; the player's gameplay is intervening in spotlight encounters (existing modal + Pull-the-threads/Watch choices) whose POV/depth scale with the player's threads and whose outcomes shift momentum; sieges extend this as a regional gravity well; resolution writes scaled destruction (prosperity collapse, ruins, refugees, commander fate, sphere pressure). Threads are the intelligence layer. No war UI — the player never commands armies (TB-073 north star). Delivered as a **playable vertical (Phase A = THR-614)** you can evaluate end-to-end, then deepened (B battle-depth, C sieges, D aftermath+living-world). Corrections: army health renamed Quintessence→`cohesion` (UL collision fix, also removes TB-073's only blocker); provisions/starvation self-contained so playable war doesn't wait on the unbuilt trade web (Flow Web coupling deferred to THR-626).

**Action being gated:** rewrite plan + restructure into Phase A (THR-614, Ready for Dev) plus follow-on phase issues; re-handoff.

**Key judgment calls for the judge:**
1. Does "scope for full gameplay" justify pulling the entire TB-073 system in-scope, and is phasing delivery (A playable vertical → B/C/D depth) faithful to "I want to evaluate REAL gameplay" (i.e. Phase A must be genuinely playable, not a stub)?
2. Is Phase A a coherent, evaluable vertical (a war you can actually fight and lose), or is it still too thin / too fat for one executor issue?
3. Does the design keep the player as god-who-nudges (no command UI), and respect load-bearing rules (no new node types beyond the blessed battle-node category; relationships as edges; additive reuse of shipped code)?
4. Is the Quintessence→cohesion rename correct, and does self-contained provisions legitimately unblock playable war without the trade web?
