> **title:** The power runtime — brainstorm companion — THR-1571
> **linear_issue:** THR-1571
> **author:** Claude Code (design lane, run 2026-09-29a)
> **created:** 2026-09-29
> **companion_of:** 2026-09-29-thr-1571-power-runtime.md

# The power runtime — brainstorm companion

The alternatives the plan weighed, the tensions it holds, and the Vision premises it leans on. The plan doc is the contract; this file is the record of why the seams fall where they do.

## The one question under everything

**Who decides a cast, and what decides whether it works?** Every other fork in this plan follows from the answer.

The rulebook fixes two things already. Forks are decided by the mortal, never by the god. And "riders never take an extra die": the game has one roll per step, and the god bends that roll. A spell runtime that gave casting its own die would be a second resolution system beside the ladder, which the rulebook forbids in one line: "No alternative dice."

### Options for what decides a cast's success

| Option | For | Against | Taken? |
|---|---|---|---|
| **A. Keep `activateSpell`'s own roll, but against Veil instead of a fixed 15%** | Smallest change to the existing function | A second die per step. The god's cards on the step would not touch the cast, so ruling 5 ("casts are nudgeable") would need a second nudge surface | No |
| **B. The step's own band decides the cast** | One die. The god's nudge on the step already bends the cast, so ruling 5 comes for free. Backlash reads the same five-band ladder every other consequence reads | A cast cannot succeed while the step fails. That is the fiction: the spell was the attempt | **Yes** |
| **C. The cast auto-succeeds; only the price and backlash roll** | Simple | "Every failure leaves a story artifact" loses its best source; a miscast is the magic story | No |

### Options for who decides to cast in an encounter

| Option | For | Against | Taken? |
|---|---|---|---|
| **A. The god plays a "cast" card** | Direct, legible | Breaks "you do not direct-control characters". The god would be casting through the mortal | No |
| **B. A new `'cast'` DecisionFamily in the Phase 2b chooser** (THR-1229's first recommendation) | An agent literally decides | Phase 2b picks *which encounter to take*, not what to do inside a step. A cast chosen there produces a decision, not a scene (THR-1229's own stated weakness) | Not for encounters (see the world-map row below) |
| **C. The mortal reaches for the spell when the odds are bad** — a pure rule over their own forecast and their boldness | The mortal decides. Deterministic, so the forecast can show it before the roll. Reads like character: a bold caster reaches early, a prudent one saves it | A threshold is a tuning number, not a mind | **Yes**, with the threshold named and keyed to the mortal's boldness |
| **D. Always cast when able** | Simplest | A walking arsenal. Cooldowns would be the only brake, and every caster's encounters would read alike | No |

### Options for world-map casts

THR-1229 recommended a `'cast'` DecisionFamily in Phase 2b on 2026-08-25. On 2026-09-07 THR-1429 shipped `use × Power`, an undertaking cell that is exactly "a mortal decides to cast a spell out in the world": it gates on seal and exhaustion, looks up the template, and calls `activateSpell`. It is reachable through the scholar-seeker ambition profile. A second decision site for the same act would be two ways to cast the same spell, disagreeing at the edges. **The plan repairs the cell instead of adding a family.** THR-1229's recommendation predates the cell; nothing in it argues for two sites.

## Fate-woven spells: where do carried effects live?

A wielded spell is a `has_trait` edge to a **shared** definition node (THR-1395, THR-1429). The effect walker already walks `has_trait` edges and applies the target node's `effects[]`. Today the spell definition node deliberately carries **no** effects, because a deliberate spell's effects are what the cast *does*, and they must not apply just by being carried.

| Option | Taken? |
|---|---|
| Put carried effects on a per-bearer node | No: THR-1395 retired per-bearer trait nodes |
| Put them on the edge | No: the walker reads the node, and every edge writer would need to copy them |
| **Split the template: `carriedEffects` go on the shared node, `effects` stay the cast** | **Yes.** A fate-woven spell's node carries its effects, so every wielder gets them through the walker with no new read. A deliberate spell's node stays empty, as today |

A spell may carry both halves: a small standing gift plus a cast. None of the five shipped templates needs that yet. The seeded generator (THR-1572) may use it.

## Strain: what does "it draws on the caster's own Reach" do?

The `reach_drain` payment writes a property nothing reads (THR-1562's "Not done" list hands it here).

| Option | Taken? |
|---|---|
| Subtract from `domainCapabilities` directly | No: "failure never costs reach" is a rule of play (THR-1581). A spell's price is not a failure, but a permanent reach loss for casting would teach mortals never to cast, and it would compound across a caster's life |
| **A timed condition that lowers the reach, then wears off** (the spell prototype's working form) | **Yes.** It reuses the condition machinery (`applyConditionToActor`, `ticksRemaining`, `conditionDecay`), shows on the sheet, and a ward cannot swallow it |
| Exhaustion only (`tick_exhaust`) | Kept as its own cost type. It says "you are spent", not "your Veil is thin" |

One shared condition definition per Reach (`condition.strained.<reach>`) keeps THR-1395's rule: shared definitions, per-bearer state on the edge.

## dispel

Today `dispel` deletes the node it matches. Since conditions and spells became shared definitions, that cures the whole world and deletes the condition from the game. Three repairs were weighed:

1. Delete only the edge. **Taken for `has_trait`.** A lifted curse leaves this bearer; the definition and every other bearer are untouched.
2. For `possesses` and `bonded_to`, deleting the edge would take an item out of its owner's hands. That is theft, not dispelling. **Taken: those become a timed `suppress` on the item**, the mechanism the Hush Stone already uses.
3. Honour `effect.target` as a filter, not a trace label. **Taken.** A "lift a curse" spell must not strip a blessing.

## Movement primitives

`teleport` and `forced_move` return no mutations. `transfer` returns none. `compel` writes a property nothing reads. The plan builds the first two because the travel arena needs them: two of the five shipped spells teleport. `transfer` and `compel` stay out: neither has a shipped spell that needs it, and a reader for `compel` (overriding a mortal's next decision) is a design of its own. The seeded generator keeps refusing them. **Out of scope, named, not deferred silently.**

## Innate powers

The UL says an Innate Power has "no code anchor yet" and must not borrow the `innate` trait category. The Temper entry says `createNamedElite` is where they will be stamped.

| Option | Taken? |
|---|---|
| Borrow `'bestowed'` or `'spell'` as the class | No: the UL forbids a stand-in |
| **A new `TraitCategory` member `'innate_power'`, one shared definition per monster family** | **Yes.** Same shape as the other two Power classes, so the Power kind's discriminator widens by one word and every Power reader already copes |
| Per-beast generated powers | No: that is the generator's job (THR-1572) and needs its envelopes |

Innate powers are fate-woven only in this plan. A beast that *casts* is a later decision.

## The upkeep budget

The map asked for one, "for example, powers tick only for spotlight-tier bearers". The measured shape: carried effects cost nothing new per tick, because the effect walker already walks every agent's `has_trait` edges; a spell adds one more edge to a walk that already happens. Casting costs something only when an attended or background step resolves for a caster, which is rare by construction. So the plan sets a **measured budget, not a pre-emptive gate**: tick cost within `POWER_UPKEEP_TICK_COST_BUDGET_PCT` of the pre-change baseline on the tick-cost probe, and a tier gate held in reserve as the kill switch if the budget is broken.

## Vision premises this leans on

- **You shift probabilities; you do not direct-control characters.** Casts are the mortal's; the god bends the roll that decides them.
- **Failure is plot, not punishment.** The miscast is the spell's story. A gamble can now bite on success, and a strained caster walks around with a thinner Veil for a few days.
- **Every primitive is clickable.** The spell name on a step's odds line, the price chip and the backlash chip all route to the spell's page.
- **Cost is characterization** (THR-1230 ruling 3). The four price layers each fire on a different band, so a player learns what kind of magic a spell is by watching what it does to its caster.

## Tensions held, not resolved

- **Threshold vs mind.** The cast rule is a number keyed to boldness. A later pass could let ambition or a fork's value axis colour it. Named as a constant so the tuning is a number change.
- **Five spells is a small shelf.** The runtime is tested against five hand-written templates. The generator (THR-1572) fills the shelf; this plan must not wait for it, and it must not author a dozen spells the generator will replace.
