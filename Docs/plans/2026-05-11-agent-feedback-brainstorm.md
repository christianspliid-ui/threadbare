---
status: brainstorm
date: 2026-05-11
author: Cowork
companion-plan: 2026-05-11-agent-feedback-system.md
domain: social, prose
---

# Brainstorm — Agent Feedback System

> Working notes for the Agent Feedback design (`2026-05-11-agent-feedback-system.md`). Captures alternatives considered, tensions surfaced, and Vision premises invoked. Not a spec — a thinking record.

## The core question

How does the player perceive that the thread is alive — that the mortal they have been investing in actually has an interior life, has noticed the god, has feelings about being chosen?

Failure modes for any answer:
- **Numeric "Devotion: 73%."** Sterile. Reads as Skyrim. Violates prose-first UI.
- **Cosmetic only.** Same mechanical behavior, slightly different flavor text. Smart players notice it's flavor and dismiss it.
- **One-shot.** A single dramatic event (the mortal prays to you once) that doesn't compound. Doesn't reward investment over a long run.
- **Everywhere all the time.** Constant prayers and curses drown the chronicle and become noise.

The design has to thread the needle: **persistent state, but expressed sparsely; mechanical consequences, but always wearing prose clothing; dramatic apex moments, but only at the extremes.**

## What the texture should feel like

Reach for the moment when, in a long campaign in a Paradox grand strategy game, an advisor finally writes you a private letter — and it changes something. Or when a Crusader Kings vassal becomes friend, then lover, then conspirator over thirty years of mechanical drift you barely noticed. The slow-cooked feeling.

But also: when a god in a Greek myth visits a mortal in a dream. Sparse, weighty, impossible to ignore. The Iliadic register.

The two registers compose. **Quiet accretion punctuated by punctuating events.**

The chronicle entry is the quiet accretion. The vignette popup is the punctuating event. The character sheet panel is the where-am-I-now reference.

## Alternatives considered

### A. Single "Devotion" dimension
Collapse all the dimensions into one number 0–1. Simpler to compute, simpler to tune.

**Why rejected.** Loses the dramatic asymmetry where a mortal can love and fear the god independently. A devoted Sworn agent who is being asked to do something that violates their identity should feel *brittle* — high devotion, high tension. A single number can't represent that. It would also flatten "fearful awe" and "loving reverence" into the same texture, which is a tonal failure for a game whose mood depends on those being distinct.

### B. Two dimensions: Devotion + Fear
Better than one. Maps to standard "love/fear" duality (Machiavelli).

**Why rejected.** Still misses sovereignty. The most interesting case in Threadbearer — the *Witness pushed to Wrath*, the *Survivor forced to martyr* — is when the mortal loves the god AND fears the god AND can't square the god's demands with their own identity. Two dimensions collapse that into the wrong picture.

### C. Three dimensions: Devotion + Awe + Sovereignty Tension (chosen)
Devotion answers "do I love the god?" Awe answers "do I feel the god's presence?" Sovereignty Tension answers "is the god making me lose myself?"

These three are *orthogonal*. A mortal can have any combination. The combinations produce different stances. Awed-but-not-loving is the trembling supplicant. Reverent-but-tense is the brittle saint. Devoted-and-hollowed is the broken-but-still-believing.

Risk: three dimensions are harder to tune than two. Mitigation: each dimension has its own decay and clear signal sources; tuning happens dimension-by-dimension.

### D. Per-action history ledger
Track every action the player has ever done to the agent in an exhaustive log; compute stance from a windowed sum over the log.

**Why rejected.** Storage-heavy. Doesn't add expressive power over decaying dimension counters. The ring buffer of 20 *significant events* (for chronicle / BondsTab history) is enough for player-facing memory; the dimensions carry the cumulative weight.

### E. Reputation tally piggyback
Use the existing `reputationTallies` infrastructure on actor nodes for feedback signals.

**Why rejected.** Tallies are for *external* reputation — how the world remembers the agent. Feedback is *internal* to the bond. They're separate concerns and conflating them couples future evolution. Bond-edge storage is the cleaner architecture.

### F. Refusal as the only behavior change
Skip cosmetic and decision-weight; just ship the dramatic apex.

**Why rejected.** Most runs never hit Defiant + Renegade + intuition-awareness. The everyday play experience would still feel one-way. The refusal moment is meaningful because it punctuates the slow accretion; without the accretion, it's just an arbitrary "your action failed" event.

### G. Mortal-authored prose via LLM at runtime
Let an LLM generate the prayer / curse / contemplation each time, conditioned on the agent's full state.

**Why rejected.** Violates determinism (NFP #3) and tunability (NFP #1). Also wildly more expensive. The hybrid layered engine with deterministic template selection and enrichment placeholders is the canonical Threadbearer prose path.

### H. Active feedback UI — relationship manager
A dedicated screen where the player sees all threaded agents and can directly adjust the relationship (gift gold, make sacrifices on their behalf, etc.).

**Why rejected.** Violates player-as-god framing. The player is not a relationship manager; they're a god who acts and observes. Feedback is an *output* channel, not an *input* channel. The player adjusts the relationship by acting differently in the world, not by clicking buttons in a relationship panel.

### I. Feedback on actor node, not thread edge
Store the feedback state on the agent's `properties` bag.

**Why rejected.** When a future feature allows multiple Ascendants to thread the same agent (already imaginable for rival activation in THR-66), each Ascendant should get a separate feedback channel. The bond is the natural carrier. Actor-node storage would force a list-of-feedback-per-thread on the actor, which is the wrong shape.

### J. Stance count smaller (4 stances)
Just Reverent / Brittle / Defiant / Untroubled.

**Why considered.** Simpler content authoring. Less prose volume.

**Why kept at 7.** Awed is a distinct *texture* from Reverent — the trembling supplicant vs. the loving devotee. Hollowed is the broken-vessel end-state and would be a tragic loss to fold into Defiant. Communing is the awareness-ladder payoff. The 7 stances pull weight; folding any reduces expressive variety.

**Open question to user:** is Hollowed too dark? Could merge with Defiant-at-max. See open questions §16.

## Tensions surfaced

### Tension: prose volume vs. stance count
7 stances × 7 event kinds × 8 reaches × 5 variants = 1,960 prose slots is a lot. The plan ships ~30% in Phase 1 and queues the rest.

**Resolution:** start Phase 1 at 30% with the priority slots (combinations players will see most often: Reverent prayer in any reach, Defiant curse in Heart/Iron, Brittle contemplation in Eye, etc.). Lower-frequency combinations can ship blank-fallback ("the mortal {stance_verb}") with the placeholder-as-fallback pattern from §7.6.

### Tension: turn-based cadence vs. responsive feedback
Game is turn-based. Mid-tick popups violate the cadence. But waiting until *end* of turn to surface feedback delays it.

**Resolution:** Feedback events fire at turn-start, after the previous turn's tick has resolved. This is the canonical Threadbearer turn pattern; it composes with existing encounter popup queues. No mid-tick interrupts.

### Tension: player agency vs. mortal sovereignty
The Refusal layer says "your action failed because the mortal refused." Some players will read this as the game taking control away from them.

**Resolution:** the design uses *narrative* framing (per `Docs/canon/prose.md` player-as-god rule). The action did not fail because of a system; it failed because the mortal — who has always been sovereign — chose not to bend. The framing is the same as a mortal failing a check; the difference is that now there's a *reason* the failure means something. The Defiant Refusal attachment makes future refusals more likely, so the player sees a coherent escalation, not a random failure.

Also: refusal requires *all four* gates — Defiant stance, Renegade-ish loyalty, intuition+ awareness, AND a RNG roll. It's rare. Most actions in most runs always resolve.

### Tension: "Devotion bar with extra steps"
Even with prose framing, the dimensions are numbers. A determined player will find them in the dev tools and treat them as bars.

**Resolution:** accept that this happens for dev-tooling-aware players. The main-line player experience strictly never sees numbers. Dev visibility (DebugPanel Feedback tab, `__DEBUG.getFeedbackState`) is *intended* — it's for the player who wants to understand the system after the texture has landed. The first 10 hours of play don't expose any of it.

### Tension: stance flicker
Dimensions might briefly cross thresholds and revert, causing stance-flicker in the UI.

**Resolution:** `STANCE_HYSTERESIS_TICKS` (default 3) requires minimum dwell time before transition. Tune up if flicker observed.

### Tension: communion-question interactivity
When a Communing agent asks the god a question, the dramatic temptation is to let the player *answer*. But answering is the mortal making a god-decision; the player would be choosing the god's response.

**Resolution:** **Observational only in Phase 2.** The prose renders the question; the popup closes; the chronicle records it. The god is silent — or, more specifically, the *player* is silent through the god, because gods in Threadbearer act through their interventions, not their words. If the player wants to "answer," they answer with their next intervention.

**This is a soft tension.** A future feature could grant Communion responses as a new divine-action kind ("Answer Through the Thread") that costs essence and is granted only at communion awareness. That would be an additive feature in a later sprint.

## Vision premises invoked

From all five Vision pages (audit reran 2026-05-11 against full vault):

**From `Vision/00-north-star.md`:**
- The seventh-hour moment — "the mortal still makes a choice — the intervention shifted the odds, not the outcome — and the choice hurts." This is the design's target experience, with refusal as its operational apex.
- "Cadence, not pacing." Token budget + stance hysteresis are the mechanical guarantors of cadence.
- "Weight of threads — losing a thread should hurt." Sever is the operational form; this is why sever is in scope (Phase 3) even though it ships last.

**From `Vision/01-core-loop.md`:**
- Scan → encounter → aftermath. Feedback IS the aftermath beat reframed (§8.4 Q5).
- "One complex story at a time." Drove the §9.10 front-of-stage rule added during revision.
- Turn-based is load-bearing. No mid-tick popups.

**From `Vision/02-non-negotiables.md`:**
- #1 god, not protagonist — read-only feature, refusal preserves sovereignty.
- #2 narrative over mechanical perfection — stances are prose.
- #3 mechanics through prose — dimensions hidden.
- #4 graph edges, not property bags — feedback state lives on the existing thread edge as edge-internal properties; rival pressure flagged for THR-66 coordination.
- #5 expansive design, conservative implementation — this brainstorm IS that discipline.
- #6 additive — schema additions backward-compatible.
- #7 three pillars — Engine/Content/UI all addressed.

**From `Vision/03-design-tensions.md`:**
- #2 emergence vs. authorship — signal-driven dimensions (emergent) expressed through authored prose (curated).
- #3 divine remove vs. attachment — distance preserved, attachment earned through accreting events.
- #4 legibility vs. mystery — stances named, dimensions hidden, apex behaviors gated by intuition+ awareness.
- #5 one story vs. portfolio breadth — addressed by §9.10 front-of-stage rule (added during revision).

**From `Vision/taste-profile.md`:**
- Prose-first UI, austere voice, meeting-encounter prose bar, dark palette + gold emphasis, graph edges, encounter-specific verbs — all respected. Anti-patterns avoided.

## Vision edit applied (2026-05-11)

The thread-as-two-way is a premise the Vision was previously silent on. The plan §18 proposed adding to `Vision/02-non-negotiables.md`. After full audit, the addition landed as an **expansion of item #1** (god, not protagonist) rather than a new item #8 — the two-way premise is doctrinally part of the god-not-protagonist principle, not a separate non-negotiable. Final text:

> The asymmetry is also two-way. The god intervenes; the mortal responds. The mortal's response — prayer, doubt, gratitude, refusal, communion — travels back through the thread as part of how the player perceives the bond. Without the return channel, sovereignty is something we *say* mortals have; with it, sovereignty is something mortals *exercise*. Both directions of the thread are load-bearing to the texture of play.

## What surprised me during research

- **THR-389 is already live.** The encounter-foreshadowing system with intervention attribution shipped 2026-05-09. Phase 1 implementation MUST read its plan and commit before writing code — the new system should be the response side of the same conversational loop, not a parallel structure.
- **The awareness ladder already exists** and has four well-named tiers (`unaware | intuition | faith | communion`). The system was designed for exactly this kind of feature but the consequences were never wired. Communion as the gate for the dramatic apex (refusal + communion-question) finally pays the ladder off.
- **Axiological profile is rich.** Nine ValuePairs with virtue/flaw poles map cleanly to "this mortal is receptive to being a god's plaything / this mortal will resist." The personality weighting table (§11.2) can be very expressive without inventing new structures.
- **`ascendantFeedback.ts` exists but is asymmetric.** It tracks the *Ascendant's* identity (the player's god-character) but not the mortal's reaction. The naming is suggestive — the future name for the new system might be `mortalFeedback.ts` to mirror it, but I named it `agentFeedback*` for consistency with the codebase's `agent` terminology.

## What I am most uncertain about

- **Hollowed.** It's the bleakest stance. In playtest, will it land as poignant (player feels bad for what they did to the mortal) or as cheap (player feels manipulated by the design)? Honest open question. Phase 1 could ship without Hollowed (just five stances + Communing) and add it later if the texture asks for it.
- **Rival pressure heuristic.** Until THR-66 ships, rival pressure is a static aggregate. May be too weak to drive interesting Defiance transitions. May need a placeholder boost factor for solo testing.
- **Faction worship signal weighting.** I gave it +0.05 to Devotion baseline. Could be too strong (every faction member becomes Reverent) or too weak (faction worship feels cosmetic). Phase 1 closeout telemetry should tell us.

## Open verdicts for user before Phase 1 starts

1. Stance count (6 vs. 7)?
2. Communion-question observational vs. interactive (I recommend observational)?
3. Sever permanent vs. reconcilable (Phase 3 question; safe to defer)?
4. Hollowed stance — keep or fold into Defiant?
5. Phase 1 prose coverage — 30% feels right; confirm or adjust?

---

**End of brainstorm.** Companion plan: `Docs/plans/2026-05-11-agent-feedback-system.md`.
