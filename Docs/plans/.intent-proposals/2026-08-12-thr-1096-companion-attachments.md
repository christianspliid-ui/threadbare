# Action Proposal — Companion attachments (THR-1096)

## intent_quote

From the THR-1082 design session (Christian, chat, 2026-08-12, verbatim — recorded in THR-1096's description):

> saved by another wanderer while almost falling, receive an attachment of the type ally (an attachment that is a person that gives bonuses like this example from eldritch horror. they are not an agent, just a part of the retinue that gives a bonus.

From this design session (Christian, chat, 2026-08-12):

> ok lets do design of companion attachments. can you see this page https://eldritchhorror.fandom.com/wiki/Ally

And the standing palette direction from the same THR-1082 session:

> addition i want the encounter builder to use ALL the attachment types and many different conditions. so the ones i wrote as examples is to point you in the direction of all those opportunities, and also the opportunity to expand with new categories if it makes for a good story.

## scope (what this plan does)

Designs the `companion` attachment category end to end: a new `companion` NodeType + `accompanies` EdgeType (full design per the load-bearing rules), template→instance minting with generated names, small always-on `domainContributions` flowing through the existing capability walk, reward-pool and direct-grant gain paths, loss as story events (contract expiry, lured away), a retinue cap, an 8+1 starter library, the retinue row UI, and the migration of `hire-mercenaries` off its off-schema dead-bonus mint.

## scope (what this plan does NOT do — explicit non-goals)

- No simulated behavior: companions never decide, move, or appear in agent systems — "not an agent" is the ruling this design exists to honor.
- No companion loyalty/opinion stats (re-opens the agent door; deferred with rationale in the brainstorm).
- No situational/conditional bonuses in v1 (EH's ally principle: small, always on).
- No companions-as-scene-cast (deferred; schema does not block it).
- No shop/purchase surface (EH's Value column deliberately not carried over).
- No artifact-action arms (steal/appraise) targeting companions in this ticket.
- No content sweep granting companions across encounters — that is THR-1097's territory once this and THR-1082 land.

## impact_class

High-risk (judge-corrected from External, 2026-08-12 — "new node type" is a named High-risk example in the intent-judge class table). New NodeType/EdgeType members on `src/types/graph.ts` (125 importers); the aftermath-effect vocabulary extension is shared with THR-885 card grants; the reward pipeline gains a category every recipe can weight. Code is additive throughout; nothing existing changes meaning.

## evidence cited

- **Linear issue:** THR-1096
- **Vision premises invoked:** god/protagonist separation (companions are read, not puppeted); mortal-story depth
- **UL terms touched:** Attachment, Retinue (new — flagged below), Companion (new). The plan proposes `ui.retinue` tooltip copy; if these graduate into cross-system authoring vocabulary the way SCAR/BOND/BOON/PATH did, a UL-proposal follows the THR-1098 precedent — the handoff comment flags it.
- **Canon pages consulted:** `Docs/canon/encounters.md` (session context), `Docs/canon/systems-inventory.md` (via substrate inventory), `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `2026-03-10-attachment-system-design.md` (the Retainer row it supersedes — documented), `2026-03-31-generic-effect-system-design.md`, THR-718 stat contributions, THR-761 condition expiry, `2026-08-12-thr-1082-consequence-language.md` (BOND renders companions)
- **Rejected approaches considered and dismissed:** actor-node retainers (the 2026-03-10 model — contradicts the ruling, needs exclusion flags everywhere); artifact-node companions (kind-routing leaks, person-as-inventory); per-instance trait nodes (pollutes the trait definition space and its closed-set test pins). All in the brainstorm companion.

## load-bearing decisions touched

- **"No inventing node types without verification"** — verified: the three existing candidates (actor, artifact, trait) are each examined and rejected with named costs; the new type is confirmed genuinely new.
- **"New node types require full design before code"** — this plan is that design: category, properties, edge types, tick participation (expiry only), traces (`companion.joined`/`companion.departed`).
- **"Relationships between entities are graph edges"** — `accompanies` is an edge, not an id field.
- **"Everything is a graph node/edge"** — respected; the off-schema mercenary mint is *repaired* toward this rule.

## high-impact files touched (from Codesight)

- `src/types/graph.ts` — 125 importers. Blast Radius section present.
- `src/types/unifiedAction.ts` — 278 importers (one visualKind member + one effect member, coordinated with THR-1082). Blast Radius section present.

## kill criteria

In the plan doc (§ Kill criteria): companions reading as stat-sticks → pause library growth and redesign the card shape before authoring more; the cap fighting authored fiction → retune `RETINUE_MAX`, never silently evict. Both display/content reversals; graph data stays valid.

## explicit user sign-off

Required (High-risk). Christian, chat, 2026-08-12, after reviewing the full design summary (graph model, two tiers, bonuses, gain/loss, cap, mercenary migration) and the retinue-row + BOND-chip mockup in this session:

> looks good.

The category itself, the not-an-agent rule, and the EH ally reference are additionally his explicit direction (quoted in intent_quote); he opened this design session and supplied the reference page.

## author notes for the judge

- The substrate inventory documents a genuine oddity: the attachment file's own header names "Retainers" as a sixth category that was designed (as actor nodes) and never built, plus a live production mint (`hire-mercenaries`) writing an off-schema node with a bonus nothing reads. The plan supersedes the former and migrates the latter; neither is green-field duplication — the inventory rows say which.
- Sequencing: this plan deliberately lands *after* THR-1082 (mutex, stated in coordination block and executor notes) because BOND chips are the render surface.
- The 8-template starter roster in the Content pillar is indicative; final authoring is the executor's pass under the register rules. The plan pins the *shape* (count, contribution range, tier spread), not the prose.
