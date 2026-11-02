# Action proposal — Encounter Factory habits (THR-2109)

## intent_quote

> "we need the design lane to look at the quality of the story text in the encounters."
— Christian, chat 2026-10-31 (THR-2105 description)

> "we can do that by looking at current examples and then we can discuss whether the evals are missing or we have some that are giving us trouble"
— Christian, chat 2026-10-31 (THR-2105 Done-when 1b)

THR-2109 was filed by the design lane from THR-2105's audit. Its Done-when: "a plan doc in `Docs/plans/`, handed to Ready for Dev (design lane)". Its scope: P6 strength tags on card lines, P3 encoded lines (the slice "X held. Y did not." turn and scout/ward/rest/prayer band prose), P8 town habits, and "the chain: the factory's brief and drafting prompts under `.claude/skills/encounter-pipeline/` so the habits stop coming back". Out of scope: any writing-check change (THR-2106), chip wording, and the "It argues for the honest way" rider awaiting Christian's pick. THR-2105 itself puts "changing the doctrine itself" out of scope.

## scope (what this plan does)

A plan doc in three slices. Slice a (THR-2109): five rules added to the Encounter Factory's draft prompt (`agents/draft-prompt.md`), each citing the doctrine line it restates, with a pointer from the brief format and one clarifying clause in the spec; then every card effect line in the 13 files the P6 grep names rewritten without strength verdicts, cost talk or "You …" openings; then the five "X held. Y did not." lines. Slice b (THR-2129, new): band prose and afterimages of seven migrated board templates rewritten for P3. Slice c (THR-2130, new): P8 sites across the 51 town templates. Done-whens are composed-text predicates and cold critic reads.

## scope (what this plan does NOT do — explicit non-goals)

- No writing-check change, including the editorial critic prompt (THR-2106 with Christian).
- No change to the doctrine's rules; the spec gets one clause that narrows a misread.
- No chip wording change.
- The Smugglers' Ford "It argues for the honest way" card is untouched until Christian picks; every other "It argues for …" rider (THR-1714 pole marking) stays word for word.
- No board rewrite-wave templates (THR-2108 / THR-2128), no novel-prose encounters (THR-2110).
- No placement, cost, forecast or card-profile change.

## impact_class

External (judge-corrected from Reversible): the draft-prompt edits change how the Encounter Factory's drafting agents behave. All edits are text in git.

## evidence cited

- **Linear issue:** THR-2109 (from THR-2105); new THR-2129, THR-2130
- **Vision premises invoked:** doctrine v2 rule zero ("narrate, never inhabit"); the communication pivot (prose does the scene, cards do the rules)
- **UL terms touched:** none new (effect line, band prose, afterimage, cast, actor as used)
- **Canon pages consulted:** `Docs/canon/prose.md`, `Docs/ubiquitous-language/README.md`, `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` (§ The communication pivot, lines 116–170; § Prose doctrine v2, lines 1010–1030; cast rules, lines 238–256)
- **Prior plan docs this builds on:** `Docs/audits/2026-10-31-encounter-story-text-quality.md`; `Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md`; `Docs/plans/2026-11-02-thr-2108-encounter-story-text-wave-2.md` (decision 7 routed the migrated templates here)
- **Rejected approaches considered and dismissed:** one slice (too large); trimming tags only (leaves mood lines); a new block in the doctrine (out of scope per THR-2105); adding the bans to the critic (a check change)

## load-bearing decisions touched

None. No graph, engine, placement or awareness change.

## high-impact files touched (from Codesight)

`src/data/encounter-content.ts` (104 importers), strings only on seven entries. The plan has a Blast Radius section.

## kill criteria

- Slice b's cold read still finds P3 after one rewrite round → stop, post findings for the design lane.
- Christian vetoes the command-register decision → slice a still removes strength tags and leaves openings.
- Any test asserting pole marking ("argues for BOTH poles") fails → the rider was touched; restore it.
