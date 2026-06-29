# Archetype Virtue/Vice Behavioral Layer

**Date:** 2026-06-29
**Author:** Cowork (with Christian Spliid, creative director)
**Status:** Approved — ready for implementation
**Project:** Content Architecture
**Domain:** Cosmology / Content grammar

## Summary

The Cosmological Pattern maps each of the 8 Reaches to an archetype-pair axis (a virtue pole and a vice pole). Until now those poles were bare role titles. This change adds a **plain-language behavioral word** to every pole (a virtue word on the positive pole, a vice word on the negative pole), and revises four of the eight pole names so the axes read more coherently.

The behavioral words are deliberately plain rather than literary — the user flagged that in-game prose runs too literary for easy comprehension, and these labels surface to players.

## The approved model

| Reach | Virtue pole | Vice pole |
|-------|-------------|-----------|
| Iron | Protector (Brave) | Conqueror (Power-Hungry) |
| Gold | Patron (Generous) | Extractor (Greedy) |
| Shadow | Broker (Fair) | Manipulator (Scheming) |
| Veil | Weaver (Patient) | Unraveller (Impatient) |
| Heart | Sworn (Loyal) | Renegade (Disloyal) |
| Eye | Seer (Perceptive) | Inquisitor (Judgemental) |
| Stone | Keeper (Dependable) | Destroyer (Reckless) |
| Star | Beacon (Inspiring) | Anchor (Discouraging) |

Convention: left pole = virtue (positive), right pole = vice (negative).

## Changes from the 2026-03-28 brainstorm

Pole names revised (the original set was Iron Protector↔Conqueror, Gold Patron↔Extractor, Shadow Saboteur↔Deceiver, Veil Seer↔Manipulator, Heart Sworn↔Renegade, Eye Witness↔Judge, Stone Keeper↔Destroyer, Star Wanderer↔Anchor):

- **Shadow: Saboteur → Broker, Deceiver → Manipulator.** Shadow is redefined around covert *social leverage* — reading people and either dealing straight (Broker, the chaotic-good thieves-guild fixer) or exploiting them (Manipulator). This intentionally moves Shadow's flavor from pure stealth/sabotage toward hidden influence. Broker retains a covert read so Shadow stays distinct from Heart (open bonds) and Gold (open influence).
- **Veil: Seer → Weaver, Manipulator → Unraveller.** Pulls the game's thread motif into the cosmology — weaving vs unravelling the threads of fate/magic. Patience vs impatience fits ritual craft.
- **Eye: Witness → Seer, Judge → Inquisitor.** Inquisitor is a sharper vice-archetype (knowledge weaponized into persecution) than a neutral arbiter.
- **Star: Wanderer → Beacon.** Shifts the virtue from "one who journeys" to "one who guides others' journeys"; pairs with Anchor (a weight that holds others back).

**Two terms relocate between reaches — the load-bearing wiring risk:**
- **`Manipulator` moves Veil → Shadow.**
- **`Seer` moves Veil → Eye.**

Any content or code that references these archetype names *by reach* must be reconciled against the new table. A naive find/replace is unsafe because the same string now means a different reach.

## Three-pillar wiring

### Engine
The archetype axes already drive **encounter tilt**. No new graph nodes or tick phases are required for the vocabulary layer itself. Scope: locate where archetype poles are represented (constant table / enum / data file), add the behavioral word as a named field alongside each pole, and update any string literals that encode the old pole names (`Saboteur`, `Deceiver`, `Witness`, `Judge`, `Wanderer`, plus the relocated `Seer`/`Manipulator`). All words live as named constants (NFP #1 — tunability).

### Content
Behavioral words are a content-grammar primitive: prose, codex entries, and encounter flavor can reference an actor's pole word ("a Greedy Extractor", "a Fair Broker"). Audit encounter/prose content for hardcoded references to the old pole names. No new content is required by this change, but the vocabulary becomes available to authors (update the systemic wiring guide if a new placeholder is introduced).

### UI
Wherever an archetype label is shown to the player (character sheet, codex, any archetype signifier), surface the plain behavioral word. Confirm at 1920×1080 with a screenshot + console capture per the Definition of Done if a UI surface renders the label.

### Wiring connective tissue
Update `Docs/plans/wiring-checklist.md` only if a new field/placeholder/trace is added. Update `Docs/canon/cosmology.md` (done in this session, working tree) and the changelog. The brainstorm source (`Brainstorms/brainstorm-cosmological-symmetry.md`) is now superseded for pole names — add a pointer note there if practical.

## Rulebook impact

None. Archetype flavor words do not change any rule of play (turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss). No rulebook update required.

## NFP compliance

- **Tunability** — PASS: behavioral words are named constants, not inline strings.
- **Inspectability** — PASS with note: if encounter tilt begins consuming the word, emit it in the existing tilt trace.
- **Determinism** — PASS: static vocabulary, no PRNG.
- **Fail-soft** — PASS: a missing word falls back to the bare pole title.
- **Narrative over mechanical** — PASS: this is a narrative-legibility change.
- **Additive over destructive** — PASS with note: pole *renames* are destructive to old string literals; the relocation of `Seer`/`Manipulator` is the one place a careful migration (not blind replace) is required.
- **Performance** — PASS: no runtime cost.

## Open items for the executor

- Find the canonical representation of archetype poles in `src/` (likely a constants/data file feeding encounter tilt) and add the behavioral-word field.
- Reconcile every old pole-name reference, treating `Seer` and `Manipulator` as reach-relocated (not simple renames).
- Commit the canon edit already made in the working tree (`Docs/canon/cosmology.md`) and append a changelog row.
