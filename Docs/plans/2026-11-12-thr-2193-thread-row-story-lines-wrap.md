> **title:** A thread row's story lines wrap instead of cutting — THR-2193
> **linear_issue:** THR-2193
> **author:** Claude Code (design lane, run dl-20261112T2019Z)
> **created:** 2026-11-12
> **three_pillars:** Engine N/A — presentation only, no state read or written that is not already read · Content N/A — the sentences already exist; this shows them whole · UI done

# A thread row's story lines wrap instead of cutting — THR-2193

The Threads rail is where the player reads what a threaded mortal is doing now; today it cuts that sentence to
"raising a p…" while the rail has empty room below.

## Why this is load-bearing

The weekly UX review of 2026-11-12 ([frame 11, *Mid-game notables*](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/11-mid-game-notables.jpg))
shows The First's row with both story lines cut to one line: the doing line reads **"raising a p… — all or
nothing"** and the result line reads **"Kael Thornweaver made the host…"**. About 150 px of rail sits empty
below the row at 1920×1080. The progress word survives (THR-1962 pinned it), but the phrase that says *what*
the work is shrinks first, so the one line that answers "what is my mortal doing?" answers only "how far".
The full sentences are only on hover. That breaks Law 57 (a panel shows its content whole while it has room)
and Law 55 (the thread row is where an ongoing story is read).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Threads rail thread row (`src/components/Game/ThreadsPanel.tsx`) | 🟢 ACTIVE | **extends** — one style constant replaces `truncate` on five prose lines |
| Doing line phrase + progress word (`strategicPresentation.ts` `activeProject`, THR-1962) | 🟢 ACTIVE | unchanged — same values, shown whole |
| Stakes / result rows (`src/components/Game/encounterStakesRows.ts`) | 🟢 ACTIVE | unchanged — same `text`, shown whole |
| Line-clamp pattern (`ChroniclePanel.tsx:266`, `OpeningDirectionLine.tsx:34`) | 🟢 ACTIVE | reused — no new primitive |

Measured on `origin/main` `0a999d5b`: the doing line's outer div (`ThreadsPanel.tsx:788`) and phrase span
(`:810`) carry `className="truncate"`, the word span (`:811`) is `flexShrink: 0, whiteSpace: 'nowrap'`; the
stakes line carries `truncate` at `:860` and `:875`; the comments at `:792` and `:824` cite "One coalesced line
(Law 49)" / "Same one-line shape as the doing-line above (Law 49)".

## The decision

**Decided by delegation — design lane, 2026-11-12 (process.md rule 4). Veto in chat.**

The row's story lines **wrap**, up to `THREAD_STORY_LINE_MAX_LINES` (3) lines each, and clamp with an ellipsis
only past that. The whole sentence stays on hover as today. No authored short forms.

- **Why wrap:** Law 57 is the ratified answer to exactly this question: *"While a panel still has room to
  grow, it shows its content whole … It grows first."* The rail's limit is its frame geometry (Law 57's own
  sub-clause, THR-1828/1829), and the rail already scrolls inside itself when it is full (Law 33), so a
  taller row never pushes anything off the page. The row's **name** already wraps for the same reason
  (`ROW_NAME_STYLE`, THR-2125 R2.3 / THR-2165); the lines under it now follow the name.
- **Why not authored short forms:** the doing phrase and the result line are generated per work and per
  encounter (`strategicPresentation.ts` `activeProject.phrase`; `encounterStakesRows.ts` from the action's
  stakes line and `record.stakesLine`). A short form for each would be a new content table to keep in step
  with every new work verb and every new encounter, and it would still drop words the player wants. Rejected.
- **Law 49 is not the reason for one line.** The code comments cite *"One coalesced line (Law 49)"*. Law 49
  is about notification bursts ("one affordance with a count … never N stacked popups"); it says nothing about
  how many text lines a row may use. The comments are corrected to cite Law 57.
- **Why 3, not 2:** the right rail is `--rail-right-w: 280px` at 1920 (`src/index.css:383`, measured). After
  the row's indent and padding that leaves an *estimated* ~230 px of text, roughly 36–40 characters per line
  at `--text-xs`. A result line names a mortal and an outcome, so an *estimated* 70–110 characters. Two lines
  would likely still cut the longer ones. Three should hold them, and the cap still stops a freak sentence
  from eating the rail. The Done-when's browser check measures the real fit; if it clips the frame-11 lines
  at 3, the executor raises the constant and says so in the closeout.

**Would change the call:** Christian saying rail rows must stay one line high (then the answer is short
forms, a content ticket), or a capture showing four or more threaded mortals where the taller rows push the
Chronicle out of view at 1920×1080 (then the cap drops to 2).

## Engine pillar

Engine: N/A — no engine module changes. The lines read the same `strategicSummary.activeProject`,
`appointmentBadge` and `encounterStakesLine` values they read today.

## Content pillar

Content: N/A — no new words. The sentences already exist and are already shown whole in the tooltip; this
change shows them whole in the row.

## UI pillar

Browser-verify tool: **Playwright DOM** (the rail is DOM, no WebGL involved).

### Player-facing display

One shared style replaces `truncate` on the thread row's prose lines in `src/components/Game/ThreadsPanel.tsx`:

| Line | Where (today) | Change |
|---|---|---|
| Doing line (`thread-doing-line`) | `:784-820` | Outer div drops `truncate`; aligns its children to the top. The phrase span wraps and clamps at `THREAD_STORY_LINE_MAX_LINES`. The progress word stays a `flexShrink: 0`, `nowrap` sibling (THR-1962's "the word never cuts" is kept), aligned to the phrase's last line. The no-active-work fallback span (`:816`, `strategicBadgeText`, e.g. "holds the Old Mill and more") gets the same clamp. |
| Appointment line (`thread-appointment-line`) | `:822-846` | Same: drops `truncate`, text span wraps and clamps. |
| Stakes / result line (`thread-stakes-line`) | `:851-878` | Same: outer and inner `truncate` removed, text wraps and clamps. |
| Location claim-status line (`location-claim-status`) | `:716-735` | Same style, for consistency: it is the same kind of status sentence. |
| Sustained-control status line (`sustained-status-line`) | `:960-985` | Same style. |

Not changed: row 2's `secondaryInfo` (counts and places, short by construction) and the row name (already
wraps). The `minHeight: 24` hit area (Law 46) stays; a wrapped line is simply taller.

The clamp is one exported style constant beside `ROW_NAME_STYLE`, e.g.:

```ts
/** THR-2193 — a row's story line shows whole up to this many lines (Law 57); past it, it clamps. */
export const THREAD_STORY_LINE_MAX_LINES = 3;
const STORY_LINE_CLAMP: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: THREAD_STORY_LINE_MAX_LINES,
  overflow: 'hidden',
  overflowWrap: 'break-word',
  minWidth: 0,
};
```

The same `WebkitLineClamp` pattern is already used in `ChroniclePanel.tsx:266` and
`OpeningDirectionLine.tsx:34`, so this is no new primitive (Law 29).

### Player-facing text

No new or changed words. What changes is how much of the existing text is visible.

| Surface | Exact text the player reads (rendered sample, frame 11) | Complaint class touched | How the player understands it |
|---|---|---|---|
| Threads rail, The First's doing line | before: "raising a p… — all or nothing"; after: the whole phrase, e.g. "raising a palisade at Wraithwood — all or nothing", wrapping onto a second line | PC-7 (no direction: "what is my mortal doing?") | The line names the work and its progress word together, with no hover needed. |
| Threads rail, The First's result line | before: "Kael Thornweaver made the host…"; after: the whole result sentence over up to three lines | none new | The latest chapter's outcome reads in place, as Law 55 promises. |

The palisade phrase above is illustrative of the shape; the executor's evidence capture records the actual
rendered phrase.

### Playtest signal

A tester in the mid-game who is asked "what is your First doing right now?" answers with the work's name
from the Threads rail, without hovering.

### Event notifications

None.

### Debug inspection

No new `__DEBUG` accessor. The Done-when's DOM check reads the existing `data-testid`s.

### Visual presence (HexMapV2)

None.

### UI Laws engaged

Law 57 (grow before truncating: the reason for the change), Law 55 (story continuity on the thread row),
Law 33 (one viewport: the rail scrolls inside itself, never the page), Law 46 (24 px hit area kept), Law 29
(no new primitive: the clamp pattern exists), Law 49 (its misattribution in the comments is corrected),
Laws 1, 13/14, 17, 21, 37 (unchanged: no new subject, number, colour or chrome).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new module, so no new wiring row is owed.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `ThreadsPanel.tsx` story-line style | N/A (render only) | `ThreadsPanel` thread row | none new | none | existing `data-testid`s |

No cross-system read or write changes, so `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`
are untouched. The Design Reference Wiki page whose `sources` list `ThreadsPanel.tsx` gets a one-line note
that the story lines wrap to three lines (Law 57), or a `Wiki-freshness-exempt:` line if the page does not
describe line shape.

## Interface impact

| Contract | Change |
|---|---|
| Strategic summary → thread row doing line | **preserve** — same fields read |
| Encounter stakes rows → thread row stakes line | **preserve** — same `text` read |
| Appointment readout / sustained-control status → thread row | **preserve** — same values read |

No cross-system read or write is added or retired; the change is CSS on lines that already render these values.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `THREAD_STORY_LINE_MAX_LINES` | `3` | How many lines a thread row's doing, appointment, stakes/result and status line may wrap to before it clamps with an ellipsis |

## Tracing

N/A — presentation only; no decision is made that a trace could explain.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A sentence longer than three lines | Clamps with an ellipsis at line 3; the whole sentence stays in the tooltip, as today. |
| Many threaded mortals make the rail taller than its frame | The rail's own internal scroll takes it (Law 33); the page never scrolls. |
| A browser without `-webkit-line-clamp` | The text wraps unclamped (`overflow: hidden` on a box with no height cap shows it all). Every supported browser has it. |

## Files touched

- `src/components/Game/ThreadsPanel.tsx`: the style constant and the five lines above; comment citations
  Law 49 → Law 57.
- `src/components/Game/__tests__/ThreadsPanelDoingLine.test.tsx`: extend (see Done-when).
- The matching Design Reference Wiki page, or a freshness-exempt line.

## Done when

- [ ] **Unit:** in `ThreadsPanelDoingLine.test.tsx`, for a mortal with an active work, the doing line's phrase
   element carries `WebkitLineClamp` equal to `THREAD_STORY_LINE_MAX_LINES`, no element in the doing, stakes
   or appointment line carries the `truncate` class, and the progress word still has `flexShrink: 0`; the
   same clamp holds for a mortal with no active work (the `strategicBadgeText` fallback), and for the
   location claim-status and sustained-control status lines.
- [ ] **Browser, 1920×1080, Playwright DOM**, on `?view=game&seeded&size=medium` with ticks run through
   `window.__DEBUG.tick(n)` until The First has an active work (the warm route the UX review uses is also
   fine): for The First's row, the doing line's phrase element and the stakes line's text element each have
   `scrollHeight <= clientHeight + 1` (nothing clipped), and `document.documentElement.scrollHeight <=
   window.innerHeight` (no page scroll). One 1920×1080 screenshot of the rail.
- [ ] The *Mid-game notables* or *Mid-game table* frame on the next weekly UX review shows The First's doing
   phrase and latest result line readable without hovering (the ticket's own Done-when, observed by that lane).

- [ ] **Gates:** `npm run gate` (code track: `npm test`, `npm run check:typecheck`, `npx vite build`, freshness
   gates) green, `npm run gate -- --final` last before push; the commit and PR bodies carry the line-anchored
   closer for this ticket (CLAUDE.md § Definition of Done).

The diff is under 400 non-test UI lines and touches no `src/engine/` or `src/types/` file, so the evidence owed
is the one screenshot plus the checks above (THR-1949), and the review gate is not required.

## Kill criteria

- The 1920×1080 check shows the taller rows pushing the Chronicle out of view with the usual mid-game thread
  count → drop `THREAD_STORY_LINE_MAX_LINES` to 2.
- The frame-11 lines still clip at 3 → raise the constant; say so in the closeout.
- Christian says rail rows stay one line → revert, and file a content ticket for authored short forms.

## Coordination block

**Suggested model:** sonnet. One style constant on five lines in one component, plus a test; fully specified.

**Parallel-safe with:** THR-2196 (First chapter content), THR-2199 (Mandate), THR-2200 (path steering): no
shared files.

**Mutex with:** any ticket editing `src/components/Game/ThreadsPanel.tsx`. Check THR-2197 (popup arrival hold)
and THR-2198 (four small faults: "a pink ring on the map", sheet wording) before claiming; neither is expected
to touch the thread row, but the executor confirms with a grep of their plan or diff.

**Files to touch:**
- Edit: `src/components/Game/ThreadsPanel.tsx`
- Edit: `src/components/Game/__tests__/ThreadsPanelDoingLine.test.tsx`
- Edit: the Design Reference Wiki page whose `sources` list `ThreadsPanel.tsx` (or a freshness-exempt line)

## Notes for the executor

- No `src/engine/` or `src/types/` file is touched: no review gate, no CLI smoke owed.
- Keep the tooltip `desc` as the whole sentence, unchanged.
- The doing line's progress word must not wrap mid-phrase ("all or / nothing"): keep `whiteSpace: 'nowrap'`.
- Line numbers are from `origin/main` `0a999d5b`.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The god reads mortals' lives from the table; showing
      the sentence whole serves that.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-12-thr-2193-thread-row-story-lines-wrap-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | One named constant, `THREAD_STORY_LINE_MAX_LINES`. |
| 2. Inspectability | PASS | No decision logic; the lines keep their `data-testid`s. |
| 3. Determinism | N/A | Presentation-only CSS; no random code or state. |
| 4. Fail-soft | PASS | See the fail-soft table; the tooltip still carries the whole sentence. |
| 5. Narrative over mechanical perfection | PASS | The story sentence is what becomes visible. |
| 6. Additive over destructive | PASS | Replaces a class with a style on five lines; no shape change. |
| 7. Performance budget | PASS | CSS only. |

## Intent-judge verdict

Pass 1 (cold): **Allow**. Reversible; 1 GAP (dimension 3: the doing line's no-active-work fallback span at
`:816` was not named, and the unit Done-when covered only the active-work case), 0 VIOLATIONs. Folded in: the
display table names the fallback span, and the unit Done-when covers it plus the claim-status and
sustained-status lines. The judge verified every cited line range, Law 49/57 text, the rail width and the
clamp precedents against source.

## Forked-audit verdicts

- **NFP:** PASS-with-notes. Row 3 should read N/A (presentation only), now fixed; row 6 notes that `truncate`
  is removed from five existing lines, a behaviour change with no data-shape change (accepted).
- **Three-pillar:** PASS-with-notes. Engine and Content N/A rationales hold; UI present and substantive. The
  auditor read a draft before `## Coordination block` was added and asked for the standard gate lines in
  Done-when; both now present.
- **Vision:** PASS. No contradictions; strengthens the portfolio-scan step of the core loop; respects the taste
  profile (no new words, no new chrome, no short-form content table).
