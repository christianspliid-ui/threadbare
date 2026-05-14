# THR-431 — Reveal Corruption — Brainstorm Prep / Design Options

**Date:** 2026-05-14
**Linear:** [THR-431](https://linear.app/threadbare/issue/THR-431) — *Reveal Corruption — hidden-state divine action (deferred from THR-400)*
**Project:** Social Systems Expansion (Now / High)
**Parent:** [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
**Deferred from:** [THR-400](https://linear.app/threadbare/issue/THR-400) §14 deferral #2 (`Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md`)
**Sibling deferrals:** THR-430 (Schism, Ready for Dev), THR-432 (Anoint Successor, In Dev), THR-433 (Kindle a Calling, Ready for Dev)
**Status of this doc:** brainstorm-prep — NOT a finished plan, NOT a Ready-for-Dev handoff. See §0.

## 0. Why this is brainstorm-prep, not a finished plan

THR-431 is the fourth and last undesigned deferral from THR-400. Its three siblings have all been designed and handed off. The natural move this session was to design THR-431 the same way — and most of it *can* be designed within established direction. §2 below does exactly that: a complete three-pillar design for the corruption schema, the verb, the encounter, the UI, the traces, the constants, and the fail-soft posture.

But one piece cannot be settled autonomously. The **suspicion mechanic** — "the verb appears only when the player has earned legibility through prior play" — is called a *Vision-level UX decision* by **three independent sources**:

1. The THR-431 issue body itself: *"The suspicion mechanic … This is a vision-level UX decision."*
2. The THR-400 reframe §14: *"Per the audit's Tension #4, this is a Vision-level UX decision, not a UX afterthought."*
3. The THR-432 brainstorm companion (written earlier today, 2026-05-14): *"THR-431 (Reveal Corruption) was explicitly not chosen: it needs a new Vision-level 'suspicion mechanic / hidden-until-suspected' decision that warrants a brainstorm session with Christian before design — designing it autonomously would risk drifting the game's legibility model."*

The legibility model — how much a player is allowed to know about hidden world state, and how they earn that knowledge — is core creative direction. Picking it unilaterally is exactly the drift the `keep-work-flowing` brief forbids ("we can't have the game drift from your humans creative vision"). And whatever THR-431 establishes becomes the precedent every future expose verb copies (Unmask the Heretic, and any later hidden-state verb).

So this doc **does the design work that is safe to do**, and **isolates the one decision that is not** into §3 — framed as three concrete options with a recommendation, so the brainstorm with Christian is a 10-minute verdict, not a blank page. Once Christian picks, §4 describes the short pass that converts this into a Ready-for-Dev plan doc.

## 1. Upstream + sandbox state — read before picking this up

Three things the executor (and Christian) must know:

**1.1 THR-400 is not in the working tree.** `dissentLevel`, `getDoubterCandidate`, `faction-action-constants.ts`, and the four shipped faction verbs are all absent from `src/` as of this session. THR-400's PR #276 was blocked by a CI billing failure (impediment #136); the Linear issue shows "Done" but the code has not landed in this tree. **THR-431 rides `dissentLevel` (raises it on reveal) and `faction-action-constants.ts` (appends constants) — both are THR-400 artifacts.** This is a hard sequencing dependency: THR-431 lands *after* THR-400 merges. If THR-431 is somehow picked up first, the executor creates `faction-action-constants.ts` and a local `dissentLevel` property exactly as the THR-432 plan instructs for the same situation.

**1.2 Working-tree staleness.** `scripts/session-precheck.ts` reported `freshness=unknown` (git could not reach origin in the sandbox). `src/` files are dated 2026-04-28 and THR-400's "Done" work is not present. Whoever implements THR-431 must `git fetch && git pull` (or rebase) and re-verify the substrate claims in §2 against current `main` before authoring.

**1.3 Naming collision — `corruption` is already taken.** `corruption` exists in the codebase as a **hex / location** property (a 0.0–1.0 level, see `src/types/index.ts:122–123`, `hexMutation.ts`, `controlEffect.ts`, `doomClock.ts` `hex_corruption`). Faction/member corruption is genuinely new — there is no `corruptionRevealed` flag, no member corruption state (confirmed by grep; matches the THR-400 reframe §1 claim). **The new concept must be namespaced distinctly** — this doc uses `latentCorruption` on members and `corruptionRevealedTick` on factions to avoid colliding with the hex concept.

## 2. The design that IS settled (within established direction)

Everything in §2 rides verified substrate or the THR-400 / THR-432 sibling pattern. None of it is gated on the §3 decision — these parts are the same regardless of which suspicion-mechanic option Christian picks. The §3 decision only changes the **drawer-surfacing rule** in §2.6.

### 2.1 Hidden-corruption schema — member-level latent state

**Recommendation: corruption is a latent state on a faction *member* (an agent), not on the faction node.**

Rationale: the issue's mortal-loop bridge requires the corrupted member to *be* the encounter target ("The corrupted member becomes the encounter target. Two choices in the scene: confess … or deny …"). A faction-level flag has no person to put in the scene. A member-level state resolves directly to the mortal who must answer for what was hidden. This also matches the shipped expose verb's pattern — `Surface a Doubter` (THR-400) resolves a *member* via `getDoubterCandidate`.

**Shape** — an optional property record on the agent node `properties`, additive, no interface change:

```ts
latentCorruption?: {
  kind: 'financial' | 'moral' | 'doctrinal';  // the three flavors named in the issue body
  severity: number;        // 0.0–1.0 — how deep the rot runs; scales reveal consequences
  originTick: number;      // when the world seeded it — drives prose ("years of quiet skimming")
  factionId: string;       // which faction membership the corruption attaches to
};
```

Plus an agent condition string `'corruption_revealed'` appended to the existing `conditions: string[]` array *after* the reveal (so post-reveal encounter content and prose can branch on it). A member-level edge (`corrupted_by`) was considered and rejected — corruption is data internal to the member's own state, not a relationship between two entities; the load-bearing "relationships are edges, properties are internal data" decision points at a property record here, not an edge.

**Sub-decision A (recommended, low-risk):** member-level over faction-level. If profiling ever shows the per-faction scan is costly, the faction node can carry a derived `latentCorruptionCount` cache — but v1 does not need it (same posture as THR-400's `getDoubterCandidate` scan).

**Sub-decision B — how corruption is seeded (recommended: world-sim drift).** Non-Negotiable #4 ("the world simulates around the player") says corruption should accrue on its own, not only when the player looks. Spec: an additive block in `phaseFactionActions.ts` (the same phase THR-400 extends with dissent decay) runs a low per-tick probability check per faction; on a hit, it seeds `latentCorruption` on one eligible non-leader member. **Eligibility weighting** favors the conditions corruption actually grows in — large factions, high-prosperity/high-wealth factions, factions with low cohesion or high `dissentLevel`. The kind (`financial` / `moral` / `doctrinal`) is biased by the faction's `factionType` (criminal → financial, religious → doctrinal, etc.) via the seeded PRNG. Rate is a tunable constant (§2.4). This is a *quiet* system — corruption seeded this way produces **no** player-facing signal until revealed (the whole point — it is hidden). The alternative ("player-observation-only seeding") is noted for Christian in §3's secondary question, but world-sim drift is the recommended default.

### 2.2 The verb — `action.faction.reveal_corruption`

| Field | Value |
|-------|-------|
| Template id | `action.faction.reveal_corruption` |
| Name / spell name | Reveal Corruption / *Naming What Was Hidden* |
| Reach / Sphere | `eye` / `mind` (per issue body) |
| CRUD verb | `read` — it surfaces existing state, does not fabricate (matches the issue's "read action that conditionally surfaces existing state — does not fabricate") |
| Cost / rarity | essence 10 · rarity tier 2 (Storied) (per issue body) |
| Target | `agent` — the corrupted member, resolved via `getCorruptionCandidate` (see below) |
| Engine effect | clears the member's `latentCorruption`; adds `corruption_revealed` condition; sets `corruptionRevealedTick` on the faction; drops faction reputation; raises faction `dissentLevel` (rides THR-400); plants `faction.encounter.corruption_scandal` on the revealed member |
| Trigger | player-cast from the action drawer; surfaced per §2.6 |

**`getCorruptionCandidate(graph, factionId)` helper** — new export in `factionNetwork.ts`, mirrors `getDoubterCandidate` (THR-400) exactly:

```ts
/**
 * Returns the member of this faction whose latentCorruption is most severe,
 * or null if no member carries latent corruption. Fail-soft: ignores dead /
 * non-member / army agents.
 */
export function getCorruptionCandidate(
  graph: WorldGraph,
  factionId: string,
): { agentId: string; kind: 'financial' | 'moral' | 'doctrinal'; severity: number } | null;
```

The verb resolves its target through this helper. If it returns `null`, there is no corruption to reveal — and the verb is not surfaced (§2.6). This is the "only fires if corruption actually exists" requirement from the issue body, expressed exactly as `Surface a Doubter` expresses its equivalent.

**`crudType: 'read'` note:** the companion expose verb from THR-400 (`Surface a Doubter`) and the perception family (`observe`, `scry`) are `read` verbs. Reveal Corruption is the same shape — it makes hidden state legible. Flagged as low-risk for the executor to confirm against the unified-action `read`-verb pipeline at pickup.

### 2.3 The encounter — `faction.encounter.corruption_scandal`

Authored in `src/data/faction-action-encounters.ts`, family `faction_internal_pressure` (the family the THR-400 reframe established for these verbs). Planted on the revealed member when the verb resolves, `delayTicks: CORRUPTION_SCANDAL_ENCOUNTER_DELAY`.

A 2–3 beat scene. Beat 1: the room hears it — the corrupted member feels themselves named, the faction's eyes turning. Beat 2: the choice.

**Two choices, each with an explicit moral-axis tilt on the card** (per `2026-05-04-encounter-experience-design-plan.md` Rule 2), straight from the issue body's "Mortal-loop bridge":

1. **Confess** *(toward sworn / honesty; courage under exposure)* — the member owns what was hidden. Faction credit is lost (reputation drop, `dissentLevel` already raised by the verb), but the **member-arc is preserved**: they keep their `member_of` edge, gain a `confessed_corruption` condition (a hidden mark available to future content — a redemption thread), and the encounter plants one follow-on `encounter_seed` scored against whether the faction forgives or watches them.
2. **Deny** *(toward renegade / concealment; the lie doubled down)* — the member refuses the naming. Faction credit is lost **harder** (deeper reputation drop), and the member is **exiled or hunted**: their `member_of` edge is removed (additive edge removal, *not* the full Schism subsystem), they gain a `corruption_denier` / hunted-adjacent condition, and the encounter seeds a follow-on on the faction (a purge beat) and optionally on the exiled member (a fugitive beat).

**Enrichment placeholders (≥2 required — systemic wiring guide Cap. 1):** `{name}` (the corrupted member), `{factionName}`, `{?has_ally}` / `{?has_rival}` (does the member have anyone who will stand with them, or anyone who will twist the knife — colors both branches), and `{leaderName}` (the faction head who must respond to the scandal). The `kind` of corruption (`financial` / `moral` / `doctrinal`) selects among authored prose variants so the scene reads specifically — an embezzler's scandal and a heretic's scandal are not the same scene.

Threadbearer voice — short, charged, mythic. The drawer card is one sentence; the encounter is where the verb's narrative weight lives.

### 2.4 Constants table (NFP #1)

Appended to `src/data/faction-action-constants.ts` (created by THR-400; if THR-400 has not landed, create it per the THR-432 plan's instruction).

| Constant | Default | Used by | Purpose |
|----------|--------:|---------|---------|
| `REVEAL_CORRUPTION_ESSENCE_COST` | 10 | template | essence cost of Reveal Corruption |
| `CORRUPTION_SEED_BASE_RATE_PER_TICK` | 0.004 | world-sim seeding | base per-faction per-tick probability of seeding latent corruption |
| `CORRUPTION_SEED_SIZE_WEIGHT` | 0.5 | seeding eligibility | how much faction size scales the seed rate |
| `CORRUPTION_SEED_PROSPERITY_WEIGHT` | 0.5 | seeding eligibility | how much faction prosperity/wealth scales the seed rate |
| `CORRUPTION_SEED_DISSENT_WEIGHT` | 0.3 | seeding eligibility | how much existing `dissentLevel` scales the seed rate |
| `CORRUPTION_REVEAL_REPUTATION_DROP` | 0.20 | verb effect | faction reputation lost on reveal (before branch modifiers) |
| `CORRUPTION_REVEAL_DISSENT_CONTRIBUTION` | 0.30 | verb effect | how much a reveal adds to faction `dissentLevel` |
| `CORRUPTION_DENY_REPUTATION_MULTIPLIER` | 1.75 | encounter (deny branch) | extra reputation damage when the member denies |
| `CORRUPTION_SCANDAL_ENCOUNTER_DELAY` | 4 | verb effect | ticks until the scandal encounter becomes eligible |
| `CONFESSED_CORRUPTION_CONDITION_DURATION` | 30 | encounter (confess branch) | ticks the `confessed_corruption` mark persists |

Reach / sphere / rarity literals are enums, not constants (per existing template authoring convention — THR-400 reframe §6). The §3 decision may add **one** constant (a capability threshold or a scrutiny threshold) — noted in §3 per option.

### 2.5 Traces (NFP #2)

Two new traces. One for the cast/reveal, one for the world-sim seeding (so the hidden system is inspectable even before any player ever reveals anything — NFP #2).

```ts
// extends FactionActionTrace, per the THR-400 reframe convention
export interface FactionRevealCorruptionTrace extends FactionActionTrace {
  readonly subtype: 'reveal_corruption';
  readonly factionId: string;
  readonly revealedMemberId: string;
  readonly corruptionKind: 'financial' | 'moral' | 'doctrinal';
  readonly severity: number;
  readonly reputationDropApplied: number;
  readonly newDissentLevel: number;
  readonly seededEncounterId?: string;
}

// emitted by the world-sim seeding block — debug-only inspectability into the hidden system
export interface FactionCorruptionSeededTrace {
  readonly tick: number;
  readonly category: 'faction_corruption_seeded';
  readonly factionId: string;
  readonly factionName: string;
  readonly seededMemberId: string;
  readonly corruptionKind: 'financial' | 'moral' | 'doctrinal';
  readonly severity: number;
  readonly effectiveSeedRate: number;  // the weighted rate that fired — tunability inspection
}
```

`FactionRevealCorruptionTrace` joins the `FactionActionTrace` discriminated union; `FactionCorruptionSeededTrace` registers a new `faction_corruption_seeded` category in the DebugPanel category grouping.

### 2.6 UI pillar

**2.6.1 Action drawer.** `action.faction.reveal_corruption` appears in the drawer when the focused target is an `agent` — *gated by the §3 decision*. The part that is settled regardless of §3: when the verb is **not** available, it is **absent**, never greyed. Greying leaks the existence of hidden state — this is Tension #4 of the THR-400 vision audit, already settled by the THR-400 reframe §9.1 ("hidden = absent, not greyed"). The §3 decision only chooses *what makes it become present*.

**2.6.2 Faction detail panel — no pre-reveal signal.** Unlike Stir Dissent (which shows an ambient "restless" shadow), **corruption shows nothing on the faction panel until it is revealed.** That is the whole point — it is hidden. After a reveal: a small scar/fracture glyph next to the faction name while `corruptionRevealedTick` is recent, tooltip *"A hidden rot was named here. The faction is still answering for it."* The §3 decision may add a *faint* pre-reveal signal (Options B/C) — see §3.

**2.6.3 Chronicle / event log.** On reveal, an IPK chronicle band, the revealed member's name as an IPK keyword (`ProseKeyword.tsx` underline pattern):

> *"{memberName} is named for what no one was meant to know. Inside the {factionName}, the hidden cannot be hidden again."*

On the scandal encounter firing, the encounter's own chronicle entry takes over. The world-sim *seeding* writes **nothing** to the chronicle — seeding is silent.

**2.6.4 Debug inspection.** The DebugPanel faction inspector gains: a `latentCorruption` table across faction members (member id, kind, severity, originTick — debug *can* see hidden state, that is its job), `corruptionRevealedTick` on the faction, and the `faction_corruption_seeded` trace category in the trace stream. Never surfaced in player UI (NN #3).

**2.6.5 Screenshot evidence at closeout (1920×1080).** (1) action drawer with the verb visible on a corrupted-member target; (2) the `faction.encounter.corruption_scandal` encounter mid-flight with confess/deny cards and axis tilts; (3) faction panel post-reveal scar glyph; (4) DebugPanel `latentCorruption` table. Playwright for DOM; Claude-in-Chrome for any canvas surface. Plus console output and a `window.__DEBUG.*` assertion per the Definition of Done.

### 2.7 Fail-soft posture (NFP #4)

| Failure surface | Behavior | Why |
|-----------------|----------|-----|
| `getCorruptionCandidate` returns null at cast time | verb not surfaced (§2.6.1); if somehow reached, action fails with essence refund + prose *"There is nothing hidden here to name"* | unreachable in normal play; defensive |
| Corrupted member removed before the encounter fires | seed retargets to the next-most-severe corrupt member; if none, withers normally (standard `encounter_seed` path) | a scandal needs someone to stand accused |
| Scandal encounter template missing | standard `encounter_seed` "withered" path — trace emitted, no crash | THR-400 reframe §7.3 pattern |
| Faction has zero members | seeding block skips it; verb never surfaces | no one to corrupt |
| `latentCorruption` record has an unknown `kind` | encounter falls back to generic scandal prose; trace logs `corruptionKindFallback: true` | tolerate data drift |
| `phaseFactionActions` seeding block throws on one faction | per-faction `try/catch` (same pattern as `processFaction`) — skip that faction, never crash the tick loop | NFP #4 |
| Faction / member node mutated | call `touchStructure()` / `touchWorld()` per the CLAUDE.md world-version-counter decision | UI/selectors must see the change |

### 2.8 NFP compliance (for the settled design — §3 decision re-audited when chosen)

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | 10 constants named in §2.4; §3 may add one |
| 2 | Inspectability | PASS | two traces (§2.5) incl. a seeding trace so the hidden system is inspectable pre-reveal; DebugPanel lines §2.6.4 |
| 3 | Determinism | PASS | only PRNG draws are the seeded per-faction-per-tick seeding roll and the kind-bias pick — same seeding pattern `phaseFactionActions` already uses |
| 4 | Fail-soft | PASS | per-faction `try/catch`; fail-soft table §2.7 |
| 5 | Narrative over mechanical | PASS | the payoff is the `corruption_scandal` scene; `latentCorruption` / `corruptionRevealedTick` never surface as numbers |
| 6 | Additive over destructive | PASS | additive agent property, additive faction property, additive traces, new helper, additive seeding block, new template + encounter — zero edits to existing entries |
| 7 | Performance budget | PASS | one weighted roll + (on the rare hit) one member scan per faction per tick — same posture as THR-400's dissent-decay block |

## 3. THE DECISION — how rich is the "suspicion mechanic"? (Christian's call)

Everything in §2 holds regardless of this answer. This section is the one fork that needs a verdict, because it sets the **legibility precedent for every hidden-state verb in the game**, not just this one.

**The question.** Corruption exists in the world (seeded by §2.1). Between "it exists" and "the player can name it," what does the player have to *do* or *earn*? What is the "earned legibility through prior play" the issue body asks for?

This is genuinely creative direction — it is a statement about how much the game trusts the player to perceive hidden state, and how investigation feels. Three coherent answers, smallest to largest:

### Option A — Lean: capability prerequisite + real-state-exists

The verb surfaces in the drawer when **both**: (a) `getCorruptionCandidate(faction) !== null` (corruption is real), and (b) the player's `eye`-domain capability tier ≥ a threshold constant. Rides entirely existing substrate: the `joinPrerequisites: Partial<Record<ReachDomain, number>>` domain-capability pattern already on `FactionDefinition`, the `requiredNodeProperties` target filter, and the existing Gate 7 "revelation gating" (`narrativeLayer`) in `getTargetActionSlots()`. **No new system.** "Earned legibility" = your Eye-reach capability, which the player builds through play. One new constant (`REVEAL_CORRUPTION_MIN_EYE_TIER`).

- **Pro:** ships on fully-verified substrate; lockstep with the THR-400 expose-verb pattern (`Surface a Doubter`); smallest scope; "hidden = absent" honored cleanly.
- **Con:** suspicion is *binary and global* — once your Eye capability clears the bar, you can see all corruption everywhere; below it, none. There is no per-faction sense of "I have been watching *this* faction and I found something."

### Option B — Moderate: per-faction scrutiny accumulator

A per-faction `scrutiny` value (a property like THR-400's `dissentLevel`) rises when the player directs eye-domain attention at that faction — existing `observe` / `scry` / `revelationAction` verbs targeting the faction or its members, and intelligence grants from encounters there. When `scrutiny ≥ threshold` **and** corruption is real, the verb surfaces *for that faction*. Earned per-faction, not globally.

- **Pro:** investigation feels *local and earned* — the player who watched the merchant guild is rewarded with the merchant guild's secret; "where you have looked" matters. Still rides `dissentLevel`-shaped substrate.
- **Con:** moderate scope creep — eye-domain actions must *contribute* to `scrutiny`, which means touching their effect definitions; and the player needs a *faint* signal that scrutiny on a faction is paying off (a soft "you sense there is more to learn here" prose beat at the §2.6.2 panel) or they will never know to keep looking. That faint signal is itself a small legibility decision.

### Option C — Rich: graduated suspicion sub-loop

A multi-stage hidden-state reveal — a real investigation mini-loop. Faint hint (*"something is off in the {factionName}"*) → suspicion (*"there is corruption here — kind unknown"*) → clue (*specific member + kind known*) → verb surfaces. Each stage is advanced by distinct eye-domain play (different perception verbs, intelligence, encounters), each stage has its own prose and its own faction-panel state.

- **Pro:** the most "game" — the most narrative payoff, the strongest expression of "earned legibility," a genuine investigation loop that other hidden-state content could reuse.
- **Con:** the largest by far — a new state machine, prose at every stage, new UI for the hint/suspicion states, and decisions about which verbs advance which stages. Arguably its own project; it could swallow THR-431 whole and blow the deferral's appetite.

### Cowork recommendation

**Option A for THR-431, with Option B noted as a clean fast-follow.**

Reasoning: A ships the verb on substrate that is 100% verified, stays in exact lockstep with the THR-400 expose-verb pattern its three siblings already follow, and honors "hidden = absent." Critically, **A does not preclude B or C** — `getCorruptionCandidate` plus a capability gate is the floor; a per-faction `scrutiny` accumulator (B) or a graduated state machine (C) can layer on top later *without reworking anything in §2*. So choosing A now is not a one-way door; it is the smallest correct first step, and B can be a follow-up deferral if the binary-global feel of A turns out to be unsatisfying in playtest.

But this is explicitly **Christian's call**, not Cowork's default, because A's "binary global capability gate" *is* a statement about the game's legibility model, and it is the statement every future expose verb will inherit. If the intended feel is "investigation is local and earned," B is the right floor and A is a regression. If the intended feel is "investigation is a real loop with stages," C is the project. Cowork should not pick between those three feelings unilaterally.

### Secondary question for Christian

Confirm **§2.1 sub-decision B** — corruption is seeded by **world-sim drift** (the world grows its own rot, per NN #4), not player-discovery-only. The recommendation is world-sim drift; the alternative (corruption only "exists" once the player's perception conjures the possibility) is a thinner, more solipsistic world and is not recommended — but it is a one-line change to the §2.1 seeding block if Christian wants it, so it is worth a yes/no.

## 4. What converting this to a Ready-for-Dev plan doc takes

Once Christian picks an option in §3, the conversion is a single short Cowork pass:

1. Fold the chosen option into §2.6.1 (the drawer-surfacing rule) and, for B/C, into §2.6.2 (the faint pre-reveal signal) and §2.4 (one or more new threshold constants).
2. For B/C only: add the `scrutiny` engine section (the accumulator, what feeds it) — for B this is ~1 added subsection; for C it is a new §, and C probably warrants splitting into its own issue rather than living under THR-431.
3. Re-run the NFP audit on the added surface and the three-pillar check.
4. Spawn `intent-judge` (the design-governance Step 8.5).
5. Rename/retitle this file to a plan doc, apply `plan-pending-commit`, move THR-431 to Ready for Dev with the coordination block in §5.

The three-pillar design in §2 is already done — Engine (§2.1, §2.2, §2.5, §2.7), Content (§2.3), UI (§2.6), wiring is the THR-400 reframe §10 pattern. Only the §3 surface is outstanding.

## 5. Coordination notes (provisional — NOT a handoff block yet)

THR-431 is **not** being moved to Ready for Dev this session — it is moved to **In Design**, signalling Cowork has actively framed it and it is blocked on the §3 verdict (the same posture THR-390 holds for its open verdicts). When §3 is settled and this becomes a plan doc, the handoff block will be:

- **Suggested model:** `model:opus-4-7` — honoring the issue author's explicit call; the hidden-corruption schema is structural design, and the corruption-scandal encounter is prose-heavy. (Provisional — re-confirm at handoff.)
- **Mutex with:** THR-400 (if not yet merged — same `unified-action-templates.ts`, faction files), THR-430 (Schism), THR-432 (Anoint Successor), THR-433 (Kindle a Calling) — all touch `unified-action-templates.ts` and faction files. **Sequence: after THR-400 merges**, and after or interleaved with the other three deferrals per the THR-400 reframe §15 mutex-chain logic.
- **Parallel-safe with:** any issue not touching `src/data/unified-action-templates.ts`, `src/engine/phaseFactionActions.ts`, `src/engine/factionNetwork.ts`, `src/data/faction-action-encounters.ts`, `src/data/faction-action-constants.ts`, or the faction trace types.
- **Codex review:** yes — new hidden-state schema, three-pillar wiring, trace coverage, encounter prose discipline.
- **Files to touch (provisional):** `src/data/unified-action-templates.ts`, `src/data/faction-action-constants.ts`, `src/engine/phaseFactionActions.ts` (seeding block), `src/engine/factionNetwork.ts` (`getCorruptionCandidate`), the faction trace types, `src/data/faction-action-encounters.ts` (new encounter), `src/types/index.ts` or the agent-node property docs (`latentCorruption` comment), `Docs/plans/wiring-checklist.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`, `Docs/canon/rulebook.md` (new action verb row).

## 6. Alternatives considered & tensions surfaced (brainstorm layer)

- **Corruption as a faction property vs. a member property.** Member won (§2.1) — the encounter needs a person in the chair. A faction-level rot with no named face has no mortal-loop bridge.
- **Corruption as a `corrupted_by` edge.** Rejected — corruption is internal data about one member's own state, not a relationship between two entities. The load-bearing "properties for internal data, edges for relationships" decision points at a property record.
- **Naming.** `corruption` is already a hex concept. Considered `rot`, `graft`, `taint` — settled on `latentCorruption` (member) + `corruptionRevealedTick` (faction) to keep the issue's vocabulary while namespacing away from the hex property. Executor should confirm no other collision on `latentCorruption` at pickup.
- **The big tension: autonomy vs. drift.** Most of THR-431 is designable within established direction — and §2 designs it. But the suspicion mechanic is, by the explicit testimony of three documents, a Vision-level decision. The THR-432 brainstorm (today) chose *not* to design THR-431 for exactly this reason. This doc threads the needle: do the safe 90%, quarantine the unsafe 10% into a framed verdict. That is the most work that can be moved forward without risking the legibility model.

### Vision premises invoked

- **NN #1 (god, not protagonist):** Reveal Corruption surfaces *existing* hidden state — it does not fabricate. The player names what is already true; the corrupted member, and the faction, choose how to answer. The player forces the exposure, not the resolution.
- **NN #3 (all mechanics surface through prose):** `latentCorruption`, `severity`, `corruptionRevealedTick` never appear as numbers — the player reads the chronicle band and the scandal encounter.
- **NN #4 (the world simulates around the player):** §2.1's recommended seeding is world-sim drift — factions grow their own rot whether or not the player is watching. The verb reveals a world that was already corrupt, not a world that becomes corrupt because the player looked.
- **Cool failure:** the "Confess" branch is not a win and "Deny" is not purely a loss — confession preserves a member-arc (a redemption thread), denial creates a fugitive (a hunt thread). Both branches produce more story than they remove.

---

*Brainstorm prep authored by Cowork, 2026-05-14, during the `keep-work-flowing` scheduled run. Deferral #2 of 4 from THR-400 §14. This is the design-options layer; it becomes a plan doc once Christian returns the §3 verdict. THR-431 moved to In Design (not Ready for Dev) — blocked on the §3 Vision-level decision per the issue body, the THR-400 reframe §14, and the THR-432 brainstorm.*
