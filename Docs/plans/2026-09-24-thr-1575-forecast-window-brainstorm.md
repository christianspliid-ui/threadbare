> **title:** Brainstorm companion — the forecast window (THR-1575)
> **linear_issue:** THR-1575
> **author:** Claude Code
> **created:** 2026-09-24

# Brainstorm companion — the forecast window (THR-1575)

Companion to [`2026-09-24-thr-1575-forecast-window.md`](2026-09-24-thr-1575-forecast-window.md). The plan is terse; this is where the alternatives, the measurements that killed them, and the tensions live.

## How we got here — the drift, in order

Christian's diagnosis (chat, 2026-09-24): *"we are in this situation because earlier agents' interpretation of my guidance has drifted over time."* The git and plan history agrees. Each step below was a reasonable local patch; together they lost the intent.

| When | Change | What it did to the dice |
|---|---|---|
| 2026-03-04 (`a6e8eb3b`, disc13 plan §3.2) | Capability sigmoid, midpoint 10, k 0.4 | Fitted to a raw range of ~2–25 (traits and items only). "Most actors spend their lives in tiers 3–6", i.e. capability 0.2–0.6. |
| 2026-03-04 (`41737e61`) | Protagonists seeded at `10 + rand(31)` plus 1–2 boosts of 20–39 | Not yet read by the sigmoid. |
| 2026-03-26 (`b15e3ce9`, TB-056 "idle death spiral fix") | `domainCapabilities` becomes the base of the raw score | Starting capability jumps from ~2–6% to ~50–95%. The curve is never re-fitted. Every protagonist now reads as a master. |
| THR-451 | Per-scale probability floors: personal 0.70, local 0.65 | Capable actors can never roll below 65% on local content. Nearly all content is local (every legacy `encounter-content` entry is hard-coded `scale: 'local'`). |
| 2026-07-04 (THR-571 re-band gate) | "Option 1 — accept the capability-poor world" | The rulebook now says the acting population is *capability-poor by design*, the opposite of what the seed data shows for protagonists. |
| 2026-09-24 (measured) | — | KPI total success 70–78% (target 50–65%); 44% of step rolls pinned at exactly 0.65; success moves only 61%→79% across the whole protagonist range. |

**The lesson for the design:** a principle that lives only in a chat message or a plan's prose gets re-interpreted by the next agent that needs a local fix. This plan therefore writes the rule into the rulebook in Christian's terms *and* makes it an automated invariant that fails a test when it drifts.

## The ruling, and why it is better than what we proposed first

The first proposal in chat was "re-fit the curve, make an even match a gamble, drop the floors, add risk appetite". Christian's ruling turned it inside out: **the success rate is not something the dice produce, it is something mortals choose.** A mortal engages when its own forecast says 50–65%. Skill decides *which* challenges fall inside that window, not how often they win.

Why this is the stronger design:

- **It is self-balancing.** Content difficulty no longer has to be tuned against a population average; each mortal sorts itself onto the content that fits. Adding harder content later adds work for masters without making the world easier or harder for anyone else.
- **It gives progression a shape.** Success grows reach; reach moves the window; the window moves the mortal onto harder content. The size of what a mortal attempts is the visible sign of growth.
- **It makes the forecast load-bearing.** Mortals already forecast (`forecastEncounterExpectedUtility`), but today the forecast only ever steers them toward the easiest candidate. In the window model it is the thing that decides engagement, so a forecast that disagrees with the roll becomes a visible bug instead of a silent one.
- **It fits the north star.** *"The player hesitates. They play the card."* ([Vision/00-north-star.md](../../TheFantasyWorldSimulator/Vision/00-north-star.md)) A card is only worth hesitating over when the odds are genuinely open. Attended encounters now sit near *uncertain*/*favorable* by construction.
- **It gives the god a clean role.** The window is what a mortal does alone. A god's nudge can push a mortal toward a challenge they would never take; the player owns the long odds.

## Alternatives considered

### A. Fix only the words (sheet and skill line read a linear share)
Cheap, no odds change. **Rejected:** the screen would show differences the dice ignore — a "Trained" swordsman who rolls like a master. That is the THR-1535 pathology (the odds shown are not the odds rolled) moved one layer up.

### B. Move the sigmoid midpoint only (the ticket's option 1)
Modelled on 3,100 recorded rolls (seeds 42/99, 300 ticks): midpoint 25–40 with any slope drops mean P to 0.25–0.37 and puts 68–89% of rolls under the old scale floors, where the THR-571 floor upgrade converts them to `success_at_cost`. The world would become a wall of scraped-through results. **Rejected on its own**: the curve, the odds formula and the floors are one system and must move together.

### C. Keep "P = capability − difficulty"
With both terms on 0–1 the at-par chance is 0%: a mortal exactly as good as the step demands never succeeds. It only worked because capability was saturated at ~1.0. **Rejected** in favour of *odds at par + gain × (capability − difficulty)*, where difficulty reads "the proficiency this step demands" and a matched challenge is a genuine gamble.

### D. Hard window (engage only inside 50–65%, otherwise refuse)
Clean, but it recreates the TB-056 idle death spiral whenever a mortal's window is empty — which it will be for masters until higher content is authored. **Rejected** for a soft fit curve plus a fallback: too-hard candidates are refused, too-easy ones are allowed but unattractive, and a mortal with nothing in its window takes the closest match. The fallback share is measured, so an empty window shows up as a content gap, not as idle mortals.

### E. Risk appetite as a large personality term (the first chat proposal)
Bold mortals taking long odds would push realised success away from the target by personality mix. **Rejected in favour of Christian's constraint** ("the same general success rate"): personality shifts the window centre by a small named amount, around the same centre. Long odds belong to the god.

### F. Scale everything to the actor (difficulty = f(actor))
Would guarantee flat success trivially and make skill meaningless — the THR-1575 problem again from the other side. **Rejected.** Difficulty stays a property of the content; the mortal's choice does the matching.

### G. Re-fit every capability reader in this ticket
`computeCapability` has ~40 non-test call sites. About half are dice or choice (resolution, planners, contests, fights); the rest are sight and gates (awareness hops, mentorship tiers, renown, social leverage, threshold checks). Re-fitting the second half changes perception range, mentorship supply and renown in the same release as the odds, and nobody could tell which change caused what. **Rejected for this ticket:** non-dice readers keep today's numbers through an explicitly named pre-refit reader, and a Deferral re-fits each one on its own evidence.

## The two traps from the game's early days

Christian (chat, 2026-09-24): early on, too many failures led mortals either to **retry the same content over and over and get nowhere**, or to **lose reach to failure penalties and become stuck**. The goals for mortal behaviour are **variety, tension, progression and theme**.

A design that raises failure on purpose has to rule both out *by construction*, not by hoping the tuning lands. What was checked on `main`:

- **Skill loss:** a failed step still grows the `experience` trait, which has no decay (`capabilityGrowth.ts:93-109, 199-257`). No failure path rewrites `domainCapabilities`. Failure's costs are temporary conditions, quintessence, standing, and story. So the spiral cannot come back through reach, and a unit test pins that.
- **Retry loops:** every resolved outcome gets the same short completion cooldown (as low as 2 ticks), and the window keeps a failed challenge at the same even odds. Without a guard, a failed mortal comes straight back. Hence the failure cooldown multiplier.
- **Stuck on a failure streak:** even without skill loss, a mortal can fail several in-window challenges in a row by the dice alone. Hence the setback shift: after consecutive failures the window moves easier, capped, and resets on the next win. It reads as a mortal licking its wounds and taking on something it can finish. That is thematic, and it cannot run away because it is capped and self-resetting.
- **Considered and rejected:** a failure-count retirement (retire a template after N failures). The existing `MAX_COMPLETIONS_PER_TEMPLATE` already retires after 5 completions of any outcome, and the cooldown multiplier spreads attempts out. A third mechanism would make the failure path harder to reason about for little gain.
- **Found in passing, out of scope:** mentorship-granted mastery traits decay every 48 ticks and nothing reinforces them since THR-1503. That is time-based loss, not failure-based, so it is reported separately.

## Tensions surfaced

- **Flat success vs. content that does not exist yet.** The invariant cannot hold for masters until expert/master content exists. The KPI therefore asserts flat success only for proficiency bands with enough drawable content, and reports coverage for the rest. Christian: *"it is easy to create more content for higher skilled agents as we get the algorithm right."* The coverage report is the brief for that content.
- **The at-cost texture.** Christian's July ruling made "won, at a price" the dominant texture (at-cost share 30–70%). Step-level floor upgrades produced only ~4% of step outcomes on the September runs, so retiring the floors should move at-cost little — but it is his ruling, so if the at-cost share leaves its band the finding goes to him rather than being re-tuned silently.
- **Sight vs. odds.** Awareness hops read capability. Re-fitting it would shrink how far mortals see, shrink their candidate pools and push them into fallback. This ticket is about odds and choice, not sight; awareness keeps its current curve.
- **Planner-only danger multipliers.** Late-game ×1.3 and danger ×(1+0.5·danger) inflate the planner's difficulty but not the roll's. Under the window model a forecast that is not the roll is a bug. They leave the forecast; if danger should deter, it deters as a named cost term, not as a false probability.

## Vision premises invoked

- North star — the player hesitates; the nudge shifts the odds, fate picks the band. Supported: attended odds are genuinely open.
- Non-negotiable — player choices are interventions that shift probabilities. Supported: nudge magnitudes stay additive percentage points outside the gain.
- Cool-failure rule — failure is plot, not punishment. Supported: 35–50% of engaged challenges fail, and every failure still leaves a story artifact (`failure_story_rate` KPI).
