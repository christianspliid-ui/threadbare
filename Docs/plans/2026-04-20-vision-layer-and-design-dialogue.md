# Vision Layer & Design Dialogue

**Date:** 2026-04-20
**Status:** Ready for Dev
**Linear project:** [Vision Layer & Design Dialogue](https://linear.app/threadbare/project/vision-layer-and-design-dialogue-33562feb1511)
**Brainstorm companion:** `TheFantasyWorldSimulator/Brainstorms/2026-04-20-vision-layer.md`

## Problem

Design in this project flows through two artifacts: Brainstorms (vault) → Plan docs (`Docs/plans/`). Plan docs are rightly tight — three-pillar, wiring-complete, NFP-compliant — because executors need them to be implementable. But that tightness compresses out the dialogue that produced them. When a design fails on first contact with implementation or playtesting, the rich vision context that would let us revise well is already gone. We rediscover tensions we already argued through, reconsider alternatives we already rejected, and sometimes drift off the long-term experience target because the target was never written down as a *living* artifact.

There is vision material in the vault — `Executive Vision.md`, `Design Direction.md`, `Thematic Pillars.md`, `Tonal Bible.md` — but it sits inside `Systems/` alongside 100+ canonical system-reference pages. It gets read as locked spec rather than as a designer's notebook we can iterate. There is no place where we explicitly think out loud about the long-term game-experience outcome and admit what we're uncertain about.

## Proposal: three surfaces, each with a clear job

**Vision/** — a new top-level folder in the Obsidian vault (sibling to `Systems/`, `Cosmology/`, `Brainstorms/`). Designer's-notebook voice: first-person-plural, exploratory, dated iterations, explicit about tensions and uncertainties. Links down to canonical `Systems/` pages rather than duplicating them. Mutated slowly, with intent — when a design decision reveals a Vision premise was wrong, updating Vision is part of closing that design's loop.

**Brainstorm companion** — every `Docs/plans/YYYY-MM-DD-topic.md` plan doc gets a sibling `TheFantasyWorldSimulator/Brainstorms/YYYY-MM-DD-topic.md` capturing the dialogue that produced it: alternatives considered, tensions surfaced, Vision premises invoked, branches not taken. Written in conversational prose. The Brainstorms folder already exists with date-prefixed files; what's missing is the habit of drafting the companion *alongside* the plan, not after. Retrofitted dialogue is fiction.

**Docs/plans/** — no change in shape. Plan docs remain tight, three-pillar, wiring-complete. They gain two new header links: upward to the Vision premises they depend on, sideways to their Brainstorm companion.

## What Vision/ contains (bootstrap)

Five seed files, drafted as part of this project:

- `README.md` — explains the folder's job and how agents (and humans) should use it
- `00-north-star.md` — what the game feels like to play at its best, in the voice of the designer watching over a prospective player's shoulder
- `01-core-loop.md` — the loop as a *rhythm*, not a flowchart; portfolio scan → curated encounter → aftermath; one complex story at a time
- `02-non-negotiables.md` — the load-bearing decisions written as notebook, narrating *why* they're non-negotiable rather than listing them as rules
- `03-design-tensions.md` — the unresolved tradeoffs we navigate continuously (expansive ideation vs. tight plans, systemic emergence vs. authored moments, divine remove vs. player attachment, mechanical legibility vs. narrative mystery)

Tone is **designer's notebook** — reflective, admits uncertainty, dated "last iteration" signatures, first-person-plural. Not a pitch. Not a spec.

## Workflow integration (CLAUDE.md edits)

Two additions to the **Design Governance → Design workflow checklist**:

1. After "Draft the system design," add: "Draft the Brainstorm companion alongside the plan — same pass, not retrofit. Capture considered alternatives, tensions surfaced, Vision premises invoked."
2. After "Three-pillar check," add: "Vision audit — does this plan contradict or update any Vision premise? If so, the Vision edit is part of this ticket's scope, not a follow-up."

One addition to **Domain Skills** table — the existing placeholder for `game-design-direction` gets promoted from "not yet created" to a real skill. Its trigger: loaded alongside `state-of-game-design` during In Design phase for player-facing features. Its behavior: read all of `Vision/` into context, prompt the agent to draft the Brainstorm companion in parallel with the plan, prompt a Vision audit at plan-doc finalization.

One line in the **Session Workflow** checklist: "For design work, read Vision/ via Obsidian MCP before drafting plans."

## `game-design-direction` skill package

Location: `.claude/skills/game-design-direction/` with `SKILL.md` following the existing skill-package conventions (see `state-of-game-design`, `prose-pipeline`, etc. for format). Mirror to `.agents/skills/game-design-direction/` via the planned sync hook, or hand-copy for now.

Skill body covers: (1) what Vision/ is and how to read it, (2) when to invoke during a design pass, (3) the Brainstorm-companion drafting pattern with a minimal template, (4) the Vision-audit prompt the skill applies at finalization, (5) links to foundational `state-of-game-design` skill (this one runs on top of that, not instead of).

## Three-pillar check

- **Engine** — N/A. This is process/doc infrastructure.
- **Content** — N/A in the game-runtime sense. Vision/ is meta-content about how we build.
- **UI** — N/A for the game itself. The only "UI" is the vault + skill tree.

Flagged explicitly because the three-pillar rule exists to prevent invisible features; this one genuinely is infrastructure.

## Non-negotiables this plan leans on

This plan itself exercises the pattern. It invokes these Vision premises (which will exist in `Vision/` after this ticket lands):

- **Expansive design, conservative implementation** (from `feedback_design_expansiveness` memory) — a vision layer is expansive thinking made durable so the conservative plan layer doesn't lose the context
- **Narrative over mechanical perfection** (NFP #5 in CLAUDE.md) — the Brainstorm companion captures narrative-level reasoning the plan doc would otherwise strip
- **Additive over destructive changes** (NFP #6) — we add `Vision/` above existing pages rather than moving or rewriting canonical spec

## Sequencing & issues

Delivered as three Ready-for-Dev issues under the Vision Layer & Design Dialogue project:

- **Issue 1 — Land vision-layer bootstrap content (CC, model:haiku).** Files already drafted in workspace by Cowork. CC commits, pushes, verifies, updates Obsidian `Index.md`, posts closing comment. Mostly mechanical.
- **Issue 2 — CLAUDE.md Design Governance edits (CC, model:haiku).** Add the two workflow-checklist steps + the Session Workflow line + promote the skill entry from "not yet created" to a real row. Doc-only.
- **Issue 3 — Author `game-design-direction` skill package (CC, model:sonnet).** Create the skill. Judgment work (how much context to load, how the Brainstorm-companion prompt should read, how the Vision audit surfaces during finalization).

Issues 1 and 2 are mutually parallel-safe. Issue 3 depends on issues 1+2 landing first (the skill references the files + CLAUDE.md edits they produce).

## Success criteria

- `Vision/` folder present in the vault with five seed files, discoverable from `Index.md`
- CLAUDE.md Design Governance checklist and Session Workflow reflect the new steps
- `game-design-direction` skill exists in `.claude/skills/` and correctly loads Vision/ into an agent's context when invoked
- A Brainstorm companion for this very design ships alongside this plan doc — pattern demonstrated by self-application
- The next design-track Linear ticket after merge has a Brainstorm companion drafted alongside its plan, verifying the workflow change took

## Open questions

None blocking. The one open decision — whether to eventually migrate `Executive Vision.md` / `Thematic Pillars.md` / `Tonal Bible.md` from `Systems/` into `Vision/` — is deliberately deferred. Start by layering above; consider reshuffling only if Vision/ proves it has gravity.

## Out of scope (explicit)

- Moving existing vision pages out of `Systems/` — they stay as canonical reference
- Retrofitting Brainstorm companions onto past plan docs — pattern applies forward only
- Changing the plan-doc template format itself — only the two new header links are added
