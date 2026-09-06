# User Action Required

**Last updated:** 2026-09-06 18:55 local (16:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`. **Ticket states below were last verified Friday 2026-09-04 — Linear was unreachable this run too.**

## Standing asks

### 1. Reconnect Linear — it is blocking four lanes

**The board has been unreachable since the machine came back on Sunday, and it is now into its second day.** Work pickup, the orchestrator, daily grooming and this brief all read Linear before they do anything; none of them can claim a ticket, promote work, or report what is in flight. It worked on Friday, so this is a change, not a standing gap.

**Re-verified 16:55 UTC — still down, seven lane runs in a row.** Not a slow call or a one-run blip: the connector reports *requires authentication*, and a scheduled session cannot run the sign-in flow.

Either fix is enough, and both need you — an unattended session cannot sign in:

- **Re-authorize the Linear connector** — claude.ai → Settings → Connectors.
- **Or set `LINEAR_API_KEY` in the machine environment** — better for the scheduled lanes: no browser sign-in, and it does not lapse the same way. The code that reads it is already shipped. (Re-checked this run: still unset.)

**It gates ask 2 in practice.** *"batch 2, run the six"* will not start the unattended machine while this is broken, because the lane that would pick it up cannot claim the ticket — though you can still start it by hand in a chat session. Raised independently this morning by [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) and [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-06.md); logged as impediments #973 and #974.

### 2. Approve the camp six — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

The brief: [Retrofit batch 2 — the camp six](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md), merged Friday morning. (An older August draft still sits on `main` under a near-identical name and reads plausible — three rulings have overtaken it. The link above is the live one.)

**Six, not seven.** `shrine_offering` is held to batch 3 — most warnings of the set (10), and a weak contrast against `offer_small_prayer`. It is roster #1 of [your slice checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with), so **that checkpoint waits one batch longer**. The six: sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. None has a typed consequence today.

Two yes/no questions in the brief: **repair in place, or re-roll from fresh premises?** (repair is the plan) and **the 2-of-6 sample** — `ward_the_camp` and `tend_to_wounds`, your own recommendation. Unchanged and not re-argued.

*"batch 2, run the six"* · *"re-roll them"* · *"put shrine_offering back in."* The execution ticket is [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine), which an executor still needs to reconcile to the merged brief.

### 3. The undertaking retirement list — four get deleted — [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants)

You asked to see the list before anything is deleted. [Slice 4a](https://github.com/christianspliid-ui/threadbare/pull/1804) merged: verbs renamed to yours (create · change · use · control · destroy · observe), registry redrawn on [the world-object catalogue](https://linear.app/threadbare/issue/THR-1394/the-worlds-objects-one-canonical-catalogue-in-game-words-the-drift), and the [grid](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/undertaking-grid.generated.md) is generated and build-gated. 42 live cells over 14 kinds, 20 reachable for the first time.

**60 of 64 templates are absorbed** by a cell — 54 by the op they already ran, 6 by intent where the old template wrote nothing and the cell now does what the fiction promised. **4 are deleted:** `improve_masterwork`, `train_apprentice`, `commission_quest`, `expose_cache`. Named honestly, not flattered: `buy_influence`, `secure_office`, `negotiate_storage`, `extend_reach` become *observe × location*, because intelligence is all they ever wrote.

**"Run 4b"** finishes the migration and flips the model on. **"Not those four"** adjusts first. Last slice of four; the rest is built and behind a flag.

### 4. Do you still want the incident-capture button? — [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)

**You filed this yourself on 16 August and nothing has moved since.** One button on the live game that captures a run to a `.json` you attach to chat — so a weird-looking simulation reaches an agent as *state*, not a screenshot and a sentence.

Scope is already settled from your answers that day: snapshot only, no replay log; must work on the deployed build; output is a downloaded file. High priority, blocked by nothing, 21 days in `Todo` purely because no design pass was run.

**Yes** puts it at the front of the design queue. **No** closes it rather than keeping it warm. *— surfaced by daily-backlog-grooming, 2026-09-03*

### 5. Three questions left on the undertakings map — [THR-1396](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map)

[Which open cells are wanted](https://linear.app/threadbare/issue/THR-1397/which-open-cells-are-wanted-yield-and-leverage-ownership-of-people) is decided and closed — every cell dispositioned, and your three forks with it: **plotting a mortal's death**, **the signed curse**, **forced succession**. The map's research question is finished too: of 26 subsystems, 11 are moved by a live cell, 14 untouched, 5 of those a genuine gap.

What is left is three questions about what the game should mean — **take the first one first, it unblocks four**:

- [The division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) — does a mortal's ambition pick its verbs and its Reach pick its objects?
- [The untouched-by-design list](https://linear.app/threadbare/issue/THR-1401/the-untouched-by-design-list-which-systems-mortals-never-move-by-their) — which systems mortals should never move by their own work.
- [What the player sees](https://linear.app/threadbare/issue/THR-1404/what-the-player-sees-the-callings-spread-on-the-sheet-the-work-on-the) — the calling on the sheet, the work on the chronicle, the grid as a codex page.

Say **"work the undertakings map"** and a session takes them in order.

### 6. Are you still planning to design Traits wave 2? — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Still one word — and **smaller than earlier briefings claimed**. It was billed as the valve holding the design pipeline shut; three of the four things it supposedly blocked closed under their own power ([grievance supply](https://linear.app/threadbare/issue/THR-1383), [undertaking factory](https://linear.app/threadbare/issue/THR-1300), [decision-board re-scope](https://linear.app/threadbare/issue/THR-1349)).

What remains is genuinely just intent: 22 days In Design, assigned to you, no plan doc. The machine keeps it counted because an assigned item means a person may be about to start. **Yes** changes nothing; **not getting to it** sets it aside. (Its description still says blocked — that blocker closed 26 July and grooming corrected the ticket.)

The work itself: location traits going live, artifact traits, draw-by-trait pools ("gain a random #relic").

### 7. The fight map — seven open, and two of them are the head — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

**Seven, not ten.** Three of the ten were waiting on answers to the other two all along; earlier briefings counted labels instead of reading relations. Every research question the map carried is finished.

Settle these two and **three more open by themselves**:

- [**How a fight against a monster works**](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) — the nerve test, the clash test, and what a monster's stat block has to say.
- [**How a fight between two people works**](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) — both sides roll, and the interesting part is which pair of results you got.

The rest: [when a fight starts on its own](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over), [the faces of defeat](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum), [just enough monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster), [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands), [may a company fight together?](https://linear.app/threadbare/issue/THR-1271/companies-in-fights). Say *"work the fight map"*.

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

**Nothing blocks the sitting.** The companion route ([THR-1413](https://linear.app/threadbare/issue/THR-1413/no-route-puts-a-companion-on-a-mortal-from-the-browser-and-a-companion)) merged Friday, so a companion can be put on a mortal from the browser; and [the premonition that never fired](https://linear.app/threadbare/issue/THR-1414/no-premonition-surfaced-in-280-ticks-across-four-seeded-runs-verify) merged with a lever that forces one on demand. One more attended item joined Friday: [THR-1419](https://linear.app/threadbare/issue/THR-1419/attended-pixel-pass-for-the-choice-card-meta-row-confirm-the-three) — the choice-card meta row, checking a three-item withdrawn row does not overflow the card and that the stance hues read against the veil ground.

It grows as more UI ships behind the same wall. Get through part of it, say which, and the remainder is re-expanded rather than closed whole. Bundles into the sitting in ask 2.

### 12. Chart the hub map — [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)

The hub is still unchartered, and the slice map's charter names it as successor: **the player reaching factions, war, economy and divine actions from inside the encounter interface.**

**Advice: wait.** Your integrated slice checkpoint is this map's entry condition — and it now waits one batch longer, because `shrine_offering` moved to batch 3 (ask 2). **Only you can charter a map** — say *"chart the hub map"* whenever you want it anyway.

### 13. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream waits on it. Listed only so it is not silently forgotten; say the word and it gets a ticket and a design pass.

### 14. Should weekend quiet be normal too? — one word

**The machine was off from Friday 16:28 to Sunday 13:22 — 45 hours — and everything resumed on its own.** Nothing broke, nothing was lost, no work is missing. The reason it reaches you at all is that the silence probe cannot tell a deliberate weekend from a fault, and you have only ruled on nights.

The probe's own words: *"No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-09-04T14:28:53.000Z — 44.9h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared."*

My read is that it was a host that was simply off: three unrelated schedulers stopped in the same minutes and came back in the same minute. That is a machine-state fact, not a defect.

**Say "weekend quiet is normal too"** and it is declined the way overnight quiet has been since 8 August, and stops reaching you. Say nothing and it will surface again after the next long gap.

## Resolved this period

- **Your pixel sweep is six-for-nine and found a fix of its own** *(2026-09-04)*. Live: [THR-1409](https://linear.app/threadbare/issue/THR-1409/three-worldgen-constants-are-declared-twice-with-different-values-the), [THR-1410](https://linear.app/threadbare/issue/THR-1410/authored-choice-veil-the-commit-control-is-unreachable-at-19201080-the), [THR-1411](https://linear.app/threadbare/issue/THR-1411/the-stance-word-never-renders-on-the-live-authored-choice-veil-choice), [THR-1413](https://linear.app/threadbare/issue/THR-1413/no-route-puts-a-companion-on-a-mortal-from-the-browser-and-a-companion), [THR-1414](https://linear.app/threadbare/issue/THR-1414/no-premonition-surfaced-in-280-ticks-across-four-seeded-runs-verify), the self-found [THR-1418](https://linear.app/threadbare/issue/THR-1418/terrainpipeline-has-no-pipeline-22-more-cms-tuning-rows-render-a), and [THR-1416](https://linear.app/threadbare/issue/THR-1416/consequence-chip-tag-maxwidth-190-wraps-bond-reputation-with-sacred) — the consequence chip's tag ceiling, tuned against the corpus rather than one screenshot ([PR #1820](https://github.com/christianspliid-ui/threadbare/pull/1820)), and the last thing merged before the machine went quiet.
- **You killed the encounter audio moments, and they are now deleted** *(2026-09-04)*. *"thr 1168. no audio please."* — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) had waited since 18 August; merged and deployed the same day ([PR #1817](https://github.com/christianspliid-ui/threadbare/pull/1817)).
- **You accepted the two batch-1 exemplars** *(2026-09-04)*. *"the two examplars are accepted"* — The Grateful Kin and The Unsafe Bridge cleared the "worth meeting twice" bar, which released the camp batch's park. Ask 2 is the one approval left behind it.
- **Your three undertaking forks are decided** *(2026-09-03)*. [THR-1397](https://linear.app/threadbare/issue/THR-1397/which-open-cells-are-wanted-yield-and-leverage-ownership-of-people) — plotting a mortal's death, the signed curse and forced succession are all in. Ask 5 is three smaller questions than it was.
- **The undertaking grid is generated and build-gated** *(2026-09-03)*. [Slice 4a](https://github.com/christianspliid-ui/threadbare/pull/1804) — your verbs, the registry redrawn on the world-object catalogue, and [a grid page](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/undertaking-grid.generated.md) the build refuses to let go stale. Ask 3 is its last slice.
- **The world's objects now have one catalogue in game words** *(2026-09-03)*. [THR-1394](https://linear.app/threadbare/issue/THR-1394/the-worlds-objects-one-canonical-catalogue-in-game-words-the-drift) — what made the undertakings map chartable, and what unparked ask 3.
- **Proactive Agent Actions closed complete** *(2026-09-03)*. [The map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map) and all six plan docs done — substrate, action library, binder, reactive loop, the calling & the surfaces, the factory.
- **The word players see is settled and shipped** *(2026-09-02)*. [THR-1314](https://linear.app/threadbare/issue/THR-1314/ul-proposal-work-holding-kind-row-christening-failure-name-register): what a character owns reads **freehold**. Say the word any time if it is wrong to your ear — still four lines to reverse.
- **Three of the four things Traits wave 2 was said to be blocking closed on their own** *(2026-09-02)*. No decision of yours was involved, and ask 6 is smaller as a result.
- **The engine got a speed guard** *(2026-09-02)*. [THR-1385](https://linear.app/threadbare/issue/THR-1385) — tick cost had drifted 45 s → 112 s over four days with CI timeouts as the only signal. Now measured hourly against a rolling median.

---

Older resolved items, run measurements and the full narration: `git log -p origin/ops -- Design/user-actions.md`.
Briefing (refreshed hourly): [Design/briefing.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).
