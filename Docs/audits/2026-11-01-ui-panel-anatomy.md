> **title:** Panel anatomy — one reading order every core panel follows — THR-2117
> **linear_issue:** THR-2117
> **author:** Claude Code (design lane, wayfinder grilling ticket on the THR-2114 legibility map, 2026-11-01, unattended — decided by delegation, process.md rule 4; veto in chat)
> **created:** 2026-11-01

# Panel anatomy — THR-2117

*One reading order for every core panel, with the Stage, dialogs, lists and the hover tier as stated variants. Decided against the census (THR-2115) and the reading-patterns rulebook (THR-2116). It extends the Inspector's existing page order and the art-led rules R1–R8; it decides no sizes, weights or colours — those belong to the type-hierarchy ticket (THR-2118), which is reserved for Christian.*

Inputs: [`2026-11-01-ui-legibility-census.md`](2026-11-01-ui-legibility-census.md) (measured), [`2026-11-01-ui-reading-patterns-research.md`](2026-11-01-ui-reading-patterns-research.md) (rules 1–18, cited below as "rule N"), `Docs/design-system/laws.md` (Laws 33, 37, 38, 57), the art-led rules R1–R8 in `Docs/plans/2026-10-31-art-led-ui-pass.md`.

## 1. The order — five slots

Every core panel reads top to bottom in these five slots. A panel may leave a slot empty; it never reorders them.

| Slot | What it holds | Answers |
|---|---|---|
| **1 · Who** | Kind label, then the name — the first text line of the panel. The subject's picture sits beside it (docked) or directly under it (wide, Full). | *What am I looking at?* |
| **2 · Now** | One line: the subject's most important current state. This is art-led R5's highlighted line, or R4's bond strip when the tie to the god is the news. At most one. | *What is going on with it?* (rule 1) |
| **3 · Act** | What the god can do to it: the Act row. | *What can I do?* |
| **4 · Detail** | Headed sections, most-used first (the tab row on the Inspector). | *Tell me more.* |
| **5 · Out** | Links to everything connected: Connections, "show on map", deeper pages. | *Where next?* (Law 20) |

**Why this order.** It is the order the five comparison games share (identity top-left, then the deciding state, then detail behind a toggle — research § Game practice), it is the inverted pyramid (rule 1), and it is already the Inspector's own order: `InspectorPage.tsx` renders `header → Act → body tabs → More → Connections` (its doc comment, line 4). The only slot the Inspector does not yet guarantee is **Now**: today the state sits in status chips under the name, in the "None of your cards works on…" box, or as R4's bond strip first in the *main* column at wide (`detailPageTemplates.ts` line 175), so it lands in a different place per page and size.

**What changes on the Inspector:**

- **Who comes first at every size.** At wide and Full, `SubjectHeader` draws the portrait first and the name centred under it (`flexDirection: column`, `textAlign: center`, lines 105 and 111); the census measured the god page's name at *y* 446–458 under a 240×320 portrait (finding 6). Decision: kind label and name move **above** the picture, left-aligned. The picture keeps its size and stays the largest object (R1 holds: the art still leads by size, and the name now leads by position). The where-line and status chips go under the picture, left-aligned.
- **Now is one slot, directly under Who** (docked) or under the picture (wide, Full) — above the Act row. R4's bond strip moves here from the top of the main column. Pages with no single deciding state leave it empty; they do not promote a chip to fill it.
- The "None of your cards works on…" box is the Act slot's empty state (R8), not a Now line.

## 2. Where the Stage, dialogs and lists differ

| Surface | Order | Why it differs |
|---|---|---|
| **Stage** (encounter, premonition, vision, beat, new power, undertaking moment) | Who (title, subject strip, step position — Law 37's chrome) → Now (the stakes line) → the canonical flow (Law 38: scene → test and forecast → hand → fate) → Act last (commit). | Law 38 fixes the flow and the player decides after reading. The anatomy binds only the header: the **title is the header's strongest text** (today it is the faintest, census finding 3) and the stakes line is the Now slot, not a whisper under the legend. |
| **Dialogs** (choice, Chapter Ledger, Read the Threads, receipts, court, settings) | Who (title, **once**) → Now (the question or the news, one line) → Detail (the options or rows) → Act at the end of the reading path. | A dialog is one decision; acting comes after reading (rule 6, on sparse screens only). The census found the choice dialog's title drawn twice (22 px heading, then a 20 px banner) — one Who, never two. |
| **Lists** (Threads, Chronicle, Notables, Find, toasts) | Panel: Who (the list's heading and its count, Law 36) → rows. Each row is the five slots in miniature on one line: picture → name (front-loaded, rule 3) → state word → nothing else. Act and Detail are one click away on the subject's page. | A row is a pointer, not a page (Law 20's click tier). The census found a Thread row's name truncated to "KAEL T…" while the Chronicle prose beside it is the larger mass — the row's name is its whole job and is never the part that truncates. |

## 3. Scan anchors

- **One left text edge per panel.** Every text block in a panel starts on the same x — the panel's padding edge (or, at wide and Full, each column's own edge). Pictures sit left of or above text; text never centres around them. Multi-line text is never centred (rule 15). This retires the centred wide header above.
- **Two heading ranks, no more.** A panel has its Who line and one rank of section headings. Every section in the Detail slot wears the same section-heading treatment; a sub-head inside a section is a row, not a third rank. The census found two or three section-heading treatments on every Inspector page and three on the Ledger rail (finding 5, finding 7). *Which* treatment the rank wears is THR-2118's.
- **Headings name their content** and sit closer to their own content than to the section above (rules 2 and 8). The census found the Threads title 33 px from its caption but sections 22 px apart — that inversion is a fail.
- **Frames:** at most container → card (rule 9). A section is grouped by space and its heading, not a box. The census found depth 4 on the person page and the Ledger rail.

## 4. What sits above the fold at 1920×1080

Without scrolling, at the floor:

| Surface | Must show |
|---|---|
| Inspector, docked | Who, Now, the whole Act row, and the Detail slot's tab row. |
| Inspector, wide / Full | The same in the aside column; the main column shows its first section heading and first rows. |
| Stage | Who (with step position), Now (stakes), the first lines of the scene, the first row of the hand, and the commit control. |
| Dialog | Who, Now, every option, and the commit. A dialog whose options do not fit takes the next size tier (Law 57) before anything folds. |
| List panel | The heading with its count and at least the first three rows whole. |

This is Law 33 and Law 57 read per slot: growth goes to Detail and Out; Who, Now and Act never move down when a panel grows (rule 1).

## 5. The hover tier in miniature

- **Tooltip:** concept name (Who) → one line, what it is (Now) → why it matters here (Detail, ≤200 characters, Law 18) → nested concept links (Out, Law 19). No Act slot: the tooltip never casts.
- **Hover card:** picture and name on one line, kind label above the name (the Inspector's own order) → one state line (Now) → "opens its page" (Out, Law 20). Today's hover card stacks kind, name and sub-kind as three lines of equal weight (census § Tooltips); the sub-kind joins the kind label and the second line becomes Now.

## 6. What this does not decide

- **Sizes, weights, colours, the heading style** — THR-2118 (reserved for Christian).
- **Where labels and values sit inside a facts block** — THR-2119.
- **The building blocks each slot is made of** — THR-2120, which this ticket blocks; it should define one block per slot (Who header, Now line, Act row, section, link group) and compose every panel from them.
- **Which panels get a plan doc, and in what order** — the map's "Not yet specified", after THR-2118–2120.
- No new container, no engine change, no new art.

## 7. Would change the call

- Christian preferring the art above the name at wide ("the portrait comes first") — the Who-first rule would then hold for docked and the hover tier only.
- A playtest finding that players look for the Act row before the state — Act and Now would swap.
- THR-2120 finding that a single Now slot cannot hold some page's deciding state without a second line.
