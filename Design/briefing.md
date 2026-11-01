# Briefing
**Generated:** 2026-11-02 00:58 local (23:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every lane stopped at about 02:57 Thursday morning and came back together at 19:12 Friday evening: 40 hours with nothing built. The worktree reaper, which runs on its own Windows timer, stopped at the same time, so the computer was probably off or asleep. Turning on "open at login" for the Claude app closes these gaps. Only you can change that setting. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) reviewed every writing check against real lines, which is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." *— silence check*
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Modules and composition — the small set of blocks every panel is built from](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) ([decision](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-modules-and-composition.md)): every panel is built from the same seven pieces: who it is, the one "what matters now" line, what your god can do, headed sections, links out, and a quiet line when a slot is empty. Each piece is drawn one way everywhere, so a player learns it once. Veto line: "a different set of blocks".
- Same ticket: sections are grouped by space and their heading, never by a box. Only things you press as a whole (a card, a tile, a dialog option) and the one highlight line get a frame, and boxes never nest more than two deep. Veto line: "keep the section boxes".
- Same ticket: one even rhythm: a wide gap between sections, a small gap under a heading, and one fixed gap between a label and its answer. Veto line: "tighter spacing".
- Same ticket: a section heading looks the same in the Inspector, a dialog and the god rail. The rails are never more cramped than the docked Inspector. Veto line: "let the rails be denser".
- [UI legibility and usability map](https://linear.app/threadbare/issue/THR-2114) closed, and its work is split into four plans: the shared pieces first, then Inspector pages, then the encounter screen and dialogs, then the rails, lists and hover cards. Veto line: "split it differently".
- [Type hierarchy — can a player tell title, heading, value and label apart at a glance?](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) ([decision](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-type-hierarchy.md), [side-by-side mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-type-hierarchy/cmp-inspector-1920.jpg)): the game keeps its six text sizes, but each panel uses only a few, so title, text and label are clearly different: one title size, 18 px for everything you read and press, and the small bold label style at 16. Veto line: "a different type ladder".
- Same ticket: Inspector body text grows from 14.4 to 18 px and chips from 12 to 16, back above the floor. Veto line: "keep the Inspector text small".
- Same ticket: every section heading looks the same: the small bold label, its carved icon, clear space above. The gold and brighter sub-heading styles leave Inspector sections. Carved Cinzel section headings were mocked and rejected, because they weigh as much as the name. Veto line: "headings in Cinzel".
- Same ticket: the one highlighted "what matters now" line on an Inspector page gets a smaller carved headline (22, down from 26), so it no longer reads as a second title. Veto line: "keep the highlight big".
- Same ticket: the god rail's essence numbers grow to 18 and line up in their column. Veto line: "keep the essence numbers small".
- Same ticket: the encounter's title becomes the strongest words in the Stage header, and the scene text moves to the normal story size instead of small italics. Veto line: "keep the Stage header as it is".
- Same ticket: interface paragraphs get their own line-length cap (about 70 letters), because the story text's cap lets the interface font run to 91 letters a line on the big screen. Veto line: "use the story cap for everything".
- [Text positions — where labels, values, numbers and captions sit](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) ([decision](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-text-positions.md)): a label sits above the thing it names. In a list of short facts, the labels line up in one column right next to their answers, instead of label at the left edge and answer at the far right. Veto line: "labels on the left, like a character sheet".
- Same ticket: each panel has one left edge for its words and one right edge kept for small marks. Words are never centred, except the big single lines of the ceremonies and the start page. The choice dialog's title moves to the left edge. Veto line: "keep the centred titles".
- Same ticket: a count stays next to its heading ("Your cards 2"), not pushed to the far edge. Veto line: "counts on the right".
- Same ticket: the words about a small picture sit to its right; a big picture has its name above it; a label under a grid tile lines up with the tile's left edge. Veto line: "captions under pictures".
- Same ticket: a small tag about a row comes after the row's name, and a count badge sits right after its word. Tooltips open where they do today. Veto line: "tags before the name".
- [Panel anatomy — one reading order that every core panel follows](https://linear.app/threadbare/issue/THR-2117/panel-anatomy-one-reading-order-that-every-core-panel-follows) ([decision](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-panel-anatomy.md)): every panel reads in the same order. First who or what it is, then one line saying what is going on with it now, then what your god can do, then the detail, then the links out. Veto line: "a different panel order".
- Same ticket: on a wide page, a mortal's or god's name sits above their portrait, not under it. Veto line: "the portrait comes first".
- Same ticket: an encounter's title becomes the strongest words at the top of the Stage, with the stakes line right under it. Veto line: "keep the encounter header as it is".
- Same ticket: a dialog shows its title once, and the button you press comes last. Veto line: "keep the dialog titles".
- Same ticket: a panel has at most two levels of heading and at most two frames. Text lines up on one left edge. Veto line: "keep the centred headers".

Say "veto <title>" to reverse any of these. *— from the design lane ([15:24](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-01e.md), [18:25](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-01f.md), [21:27](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-01g.md), [00:27](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-01h.md))*

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Starved (1 ready).** The one ready ticket, [THR-2103](https://linear.app/threadbare/issue/THR-2103/art-led-pass-slice-7-lists-and-notices-chronicle-notables-rivals) (pictures in the lists and notices, [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-thr-2103-art-led-lists.md)), comes off hold at 00:00 UTC, minutes from now; the builder's last eight runs stood down for that reason, which is correct, and its 00:10 UTC run should take it. The UI legibility map is closed and split into four plans (above), which refills the shelf once they reach Ready for Dev.

Two items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) (a god's push onto a hex can pick the wrong nearest place) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (13 days). It is parked because unattended runs are refused the gate and CI edits it needs. No local worktree carries its id this hour. Agents can un-park it in an attended run.

## Health

All green. No pull requests are open. The live site is current: the only commit since the ceremonies slice (8d8e7538) is the modules decision doc, which needs no rebuild. Checks on main and the scheduled background jobs pass. All nine enabled scheduled tasks are on time, and the worktree reaper last ran at 23:40 UTC. Engine speed is normal (176 ms per tick, 11% over the weekly median, inside the 25% line).
