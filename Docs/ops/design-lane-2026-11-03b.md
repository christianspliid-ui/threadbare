---
lane: tb-design-lane
run: 2026-11-03b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-03 (run b, ~02:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

All from [Legibility 2 — Inspector pages read Who, Now, Act, Detail, Out](https://linear.app/threadbare/issue/THR-2123/plan-doc-legibility-2-inspector-pages-read-who-now-act-detail-out-at). Plan: [Legibility 2 — Inspector pages](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-03-thr-2123-legibility-inspector-pages.md). Nobody may start building it before 14:33Z on 3 Nov.

- When you widen the Inspector, the page now opens on the kind and name at the top left, with the portrait below them at the same size. Today the name sits centred under the portrait, halfway down the page. Veto line: "keep the portrait above the name".
- Right under the name sits the one line that matters most: a mortal's strongest want, or the god's Mandate. The Act row comes after it. On The First's page her want takes that spot; the strip with your face and hers stays first in her Overview, and takes the spot only when she has no known want. Veto line: "the bond comes first on her page".
- The Inspector loses the inner border it draws inside its own edge, so it reads as one surface with the highlighted line as its only box. Veto line: "keep the inner border".
- "Act on …" and "In this land" headings stop being gold. The highlighted line is the page's one gold. Veto line: "keep the gold headings".
- The page's parts sit a little further apart (24 px), the same distance as the sections below them. Veto line: "keep the page tighter".

## Work

- **Chose** [Legibility 2](https://linear.app/threadbare/issue/THR-2123/plan-doc-legibility-2-inspector-pages-read-who-now-act-detail-out-at). The ready shelf held 3, below the floor of 4. It is UI-legibility focus work. Its blocker, [Legibility 1](https://linear.app/threadbare/issue/THR-2122), merged in [#2721](https://github.com/christianspliid-ui/threadbare/pull/2721). The decisions it draws on date from 1 Nov, outside the 12-hour veto window. No vetoes were waiting and no lane claims were open.
- **Measured** on `main` @ `fffad27e`:
  - The wide header centres the portrait, then the name, at 40 px (`SubjectHeader.tsx:105`, `:111`, `:116`).
  - The highlighted line and the bond strip are ordinary Overview sections. Only two pages produce a highlight (person and god) and only one produces a bond strip.
  - The Inspector draws a framed panel inside its already-framed host. That is the extra level behind the census's depth 4.
- **Gates:**
  - Intent judge: Allow on the first run, with 2 gaps, both fixed (a too-broad grep in the Done-when, and no frame-depth measurement).
  - NFP, three-pillar and Vision audits: PASS-with-notes, each answered in the plan.
  - The docs gates are green. Plan-doc liveness: LIVE.
- **Merged** [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2722).
- **Handed off** [Legibility 2](https://linear.app/threadbare/issue/THR-2123/plan-doc-legibility-2-inspector-pages-read-who-now-act-detail-out-at) to Ready for Dev, unassigned, held until 14:33Z with `Claimable from` in its description. The shelf is now 4.

## Escalations

None.
