---
domain: rulebook-assessment
audit_date: 2026-05-11
reviewer: cowork-cc (Opus 4.6 executor pass)
linear: THR-403 (Phase 1 closeout — first quarterly architecture-assessment pass)
related_canon: Docs/canon/rulebook.md
related_plans: Docs/plans/2026-05-11-rulebook-canon-page.md
---

# Rulebook Architecture-Assessment — First Pass (2026-05-11)

> The first quarterly architecture-assessment of `Docs/canon/rulebook.md`, run at Phase 1 closeout because the *act* of writing the rulebook surfaces all three assessment signals naturally (per plan § 7). Future assessments run quarterly or on-demand when the user senses architectural drift; the cadence and template formalisation are tracked under THR-405 (Phase 3).

The assessment answers three questions in writing. Each section ends with a short verdict.

---

## 1. Synthesis check — do the rules combine into a coherent game?

**Verdict: largely yes, with one structural seam to watch.**

The rulebook's eight-section synthesis holds together when read end to end. Each section answers a player-facing question — *What are you? What is the world? How does a turn move? What can you do? What do you spend? What is an encounter? What are the clocks? What ends a run?* — and the answers reference one another without circular dependency. The Three-Beat Turn (§3) cleanly motivates the verb-and-prerequisite system (§4), which is fuelled by the resources (§5), spent through encounters (§6), pressured by the clocks (§7), and resolved at run-end (§8). Reading §3 → §6 sequentially, the encounter is *clearly* the curated moment §3 describes, and the aftermath beat in §3 is *clearly* the aftermath of §6. The seams hold.

The one structural seam worth watching is **between §5 (resources) and §6 (encounters)** — specifically how Influence Tiers, court positions, and the mortal's `awareness` field combine during encounter resolution. The rulebook describes the resources and the encounter as if they are two systems that touch at the action menu and the aftermath. In practice they are deeply intertwined: tier shapes what encounters can fire, court position shapes which mortals reach the scan, and `awareness` shapes how prose reads the intervention back to the player. The rulebook does not yet draw the seam explicitly. Right now this is *fine* — neither section claims a tighter coupling than it has — but as the Agent Feedback System (THR-402) lands, this seam will need either a tighter §5→§6 narrative bridge or a dedicated subsection on "the thread as a two-way conduit during encounter resolution." Marking as a future-pass concern, not a present incoherence.

A secondary check: **the Vision premises survive synthesis.** All five Vision premises are reachable from rulebook sections (§1 cites "god, not protagonist"; §3 cites "loop as rhythm"; §5 cites "sovereignty as a kind of being"; §6 cites "the unfolding is why they are playing"; §8 cites "a story the player can tell in prose"). No section requires the reader to accept a premise that contradicts Vision. The synthesis is, in the most useful sense, *Vision-compatible*.

A failure mode the rulebook does *not* yet fully prevent: a reader who only reads §4 (verbs) and §5 (resources) without §3 (the turn) can come away thinking Threadbearer is a real-time action game with a god-mode HUD. That is not the game. The fix is to load-order discipline (the quick-reference card always-loads §3 alongside §4 and §5) and a cross-link from §4's opening sentence back to §3, which the rulebook already has. The risk is design-time, not player-facing.

## 2. Implementation gap analysis — where is the gap between `[IMPL]` and `[DESIGN]` largest?

**Verdict: the gap is widest at Control and at the Twilight/Metaprogression beat.**

Counting status flags across the rulebook (rough estimate from drafting):

| Section | `[IMPL]` weight | `[DESIGN]` weight | `[OPEN]` weight | Notes |
|---------|----------------|-------------------|-----------------|-------|
| §1 What You Are | high | low | none | Ascendant exists, identity carries, avatar partially |
| §2 What the World Is | high | medium | none | Hex map, agents, factions, cultures, doom clock all `[IMPL]`; World-Soul partial |
| §3 The Three-Beat Turn | high | medium | low | Tick orchestration `[IMPL]`; portfolio scan UI `[DESIGN]` (Attention Tier Model project) |
| §4 What You Can Do | medium | high | low | Templates and prerequisites `[IMPL]`; Control sustained-effect contestation `[DESIGN]`; verb gating soft |
| §5 Your Resources | medium | high | medium | Essence `[IMPL]`; tier ladder split (5 int vs 6 names) is `[OPEN]`; Agent Feedback System `[DESIGN]` (THR-402) |
| §6 Encounters and Aftermath | high | low | none | UAT + resolution + awareness all `[IMPL]`; aftermath reactions `[IMPL]` |
| §7 The Clocks | medium | high | low | Doom Clock fully typed `[IMPL]`; Victory Mandate stages `[DESIGN]`; clock-vs-clock pressure formulas `[OPEN]` |
| §8 Winning and Losing | low | high | low | Endings produce echoes `[DESIGN]`; thematic injection into next cycle `[DESIGN]` |

**Largest gap #1: Control as a sustained mechanic.** §4 and §5 both describe Control as the signature god-game verb, with sustain models, slot caps, and rival contestation. In code, Control templates exist as a verb but the sustain pipeline, slot accounting, and `usurp`/`destroy` reactions are partially wired. This is the load-bearing verb of the game; the gap matters. Implication for prioritisation: any prose authored before Control sustain is end-to-end wired will produce encounters that *describe* a kind of contestation the engine cannot yet stage. The systemic wiring guide should be the next loop here.

**Largest gap #2: Twilight Phase → World-Soul → next-cycle thematic injection.** §7 and §8 carry the run's ending and the metaprogression promise. Types exist (`worldSoul.ts`, echo enums), but the *pipeline* from run-end → harvest → fundament-shift → next-cycle generation seeding is not yet a single integrated path. This is the structural piece that turns Threadbearer from a single-run roguelike into the procedural saga it claims to be. It is also, encouragingly, the area with the *most* concentrated `[DESIGN]` flags — meaning the design exists, it just hasn't been integrated.

**Smaller gap to flag #3: Attention Tier Model.** §3's "scan" beat depends on portfolio surfaces (attention pool, thread tugs, dormant threads) that are partially `[IMPL]` (constants exist, some wiring exists) and partially `[DESIGN]` (the player-facing portfolio UI is the active project). The Attention Tier Model Linear project is the right home for this; rulebook is consistent with that direction.

**Counter-signal:** §6 (encounters) is *almost entirely* `[IMPL]`. The most complex narrative system in the game is also the most implemented one. This is the right shape — encounters are the chapter, and the chapter is what the player meets first. If the gap analysis ever inverts (more `[DESIGN]` than `[IMPL]` in §6), that is a red flag.

## 3. Open question blockers — which `[OPEN]` questions are blocking the next phase of work?

**Verdict: none of the six current open questions blocks Phase 1 closure. Two warrant near-term user verdicts to unblock dependent work; the others can wait for the next quarterly assessment.**

The rulebook's Open Questions section lists six items, each surfaced during drafting:

1. **Influence Tier — six-name ladder vs. five-integer code.** §5. **Not a Phase 1 blocker.** Code is internally consistent at 0–4; the six-name ladder is a UI/prose label question. Will become a blocker only when an interface or prose layer needs to name the tier the player is in. Recommend user verdict during the next assessment, not now.
2. **Five verbs vs. CRUD-ish surface.** §4. **Not a blocker.** Templates are filtered correctly; the question is whether the *player* ever sees the five-verb taxonomy as a UI affordance (filter chips, tutorial framing, etc.). Surfaces only when Attention Tier Model or ActionDrawer redesigns visit this area. Verdict when needed.
3. **Find gates Change/Control — hard or soft?** §4. **Not a blocker, but the answer shapes future template authoring.** Authors are currently writing prerequisites by hand; a hard gate would let them stop thinking about it. Recommend addressing during the next encounter-design assessment, not separately.
4. **Session length.** §3. **Not a blocker.** Vision §`01-core-loop` keeps this as a *suspicion* (three to six encounters per session). The game does not yet signal a stopping point. Resolves naturally during playtest, not in design.
5. **Doom + Mandate dual-clock interplay.** §7. **Not currently a blocker, will be a blocker for Phase 2 of the metaprogression work.** The formula needs to be tuned before either clock-acceleration UX is built. Recommend a focused design pass in the next quarter.
6. **Twilight authorship vs. emergence.** §7. **Not a Phase 1 blocker, will become a blocker for the metaprogression project's next phase.** Same recommendation as #5 — design pass in the next quarter.

**No item rises to "must be answered before Phase 1 of the rulebook closes."** This matches the THR-403 refinement (2026-05-11) directing that only blocking `[OPEN]`s warrant separate Linear issues; non-blocking ones stay in the rulebook for the next quarterly assessment to verdict in batch.

**Implication:** Phase 1 of THR-403 ships clean. The rulebook is internally consistent, the gaps are honestly flagged, and the open questions are deferrable. The first assessment validates Phase 2 (drift detection, THR-404) and Phase 3 (maintenance cadence, THR-405) as the right next moves — the rulebook needs the drift checks to *stay* true and the cadence to *stay* fresh, and both Phases are already filed and blocked-by THR-403.

---

## Recommendations forward

1. **Ship Phase 1 as-is.** No blocking edits required.
2. **Promote THR-404 (Phase 2 drift detection) and THR-405 (Phase 3 maintenance cadence) when this issue closes.** Both are already filed with `blocked_by: THR-403`.
3. **Reassess Control's gap (§4/§5) when the systemic wiring guide next ships an update.** That guide is the right surface for "what content authors can rely on."
4. **Reassess the Twilight pipeline (§7/§8) when the metaprogression project enters its next phase.** The `[DESIGN]` density there is concentrated enough to be a project, not a series of small tickets.
5. **Surface the §5→§6 seam (resources vs. encounter) for revision after THR-402 lands.** That ticket explicitly tightens the two-way thread, which is the seam.

---

## Next-pass schedule

Next architecture-assessment: **2026-08-11** (quarterly cadence; or earlier on user demand). Cadence and the template that formalises this audit's shape are tracked under THR-405 (Phase 3). The Phase 2 drift signals (THR-404) are expected to surface mechanical-vs-prose drift between assessments; this assessment will then *consume* those signals at the next pass.

— Cowork-CC, 2026-05-11
