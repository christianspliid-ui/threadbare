# Action proposal — novel-prose story beats (THR-2110, with THR-2134)

## intent_quote

> "we need the design lane to look at the quality of the story text in the encounters."
> — Christian, chat 2026-10-31 (quoted in THR-2105's description; THR-2110 is its filed follow-up)

THR-2110 description: "**Audit:** `Docs/audits/2026-10-31-encounter-story-text-quality.md` — pattern P4: steps of 190–300 words in past tense, inside the scene, with the god perceiving and acting … Doctrine rule zero: narrate, never inhabit; the god sways, never decides. **Scope:** `crafting.quest.flawed_steel` …, `stone.permanence.mason_lord_wall`, `star.turning.comet_omen`, `veil.truth.page_beneath_saint`, `encounter.apotheosis.ascension`. Also remove the word-for-word duplicate aftermath variants in the comet and the page. Note `check:encounter --all` sweeps only `encounter.*` ids … run them by id. **Done when:** a plan doc in `Docs/plans/`, handed to Ready for Dev (design lane)."

## scope (what this plan does)

One plan doc, `Docs/plans/2026-11-02-thr-2110-novel-prose-story-beats.md`, in two executor slices: A (THR-2110) rewrites Flawed Steel and the Mason-Lord's Wall from scratch to Prose Doctrine v2 and writes the Mason-Lord's five missing result lines; B (THR-2134, filed this run, blocked by A) rewrites the comet, the page and Apotheosis (openings to the 80-word skeleton, three fragment card names to verb + noun). Every story-beat field gets a named word budget from existing `NUDGE_WORD_BUDGETS` rows; the god appears only as the player's hand. Mechanics, ids and effects are asserted unchanged.

## scope (what this plan does NOT do — explicit non-goals)

- No conversion of the four quest files off `authoredChoices` (the rejected authored-futures model); filed as THR-2135 because 34 data files are affected.
- No fix of the structural `check:encounter` failures (settings, cast support, aftermath band keys, anchors); their count must not grow.
- No writing-check change (THR-2106), no new cast, no placement change, no new outcome.
- The `fallback: { ...variant }` copies stay (they give no-card play an ending).
- No engine or UI code.

## impact_class

Reversible — string values in five data files, five added afterimages, one possible list append and one possible list removal.

## evidence cited

- **Linear issues:** THR-2110 (this), THR-2134 (B, filed this run), THR-2135 (authored-choice residue, filed this run), THR-2105, THR-2108, THR-2109, THR-2106, THR-1411, THR-1086
- **Measurements (this run, `main` @ `93ecdca4`):** an `authoredProse` reader over the five templates (prose words 2,282–3,576; longest entries 167–348; 9–26 entries naming "the god"; per-field totals); `npm run check:encounter -- <id>` per template (register, page, opening, card-name, intensifier and structural lines counted); `grep -rln authoredChoices src/data` (36 files, 34 authoring)
- **Code read:** the five template files' `aftermathConfig` (`fallback: { ...X }`), `authoredChoices`, `stakes`; `NUDGE_WORD_BUDGETS` (`nudgeAuthoringConstants.ts:258`); `authoredProse` (`compositionContract.ts:1925`); `aspect-content.ts:49`
- **Vision premises invoked:** the god sways, never decides. None changed. NFP 5.
- **UL terms touched:** none new (afterimage, aftermath, story beat)
- **Canon pages consulted:** `Docs/canon/prose.md` § Narrator mode; nudge-authoring-spec § Prose doctrine v2 and the `description` row; `Docs/canon/encounters.md` § Rejected; `Docs/exemplars.md`; THR-1634 § What "complete" means
- **Prior plan docs:** slice 1 (`2026-10-31-thr-2105-…-slice-1.md`), wave 2 (`2026-11-02-thr-2108-…-wave-2.md`, decision 6 hands the Mason-Lord's lines here)
- **Rejected:** one slice; five slices; converting the choices now; waiting for THR-2135; no budgets; board budgets everywhere; deleting or rewriting the fallback

## load-bearing decisions touched

None. No node, edge, placement or mechanic changes; ids and effects asserted by snapshot.

## high-impact files touched (from Codesight)

None. The five files are each imported once into the template catalog.

## kill criteria

Cold read failing P1–P4 after one round → stop, post findings, slice B waits. A fact that cannot fit its budget → raise that field's budget by the smallest step and report, never drop the fact. Id snapshot differing → revert that template and report.
