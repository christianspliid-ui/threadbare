# Action Proposal Template

Authors (Cowork): copy this file to `Docs/plans/.intent-proposals/<plan-doc-slug>.md`
and fill in every field before invoking `/intent-judge` or auto-spawning the
judge. Empty or omitted fields = the judge will Block on "malformed proposal".

---

## intent_quote

> <Paste the user's verbatim ask. If you're paraphrasing, you're already wrong.
> Use the exact words from the user's message that prompted this plan doc.
> If the ask spans multiple messages, quote each separately with `>` blocks.>

## scope (what this plan does)

<One paragraph, no marketing speak. What does the plan touch, and what does it
deliberately not touch?>

## scope (what this plan does NOT do — explicit non-goals)

<Bullet list. If a user might reasonably expect a thing and it's not in scope,
say so here. The judge uses this to score dimension 1 (intent fidelity) —
absent non-goals = GAP because the judge cannot tell scope creep from intent.>

## impact_class

<One of: Read-only | Reversible | External | High-risk.
The judge will confirm or correct this. Picking too low is more dangerous
than picking too high — the judge bumps you up and notes it.>

## evidence cited

- **Linear issue:** <THR-XXX>
- **Vision premises invoked:** <file paths, e.g. `Vision/cosmology.md`>
- **UL terms touched:** <list, plus any new terms that need a `UL-proposal` issue>
- **Canon pages consulted:** <`Docs/canon/<domain>.md` files>
- **Prior plan docs this builds on:** <paths>
- **Rejected approaches considered and dismissed:** <if any — name them and why>

## load-bearing decisions touched

<List any entry from CLAUDE.md's "Load-Bearing Architectural Decisions" this
plan interacts with. Even if the plan respects the decision, list it — the
judge will check the plan's text against the decision's wording.

If a decision is being *changed*, this plan must be High-risk class with an
explicit user sign-off line below.>

## high-impact files touched (from Codesight)

<Run Codesight or grep importers for every `src/` file the plan touches.
List any with ≥100 importers here. Plan doc must have a Blast Radius section
if this list is non-empty.>

## kill criteria

<How will we know if this plan was wrong? What will we do then?
The judge scores GAP on dimension 10 if this is absent or hand-wavy.>

## explicit user sign-off

<Only required for High-risk impact class.
Paste the user's verbatim "yes, ship this" message here, with timestamp.
If you're authoring a High-risk plan without explicit sign-off, leave this
field empty — the judge will Escalate, which is the correct outcome.>

## author notes for the judge

<Anything the judge should know that the plan doc doesn't say out loud.
Tradeoffs you made, paths you considered and dropped, places where you're
uncertain. The judge reads this — it is not a "skip this" field.>
