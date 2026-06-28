# Opening & Action Availability — living design reference

**Date:** 2026-06-28 · **Author:** Cowork · **Status:** living reference (tune this as we make the game start good)

> This is the single place that answers **"how does an action become available to the player, and when?"** It is the knob-board for the opening experience. The implementation lives across the Ascendant Beats — Divine Cadence project (THR-499) — see `Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md` for the build spec. This doc is the *conceptual* reference we iterate against.
>
> **Currency note (2026-06-28):** the Ascendant Beats work is shipped per Linear (THR-500/501/502/503/505/507/508/509/511/512/513/517 Done). The descriptions below reflect that designed-and-shipped state. A code-true catalog regeneration is pending a synced checkout (the Cowork sandbox was on a stale branch when this was written).

## 1. The two axes

Player action availability is the product of two independent questions:

1. **Does the action exist?** — the **catalog**: ~114 ascendant action templates today (+ the Ascendant Beats verbs). See the visual catalog (`Docs/visuals/action-catalog.html`).
2. **Is it available *right now*?** — the **availability system**: floor → unlocks → gates → surfaces. This doc.

We tune the *opening* almost entirely on axis 2. The catalog grows slowly; availability is where game-feel is dialed in.

## 2. The floor (turn 1)

After THR-501, a fresh run shows **only the two generics: Move and Investiture** (the AscendantBar Core tier). Everything else — hex verbs, agent interventions, the AscendantBar Self/Rare tiers — is hidden until unlocked. The legacy intervention wheel (`engine/wheel.ts`) was **retired**; agent-facing interventions now flow through the unlock-gated unified `divine.*` templates.

`STARTER_ACTION_IDS` shrank from the old Starter-12 to `[move, investiture]`. `runUnlockedActionIds` (per-run) starts there and grows as beats grant.

## 3. The four availability surfaces

An action can appear on any of these; each is gated, and **all of them honour the unlock set** (post-THR-501):

| Surface | What it shows | Gate source |
|---|---|---|
| Hex / location drawer | hex + location + faction + artifact verbs for the selected target | `getTargetActionSlots` (`targetActions.ts`) |
| Agent action hand | verbs for a selected agent (bind-thread, divine.* interventions) | `getTargetActionSlots` via `useAgentInteraction` — now passes `unlockedActionIds` |
| AscendantBar — Core | **Move + Investiture only** (always on) | hard-coded, ungated |
| AscendantBar — Self / Rare | ascendant-innate self-actions (Meditate/Withdraw/…) | `selectActionTray` — now unlock-gated (turn 1 = empty) |

## 4. The gate cascade (how one action is filtered)

`getTargetActionSlots` runs each candidate template through an ordered cascade; the first failing gate hides or dims it. Order (current):

1. **Node-type** — template `targetCategories` includes the target's type
2. **Subtype** — template `targetSubtypes` matches
3. **Thread-dedup** — hide `bind_thread_*` when a thread already exists
4. **Trait** — `requiredTargetTraits` present
5. **Node-property** — `requiredNodeProperties` match
6. **Revelation** — narrative-layer revealed (unless `bypassRevelationGate`)
7. **Unlock** — `isActionRevealed(template, runUnlockedActionIds)` — *the opening's main lever*
8. **Reach** — `requiresReach` ∈ the ascendant's two domains (**permanent** filter, see §6)
9. **Sphere** — `sphereAffinity` ∈ accessible spheres (soft: shows locked)
10. **Essence** — affordable
11. **Range** — within local range (hex distance)

When tuning the opening, gates **7 (unlock)** and **8 (reach)** are the ones we move; the rest are structural.

## 5. The unlock model

Two layers were designed; **only the within-run layer is built** (per the 2026-06-26 decision; per-account meta deferred to THR-480):

- **Within-run (`runUnlockedActionIds`)** — starts as `[move, investiture]`; the `unlock_action` aftermath effect pushes IDs in as beats resolve. Resets each run.
- **Per-account (deferred)** — would widen the *pool* of what beats can grant, never grant on turn 1. Not built; clean seam left.

Actions fall into three **buckets** (`ASCENDANT_ACTION_BUCKETS`):

| Bucket | Available | Example |
|---|---|---|
| Generic | always (the floor) | `move`, `investiture` |
| Unlockable-generic | earned via beats, any ascendant | `invest.thread_actor`, `imbue`, `consecrate`, `bestow`, `anoint` |
| Reach-gated | earned via beats AND within your two domains | reach-specific investment cards |

## 6. The two-domain lock

Every ascendant has exactly **one primary + one secondary domain (reach)**, fixed for the whole run; no other domain is ever reachable. The reach gate (#8) is therefore a **permanent** filter — a card needing a third domain is hidden the entire game, never surfaced even as aspiration. Spheres are the orthogonal axis (also primary+secondary, fixed at chargen). Expression-card *magic* is flavored by these two axes.

## 7. The opening engine — the Director and beats

The piece that decides *when* unlocks arrive is the **Ascendant Beat Director** (`phaseAscendantBeatDirector`), an orchestrator phase that **offers** one beat at a time. A beat is an encounter addressed to the god (a `UnifiedActionTemplate`); resolving it (the offer→enter→resolve path, THR-517) clears `pending`, records history, and runs aftermath (incl. `unlock_action`).

Three beat sources:

- **Spine beats (scripted, 0–4)** — the deterministic opening. Each grants cards + seeds a thread: Beat 0 The First (threaded actor) → Beat 1 The Seat (threaded throne + mana) → Beat 2 A Thing Left Behind (threaded artifact) → Beat 3 The First Word (first expressive verb) → Beat 4 A Path Opens (1-of-N selection).
- **Pool beats (cadence-gated)** — the living world. Drawn every `BEAT_BASE_INTERVAL` (±jitter, ≥ `BEAT_MIN_GAP`), filtered by eligibility predicates and weighted by identity bias (THR-516): introduction (surface a culture/faction), investment (offer a thread/bless/claim), selection.
- **Delivery beats** — wrap otherwise-unreachable branching encounters (THR-452) as divine visions.

## 8. The tuning surface (what we change to make the start fun)

These named constants are the dials. Changing game-feel = changing a number here, not rewriting logic (NFP #1).

| Constant | Default | Effect on the opening |
|---|---|---|
| `STARTER_ACTION_IDS` | `[move, investiture]` | what's on screen at turn 1 |
| `SPINE_TRIGGER_TURNS` | `[0,2,4,6,8]` | how fast the scripted opening doles out cards/threads |
| `BEAT_BASE_INTERVAL` | 9 | how often the world "calls" after the spine |
| `BEAT_INTERVAL_JITTER` | ±2 | rhythm variation |
| `BEAT_MIN_GAP` | 4 | floor between any two beats (anti-spam) |
| `BEAT_KIND_WEIGHTS` | intro 3 / invest 4 / select 1 / delivery 2 | the *flavor mix* of the living world |
| `ESSENCE_PER_SEAT` | 1.0 | how fast the throne funds early actions |
| spine grant map (unlock catalog) | per Beat 0–4 | *which* cards arrive *in what order* |

**The most important opening lever is the spine grant map + `SPINE_TRIGGER_TURNS`** — together they decide what the player can do, and how quickly, in the first ~8 turns. That's where "good and fun" is won or lost.

## 9. What we'll iterate on (open tuning questions — resolve in playtest, not on paper)

- Does turn 1 = 2 cards feel empowering or empty? (candidate: Beat 0 fires on turn 0–1 so the player gets bind-thread + observe immediately.)
- Is the spine cadence (`[0,2,4,6,8]`) too slow/fast for the first session?
- Does the pool kick in at the right moment after the spine, and is the kind-mix the right texture?
- Reach-gated cards: surfaced as aspiration anywhere, or invisible until earned? (Currently invisible per the two-domain lock.)
- Do Self/Rare innate actions belong in the opening at all, or stay gated? (Currently gated.)

These are **playtest questions** — the whole point of making availability data-driven is that we answer them by feel, fast.

## 10. Pointers

- Build spec: `Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md`
- Live gate: `src/engine/actionUnlock.ts` (`isActionRevealed`, `STARTER_ACTION_IDS`)
- Targeting cascade: `src/engine/targetActions.ts`
- Action audit (catalog, partly stale): `Docs/audits/2026-05-09-ascendant-actions-audit.md`
- In-game catalog: `?view=codex`
- Visual catalog: `Docs/visuals/action-catalog.html`
- Visual of this system: `Docs/visuals/opening-system.html`
