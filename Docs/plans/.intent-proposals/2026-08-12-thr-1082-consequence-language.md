# Action Proposal — Consequence language (THR-1082)

## intent_quote

From the issue (Christian, chat, 2026-08-10, verbatim):

> the encounter view is good enough but the aftermath modifiers have issues.
>
> 1. the consequences require a consequences icon language that fits into the icon language we are using in the encounters. writing out "Vara's stone grew steadily" is not good enough - what does steadily even mean? how can a player use that word to gage anything - just showing with an icon that stone got a plus modifier of some rough magnitude something is better than text that does not fit the encounter and is ungageable. alternatively if we also want a little consequence text, the text must be much better connected to the encounter text. look for example at the consequences from e.g. eldritch horror encounter cards.

From the design session (Christian, chat, 2026-08-12, verbatim):

> the player does not understand the difference between toll, mark, seed. are those categories of chips? if so they must be explained via tooltip and the chip taxonomy must be designed so that it is cool and makes sense from a character and story perspective. the current names dont do any of this.

> "personal, ie it must influence the character, it is a success or a failure for the character first and foremost
> use basic story telling rules of thumb. the aftermath/outcomes must happen for a reason that has a relevance to the character and the world in a way that fits the epic tales of gods and world influencing heroes on missions.

> the chevrons are fine as long as we use the same iconography as we did in the encounter screens that go just before.

> addition i want the encounter builder to use ALL the attachment types and many different conditions. so the ones i wrote as examples is to point you in the direction of all those opportunities, and also the opportunity to expand with new categories if it makes for a good story.

## scope (what this plan does)

Redesigns the aftermath consequence surface: a four-category story-first taxonomy (SCAR/BOND/BOON/PATH) with tooltips and a first-contact legend; a chip anatomy of icon tile + CATEGORY·NOUN tag + cause→change sentence + triangle delta cluster; additive structured fields on `EncounterAftermathChange` so noun/direction/magnitude survive as data; derived chips compressed to icon-first form; a `quintessence_shift` authoring effect; the causality + full-palette authoring rules written into the two authoring specs; Laws 13/15 amended in the same PR. Two sibling tickets filed, not implemented here: the `companion` attachment category, and the content pass rewriting existing consequence sets.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT implement the `companion` attachment category (sibling ticket; BOND renders companions when they exist).
- Does NOT rewrite existing encounters' consequence content (sibling content ticket extending THR-1083's territory).
- Does NOT change outcome bands, resolution math, ladders' band boundaries, or what consequences mechanically do.
- Does NOT touch the nudge cards, odds pips, or cost badges — only the aftermath surface.
- Does NOT remove derived growth chips (compressed, not deleted — the removal question is explicitly deferred, see brainstorm).
- Does NOT rename the engine-side `EncounterAftermathChangeKind` union.

## impact_class

External (corrected from Reversible on intent-judge finding, 2026-08-12) — the code changes are reversible (additive type fields, display-layer remapping; old content renders unmodified through the fail-soft path), but the plan changes other agents' behavior: UI Laws 13/15/31 amendments bind all future UI-pillar Done-whens; `encounter-pipeline` (nudge-authoring-spec) and `template-encounter-rewrite` skill edits change content-agent behavior; the `EncounterAftermathReactionEffect` vocabulary extension is inherited by THR-885 card grants. Law amendments carry Christian's live chat ratification (2026-08-12).

## evidence cited

- **Linear issue:** THR-1082
- **Vision premises invoked:** personal-first consequences (Christian 2026-08-12, quoted in plan); plain register / picturable anchors (THR-868 rejection list in `Docs/canon/encounters.md`); prose-does-scene-cards-do-rules (THR-883)
- **UL terms touched:** Aftermath, Encounter; four new player-facing category words (SCAR/BOND/BOON/PATH) — display vocabulary; a `UL-proposal` issue is warranted if they graduate into cross-system use
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/design-system/laws.md` (the UI-law constitution)
- **Prior plan docs this builds on:** THR-971 chip taxonomy, THR-1004 words-never-numerals (`aftermathWords.ts` header), THR-890/972 pip + glyph vocabulary, THR-969 outcome-keyed aftermath
- **Rejected approaches considered and dismissed:** pip reuse for magnitude (Law 10); THREAD as category name (UL collision); five visible magnitude steps (legibility); keeping MARK (unexplainable bucket); generated mini-sentences on derived chips (mad-lib in miniature) — all in the brainstorm companion

## load-bearing decisions touched

- **"No inventing node types without verification"** — respected: no new node/edge types; the companion category is split out precisely because it needs its own design pass.
- **"Relationships are graph edges, not property fields"** — untouched; consequences reference entities by id, as today.
- The plan extends `src/types/unifiedAction.ts` additively (NFP #6), the pattern THR-969 proved on the same type.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 278 importers. Blast Radius section present in the plan (additive-optional-only discipline, identity assertion required).

## kill criteria

Wrong if: (a) playtest/screenshot review still cannot answer "what changed and roughly how much" per chip without hovering — then the anatomy failed and the taxonomy/cluster get a second pass before any content investment; (b) the four categories fail to cover real consequence sets and the polarity fallback fires routinely — visible in the adapter's warn-once logs; then the taxonomy grows a deliberate fifth category via the plan's own new-category rule rather than resurrecting MARK. Both are display-layer reversals; the data fields stay valid either way.

## explicit user sign-off

Not required (External — sign-off is only mandatory for High-risk). Direction, taxonomy, chevron idiom, and palette rule were given by Christian live in chat 2026-08-12 in this session; Law 13/15 amendment path ratified there too ("the chevrons are fine as long as…").

## author notes for the judge

- The PATH name was proposed with alternates (TIDING/CALL/ROAD) and Christian did not veto; the plan proceeds decide-and-invite-veto per his standing delegation rule (canon process.md § User review interface rule 4).
- The Law 15 amendment is the one place the plan *changes* standing law rather than obeying it; the brainstorm documents why Law 10 forces the choice. Amendments follow the laws file's own change protocol and were discussed with Christian this session.
- The mockups shown in chat are the visual contract; the plan's UI pillar describes the same anatomy in words. The executor gets both (mock recap lives in the Linear handoff comment).
