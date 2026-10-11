> **Prototype audit for THR-1773** (wayfinder map THR-1758, project Dominion — Player Power Progression). Attended session 2026-10-11, Christian present in chat. **The direction is Christian's ruling** (chat, 2026-10-11, recorded on the ticket); the *how* below is decided by delegation with a veto invited. Inputs: the THR-1772 research (`Docs/audits/2026-10-06-thr-1772-starting-god-stats-and-cross-run-persistence-research.md`), the THR-1794 tiers (`Docs/audits/2026-10-11-thr-1794-god-card-tiers-prototype.md`), the THR-1763 neglect rule, the THR-1765 power growth, rulebook §11. Prototype code is on the never-merged branch `proto/thr-1773-cross-run`: the driver `scripts/proto-cross-run-1773.mjs` and its output `scripts/proto-cross-run-1773.out.txt`. The mock is [`remembrance-mock.html`](2026-10-11-thr-1773-remembrance-mock/remembrance-mock.html).

# THR-1773 — how a player's gods grow across runs

## Christian's ruling (chat, 2026-10-11)

Three shapes were laid out: the world remembers + wider choices, a stronger start, and wider choices only.

1. **"World remembers + wider."** The god starts every run equally strong. What carries is **in the world** (Monuments, Legacy mortals' descendants, Relics, the World-Soul's tilt) and **in the player's choices** (each run unlocks hungers, courts and cards for later runs). **No stat growth on the god.**
2. **"New world, shaped by echoes."** Each run wakes in a fresh map with fresh mortals, and the echoes are seeded into it (rulebook §11: *a response, not a sequel*). Today's in-tab "Begin Next Cycle" continues the same world, graph and god, so it changes.

Ground truth: `main` @ `1ed28336`. Re-run on `proto/thr-1773-cross-run` with `node scripts/proto-cross-run-1773.mjs` (add `--unlocks N` / `--harvest triumphant|bittersweet|somber` / `--runs-mc N`).

## Verdict in one paragraph

What a run starts with is grown on three axes that already exist in code, and none of them is a god stat:

1. **Echoes seeded into the new world.** The four echo kinds (Legacy / Monument / Relic / card, `src/types/echo.ts`) fade 0.15 a world and are gone at 0.9; the harvest keeps one to three of the god's own (`HARVEST_ECHO_COUNTS`). At most six live echoes are seeded into each world.
2. **The World-Soul's tilt.** `blendFundaments` exists but has no caller. Each world leans a little toward the spheres the last god drew on, and relaxes back.
3. **Unlocks that widen choice.** Run 1 offers 4 of the 12 hungers and 70 of the 93 market cards. Each run awakens one hunger, chosen by the player from two the echoes favour, and unseals two cards weighted to the spheres the god drew on. All 12 hungers are awake by run 9 and all 93 cards by about run 14.

The run's own economy is **unchanged from run 1 to run 20**: day 10 holds 20 cards, day 45 holds 44 with 15 bought, every time. Only late-run wonder buys rise (1.0 → 1.9 Tier 4 by day 90) as the reservoir opens. So cross-run growth cannot trivialise the in-run loop, by construction. Echoes give a small, fading, sphere-relative head start: 0–1 places start Held or Touched for a kin god. **A past god's monument in opposing spheres starts as ground against you.** That is the brake and the story in one. The one real prerequisite is an **account store**: today a new game inherits nothing, and there is no persistence layer.

## 1. The axes

| Axis | Grows? | Existing substrate | Earned by | Cost / brake |
|---|---|---|---|---|
| **Monuments** in the new world | Yes: the world | `EchoType 'monument'`, `buildEchoDefinition` (`cycleEnd.ts`), `EchoInjection.location_feature` | A place the god held Sovereign or raised (harvest picks; divine echoes 1–3 by harvest type) | Read against the *next* god's spheres: kin, it starts **Held** (memory still warm, degradation < 0.3) or **Touched** (< 0.6); opposed, it starts **Hostile**. THR-1763 neglect applies, so an untended monument loses a band in about 3 weeks. |
| **Legacy** descendants | Yes: the world | `EchoType 'legacy'`, `traitTendencies` | A mortal who became an Aspect or a Champion | A notable descendant with a tie (THR-1589 notables and ties) whose spheres lean like the old god's. Easy to reach for a kin god, natural kin to a rival for an opposed one. No tier or thread carries. |
| **Relics** lying in the world | Yes: the world | `EchoType 'relic'`; THR-1764 bearer reads (unborne = Foreign) | An artifact the god imbued or bound | Lies unclaimed; must be found and borne. A Foundation-sphere relic is how elder magic can be *met* sooner, but never bought. |
| **Card echo** | Yes (shipped) | THR-887 `cardEcho`, `echoCardsFromDefinitions` | The harvest's card pick | One nudge card in the starting repertoire, scarred after a somber age. Unchanged. |
| **World-Soul tilt** | Yes: the world | `FundamentState.sphereWeights`, `blendFundaments` (no caller), `executeCycleTransition` (no caller) | The spheres the god drew essence through (`essenceEarnedBySphere`) | `FUNDAMENT_BLEND_PER_RUN` 0.1 toward the god's pair, `FUNDAMENT_REVERT` 0.05 back toward even. The modelled god's spheres sit ×0.92–×1.34 of even. How far that moves tick-0 home turf needs a census once world generation reads the Fundament; today `cosmology.ts` never reads it (THR-1772 §3). |
| **Hungers on offer** | Yes: choice | `filterHungers`, `HUNGER_CATALOG` | One awakens per run: the player picks between the next two sealed hungers, and the echoes favour the one sharing a sphere | Run 1 offers Gather, Witness, Reclaim, Sever (one per court shape). All 12 by run 9. |
| **Courts** | Yes: choice | each hunger's two `courtOptions` | A hunger's second court opens after one run played with it | None |
| **Cards that can rise among the omens** | Yes: choice | THR-1794 `progression` (a sealed card is simply not offered) | Two unseal per run, weighted to the god's primary (×3) and secondary (×2) | Run 1's market keeps every Tier 1–2 card, every generic card, and each sphere's cheapest Tier 3. The other 23 (most Tier 3 and every sphere-bound Tier 4) are the reservoir; new authored cards join it. |

## 2. The curve

Bittersweet harvest every run, two unlocks a run; the economy columns are 300-seed means for the THR-1794 fit player.

**What a run starts with** (the god played that run; the head start is read against its spheres):

| Run | God played | Hungers on offer | Market cards | Still sealed | Echoes alive (Monument / Legacy / Relic) | Places Held / Touched at start | Opposed monuments | Kin mortals | World tilt to its spheres |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Gather (life/spirit) | 4 | 70 | 23 | 0 / 0 / 0 | 0 / 0 | 0 | 0 | ×1.00 |
| 2 | Witness (mind/spirit) | 5 | 72 | 21 | 0 / 1 / 1 | 0 / 0 | 0 | 1 | ×1.20 |
| 5 | Preserve (time/spirit) | 8 | 78 | 15 | 2 / 2 / 2 | 1 / 1 | 0 | 1 | ×1.34 |
| 10 | Consume (entropy/force) | 12 | 88 | 5 | 2 / 2 / 2 | 0 / 0 | **1** | 0 | ×0.92 |
| 20 | Bind (matter/mind) | 12 | 93 | 0 | 2 / 2 / 2 | 1 / 0 | 1 | 1 | ×1.20 |

**What the run then does:**

| Run | Day 10 held / bought | Day 45 held / bought | Day 45 bought T1/T2/T3/T4 | Day 90 bought T3 / T4 | Shared first five buys |
|---|---|---|---|---|---|
| 1 | 20.0 / 2.0 | 44.1 / 15.1 | 7.0 / 7.7 / 0.4 / 0.0 | 7.4 / 1.0 | 0.35 |
| 2 | 20.0 / 2.0 | 44.1 / 15.1 | 7.0 / 7.7 / 0.4 / 0.0 | 7.8 / 1.0 | 0.35 |
| 5 | 20.0 / 2.0 | 43.9 / 14.9 | 7.0 / 7.6 / 0.4 / 0.0 | 8.0 / 1.0 | 0.35 |
| 10 | 20.0 / 2.0 | 43.9 / 14.9 | 7.0 / 7.5 / 0.4 / 0.0 | 7.5 / 1.6 | 0.35 |
| 20 | 20.0 / 2.0 | 43.9 / 14.9 | 7.0 / 7.5 / 0.4 / 0.0 | 7.2 / 1.9 | 0.35 |

For scale: the THR-1765 census puts a Shepherd at power 1.0 at 41–53 Touched-or-better places at tick 0 (seeds 42/99/7). A head start of one Held monument is a felt landmark, not a balance shift. It is about two weeks of Claim Dominion attention (THR-1762) that fades in about three weeks untended.

**Sensitivity** (in the `.out.txt`): a triumphant harvest every run fills the echo cap a run sooner but does not raise it; a somber one slows it. **Four unlocks a run** unseals the whole reservoir by run 7, which is why two was chosen. Choice keeps widening until about run 14, and newly authored cards extend that. **Width is content-bound:** once the reservoir is empty, only new cards, hungers and courts keep "wider" alive. That makes content cadence a standing input to this system.

## 3. What never grows

Fixed across runs, by Christian's ruling and canon:

- the sphere point budget and per-pole cap (THR-1749: 5 / 3)
- starting essence and cap (50 / 50 + 5 a thread), the income split, and starting power 1.0 (THR-1765)
- reach affinities per hunger, two reach signatures a run (never a third: rulebook *no third domain in a run*), and the opening spine
- the tier ladder, prices and keys (THR-1794)
- **Foundation spheres are never bought** (found only; a Relic echo can carry one into the world to be found)

The meta layer loosens only **which** hungers, courts and cards are on offer, and **what the new world contains**.

## 4. Where it is earned and seen

**Earned at Twilight**, in the existing harvest:

- the harvest type sets how many divine echoes the world keeps (3 / 2 / 1)
- the harvest's picks name which place, mortal and relic become echoes
- the spheres the god drew essence through set the tilt and which cards unseal
- the player picks which of two stirring hungers awakens

**Seen in one place:** a new first step of Remembrance from run 2 on, *The world remembers*, before the Stirring ([mock](2026-10-11-thr-1773-remembrance-mock/remembrance-mock.html)). It shows what still stands (each echo named, sphere-tinted, with memory words: *still warm / fading / almost gone*). Opposed monuments are shown **before** the god is chosen, so the choice carries weight. It also shows the gods who may wake (two stir, and the player chooses), and the powers that may now rise among the omens. No numbers anywhere.

UI-Laws judgement for the mock: **Law 13** ✓ (memory and tilt are words). **Laws 1 / 17** ✗ in the static mock: every sphere and echo word needs a registry tooltip in a build. **Law 21** ✗ in the mock: every echo and power name must open its Chronicle or Codex entry. Sphere tint kept. Laws 33 / 37 are not engaged. The ✗ rows are build obligations, not direction defects.

## 5. The prerequisite: an account store

A new game inherits nothing today (THR-1772 §3: no save system; `worldSoul` is rebuilt from defaults; Fundament blending and `bankedDiscoveries` are unwired). Under the ruling, the next run is a **new** world, so cross-run state does **not** need a full world save, only a small versioned **account record**:

- unlocked hungers, courts and card ids
- live `EchoDefinition` + `EchoState` (degradation)
- the Fundament weights and Resonance memories (≤ `MAX_RESONANCE_MEMORIES` 10)
- the cycle count

It can live in browser storage first (a cleared browser resets the account; acceptable at this stage) behind one read/write seam, so a server store can replace it later. `transitionToNewCycle` (same graph) is replaced by: generate a new world, wire `executeCycleTransition` / `blendFundaments`, seed echoes through `EchoInjection`, then run Remembrance from *The world remembers*.

## 6. Decided, reserved, veto

**Christian's ruling:** world remembers + wider; each run a new world shaped by echoes.

**Decided by delegation** (the *how* of the ruling):

1. The axes and earners in §1.
2. A monument reads Held / Touched / Hostile against the *next* god's spheres, with neglect applying.
3. At most `MAX_SEEDED_ECHOES` 6 live echoes per world.
4. `FUNDAMENT_BLEND_PER_RUN` 0.1 with `FUNDAMENT_REVERT` 0.05.
5. Run 1 offers 4 hungers and 70 market cards; one hunger (player's pick of two) and `ACCOUNT_CARD_UNLOCKS_PER_RUN` 2 cards unlock per run; a second court opens after one run with a hunger.
6. The never-grows list in §3.
7. The Remembrance step in §4.
8. A small account record, not a full save.

**Veto lines:**

- *keep the in-tab "same world" continuation as an option*
- *opposed monuments should not stand against you*
- *run 1 should offer all 12 hungers*
- *unseal faster (4 a run)*

## 7. What the model does not cover

- **Turf effect of the tilt:** how far the Fundament tilt moves tick-0 home turf needs a census, once world generation reads the Fundament.
- **Echo kinds per harvest:** these rotate in the model; in play the harvest picks them.
- **Measured god:** the economy columns measure the Shepherd on each account's market, whatever god the run plays. The day-10 and day-45 numbers do not move with the market's width, so the choice of measured god does not bias the claim that the in-run loop stays the same.
- **Real players:** they will not rotate hungers in catalog order.
