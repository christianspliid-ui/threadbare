# User Action Required

**Last updated:** 2026-09-07 02:56 local (00:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`. **Ticket states below were re-verified against a live board this run.**

## Standing asks

### 1. Approve the camp six — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

The brief: [Retrofit batch 2 — the camp six](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md), merged Friday morning. (An older August draft still sits on `main` under a near-identical name and reads plausible — three rulings have overtaken it. The link above is the live one.)

**Six, not seven.** `shrine_offering` is held to batch 3 — most warnings of the set (10), weak contrast against `offer_small_prayer` — and it is roster #1 of [your slice checkpoint](https://linear.app/threadbare/issue/THR-1220), so **that checkpoint waits one batch longer**. The six: sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. None has a typed consequence today.

Two yes/no questions in the brief: **repair in place, or re-roll from fresh premises?** (repair is the plan) and **the 2-of-6 sample** — `ward_the_camp` and `tend_to_wounds`, your own recommendation.

*"batch 2, run the six"* · *"re-roll them"* · *"put shrine_offering back in."* The execution ticket is [THR-1222](https://linear.app/threadbare/issue/THR-1222), pickup-able by the unattended machine the moment you say the word.

### 2. What should a proportion read as? — [THR-1424](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct)

Two places still show you a bare percentage: an effect tooltip says something is at *62% strength*, and the doom clock says you are *62%* of the way to the doom. The design laws ban percentages on player-facing surfaces, and unlike the "4 ticks" problem cleared all week, **there is no existing replacement to reach for** — a duration converts into days; "62% strength" converts into nothing a player already thinks in. Word ladders are out by your own verdict on `grew steadily`: *"how can a player use that word to gage anything"*.

**Recommendation: drop both numbers rather than invent a new language.** The doom clock already shows a bar and names which chapter of five you are in — the percentage is a third rendering of a quantity the screen states twice. The tooltip's strength is arguably readable from the effect's prose.

The fork that is genuinely yours: **if a proportion is ever worth showing, what should it read as** — whatever is picked becomes the sanctioned reading for *every* proportion in the game, the way "four days" now is for every term. Say **"drop them"** and a lane takes it from there; *"no, they matter"* needs your language. *— from [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07.md), 2026-09-07*

### 3. Are you still planning to design Traits wave 2? — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Still one word — and **smaller than earlier briefings claimed**. It was billed as the valve holding the design pipeline shut; three of the four things it supposedly blocked closed under their own power ([grievance supply](https://linear.app/threadbare/issue/THR-1383), [undertaking factory](https://linear.app/threadbare/issue/THR-1300), [decision-board re-scope](https://linear.app/threadbare/issue/THR-1349)).

What remains is genuinely just intent: **23 days In Design, assigned to you, no plan doc.** The machine keeps it counted because an assigned item means a person may be about to start, and it occupies the design tier's one preparation slot — eighth consecutive day.

**Yes** changes nothing and the asking stops; **not getting to it** sets it aside, frees the slot, and preparation restarts tonight. The work itself: location traits going live, artifact traits, draw-by-trait pools ("gain a random #relic"). *(Its description still says blocked — that blocker closed 26 July and grooming corrected the ticket.)*

### 4. The undertaking retirement list — four get deleted — [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants)

You asked to see the list before anything is deleted. [Slice 4a](https://github.com/christianspliid-ui/threadbare/pull/1804) merged: verbs renamed to yours (create · change · use · control · destroy · observe), registry redrawn on [the world-object catalogue](https://linear.app/threadbare/issue/THR-1394), and the [grid](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/undertaking-grid.generated.md) is generated and build-gated. 42 live cells over 14 kinds, 20 reachable for the first time.

**60 of 64 templates are absorbed** by a cell — 54 by the op they already ran, 6 by intent where the old template wrote nothing and the cell now does what the fiction promised. **4 are deleted:** `improve_masterwork`, `train_apprentice`, `commission_quest`, `expose_cache`. Named honestly, not flattered: `buy_influence`, `secure_office`, `negotiate_storage`, `extend_reach` become *observe × location*, because intelligence is all they ever wrote.

**"Run 4b"** finishes the migration and flips the model on. **"Not those four"** adjusts first. Last slice of four; the rest is built and behind a flag.

### 5. Do you still want the incident-capture button? — [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)

**You filed this yourself on 16 August and nothing has moved since.** One button on the live game that captures a run to a `.json` you attach to chat — so a weird-looking simulation reaches an agent as *state*, not a screenshot and a sentence.

Scope is already settled from your answers that day: snapshot only, no replay log; must work on the deployed build; output is a downloaded file. High priority, blocked by nothing, 22 days in `Todo` purely because no design pass was run.

**Yes** puts it at the front of the design queue. **No** closes it rather than keeping it warm.

### 6. Three questions left on the undertakings map — [THR-1396](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map)

[Which open cells are wanted](https://linear.app/threadbare/issue/THR-1397) is decided and closed — every cell dispositioned, and your three forks with it: **plotting a mortal's death**, **the signed curse**, **forced succession**. The map's research question is finished too: of 26 subsystems, 11 are moved by a live cell, 14 untouched, 5 of those a genuine gap.

What is left is three questions about what the game should mean — **take the first one first, it unblocks four**:

- [The division rule](https://linear.app/threadbare/issue/THR-1398) — does a mortal's ambition pick its verbs and its Reach pick its objects?
- [The untouched-by-design list](https://linear.app/threadbare/issue/THR-1401) — which systems mortals should never move by their own work.
- [What the player sees](https://linear.app/threadbare/issue/THR-1404) — the calling on the sheet, the work on the chronicle, the grid as a codex page.

Say **"work the undertakings map"** and a session takes them in order.

### 7. The fight map — seven open, and two of them are the head — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

**Seven, not ten.** Three of the ten were waiting on answers to the other two all along. Every research question the map carried is finished.

Settle these two and **three more open by themselves**:

- [**How a fight against a monster works**](https://linear.app/threadbare/issue/THR-1263) — the nerve test, the clash test, and what a monster's stat block has to say.
- [**How a fight between two people works**](https://linear.app/threadbare/issue/THR-1264) — both sides roll, and the interesting part is which pair of results you got.

The rest: [when a fight starts on its own](https://linear.app/threadbare/issue/THR-1267), [the faces of defeat](https://linear.app/threadbare/issue/THR-1266), [just enough monster](https://linear.app/threadbare/issue/THR-1268), [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270), [may a company fight together?](https://linear.app/threadbare/issue/THR-1271). Say *"work the fight map"*.

### 8. Two sketches ready to be built for you to react to

The [powers](https://linear.app/threadbare/issue/THR-1226) and [items](https://linear.app/threadbare/issue/THR-1227) maps have finished everything else; these two sketches are the single open question left on each. A session builds the sketch, you look, and your reaction is the design decision.

- [**Twenty generated spells**](https://linear.app/threadbare/issue/THR-1232) — do composed spells read as one coherent thing, or as parts bolted together?
- [**Thirty generated items**](https://linear.app/threadbare/issue/THR-1236) — are they *cool*? That is the whole bar.

Say **"work the powers map"** or **"work the item map"**.

### 9. Image credits — should the spend be gated on you at all? — [THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

**Five Meet-The-First scene images break the art rule.** Two have words painted in, two show individual faces (reserved for portraits), one has old choice buttons as scenery. All five are switched off and substitutes cover the slots, so nothing is broken. Sizes, rules and acceptance are settled. It waits on you for one reason: **it spends image credits.**

**The real question.** The opening beat's three missing plates ([THR-1170](https://linear.app/threadbare/issue/THR-1170)) were listed here for the same reason and a lane made them anyway; a later lane *overruled* a ticket outright ([THR-831](https://linear.app/threadbare/issue/THR-831)). Both judgements look right. So: **do you want image spends gated on you, or decided by the lane and reported after?** Your answer settles these five and every batch after. Until then the standing rule holds: *remap where a match is honest, come to you only when it is not.*

### 10. What is a run *about*? — [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)

Forty-eight authored lines narrate a campaign's milestones. They are wired and working, but written for **twelve named campaigns**, while every live game derives its spine from **what your god remembers**. Correct, connected, unreachable; the game falls back to generated text and nothing is broken.

**Does a run's spine come from what the god remembers, or from a named campaign the world offers?** *Remembrance* — write the milestone prose for the twelve hungers instead, and the existing forty-eight stay unread. *Named campaigns* — give them a route back into play, which changes how a run's purpose is chosen, not just what it reads like.

Deliberately left with you: what the game means, not how to wire it. No urgency — [the wiring shipped](https://linear.app/threadbare/issue/THR-1197) and nothing downstream waits.

### 11. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

One `npm run dev` and a browser at 1920×1080: shipped surfaces and the screenshots they owe. Each carries test-level proof but no picture, because a scheduled run is refused a dev server and structurally cannot capture one. Nine passes now, nineteen captures. Newest include faction heraldry (does a subordinate charge at 0.42 scale read as *deliberately lesser* or as a broken asset?), the tooltip focus ring, and the aftermath screen as composed.

**Nothing blocks the sitting.** The companion route ([THR-1413](https://linear.app/threadbare/issue/THR-1413)) merged Friday, and [the premonition that never fired](https://linear.app/threadbare/issue/THR-1414) merged with a lever that forces one on demand. One more attended item joined Friday: [THR-1419](https://linear.app/threadbare/issue/THR-1419) — the choice-card meta row, checking a three-item withdrawn row does not overflow the card and that the stance hues read against the veil ground.

It grows as more UI ships behind the same wall. Get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 12. Chart the hub map — [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)

The hub is still unchartered, and the slice map's charter names it as successor: **the player reaching factions, war, economy and divine actions from inside the encounter interface.**

**Advice: wait.** Your integrated slice checkpoint is this map's entry condition — and it now waits one batch longer, because `shrine_offering` moved to batch 3 (ask 1). **Only you can charter a map** — say *"chart the hub map"* whenever you want it anyway.

### 13. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream waits on it. Listed only so it is not silently forgotten; say the word and it gets a ticket and a design pass.

### 14. Should weekend quiet be normal too? — one word

**The machine was off from Friday 16:28 to Sunday 13:22 — 45 hours — and everything resumed on its own.** Nothing broke, nothing was lost, no work is missing. The reason it reaches you at all is that the silence probe cannot tell a deliberate weekend from a fault, and you have only ruled on nights.

The probe's own words: *"The scheduled lanes went silent for 44.9h (2026-09-04T14:28:53.000Z → 2026-09-06T11:25:14.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

My read is that it was a host that was simply off: three unrelated schedulers stopped in the same minutes and came back in the same minute. That is a machine-state fact, not a defect.

**Say "weekend quiet is normal too"** and it is declined the way overnight quiet has been since 8 August, and stops reaching you. Say nothing and it will surface again after the next long gap.

### 15. The scripted half of Linear access — small, and not urgent

**The connector fixed itself — there is nothing to reauthorize.** It came back on its own around 17:15 on 6 September after roughly six hours of lane runs against a wall, and has stayed up since — a full night now, with every board read this run returning normally and four tickets shipped through it overnight. Nothing was lost.

**`LINEAR_API_KEY` is still unset.** A handful of background checks read Linear through that environment variable rather than the connector, so they stay switched off — one background lint runs with three sub-checks dark. **Nothing is blocked on it.** The transport is already written and shipped in `scripts/drift-scan/linear.ts`.

Setting it in the machine environment or the home tree's `.env` is the durable fix — no browser sign-in, and it survives a lapsed token, which is exactly the failure that just happened. Worth doing eventually, not worth your evening.

## Resolved this period

- **The stale-process pile-up cleared itself — no restart needed** *(2026-09-07)*. Machine at 2% load; warm-up back to normal and the engine-speed trend is publishing rows again.
- **Linear came back on its own** *(2026-09-06)*. Six hours of lane runs hit an authentication wall and it recovered unaided around 17:15 — no reauthorization, nothing lost. Two residues: ask 15, and seven unticketed merges flagged for the Friday retro.
- **Your pixel sweep is six-for-nine and found a fix of its own** *(2026-09-04)*. [THR-1409](https://linear.app/threadbare/issue/THR-1409), [THR-1410](https://linear.app/threadbare/issue/THR-1410), [THR-1411](https://linear.app/threadbare/issue/THR-1411), [THR-1413](https://linear.app/threadbare/issue/THR-1413), [THR-1414](https://linear.app/threadbare/issue/THR-1414), the self-found [THR-1418](https://linear.app/threadbare/issue/THR-1418), and [THR-1416](https://linear.app/threadbare/issue/THR-1416).
- **You killed the encounter audio moments, and they are now deleted** *(2026-09-04)*. *"thr 1168. no audio please."* — [THR-1168](https://linear.app/threadbare/issue/THR-1168) merged and deployed the same day.
- **You accepted the two batch-1 exemplars** *(2026-09-04)*. *"the two examplars are accepted"* — The Grateful Kin and The Unsafe Bridge cleared the bar, releasing the camp batch's park. Ask 1 is the one approval left behind it.
- **Your three undertaking forks are decided** *(2026-09-03)*. [THR-1397](https://linear.app/threadbare/issue/THR-1397) — plotting a mortal's death, the signed curse and forced succession are all in.
- **The undertaking grid is generated and build-gated** *(2026-09-03)*. [Slice 4a](https://github.com/christianspliid-ui/threadbare/pull/1804) — your verbs, the registry redrawn, and a grid page the build refuses to let go stale.
- **The world's objects now have one catalogue in game words** *(2026-09-03)*. [THR-1394](https://linear.app/threadbare/issue/THR-1394) — what made the undertakings map chartable, and what unparked ask 4.
- **Proactive Agent Actions closed complete** *(2026-09-03)*. [The map](https://linear.app/threadbare/issue/THR-1276) and all six plan docs done.
- **The word players see is settled and shipped** *(2026-09-02)*. [THR-1314](https://linear.app/threadbare/issue/THR-1314): what a character owns reads **freehold**. Say the word any time if it is wrong to your ear — still four lines to reverse.

---

Older resolved items, run measurements and the full narration: `git log -p origin/ops -- Design/user-actions.md`.
Briefing (refreshed hourly): [Design/briefing.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).
