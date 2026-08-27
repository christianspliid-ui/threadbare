# Action Proposal — 2026-08-27-shared-anchor-machinery (THR-1212)

## intent_quote

> hey lets get some design work promoted

(Christian, chat, 2026-08-27 — the session ask. The substantive intent lives in the ticket he authored and the map ruling he made live in chat:)

> **THR-1212 Done-when:** "Plan doc in `Docs/plans/` per design governance, linking the specific map decision tickets inline where used; moved to Ready for Dev with a coordination block. Strangler, never big-bang (standing preference)."

> **THR-1163 wave-1 ruling (Christian, chat 2026-08-22, recorded on the map):** "Wave-1 slate, in order: (1) shared machinery — the anchor type normalising the four vocabularies, the generated catalog, the gates; …" with the absorbed rulings: "consequence chips (remainder) fold into the machinery doc as a ruling, and followOnTags becomes its falsifiable demonstration case."

> **Program epic priority (Christian, verbatim on THR-1156):** "lets get it sorted. higest priority. new features can wait as they will just be implemented badly due to these issues"

## scope (what this plan does)

Designs the shared reference machinery for the typed game-state program: a canonical `WorldRef` type + kind union normalising the four existing reference shapes behind adapters (hub-and-spoke, wire shapes untouched); extends the existing anchor-catalog generator into the game-wide authority with a kind-union coverage lint; defines the four-part typed-seam gate contract (static classifier, live resolver that drops, seeded-world no-op gate, ratchet baseline); designs the reachable-consumption ledger (generated, half-curated, fail-by-name); and settles the five absorbed rulings the map routed here (chips remainder, followOnTags deletion-as-demonstration, violation-class taxonomy home = UL + one map badge, codex arm = reserved kind + chartered Deferral, edge warn→enforce = per-family earned ratchet). Includes the ticket's prep-step measurement, run fresh this session (626 chips / 183 anchored / 0 unanchored-in-scope / 443 no-referent, bucketed by family).

## scope (what this plan does NOT do — explicit non-goals)

- Does not implement anything — design-session ticket; executor slices are enumerated for handoff.
- Does not rewrite the four legacy reference shapes or migrate their consumers (strangler; kind vocabulary unifies now, shapes converge per chartered seam).
- Does not sweep the 443 no-referent chips (ratchet + factory retrofit cadence instead).
- Does not design the hunger seam (THR-1213) or region identity (THR-1155) — they consume this machinery.
- Does not design the in-game codex surface (chartered as a Deferral with the reserved kind making the gap visible).
- Does not invent new sentinel forms ahead of content need (`$spawned:` generalization waits for defect evidence).
- Does not touch reach-signature `SYMBOLIC_REFS` / `TargetCategory` (leave-alone verdicts from THR-1159, honored).
- Does not ratify the "no naked state" law candidate — surfaced to Christian in chat; law changes are his call.

## impact_class

Reversible — a plan doc plus enumerated additive executor slices; the one destructive slice (followOnTags deletion) is evidence-gated by the ledger and reversible from git.

## evidence cited

- **Linear issue:** THR-1212 (map: THR-1157; decisions: THR-1158, THR-1159, THR-1160, THR-1161, THR-1163, THR-1176; pilot: THR-1153/1154/1164/1165; post-pilot sentinels: THR-1130, THR-1275)
- **Vision premises invoked:** typed-state charter distinctions 1–4 (THR-1156, ratified); architecture-first ruling; strangler rule
- **UL terms touched:** new — `WorldRef`, `claim-without-anchor`, `write-without-consumer`, `render-private-pipeline` (UL-proposal is an executor action item; "Law 56-hollow" recorded as alias)
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/process.md`, `Docs/design-system/laws.md` (Laws 13/21/56), interface-map governance
- **Prior plan docs this builds on:** the pilot's shipped machinery (PRs #1520–#1523) read from the tree; `generate-anchor-catalog.ts`, `chipAnchorDeclarations.ts`, `compositionContract.ts` clause 2
- **Rejected approaches considered and dismissed:** replacement-not-hub (big-bang, violates strangler + pilot evidence), structured binding discriminant (pilot proved id-field sentinels), big-bang chip sweep (cost split), interface-map-only or UL-only taxonomy home (single authority + pointers wins), designing the codex surface inline (pillar-sized UI effort out of scope). Full list in the brainstorm companion.

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected; WorldRef references existing types, adds none.
- "No inventing node types without verification" — no node types invented.
- "Relationships are edges, not property fields" — untouched.
- "Agent position three-tier model" — the `sublocation` kind mirrors the THR-1183 shape (`location` + `parentLocationId` discriminator), stated in the type comment.
- High-impact file `src/types/unifiedAction.ts` — touched only by the followOnTags field deletion; Blast Radius section present. `src/types/graph.ts` — parsed as source text, not modified or runtime-imported.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (278 importers — field deletion only, zero-consumer-evidenced). `src/types/graph.ts` (531 — NOT modified; source-parse coupling registered for freshness). Blast Radius section present in the plan doc.

## kill criteria

- The ledger's first honest run fails to flag `followOnTags` unprompted → the ledger design is wrong; rework before the deletion slice runs (stated as an acceptance criterion, not a hope).
- THR-1213 (hunger, the generalization proof) finds the type/adapters cannot express its seam without shape changes → the map's own escalation path: Linear comment against this doc, not silent redesign.
- The kind-union coverage lint produces more curated-exception rows than mapped rows → the "normal form" is fiction; revisit hub-and-spoke.
- Ratchet baseline generates recurring false failures at closeout (tree-diffing gate misuse) → same repair as the typecheck ratchet's documented pattern; if it recurs ≥3×/week it is an impediment-log pattern for retro.

## explicit user sign-off

Not required — Reversible class. (The wave-1 slate itself carries Christian's live ruling, quoted above.)

## author notes for the judge

- The pilot-era picture moved under the ticket: `$target` and `$artifact` shipped after the pilot learnings were written, which partly dissolves the carrier-vs-G1 fork the ticket poses. The ruling acknowledges the shipped state rather than re-deciding a stale fork — flagging so the judge doesn't read it as scope drift.
- The prep-step number (443) differs from both prior citations (437 seam-inventory, 491 PR #1522) because the corpus moved and the measurements differ in walk/dedupe; the plan states its own walk (chipAnchorViolations-identical) and commits the number only as a ratchet baseline, which self-corrects.
- UI pillar has no new surface by design; I chose explicit laws-binding + debug accessor + chartered deferral over a token surface. Judge may verify this against the three-pillar rule's N/A-with-rationale allowance.
- No tick traces: deliberate (nothing ticks); inspectability is served by generated artifacts + `__DEBUG` accessor. Flagged because NFP #2 checklists often expect a trace interface.
