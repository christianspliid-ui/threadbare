# UL Interactive Dashboard — `?view=ul`

**Linear:** THR-289
**Project:** Continuous Improvement
**Brainstorm companion:** `Docs/plans/2026-05-08-ul-interactive-dashboard-brainstorm.md`
**Predecessor (shipped):** `Docs/plans/2026-04-28-ubiquitous-language-obsidian-mirror.md` (THR-288 / ARC-66)
**UL parent:** `Docs/plans/2026-04-24-codebase-health-first-wave.md` §5 (THR-271)

---

## 1. Goal

Add an in-app, browseable, searchable, drift-aware dashboard for the Ubiquitous Language at the URL `?view=ul`, joining the existing reference-surface family (`?view=cms`, `?view=codex`, `?view=styleguide`).

The dashboard is the **rich** human read surface for the UL. The lightweight Obsidian mirror (THR-288, shipped) covers casual lookup; this surface covers *cross-shard* browsing, drift visibility, content-adjacency filtering, and any future UL workflows that want to live in the running app rather than in a vault.

It is read-only. UL editing remains a PR against `Docs/ubiquitous-language/`.

## 2. Non-Goals

1. **No editing.** Saving from the dashboard is explicitly out of scope; the source of truth stays in `Docs/ubiquitous-language/`.
2. **No mobile layout.** Desktop-first at 1920×1080; ≥1440 wide is the supported floor. Mobile is a post-v1 ticket if it ever ships.
3. **No term-graph view in v1.** A force-directed See-Also graph is a stretch listed in the Idea ticket. Deferred to a follow-up issue; v1 delivers tabular/list browsing only.
4. **No live re-fetch from `Docs/ubiquitous-language/` at runtime.** The dashboard reads a build-generated JSON snapshot. UL edits ship via PR + rebuild.
5. **No auto-merging of `UL-proposal` Linear issues.** Drift badges link out to the relevant Linear issues; the human still decides.

## 3. Three-Pillar Coverage

| Pillar | Status | Note |
|---|---|---|
| Engine | N/A | View-only dashboard. No tick-loop, no `WorldGraph`, no PRNG, no orchestrator phase. The dashboard does not participate in the simulation. |
| Content | ✅ (small) | New build-time generator (`scripts/generate-ul-dashboard-data.ts`) that parses the seven shards into a typed JSON contract (`src/data/ul-dashboard.generated.json`). Optional `drift-scan-status.json` emit from `scripts/drift-scan/index.ts` for badge integration (Phase A2). |
| UI | ✅ | Entire surface. New route, new components in `src/components/UL/`, IA manifest entry. Owns layout, filter state, search, detail pane, drift badges. |

The generator script is treated as a Content concern because it owns the parsed-shard data shape consumed by content-adjacent surfaces. Wiring rationale recorded in §10.

## 4. User Stories (anchoring the design)

1. **Designer reading IA manifest at `?view=cms#ia-surfaces`** wants to jump to the UL definition of a term referenced in a surface note without leaving the running game.
2. **Cowork agent** wants to confirm an in-flight design uses canonical terminology — needs to see all `Status: canonical` terms for a shard at a glance and search across them.
3. **Human reading a Linear `UL-proposal` issue** wants the in-context drift-scan signal for the term — has it been used uncanonically? When was it last referenced in `src/`?
4. **Author writing prose content** wants to check whether a term is content-adjacent (i.e. authoring expects fluency), filter to only those, and confirm definitions.

These stories drive: shard tabs (story 2), cross-shard search (story 1), drift badges (story 3), content-adjacency filter (story 4).

## 5. Layout (1920×1080, viewport contract)

Three-zone shell, mirroring the `Codex` and `CMS` patterns:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TopBar — title "Ubiquitous Language", search box, filter chips, counts  │ 48px
├──────────┬───────────────────────────────────┬───────────────────────────┤
│ Sidebar  │ Term Table                        │ Detail Pane                │
│  240px   │ flex-1, overflow-y-auto           │ 480px, overflow-y-auto     │
│          │                                   │                            │
│  Shards  │  Term  | One-liner | Status       │  Term name (large)         │
│  + All   │  ────                             │  Aliases · Status badge    │
│  + filter│  ...rows...                       │  Source path               │
│  toggles │                                   │  Definition (markdown)     │
│          │                                   │  See-Also links            │
│          │                                   │  Drift badges (if any)     │
└──────────┴───────────────────────────────────┴───────────────────────────┘
```

- `h-screen flex flex-col overflow-hidden` on the root, per CLAUDE.md viewport contract.
- Detail pane scrolls internally; never grows the page.
- Empty-state for the detail pane shows a hint to pick a term.
- Empty-state for the term table (search returns nothing) shows the cleared filters and a "clear all" button.

## 6. Components (new files only)

| File | Role |
|---|---|
| `src/components/UL/UbiquitousLanguageDashboard.tsx` | Root view; owns selection, search, filter state. Mirrors `Codex.tsx` (~190 lines) in shape. |
| `src/components/UL/ULSidebar.tsx` | Shard tabs ("All", then 7 shards) + filter chips (content-adjacent only, has-drift, status). |
| `src/components/UL/ULTermTable.tsx` | Sortable table of terms in the active filter; columns: Term, One-liner, Status, Drift. |
| `src/components/UL/ULDetailPane.tsx` | Selected-term card: name, aliases, status, source path, full definition (rendered markdown), See-Also link list, drift badges. |
| `src/components/UL/ULSearchBox.tsx` | Top-bar search input; debounced via `ul-dashboard-constants.SEARCH_DEBOUNCE_MS`. |
| `src/components/UL/ULDriftBadge.tsx` | Single badge primitive; renders one S4 signal kind at a time. |
| `src/components/UL/ulDashboardData.ts` | Typed loader importing `ul-dashboard.generated.json`; exports indexed lookups (by term, by shard, by alias). |
| `src/data/ul-dashboard-constants.ts` | Tunable constants — see §8. |
| `src/data/ul-dashboard.generated.json` | Build artifact. **Generated, never hand-edited.** Committed so dev environments don't need to regenerate; `npm run` script regenerates on demand. |
| `scripts/generate-ul-dashboard-data.ts` | Build-time parser; reads the seven shards, emits the JSON. Mirrors `scripts/mirror-ul.ts` esbuild pattern. |

## 7. JSON Contract (`ul-dashboard.generated.json`)

Versioned for forward-compatibility:

```ts
interface ULDashboardData {
  schemaVersion: 1;
  generatedAt: string; // ISO date — for "last updated" footer
  shards: ULShard[];
  terms: ULTerm[];
  warnings: ULGenerationWarning[]; // build-step issues (malformed link, missing Status, etc.)
}

interface ULShard {
  id: 'cosmology' | 'agents' | 'encounters' | 'prose' | 'graph' | 'coordination' | 'process';
  filename: string;       // e.g. "Cosmology.md"
  title: string;          // "Cosmology"
  contentAdjacent: boolean;
  termCount: number;
  blurb: string;          // Pulled from the shard's leading paragraph; used in sidebar tooltips.
}

interface ULTerm {
  shardId: ULShard['id'];
  slug: string;           // anchor slug; matches the GitHub auto-anchor (`reach`, `sphere-alignment`, ...)
  name: string;           // "Reach"
  aliases: string[];      // ["Action Domain", "Domain", "ReachDomain"]
  status: 'canonical' | 'proposed' | 'deprecated' | 'unknown';
  oneLiner: string;       // Pulled from the shard index; falls back to the first sentence of the body if missing.
  body: string;           // Markdown body between heading and the next `---` or `### `.
  seeAlso: ULSeeAlsoLink[];
  sourcePath: string;     // "Docs/ubiquitous-language/Cosmology.md#reach"
  contentAdjacent: boolean; // inherited from shard for v1; could be per-term later if README evolves.
}

interface ULSeeAlsoLink {
  raw: string;            // "[[Domain Capability]]" or "[[Sphere|spheres]]"
  termName: string;       // "Domain Capability"
  resolvedSlug: string | null; // null if the See-Also points to a term we couldn't resolve; surfaces a warning.
}

interface ULGenerationWarning {
  kind: 'unresolved_see_also' | 'missing_status' | 'duplicate_slug' | 'malformed_aliases' | 'missing_one_liner';
  shardId: ULShard['id'];
  termSlug: string;
  detail: string;
}
```

The optional drift-scan side-channel:

```ts
// Loaded lazily; missing file is fine (no badges rendered).
interface DriftScanStatus {
  schemaVersion: 1;
  generatedAt: string;
  staleCanonical: { shardId: string; termSlug: string; lastSeenAgo: number /* days */ }[];
  usedUncanonical: { candidate: string; occurrences: number; suggestedShardId?: string }[];
  openProposals: { termSlug: string; linearId: string; state: string }[];
}
```

## 8. Constants (`src/data/ul-dashboard-constants.ts`)

Per NFP #1 — every magic number named and explained.

| Constant | Default | Purpose |
|---|---|---:|
| `SEARCH_DEBOUNCE_MS` | 150 | ms before keystrokes recompute the filtered table; balances feel vs. churn. |
| `MAX_RESULTS_PER_SHARD` | 200 | Hard cap on rows rendered per shard before "Show all" expander; prevents accidental DOM blow-up if the UL grows. |
| `DEFINITION_PREVIEW_CHAR_LIMIT` | 220 | Detail-pane definition truncation point before "Read full" expander; only used if body > limit. |
| `STALE_CANONICAL_BADGE_DAYS` | 30 | Mirrors `UL_DRIFT_STALE_DAYS` in `scripts/drift-scan/index.ts`. **Single source of truth — re-export from drift-scan constants, do not duplicate.** |
| `USED_UNCANONICAL_MIN_OCCURRENCES` | 4 | Mirrors `UL_UNCANONICAL_MIN_OCCURRENCES` in drift-scan. Same single-source-of-truth rule. |
| `DRIFT_STATUS_FRESHNESS_WARN_DAYS` | 14 | If the drift-scan-status.json is older than this, render a "stale data" notice in the footer. |
| `EMPTY_TABLE_HINT` | (string) | Empty-state copy when filters return nothing. |

## 9. Tracing

Per NFP #2 — emit traces for inspectability. Dashboard traces are **session-local** (`console.debug` gated by a `DEBUG_UL_DASHBOARD` env flag); they do not flow into the engine's `traceBuffer`. The dashboard is outside the simulation.

```ts
type ULDashboardTrace =
  | { kind: 'ul_dashboard_open'; ts: number; shardCount: number; termCount: number; }
  | { kind: 'ul_search'; ts: number; query: string; resultCount: number; durationMs: number; }
  | { kind: 'ul_term_select'; ts: number; shardId: string; termSlug: string; }
  | { kind: 'ul_drift_badge_click'; ts: number; termSlug: string; signal: 'stale_canonical' | 'used_uncanonical' | 'open_proposal'; }
  | { kind: 'ul_data_load_warning'; ts: number; warningCount: number; };
```

Build-step warnings (from `generate-ul-dashboard-data.ts`) are surfaced two ways: (1) printed to stderr on generation, (2) carried into the JSON's `warnings[]` array and rendered in the dashboard footer behind a "(N issues)" disclosure. This satisfies NFP #2 inspectability for the silent-data-loss failure mode.

## 10. Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Wire-up |
|---|---|
| **Route** | `src/App.tsx` — add `if (viewParam === 'ul') return <Suspense ...><UbiquitousLanguageDashboard /></Suspense>`. Lazy-loaded like `Codex` / `ContentBrowser`. |
| **IA manifest** | `src/data/ia-manifest.ts` — add a new entry: `surface: "ul.dashboard"`, `view: "ul"`, `mount: "always"`, `reads: [{ state_path: "(static UL JSON snapshot)", reader: "UbiquitousLanguageDashboard", visible_when: "view === 'ul'" }]`, `openUrl: "/?view=ul"`. |
| **`?view=cms#ia-surfaces` cross-link** | The dashboard's IA entry uses the standard `openUrl` field — no extra work needed. The CMS surface viewer renders the link automatically. |
| **`?view=cms` jumps to UL** | Out of scope for v1 — the IA manifest already has term-text matches via search. A "jump to UL" affordance from CMS detail panes is a follow-up if it surfaces in workflow. |
| **`StartPage` menu** | Add a "Ubiquitous Language" item next to the existing Codex / Style Guide / CMS items. |
| **CLAUDE.md** | Update the "Dev Quick-Start URLs" table with `?view=ul`. Update the "Documentation Strategy" sub-section to point developers to the dashboard alongside the Obsidian mirror. |
| **`README.md` of `Docs/ubiquitous-language/`** | One-line note that the in-app dashboard is at `?view=ul`. |
| **npm scripts** | Add `generate-ul-dashboard` and `generate-ul-dashboard:dry`, mirroring `mirror-ul` and `generate-vault`. Wire `prebuild` (or document explicit pre-CI run) so the JSON is always current at build time. **Decision logged below.** |
| **Drift-scan output emit** | Add an opt-in JSON write inside `scripts/drift-scan/index.ts` controlled by an env flag `DRIFT_SCAN_EMIT_DASHBOARD_STATUS=1`. The GitHub Action sets it. Local runs don't emit by default to keep the repo clean. The CI step uploads the artifact and a follow-up step commits it back to `main` (or, simpler, the dashboard fetches the artifact at build time — see §11 trade-off). |
| **Wiring checklist update** | Add an entry under "Reference surfaces" listing the new route + components. Mark IA manifest inclusion as Done-when criterion. |
| **Codex MCP / ContentBrowser CMS index** | No change. The dashboard is its own surface, not a CMS table. |

### Build-step generation — `prebuild` decision

The simplest path is: the CC pickup adds `"prebuild": "npm run generate-ul-dashboard"` so the JSON is regenerated before every `vite build`. This guarantees CI artifacts are always fresh. The cost is a few seconds of additional build time. We accept it.

The committed `ul-dashboard.generated.json` lets local `vite dev` work without running the generator. Stale dev data is acceptable (the warning system flags inconsistencies); a contributor who edits a UL shard runs `npm run generate-ul-dashboard` to refresh.

## 11. Drift Status — Trade-off Discussion

The drift scan runs weekly on the schedule in `.github/workflows/drift-scan.yml`. We need a way to ship its S4 output (used-uncanonical + canonical-unused) into the dashboard JSON.

Three options were considered:

| Option | How | Pro | Con |
|---|---|---|---|
| (A) Drift-scan job writes `drift-scan-status.json` and commits to `main` | New GH Action step pushes the file | Always present; simple read | Adds a bot commit per week; touches `main` writes-from-CI surface area |
| (B) Drift-scan job uploads as an artifact; dashboard build downloads it | New build step in `vercel.json` or `prebuild` | No bot commits; clean separation | Build step needs GH API access for artifact; complicates CI surface |
| (C) Dashboard reads it at runtime from a static URL | Browser fetch on view open | Always fresh | Network dependency; conflicts with offline-first pattern; requires CORS-safe host |

**Decision: (A).** The committed file is the simplest contract, mirrors how `drift-scan-baseline.json` is already cached/committed in the workflow path, and the bot commit is one weekly noise event we can live with. The dashboard reads the file from `src/data/drift-scan-status.json` (or wherever the commit lands); missing file degrades gracefully (no badges).

The actual auto-commit step is **deferred to a follow-up ticket** so v1 ships without the CI complexity. v1 commits an *empty* `drift-scan-status.json` so the contract is alive and the dashboard renders the "no drift signal yet" state correctly. The follow-up is filed at handoff time.

## 12. Fail-Soft Table (NFP #4)

| Failure case | Fallback behavior |
|---|---|
| `ul-dashboard.generated.json` missing at build | Build fails loud; the script's exit code propagates. Aborting build is the correct response — the dashboard is unusable without it. |
| `ul-dashboard.generated.json` missing at runtime (vite dev with stale tree) | Dashboard renders an empty state with "Run `npm run generate-ul-dashboard`" hint. Does not throw. |
| `drift-scan-status.json` missing or stale | Dashboard renders without drift badges; footer shows "drift signal unavailable" link to the GH Action page. Does not throw. |
| Term has no `Aliases:` line | `aliases: []`; no warning unless `Status: canonical` (canonical terms without aliases produce a `missing_aliases` warning into the JSON warnings array, but render fine). |
| Term has malformed `**Status:**` value | `status: 'unknown'`; warning into JSON warnings array. Dashboard surfaces an "unknown status" badge so the human can fix the source. |
| `[[See-Also]]` wikilink points at a non-existent term | Link renders as inert grey text + small ⚠ icon; warning into JSON warnings array. Hover tooltip explains "term not found in current shards". |
| Search regex throws (user pastes weird input) | Caught by the search component; results revert to unfiltered list; debug trace `ul_search` records the error. |
| Shard file missing entirely | Generator script aborts loud — that's a repo-level integrity issue, not a graceful-degradation case. |

## 13. Test Strategy

Per `testing-patterns` skill — the dashboard is a UI surface over a deterministic JSON parse. The split:

| Test | What it covers | Where |
|---|---|---|
| `scripts/__tests__/generate-ul-dashboard-data.test.ts` | Parse fixtures (synthetic shards in test/fixtures); assert JSON shape, alias parsing, See-Also resolution, warning emission | vitest |
| `src/components/UL/__tests__/UbiquitousLanguageDashboard.test.tsx` | Smoke test: renders without throw given a fixture JSON; tab switch triggers term-list change; term click shows detail pane | vitest + RTL |
| `src/components/UL/__tests__/ulSearch.test.ts` | Search ranking: name match > alias match > body match; case-insensitive; debounce wired | vitest |
| Snapshot test at 1920×1080 | One snapshot for default state, one with detail pane open, one with drift badges | follow-up if D2 snapshot infrastructure (THR-344-style) covers it; otherwise a single Playwright spec |
| `npm run check:ia-manifest` | Verifies the new IA entry validates | already exists; no new work |

The build-step parser test is the load-bearing one — it locks the JSON contract.

## 14. NFP Compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Constants table in `ul-dashboard-constants.ts` (§8); drift-mirror constants re-exported from drift-scan (single source of truth). |
| 2. Inspectability | PASS | Build-step warnings preserved into JSON `warnings[]` and rendered in footer; debug traces gated behind `DEBUG_UL_DASHBOARD`. |
| 3. Determinism | PASS | Build-step parser runs offline against committed markdown; sort order stable; no PRNG. |
| 4. Fail-soft | PASS | Fail-soft table §12 covers seven failure modes. Missing drift status is deliberately graceful; missing UL JSON deliberately fails loud. |
| 5. Narrative over mechanical | PASS with note | Utility surface; not narrative. The dashboard *itself* is mechanical, but it surfaces the canonical names that *enable* narrative coherence — so it serves NFP #5 indirectly. |
| 6. Additive over destructive | PASS | All-new files (route, components, constants, generator script). The only edits are: `src/App.tsx` (one-line route), `src/data/ia-manifest.ts` (one entry), `package.json` (two npm scripts + prebuild), `CLAUDE.md` (table updates), `Docs/ubiquitous-language/README.md` (one line). No deletions. |
| 7. Performance budget | PASS | ~73 terms, no virtualization needed; React renders linear table within budget. Search debounced. JSON size <100kb expected. |

## 15. Definition of Done

- [ ] `?view=ul` route loads the dashboard at <500ms first paint (local).
- [ ] Sidebar shows 8 entries: "All" + 7 shards. Each shard tab shows correct term count.
- [ ] Search filters across name + aliases + one-liner; debounced; case-insensitive.
- [ ] Term click opens detail pane with: name, aliases, status badge, source path link (opens GitHub), full markdown body, See-Also chips, drift badges if any.
- [ ] See-Also chips navigate to the linked term within the dashboard (no page reload).
- [ ] Footer shows: "Generated YYYY-MM-DD HH:MM", "(N) build warnings" disclosure, "Drift status: [fresh / stale / unavailable]".
- [ ] IA manifest entry validates via `npm run check:ia-manifest`.
- [ ] StartPage menu has the new "Ubiquitous Language" item.
- [ ] CLAUDE.md Dev Quick-Start URLs table updated with `?view=ul`.
- [ ] `npm run generate-ul-dashboard` and `:dry` work; output is deterministic across runs.
- [ ] `prebuild` is wired so `npm run build` always emits a current JSON.
- [ ] All tests pass: `npm test`, `npx tsc --noEmit`, `npx vite build`.
- [ ] At 1920×1080: nothing scrolls outside the layout shell. Detail pane scrolls internally per viewport contract.
- [ ] No regressions: `?view=cms`, `?view=codex`, `?view=styleguide`, `?view=game`, `?view=game&seeded` all still render.
- [ ] Empty states: empty search returns hint; missing drift JSON renders without error.
- [ ] Source paths in detail pane point at the correct GitHub anchor (`#reach`, `#sphere-alignment`, ...).
- [ ] Verification evidence in commit body: raw output of `npm test`, `npx tsc --noEmit`, `npx vite build`. CI link is acceptable instead.
- [ ] Linear issue closed by `Fixes THR-289` keyword in the merge commit; no manual `save_issue(state: Done)` from CC.

## 16. Deferrals (file as Linear `Deferral` follow-ups at closeout)

1. **Drift-scan auto-commit step.** v1 ships with a hand-curated empty `drift-scan-status.json`; the GH Action step that writes the live data is the follow-up. Title suggestion: "Drift scan emit `drift-scan-status.json` for UL dashboard".
2. **Term-graph view (force-directed See-Also visualization).** v1 stretch goal explicitly excluded. Title suggestion: "UL dashboard — term-graph view (See-Also force-directed)".
3. **CMS detail-pane "Jump to UL" affordance.** Surfaced in user story 1; not implemented in v1. Title suggestion: "CMS detail panes — link out to UL term where text matches".
4. **Per-term content-adjacency (vs. shard-level).** README currently flags content-adjacency at the shard level. If we want per-term granularity, the shards need a per-term flag and the parser needs to honor it. Title suggestion: "UL — per-term content-adjacent flag".
5. **Mobile layout.** Out of scope by §2. Title suggestion: "UL dashboard — responsive layout for narrow viewports".

Each gets a Linear issue under Continuous Improvement with `Deferral` label, parented to THR-289, and a tag of `// TODO(THR-XXX)` in the relevant code spot if we drop a placeholder for it.

## 17. Coordination block (for handoff comment)

```
Suggested model: sonnet
Parallel-safe with: any non-route, non-IA-manifest issue
Mutex with: any issue editing src/App.tsx routes or src/data/ia-manifest.ts
Codex review: no — UI scaffold; tests are the gate
```

Rationale for `model:sonnet` (not opus): the dashboard is a CRUD-shaped read surface modeled on `Codex.tsx` — pattern-following work, no novel systems. The build-step parser is mechanical regex/markdown parsing. Sonnet is the right tier; opus is reserved for novel-system or judgment-heavy lifts (e.g., the Encounter UI animation phases D1/D2 which carry `model:opus-4-6`).

## 18. Vision Audit

Walked the relevant Vision premises:

- **"Cowork designs and Claude Code executes" workflow** — this dashboard is a tool *for the workflow*, not a player surface. Doesn't update or contradict any Vision premise.
- **"Player-as-god framing"** — N/A. Dashboard is a developer/designer surface. Reachable from `?view=cms`/`?view=codex` family, not from the playable game flow. Not exposed in `?view=game`.
- **"UL wins on terminology"** — strengthens this premise. Dashboard makes UL more legible, increasing the cost of using non-canonical terms.
- **"Canonical doc strategy"** (THR-304 in flight) — neutral; the dashboard reads the canonical UL location and would consume any future Canon-page index automatically if we extend the JSON contract later.

No Vision edits required as part of this ticket.

---

**End of plan doc.** See companion brainstorm at `Docs/plans/2026-05-08-ul-interactive-dashboard-brainstorm.md`.
