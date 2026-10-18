# Action proposal — The First keeps her trade (THR-1982)

## intent_quote

There is no live user message; this is the design lane (unattended, Christian's ruling 2026-09-25, THR-1611) working an agreed cold-playtest ticket. The originating intent is the ticket and the testers it quotes.

> "Elara changed identity between events: herb-healer, then a smithing guild applicant working iron, then a forty-year archivist. It felt like the game forgot who she was." — round-4 story tester, quoted on THR-1982

> "Morthane's intro didn't match his chapters." — round-4 skimmer, quoted on THR-1982

> **Design question.** What identity does The First carry out of the meeting (a calling/role, the vignette's occupation, both), and how strongly should it steer which chapters she is offered and how a chapter's prose names her role?
> **Recommended direction.** 1. The meeting writes The First's calling as a role the engine already reads (`npcRole`, or the existing calling vocabulary), derived from the chosen vignette. 2. Role affinity then weights her chapters toward that calling, with a floor so other chapters still appear. 3. Chapters that hard-cast an occupation ("a forty-year archivist") either gate on a matching calling or phrase the role as a situation ("the archive she keeps").
> **Fixed when** no round-5 tester reports their First's occupation changing between chapters.
> **Done when** this ticket's implementation tickets are filed into this milestone (*Cold playtest · round 4*) and this ticket is closed by the design pass. — THR-1982 description

Christian's standing ruling: "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations" (2026-09-25).

## scope (what this plan does)

Adds an authored trade (an existing `NpcRole` plus a display word) to each of the 24 Meet-The-First vignettes, writes it onto The First at the bond so every existing `npcRole` reader (role-affinity scoring, birth Means, caster tradition, prose) sees her trade, adds one optional template field `protagonistRoles` and one fail-open filter stage so the five regional chapters whose premise is a job only run on a mortal whose role fits, adds a `{trade}` prose token for future content, and shows the trade word once on the person sheet with a tooltip.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the calling (derived title) or feed the trade into its derivation.
- Does not rewrite any chapter's prose, and does not convert existing prose to `{trade}`.
- Does not grant The First a starting spell.
- Does not touch odds, forecasts or bands; role affinity weighs choice only.
- Does not add names or captions to the meeting picker (that is THR-1981's design pass).
- Does not census or fix ordinary (non-story-beat) encounters that assume a trade in their prose; named as the next step if round 5 still sees a recast.
- Does not migrate old saves.

## impact_class

Reversible — two master switches (`FIRST_TRADE_ENABLED`, `PROTAGONIST_ROLE_FIT_ENABLED`) restore main's behaviour; all fields are optional and additive.

## evidence cited

- **Linear issue:** THR-1982
- **Vision premises invoked:** "the story becomes yours"; the god influences, never commands (Law 9, `Docs/game-design/laws.md`)
- **UL terms touched:** Calling (unchanged, disambiguated from trade); `npcRole` (engine). New player-facing term **Trade** (what The First did before the thread; fixed; distinct from Calling): a `UL-proposal` is filed with the build PR (plan Done-when).
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md` (Meet The First, calling), `Docs/canon/encounters.md`, `Docs/ubiquitous-language/Agents.md` § Calling, `Docs/game-design/laws.md` (9, 20, 40, 42, 43), `Docs/ops/player-complaint-classes.md` (PC-6)
- **Prior plan docs this builds on:** `Docs/plans/2026-09-02-thr-1299-calling-and-surfaces.md` (the calling), `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md` (birth Means from role), `Docs/plans/2026-10-11-thr-1807-terms-explain-themselves.md` (the picker rule)
- **Rejected approaches considered and dismissed:** using the calling as the carrier; deriving role from reach pair (measured: empath → bard); hard-filtering by role affinity; rewriting the five chapters as situations; showing the full epithet — all in the brainstorm companion.

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — respected: the trade is a label on the actor (no traversal wants it), like `npcRole` on every other mortal.
- "No inventing node types without verification" — no new node or edge type.
- "Everything is a graph node/edge" — respected.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 663 importers (one optional field). Blast Radius section present.

## kill criteria

- The ordinary-scene recast (the round-4 "smithing guild applicant") is already filed as THR-1983 in the same milestone; it is not left to round 5. If round 5 still has a tester reporting a *story chapter* recasting their First, the gate lists are wrong — widen the census to every story-beat template.
- If the role-fit gate leaves a measured First with no chapter to draw for longer than the story breath in a 600-tick CLI run (seed 42 medium, `firstunmet` path), switch `PROTAGONIST_ROLE_FIT_ENABLED` off and rewrite the five chapters' prose instead.
- If Christian vetoes "the trade is fixed", drop the sheet line and fold the trade into the calling's seed.

## explicit user sign-off

Not required (Reversible). Decided under delegation; veto invited in the lane report.

## author notes for the judge

- The ticket offered "calling" as a possible carrier; I deliberately did not use it because the calling is canon-defined as derived and changing (UL Agents.md § Calling). The ticket's own wording ("`npcRole`, or the existing calling vocabulary") allows the `npcRole` route.
- The healer role's reach pair (gold/star) differs from the empath vignette's capability (veil/heart). I chose story over mechanical alignment; the NFP table says so.
- Each gate list includes a role a First can start with, so no gated chapter becomes unreachable for The First; I checked this against the 24-row table.
- Revise round 1 (judge) applied: dev-seed writer, `generateNarrativeCandidates` copy site + `vignetteId`, the two surfaces that print raw `npcRole`, UL-proposal, the follow-up ticket THR-1983, citation `:961-1096`.
- Binder: the judge measured no threaded-mortal exclusion and that roleless actors are already castable. I deliberately did **not** take the suggested `the_first` exclusion: The First is castable in others' scenes on main today, and removing that changes scene casting for every run — a separate decision. The plan pins "eligibility unchanged" with a unit test instead.
