# Skill spec — `action-catalog-design`

**Date:** 2026-05-11
**Driver:** Cowork (catalog-expansion drift in THR-400)
**Handoff:** CC to land in `.claude/skills/action-catalog-design/SKILL.md` and mirror to `.agents/skills/action-catalog-design/SKILL.md`. Run `npm run check:skill-sync:sync` after the first copy to set up mirroring.
**Origin:** `Docs/audits/2026-05-11-thr-400-vision-audit.md` → "Feature-creep prevention" proposal in the same session.

---

## Why this skill exists

[THR-400](https://linear.app/threadbare/issue/THR-400) drafted 8 faction verbs as catalog organization. Three (Schism, Reveal Corruption, Anoint Successor) silently invoked entire new subsystems (faction-split, hidden-corruption schema, succession logic) presented as one-line implementation steps. Vision drift went uncaught until review.

The pattern, named: **catalog expansion drift.** A draft to *organize* or *flesh out* an under-served target category drifts into *commissioning new substrate systems*. The substrate work is hidden behind verb-shaped phrasing. Symptom always: N proposed verbs, M of them require new subsystems, M is uncounted.

This skill makes three pre-flight checks the agent's first move when expanding the action catalog, so the drift is caught before drafting begins rather than at review.

---

## File to create

**Path (canonical):** `.claude/skills/action-catalog-design/SKILL.md`
**Mirror:** `.agents/skills/action-catalog-design/SKILL.md`

## Full content

```markdown
---
name: action-catalog-design
description: >
  Pre-flight gate for any design pass that expands the action catalog —
  drafting new ascendant / divine / agent / faction / location / artifact /
  hex / army action verbs, adding to `src/data/unified-action-templates.ts`,
  or shaping a new `UnifiedActionTemplate`. Fires on: "expand the action
  catalog", "new action verbs", "new god-verbs", "new intervention verbs",
  "faction actions", "location actions", "artifact actions", "ascended
  action expansion", "add to unified-action-templates", "new
  UnifiedActionTemplate", "extend the action vocabulary". Enforces three
  checks before drafting: Substrate Honesty, Mortal-Loop Bridge,
  Surface-Shape Check. Load alongside `game-design-direction` for In
  Design phase work; this skill is the action-catalog-specific extension
  of that skill's general Vision audit.
last_validated_against: 2026-05-11
---

# Action Catalog Design — Pre-flight

This skill exists to prevent a specific failure mode the project has hit before: a draft to *organize* or *flesh out* an under-served target category drifts into *commissioning new substrate systems*, and only gets caught at review. By that point the plan reads coherently and the audit is expensive.

The pattern, named: **catalog expansion drift.** Symptom: a draft adds N new verbs; M of them silently invoke entire new subsystems (faction-split, hidden-corruption schema, succession logic, mission objects, suspicion mechanics). M is hidden behind verb-shaped phrasing like *"Schism needs faction-split logic in `factionLifecycle.ts`"* — one sentence, one ticket, in the implementation steps.

This skill runs the three gates that catch it.

---

## When to load

Load at the start of any **catalog-expansion design pass**. Concretely:

- Drafting new action verbs for any target category (agent, faction, location, sublocation, artifact, hex, army)
- Adding entries to `src/data/unified-action-templates.ts`
- Reshaping or extending the action vocabulary at any scale
- Reviewing a plan doc whose deliverable is "N new actions"

Load it **alongside `game-design-direction`**, not instead of it. This skill is the action-catalog-specific extension; the general Vision audit still applies.

**Skip it** when work is editing prose / tuning numbers on existing actions, or when work is about action-system *infrastructure* (drawer UI, targeting engine, prerequisite logic) rather than catalog content.

---

## The three pre-flight checks

Run all three **before drafting**. Drafting before the checks pass is what produces catalog-expansion drift.

### 1. Substrate Honesty

For **every proposed entry**, build the table:

| Verb | Substrate it touches | Exists today? (Codesight evidence) | Verdict |
| --- | --- | --- | --- |
| Example: Stir Dissent | faction.dissentScore property | `grep dissentScore src/` → present in `factionAgenda.ts:47` | rides existing |
| Example: Schism | faction-split subsystem (mint new faction node, transfer members, partition territory) | `grep -r "splitFaction\|forkFaction" src/` → no results; `factionLifecycle.ts` has no creation path | **NEW SUBSTRATE NEEDED** |

Rules:

- Run a Codesight query or `grep` for each substrate claim. "Verify by reading existing X" deferred to implementation is **not acceptable** — that's how drift gets through.
- **Any entry marked NEW SUBSTRATE NEEDED becomes its own design ticket.** It is not a bullet in this plan's implementation steps. Move it to a sibling Linear issue with its own design pass scoped to the substrate.
- The remaining "rides existing" entries are this plan's scope. If that drops the verb count below the original ambition, that is correct — the original ambition included substrate work disguised as authoring work.

**Hard rule:** if a single design pass would introduce more than one new substrate primitive, split. The verb that requires a new subsystem is a separate ticket, not a step.

### 2. Mortal-Loop Bridge

For **every proposed entry**, write one paragraph answering:

> *"When this verb fires, what encounter does it generate, on which portfolio mortal, sourced from which existing thread?"*

This is the North-Star check. `Vision/00-north-star.md` frames the moment we are building toward as **one mortal the player came to care about, in a crisis**. `Vision/03-design-tensions.md` §3 names the drift signal: *"We are drifting toward pure remove when the player has no mortals they could name."*

High-remove target categories (faction, location, hex, army) fail this check most often. They produce *world events* without lifting a *mortal* to the stage. Verbs that cannot produce a mortal-scale encounter are dashboard expansion, not story expansion — they fail this check.

**Examples that pass:**

- *Schism* (if it shipped): "When schism fires on a faction with bonded mortals in both halves, the orchestrator scans the portfolio for the most-bonded mortal whose loyalties span the split, and lifts them to a curated encounter where they must choose. Their choice becomes thread-load-bearing for the rest of the run."
- *Stir Dissent*: "When dissent on a faction passes the unrest threshold, the orchestrator lifts the faction's leader (if in the portfolio) to a 'sleep is brief' encounter — their authority is brittle and they know it."

**Example that fails:**

- "Faction reputation drops 12% and territory shrinks." → no mortal, no encounter, no portfolio lift. Failed bridge. Either rewrite the bridge or drop the verb.

If you cannot write the bridge paragraph for a high-remove verb, the verb is incomplete — even if the engine effect is well-specified.

### 3. Surface-Shape Check

Before adding to `src/data/unified-action-templates.ts`, read `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §10.4 and state in your plan:

> *Verdict: this verb should live as [a global `UnifiedActionTemplate` / a per-scene god-verb inside an encounter template]. Reasoning: [...]*

Why: `Vision/taste-profile.md` (strong opinion, updated 2026-05-07) records the **2026-05-04 retirement of fixed verbs** in favor of encounter-specific god-verbs. The catalog surface itself is under pressure. The right answer per scope is plausibly:

- **Per-scene** when the verb is intimate, agent-scale, anchored in a specific encounter beat.
- **Global** when the verb is institutional, world-scale, fired from the action drawer against a focused target.

But the question is **not yet settled across all scales** — that's the open work. Your plan must state which side it lands on and why, not silently default to global because that's where `unified-action-templates.ts` lives.

---

## What a passing pre-flight produces

A short pre-flight section at the top of the plan doc, before any verb drafting:

```markdown
## Pre-flight (action-catalog-design skill)

### Substrate Honesty table

| Verb | Substrate | Exists? | Verdict |
| --- | --- | --- | --- |
| Stir Dissent | faction.dissentScore | Yes (`factionAgenda.ts:47`) | rides existing |
| Whisper to Leader | leader edge + persuasion model | Yes (`divine.persuade` uses it) | rides existing |
| Recover Doctrine | ruin discovery + faction property | Partial — ruin discovery yes, property setter no | rides existing (small extension) |
| Surface a Doubter | member-faction-conflict state | **No** — needs heretic schema | **deferred to THR-NNN** |

### Mortal-Loop Bridges

(one paragraph per surviving verb)

### Surface-Shape Verdict

This pass keeps global `UnifiedActionTemplate` for the three surviving verbs. Reasoning: faction-scale interventions are institutional, fire from the drawer against a focused faction target, and have no obvious anchor encounter. The 2026-05-04 direction explicitly preserves global templates for scopes the encounter pipeline cannot host.
\`\`\`

Once the pre-flight passes, drafting proceeds normally — and the rest of `game-design-direction` (Brainstorm companion, three-pillar structure, constants table, etc.) applies as usual.

---

## Why this skill exists (the precedent)

[THR-400](https://linear.app/threadbare/issue/THR-400/faction-action-expansion-add-6-8-governance-verbs) (2026-05-11) drafted 8 faction verbs. Three (Schism, Reveal Corruption, Anoint Successor) silently invoked entire new subsystems. The Vision audit caught it, but only because a reviewer happened to read carefully and remembered the 2026-05-04 direction shift. The audit doc is `Docs/audits/2026-05-11-thr-400-vision-audit.md`.

The three checks above are the three things that audit had to reconstruct manually. This skill makes them the agent's first move, not a reviewer's recovery.

---

*last iterated 2026-05-11 — bootstrap, drawn from `Docs/audits/2026-05-11-thr-400-vision-audit.md` and `Vision/`.*
```

---

## Implementation notes for CC

1. Create the directory: `.claude/skills/action-catalog-design/`
2. Write the content above (the fenced block between the first `---` after the description and the final `---` at end of content) verbatim to `.claude/skills/action-catalog-design/SKILL.md`. Note the escaped triple-backticks in the "What a passing pre-flight produces" section — unescape them in the final file.
3. Mirror to `.agents/skills/action-catalog-design/SKILL.md` via `npm run check:skill-sync:sync`, or manually if the script doesn't pick up brand-new skills automatically.
4. Verify the skill-sync hook is happy with the new pair (it should be — both copies will be byte-identical at creation).
5. No tests needed — this is a documentation skill, not code.

## Three-pillar check

- **Engine:** N/A — this is an authoring-process skill, no engine changes.
- **Content:** N/A — affects how content gets designed, but adds no content.
- **UI:** N/A — no player-facing surface.
- **Process pillar:** YES — this is a Cowork/CC tooling change. The three-pillar rule says N/A is acceptable when flagged with rationale; this is that flag.

## Definition of done

- [ ] `.claude/skills/action-catalog-design/SKILL.md` exists with the content above
- [ ] `.agents/skills/action-catalog-design/SKILL.md` mirrors it (verified by sync hook)
- [ ] Skill triggers on the listed keywords (verify by loading a session with one of the trigger phrases — e.g., "expand the action catalog" — and confirming the skill auto-loads)
- [ ] `Fixes THR-NNN` in the commit message

## Coordination block

- Suggested model: **model:sonnet** (file creation + skill-sync, no novel reasoning)
- Parallel-safe with: any work not touching `.claude/skills/` or `.agents/skills/`
- Mutex with: nothing currently — no other skill work in flight
- Files to touch: `.claude/skills/action-catalog-design/SKILL.md`, `.agents/skills/action-catalog-design/SKILL.md`
- Done when: checklist above passes
