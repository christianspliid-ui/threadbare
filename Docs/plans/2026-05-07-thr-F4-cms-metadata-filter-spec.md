---
status: current
title: THR-342 (F4) — CMS metadata-filter contract — Option C made permanent
date: 2026-05-07
linear: THR-342
parent_plan: 2026-05-05-encounter-ui-implementation-phasing.md
predecessor: 2026-05-05-thr302-encounter-format-cleanup-impl-plan.md
audience: Codex (executor)
---

# THR-342 — CMS metadata-filter contract: Option C made permanent

**Status:** Tightened spec for Codex pickup. Resolves the design decision left open in `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §7.1 and the three-option table in `Docs/plans/2026-05-05-thr302-encounter-format-cleanup-impl-plan.md` §2.3.

**Audience:** Codex executor. This is a **documentation-only** ticket; no engine, content, or UI code changes.

---

## 1. Decision (resolved by Cowork 2026-05-07)

**Option C is made permanent.** The CMS retains authored encounter-package imports as the taxonomy source. The metadata-filter contract is closed, not migrated.

### Why Option C, not Option A or B

The three options from THR-302's plan §2.3:

| Option | Verdict | Reason |
|--------|---------|--------|
| **A — Bulk-add `narrativeLayer: 'encounter'` to 22 content files, refactor registry to filter by metadata** | Rejected | (1) Commits content authors to populating `narrativeLayer` going forward — process discipline without a current consumer. (2) Touches 22 files for zero player-visible benefit. (3) The encounter UI work shipped through Phases C/D/E consumes encounter content via `UnifiedActionTemplate[]` arrays directly, not via CMS-style filtering — there is no engine consumer that needs `narrativeLayer === 'encounter'`. |
| **B — Side-table id registry (`ENCOUNTER_TEMPLATE_IDS: ReadonlySet<string>`)** | Rejected | Adds an indirection module and a maintenance contract (every new encounter template must register its id) without a clear consumer. The 8 authored imports already provide identical CMS coverage with less ceremony. |
| **C — Keep authored taxonomy permanently** | **Accepted** | Already shipped under THR-302 PR #129; the CMS view (`?view=cms`) renders encounter categories correctly today. The 8-import structure *is* the authored taxonomy — encounters are grouped by package (Civic Guard, Arcane Circle, Mercenary, Monster, etc.), which mirrors how content authors think about them. NFP-#6 (additive over destructive) favors leaving the working shape. |

### Reversal trigger (when to revisit)

This decision is **good enough for now, safe enough to try** (sociocratic two-part consent). Reopen this question only when one of these triggers fires:

1. A future engine system needs to filter `UNIFIED_ACTION_TEMPLATES` by encounter-vs-non-encounter at runtime (not just CMS visibility).
2. A new encounter package is added that doesn't fit the current CMS category groupings, forcing the question of where it lives.
3. An author proposes promoting a non-encounter `UnifiedActionTemplate` to encounter status without changing files — a workflow Option A would enable.

If none of those fire, Option C stays permanent.

---

## 2. Files to touch

Exactly three files. All edits are **comment / prose only**.

### 2.1 `src/components/CMS/registry.ts`

**Current state (lines 35–37):**

```ts
// Encounters
// THR-302 Option C: keep authored encounter-package imports as the CMS taxonomy source.
// We intentionally defer metadata-driven registry filtering to THR-301 follow-up.
```

**Replace with:**

```ts
// Encounters
// THR-342 (Phase F4) made Option C permanent: keep authored encounter-package imports
// as the CMS taxonomy source. Reasons:
//   - The 8-import structure mirrors how authors think about encounter packages.
//   - No runtime engine system needs to filter UNIFIED_ACTION_TEMPLATES by encounter-vs-non-encounter.
//   - Encounter UI (THR-301 Phases C/D/E) consumes encounter arrays directly, not via CMS filtering.
// Reversal triggers documented in Docs/plans/2026-05-07-thr-F4-cms-metadata-filter-spec.md §1.
```

**No other changes to `registry.ts`.** Do not touch the import statements or the registry entries; the existing structure IS the implementation of Option C.

### 2.2 `Docs/plans/2026-05-05-thr302-encounter-format-cleanup-impl-plan.md`

Append a new §8 at the end of the file (after the current §7 "Out of scope"):

```markdown
---

## 8. Decision resolved (2026-05-07, THR-342)

The §2.3 three-option choice (A bulk-add / B side-table / C keep-as-is) is resolved as **Option C made permanent**. Implementation: documentation-only update in `src/components/CMS/registry.ts` clarifying the comment from "deferred" to "permanent" with rationale.

Resolution doc: `Docs/plans/2026-05-07-thr-F4-cms-metadata-filter-spec.md`.

Reversal triggers (when to reopen):
- A future engine system needs runtime metadata filtering of encounter templates.
- A new encounter package doesn't fit existing CMS category groupings.
- An author workflow needs file-free promotion of templates to encounter status.

Until one of those fires, Option C is the permanent shape.
```

### 2.3 `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md`

In §7.1 ("CMS metadata-filter contract (from THR-302 Option C)"), replace the paragraph:

> F4's job: settle whether `narrativeLayer: 'encounter'` (currently never set) becomes the canonical filter signal (Option A from THR-302's plan), or whether a side-table id registry is preferred (Option B), or whether the authored taxonomy stays as-is permanently (Option C made permanent). Decision lives in F4, not pre-empted here.

with:

> F4 resolved 2026-05-07 (THR-342): **Option C made permanent.** Authored encounter-package imports remain the CMS taxonomy source; no metadata-filter contract is migrated. Resolution doc: `Docs/plans/2026-05-07-thr-F4-cms-metadata-filter-spec.md`. Reversal triggers documented there.

---

## 3. Coordination block

**Plan doc:** `Docs/plans/2026-05-07-thr-F4-cms-metadata-filter-spec.md` (this file)
**Parent phasing plan:** `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §3 Phase F4 + §7.1
**Predecessor:** `Docs/plans/2026-05-05-thr302-encounter-format-cleanup-impl-plan.md` §2.3 (Option C originally chosen, now made permanent)

**Parallel-safe with:** F1 (THR-339, in Ready for Dev), F2 (THR-340, in Ready for Dev), G1 (THR-343, In Dev — Codex), G2 (THR-344, Ready for Codex), G3 (THR-345, Ready for Codex), D3 (THR-353, Ready for Codex)
**Mutex with:** none
**Codex review:** no — documentation-only edit; no source-file behavior changes; review via diff is sufficient.

### Why this is a Codex fit

- Decision is settled in §1; no design judgment remaining.
- Three concrete edits with exact replacement text in §2.
- Each done-when item is binary (text matches / commit lands / build green).
- No source-file behavior changes — registry.ts comment swap is the only `.ts` edit, and it's a comment.

---

## 4. Done when

- [ ] `src/components/CMS/registry.ts` lines 35–37 replaced with the permanent-decision comment block from §2.1; no other edits to that file.
- [ ] `Docs/plans/2026-05-05-thr302-encounter-format-cleanup-impl-plan.md` has the new §8 from §2.2 appended verbatim.
- [ ] `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §7.1 paragraph replaced verbatim per §2.3.
- [ ] `?view=cms` (booted via `npm run dev`) renders the same encounter categories as before — no regression. (Local-only verification; CI does not run a UI smoke for CMS.)
- [ ] `npm test` green.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` clean.
- [ ] Commit body includes `Fixes THR-342` for the merge-to-main auto-close.
- [ ] Verification evidence (raw `npm test` / `tsc` / `build` output, or a link to a green CI run for the same commit) pasted in the closeout comment.

---

## 5. Out of scope

- Any change to encounter content files (`*-encounter-content.ts`) — Option A would have required this; Option C does not.
- Any change to the `narrativeLayer` field type or its existing `'ruins'` / `'soul'` / `'land'` values.
- The `Systems/Encounter System.md` vault doc — that update was rolled into THR-341 (F3, Done) per the phasing plan §7.2; F4 does not touch the vault.
- Adding new encounter taxonomies, categories, or filter mechanisms.
- Refactoring `unified-action-templates.ts` (still out of scope per THR-302 §7).

---

## 6. NFP compliance summary

| NFP | Verdict | Note |
|-----|---------|------|
| 1 — Tunability | PASS (N/A) | No tunables touched. |
| 2 — Inspectability | PASS | Comment makes the design intent legible at the call site. |
| 3 — Determinism | PASS (N/A) | Documentation-only. |
| 4 — Fail-soft | PASS (N/A) | No runtime change. |
| 5 — Narrative over mechanical perfection | PASS (N/A) | No narrative surfaces touched. |
| 6 — Additive over destructive | PASS | Honors NFP-#6 by leaving the working shape and only clarifying intent in the comment. |
| 7 — Performance budget | PASS (N/A) | Zero runtime impact. |

---

## 7. Important pickup notes

- This is a **documentation-only** ticket. If Codex finds itself editing `.ts` source files beyond the registry.ts comment block in §2.1, **stop and bounce to Cowork** — the spec has drifted.
- The replacement text in §2.1 / §2.2 / §2.3 is intended to be applied verbatim. If a literal verbatim apply isn't possible (e.g. the surrounding text has shifted on `main`), normalize the surrounding context manually and preserve the decision wording.
- After the spec doc is committed by `flush-plan-docs`, this file lives at `Docs/plans/2026-05-07-thr-F4-cms-metadata-filter-spec.md` on `origin/main`. The `plan-pending-commit` label triggers the commit; do not try to commit the spec doc yourself.
