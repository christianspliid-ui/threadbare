---
lane: tb-design-lane
run: 2026-11-01d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-01 (run d, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

All eight are from [Art-led pass, slice 7 — lists and notices](https://linear.app/threadbare/issue/THR-2103/art-led-pass-slice-7-lists-and-notices-chronicle-notables-rivals) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-thr-2103-art-led-lists.md)). The window closes about 00:00 UTC tonight.

- A row about a mortal, a place, a faction, an army or a relic shows its small picture (40px) beside the name: in the Chronicle, Notables, Threads, Read the Threads, toasts and Find. A mortal you have not come to know shows the silhouette. Veto line: "no pictures in the lists".
- A Chronicle entry shows one picture: the first name it links that has one. The other names stay links, and hovering them shows their face. Veto line: "a picture for every name in the Chronicle".
- Threads drops its initials circles. Each mortal shows their face, or the game's designed tile. Veto line: "keep the initials in Threads".
- A toast keeps its small "go there" mark on the right and adds the picture of whoever it is about on the left. Veto line: "no pictures on toasts".
- The hover card shows its subject's small picture beside the name. Veto line: "keep the hover card words only".
- Rivals, the doom, the Mandate and omens keep their marks. None is about a person or place, and each already opens on a shape. The rival and doom glyphs wait on [your shape pick](https://linear.app/threadbare/issue/THR-1908). Past omens now carry their omen's mark. Veto line: "leave the omen history plain".
- Headings get their carved shape only where one exists: Chronicle, Notables, Rival gods, World Omens, Threads and its sections, Read the Threads, and the Find groups. "Rulers", "Local", "Before you woke", "Powers", "Recent", "Sources", "Missed opportunities", "Dormant court", the reach groups, and the Mandate and doom sub-headings draw none. They join [your icon pick](https://linear.app/threadbare/issue/THR-2104). Veto line: "no shapes on list headings".
- The doom's detail page stops keeping its own copy of the doom marks and reads the one shared list. The marks look the same. Veto line: none needed; this is tidy-up.

## Work

- **Claimed** [Art-led pass, slice 7](https://linear.app/threadbare/issue/THR-2103/art-led-pass-slice-7-lists-and-notices-chronicle-notables-rivals) under `design-lane claim 2026-11-01d`. The shelf held 4 non-Deferral items, at the floor of 4, so not thin. No wayfinder map is open, and no lane claim was waiting to resume. This is the last undesigned slice of the approved programme, and its blocker, [slice 1](https://linear.app/threadbare/issue/THR-2097), is Done. The briefing held no veto.
- **Survey:** a read-only subagent measured all ten surfaces (file:line), and the lane spot-checked seven claims against the code. Six surfaces and the hover card list people and places, and every row already holds the id a picture needs. The other four (Rivals, the doom, the Mandate, omens) are about the world and already open on a mark.
- **Plan doc:** [2026-11-01-thr-2103-art-led-lists.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-thr-2103-art-led-lists.md) (321 lines, under the 400 limit), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-thr-2103-art-led-lists-brainstorm.md). Merged by [PR #2679](https://github.com/christianspliid-ui/threadbare/pull/2679). `npm run gate -- --final` PASS (docs-only, after regenerating the plans index).
- **Gates:** the intent judge first said **Revise**, on two gaps. Three player-text rows lacked real rendered strings. And the scroll kill criterion's fallback would have broken the ticket's Done-when; it now stops and asks you instead. Both are fixed, and the second pass said **Allow**. The NFP, three-pillar and Vision audits all passed with notes. The NFP performance note was measured and folded in.
- **Independence:** the eight decisions draw only on the approved programme doc and the UI Laws, not on slices 3–6's lane decisions, which are still inside their windows.
- **Handoff:** Ready for Dev, unassigned, `Claimable from: 2026-11-02T00:00:00Z` in the description. The handoff comment carries the coordination block (opus; owes the review gate; build after slices 4–6 merge, because all four edit the same debug and icon files).
- **Fixed in-run:** the first push used a branch name holding the issue id, which Linear could read as a closing link. It was renamed to an id-free branch before the PR opened, and the old remote branch was deleted.

- **Caught at handoff:** writing the PR link into the ticket description made Linear attach the merged PR to the ticket, which could have closed it. The link was swapped for the merge commit; the ticket stayed in Ready for Dev with no PR attached. Logged as impediment #1238 ([PR #2680](https://github.com/christianspliid-ui/threadbare/pull/2680), auto-merge armed).

## Escalations

None.
