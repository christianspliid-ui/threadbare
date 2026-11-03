> **title:** Brainstorm companion — Legibility 2, Inspector pages (THR-2123)
> **linear_issue:** THR-2123
> **author:** Claude Code (design lane, unattended, 2026-11-03)
> **created:** 2026-11-03

# Brainstorm companion — Legibility 2 (THR-2123)

Companion to [`2026-11-03-thr-2123-legibility-inspector-pages.md`](2026-11-03-thr-2123-legibility-inspector-pages.md). It records the options weighed for the four calls the plan makes.

## 1. Which line takes the Now slot when a page has both a highlight and a bond

- **Highlight first, bond as fallback (taken).** R5 calls the highlight "the one thing that matters most". The bond on The First's page is permanent once made, so it stops being news. Her want changes and decides her next move.
- **Bond first.** This reads anatomy § 1's "when the tie to the god is the news" as "whenever there is a tie". It was rejected because the strip never changes on the most-viewed page, so the slot would show the same faces for the whole run.
- **Both, stacked.** Rejected: anatomy § 1 says "at most one", and THR-2120's would-change condition (a page that needs two lines) is not met, since the bond already has a home first in Overview.
- **A new registry field `slot: 'now'`.** This is more explicit, but it touches `src/types/detailPage.ts` and `src/data/`. That widens the PR into review-gate scope for a choice the existing fields already express. It is worth revisiting if a third producer appears.

## 2. Frames

- **The page drops its frame inside the host (taken).** The host aside already draws the surface, so the inner border is the extra level the census counted.
- **The host drops its frame.** Rejected: the host's gold left border is the Inspector's edge against the map at docked, and it carries the over-Stage variant too.
- **Keep both and count the host as chrome.** Rejected: that is the depth-4 reading the census measured.

## 3. Gold on the Act row and *In this land*

- **Plain section headings (taken).** Type hierarchy § 3.2 is one treatment, and Law 31 allows one gold per page.
- **Keep gold on Act because it is the god's verb.** Rejected: the cards themselves carry sphere tint and fate words, and the heading is a label over them.

## 4. Header order at wide

- **Kind and name above the picture, describing lines under it (taken).** This follows anatomy § 1 and text positions § 4.
- **Name overlaid on the portrait's bottom edge.** Rejected: it fights the First badge, which already sits there, and it puts text on art (Law 3 territory).

## Vision premises checked

- R1 "art leads": still true by size.
- Taste profile, "Prose-first UI, no numbers visible": no number is added.
