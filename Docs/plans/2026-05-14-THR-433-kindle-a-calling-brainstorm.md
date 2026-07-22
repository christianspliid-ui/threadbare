# THR-433 — Kindle a Calling — Brainstorm Companion

**Date:** 2026-05-14 · **Author:** Cowork · **Plan doc:** `2026-05-14-THR-433-kindle-a-calling.md`

The dialogue layer behind the tight plan doc — the alternatives considered, the tensions surfaced, the Vision premises invoked.

## The premise

THR-400 deferred Kindle a Calling because it "requires an internal-pressure resolver subsystem that doesn't exist yet." The discovery on opening the codebase: a resolver subsystem *substantially does* exist — `phaseFactionAmbitions` already takes each faction's `ambitionWeights`, scores eligible `FactionAmbitionType` candidates against world context, and runs a seeded weighted draw. What does *not* exist is (a) a way for the player to *trigger* that selection on demand, (b) the dynamic bias signals the issue names (member pulls, leader, doctrine, dissent), and (c) the encounter. So this issue is not "build a resolver from scratch" — it is "give the player a verb that reaches into the resolver that already runs, tilts it with the faction's live pressures, and forces it to fire now."

That reframing is what kept the scope honest. The issue body's own engine sketch ("engine-built from ambition history + member pulls + doctrine + leader bias") was pointing at exactly this — the resolver is `phaseFactionAmbitions` extended, not a parallel system.

## The design fork — the one that mattered

The issue body contains two incompatible readings of "latent goal candidates," and the whole shape of the feature depends on which you pick:

- **Reading A — authored.** "For each faction definition, a small set of candidate ambitions (3–5)." A new `latentCallings` field on `FactionDefinition`, hand-authored per faction.
- **Reading B — derived.** "Reads the faction's latent goal candidates (engine-built from ambition history + member pulls + doctrine + leader bias)."

**Chose B.** The deciding argument was Non-Negotiable #4 — *the world simulates around the player*. The rename rationale for this verb (Sanction Mission → Kindle a Calling) is that it *amplifies whatever latent ambition the faction already holds*. An authored static menu is not "whatever the faction holds" — it is "whatever a designer pre-wrote." A faction that has spent forty ticks losing members to a rival, accumulating dissent, watching its leader drift toward ruthlessness — that faction's *real* latent want is legible from its live state, and a derived resolver reads exactly that. Reading A would make Kindle a Calling a fixed menu wearing a "you don't choose" costume; Reading B makes the not-choosing *true*.

Secondary arguments that all pointed the same way: Reading B rides verified machinery (`scoreEligibleAmbitions`) instead of building beside it; it needs zero per-faction authoring and so works for dynamically-seeded monster factions for free; and the "finer granularity" the issue wanted ("expand westward," not just "territorial_expansion") already has a home — `FactionAmbition.targetNodeId`, resolved inside the `calling_named` encounter. The specificity is the *target* and the *prose*, not a proliferated enum.

This is flagged at the top of the plan (§0.1) and in §15 note 1 — it is the one place the executor or Christian could reasonably have wanted the other thing, and if so the design is bigger and needs re-scoping.

## Considered alternatives

**A. Authored `latentCallings` per faction definition** — rejected above. The deeper reason: it also fights Additive-over-Destructive in spirit — every future faction definition would carry a new mandatory authoring burden, and the `FactionAmbitionType` enum would be under constant pressure to fragment ("expand westward" wants to be a type). Keeping the enum stable and pushing specificity to `targetNodeId` is the more durable shape.

**B. Kindle picks the ambition directly, no encounter** — rejected. It would make the verb a clean strategic lever — but it would also make the player the protagonist (they'd effectively be choosing the faction's goal by choosing when/where to cast). The encounter is not decoration; it is the firewall that keeps the player a god. The leadership names the target in a scene the player only watches.

**C. Essence as a flat guarantee (kindling always picks the single highest-weighted candidate)** — rejected. Too deterministic — it would collapse "you do not get to choose which want rises" into "you always get the faction's top want," which is choosing-by-proxy. The `KINDLE_WEIGHT_EXPONENT` sharpening is the middle path: essence makes the dominant pressure *much* more likely without making it certain. A faction with two near-equal pressures can still surprise you. That uncertainty is the verb's texture.

**D. New every-tick phase for the stall-fade** — rejected. The stall-fade (a kindled-but-uncommitted calling cooling back to latent) only needs to happen *eventually*; "fades back to latent after N ticks" is narratively soft by nature. Putting the check inside the existing `phaseFactionAmbitions` (every 5 ticks) costs one property compare per faction and accepts ≤5 ticks of slop — a strictly better trade than a new phase or touching the every-tick `phaseFactionActions.ts`. THR-400's dissent-decay block set the precedent for "additive housekeeping inside an existing faction phase."

**E. Reach `star` instead of `heart`** — genuinely close. "A calling" is a destiny word, and `star` (Wanderer ↔ Anchor) is the destiny reach. Went `heart` because the agent-scale companion is decisive: `divine.inspire` ("Breath of Purpose," "kindles … a sense of calling and passionate purpose") is `heart`, and Kindle a Calling is *literally the faction-scale `divine.inspire`*. Companion pairing won — the same principle THR-432 used to pair `anoint_successor` with `anoint-champion` on `iron`. Left as a one-field flip in §15 note 2 if Christian prefers `star`.

## Tensions surfaced

- **`life` is not a Reach.** The issue wrote `life / force`. `life` is one of the 8 Creation Spheres (`force, matter, energy, life, mind, spirit, time, entropy`) — it cannot sit in the reach slot. This is a small drift error in the issue body, caught and corrected the same way THR-432 caught its `will_succeed`-edge-direction deviation. Reassigned to `heart / force`; `force` (the intended sphere) kept.
- **Army-spawn timing.** `phaseFactionAmbitions` spawns an army the instant it creates a military ambition. A *kindled* ambition is not yet committed — it should not raise an army until the player presses the calling home in the encounter. The resolver therefore must not call `spawnArmy`, and the plan flags a wiring concern (§5.4 / §15 note 4): the executor must confirm no *other* system auto-spawns for an uncommitted kindled military ambition. This is the one real interaction-surface risk; everything else is cleanly additive.
- **Replacing an existing ambition.** The issue says Kindle replaces "any non-locked existing ambition." "Locked" had to be given a concrete meaning — settled on "the faction has already raised an army pursuing it," with a fail-soft refund + prose when the player tries to redirect a war with an ember. The exact army↔ambition accessor wasn't confirmable from the mounted tree (THR-400 unmerged), so §5.4 carries a safe fallback (`KINDLE_LOCK_GRACE_TICKS`).
- **THR-400 is the hard dependency and may not be merged.** PR #276 was blocked by a CI billing failure (impediment #136); `grep` for `action.faction` in the working tree returns nothing this session. The plan is written defensively throughout — the constants file is created-if-absent (THR-432's pattern), THR-400's *runtime* state (`dissentLevel`, `recoveredDoctrineId`) is read as optional so the verb works with or without it, and §16 makes THR-400 an explicit mutex + ordering dependency. The session freshness signal was `unknown` (sandbox git has no network) — the executor must re-verify against `origin/main` at pickup.

## Vision premises invoked

- **Non-Negotiable #1 (god, not protagonist):** the verb's entire shape is "you supply the heat, the world supplies the want." Three firewalls keep the player out of the protagonist seat — the bias layer decides *which* want, the seeded PRNG draws it, the encounter's leadership names the *target*. The player's only choice is the god's choice: press the calling home, or let the room cool. This is, with THR-432, the cleanest faction-scale expression of indirect divine influence in the verb set.
- **Non-Negotiable #4 (the world simulates around the player):** see the design fork above — the derived-candidates decision *is* this premise applied. The calling that rises is the faction's actual accumulated story, not a designer's menu.
- **Cool failure:** "Let the room cool" is not a loss — it leaves an `indecisive_leadership` hidden mark on the leader, "the calling they let go cold," available to future content. A faction that was offered a purpose and declined it is a more interesting faction than one that never had the choice. (Same shape as THR-432's "refused inheritance" mark.)
- **Narrative over mechanical perfection:** the `biasedWeights` map is in the trace for inspectability, but the *player* never sees a number — they read the chronicle band, the kindled-ember glyph, and the `calling_named` scene. The math is for the developer; the story is for the player.

## Why this one, this session

WSJF triage of THR-400's deferral set on 2026-05-14: THR-430 (Schism) is In Dev, THR-432 (Anoint Successor) was designed and handed off earlier today, leaving THR-431 (Reveal Corruption) and THR-433 (Kindle a Calling) undesigned. Both are "No priority" in Linear, but the "finish before you start" rule says complete the deferral set of an active project before opening new fronts — so one of the two was the right pick.

Chose **THR-433 over THR-431** for the same reason THR-432's brainstorm gave: THR-431 (Reveal Corruption) needs a *new Vision-level UX decision* — the "hidden-until-suspected" suspicion mechanic that gates legibility of hidden-state verbs across the whole catalog, flagged in the issue body as "a vision-level UX decision, not a UX afterthought." Designing that autonomously in a scheduled run would risk drifting the game's legibility model — it warrants a brainstorm session with Christian first. THR-433, by contrast, has a settled direction (the rename verdict from the 2026-05-11 vision audit locked the "player never names the want" framing) and rides an existing engine subsystem. It is designable without a human in the loop; THR-431 is not.

**Recommendation for the next Cowork session:** THR-431 (Reveal Corruption) is the last undesigned THR-400 deferral. It should get a short brainstorming pass with Christian on the suspicion-mechanic / hidden-until-suspected pattern *before* it is designed — that pattern is bigger than one verb and will set precedent for every future hidden-state verb. Surfaced in the session handoff.
