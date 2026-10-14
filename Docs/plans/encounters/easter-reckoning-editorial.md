# Encounter Pipeline: The Wrong Feast Day
> Scale: short | Slug: easter-reckoning | Pass: editorial (cold critic, THR-1757 master batch 2, slot 6)
> Date: 2026-10-14 | Pipeline version: 2.0
> Judged: `easter-reckoning.package.json` (what ships), against `easter-reckoning-revised.md` and brief `master-everyday-2-brief.md` slot 6

**Verdict: PASS WITH REVISIONS.** Every fix below is applied in the package and in `easter-reckoning-final.md`.

## Binding-row check (brief slot 6)

| Item | Brief | Package | |
|---|---|---|---|
| id | `encounter.town.easter_reckoning` | same | ✓ |
| reach | star | star | ✓ |
| steps | star 0.74 → star 0.82 | 0.74, 0.82 (both in 0.72–0.85) | ✓ |
| shape | appointment | `encounter_seed` + `appointment` on step 1 success, `missed` authored | ✓ |
| settings | `urban` | `urban`, one opening | ✓ |
| rarity / scale / tier | 2 / local / shaping | 2 / local / shaping | ✓ |
| hand | drive + omen | `assign_ambition ambition_spread_faith` (step 1 success) + `emit_omen` cultural/global (step 1 success `time`, step 1 failure `entropy`) | ✓ both wired in context |
| sequels | `town.easter_reckoning_heard` / `_defaulted`, seed-only | both in `easter-reckoning-sequels.ts`, `drawable: false`, registered | ✓ |

## 1. Prose Quality

The spine is clean narrator-mode prose: arrival (9 words), situation and complication (40), problem (27). Every sentence is a report. The step-1 spine states the stake as a fact and names the appointment's place and time, which is lawful only because the seed carries the `appointment` block. Its "If {actor} proves … If not …" pair is the shipped house form (boundary-survey and bell-tower-shoring carry the same sentence on the same primitive), so it is not trigger 25.

**Binding fix from the orchestrator: the real-world feast name.** Nothing else in this world names a real-world feast. "Easter" appeared in the title, two stakes lines, the step-0 spine, the initiation template, the description and the failure omen's hook, and in four sequel strings. All of them now say **the spring feast** (first mention) or **the feast**. The name fits the mechanism the prose already uses: a feast fixed by the spring equinox and the full moon after it. Ids are unchanged.

**Title (trigger 27).** "The Easter Reckoning" failed the glance test even before the name was removed: a "reckoning" does not tell the player what is wrong. **[EDITORIAL REWRITE] "The Wrong Feast Day"** names the complication.

**The omen was told nowhere.** The draft's design block says the omen is "told in step 1's afterimages and the failure overview". It was not. No step-1 afterimage and no overview mentioned a sign, a good year or a bad year. A grep of `src/components` finds no reader of `emittedOmens`. The engine reads it only in `phaseAgentDecision.ts`, as an encounter-draw bias. As shipped, the player could never recognise that the omen happened. (Orchestrator question, answered: **no, not as drafted; yes after the fix.**) **[EDITORIAL REWRITE]**:
- step 1 critical_success / success / success_at_cost afterimages each end "The town (still) takes it for a good sign for the year." `near_miss` reads `successAfterimage`, so every route that emits the `time` omen says so.
- step 1 critical_failure afterimage ends "The town takes it for a bad sign for the year."
- failure overview: "The cathedral will proclaim the feast a week late, which the bishop sent a master to stop, and the old priests say a year begun on a false feast goes badly." The failure band is reached only through step 1's failure, so the `entropy` omen has always fired on it. This also delivers the taken plot hook (`prophetic_investigation`), which until now lived only in the omen's engine-side `narrativeHook`.
- critical_failure overview left alone: a step-0 critical failure ends the action before step 1 can emit, so the overview must not claim the omen.

## 2–4. Branch audit, branch count, scale

Linear, 0 branches, two beats, short scale: correct for the shape. No player-picked fork. KEEP 0.

## 5. Inspiration Anchor Honesty

The prophetic-investigation hook now changes what the player reads (the old priests' saying on failure), not only an engine string. The Forged Charter wiring copy is honest. The Star siblings are not colliding: this reads the sky for a date, not a fate.

## 6. Aftermath Payoff

Actor-centred and plain. The cost of master failure is the name: the feast is kept late, which the bishop sent a master to stop. That is the brief's "name before the purse".

## 6b. Page read (assembled per band, after fixes)

**critical_success**
> The bishop has told the diocese to wait for the synod before proclaiming the feast.
> - BOND reputation with {location} — The chapter's word on it. {location} thinks well of their reckoning.
> - PATH ambition — Every parish on the true day. {actor} is pursuing Spread the Faith now.
> - PATH appointment — Synod day in the chapter house. {cast:dean} answers the reckoning in {location} in three days.

Was: "told **every parish** to wait" directly above "**Every parish** on the true day", a seam echo. Fixed ("the diocese"). Clean now.

**success**
> The chapter has the reckoning in writing, under {actor}'s hand. + the same three chips.

Clean.

**success_at_cost**
> Half the chapter now sides with {cast:dean} against {actor}. + the same three chips.

Was: "The synod will hear the reckoning, but half the chapter …", which repeated the synod chip ("answers the reckoning … in three days"). That is trigger 35, repetition. The cost clause alone is the band's news. Fixed. No conflict: the town thinks well of the reckoning, and the chapter is split. These are different parties.

**failure**
> The cathedral will proclaim the feast a week late, which the bishop sent a master to stop, and the old priests say a year begun on a false feast goes badly.
> - SCAR reputation with {location} — The tables stand. {location} thinks less of their reckoning.

Clean. Each block adds something.

**critical_failure**
> The dean now has a master's own error to set against the old priests.
> - SCAR reputation with {location} — An error in their own reckoning. {location} thinks less of their reckoning.

The overview and the chip both mention "error" but say different things: what the dean gained, and how the regard was lost. Accepted. The page is true on both routes (step-0 moon a night early, step-1 sums).

No reactions (short scale).

## 7. Dilemma Energy

A real hand: night against dawn on step 0, the copy's fault against a witness on step 1. Each card answers a different question. Playing nothing is viable.

## 8. Experience Differentiator Gate

1 YES (76 words, skeleton held) · 2 YES · 3 YES (lamps/close, haze/aisle, the dean's copy, the old priests all precede their cards) · 4 YES · 4b YES (P2→P3, step-1 spine→afterimages read; the crit-success seam echo fixed in § 6b) · 5 YES · 6 YES · 7 YES (every special has ≥1 failure fragment; max Δ 0.11, no big-delta) · 8 YES · 9 YES · 9b YES (5 and 5 composed) · 10 YES · 11 YES (`reputation with {location}`, `ambition`, `appointment`: sheet words) · 11b YES after fixes · 12 N/A short · 13 N/A short · 14 YES (residue image: a split book of tables in an empty chapter house, no people).

## 9. Verdict

**PASS WITH REVISIONS.**

## 10. Revision Summary (all applied)

**Must fix**
1. Remove "Easter" from every player-facing string in the package (title, stakes ×2, step-0 spine, initiation, description, failure omen hook) and the sequels (heard: description, spine, success afterimage, success template; defaulted: spine). It is now "the spring feast" / "the feast".
2. Title → "The Wrong Feast Day" (trigger 27).
3. Tell the omen on a surface the player reads: step-1 afterimages (good sign ×3, bad sign ×1) and the failure overview (the old priests' saying).
4. success_at_cost overview: cut the clause that repeats the synod chip (trigger 35).

**Should fix**
5. critical_success overview: "every parish" → "the diocese" (seam echo with the ambition caption).

**Consider (not applied)**
6. The specials' effect lines lean scene-specific ("the cathedral close", "the dean's copy", "the chapter house stair"). That is within the corpus norm for authored specials (bell-tower-shoring's "the lodge master's love for the tower"), so it is not trigger 16.
7. Clear The Dawn's critical_failure fragment (the wrong equinox morning) sits beside the step-0 base afterimage (the full moon a night early). It reads as two errors, not a contradiction.
