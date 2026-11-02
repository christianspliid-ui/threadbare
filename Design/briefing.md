# Briefing
**Generated:** 2026-11-02 07:57 local (06:57 UTC) · keep-work-flowing-cc

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

- [Encounter Factory habits](https://linear.app/threadbare/issue/THR-2109) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-02-thr-2109-encounter-factory-habits.md)): the fix comes in three rounds. First, the drafting rules and every card line. Then the seven older camp-and-shrine encounters' result lines. Last, the town encounters. Veto line: "one round".
- Same plan: a god's card says what the god does, never how strong it is. Lines like "A small help." and "and it costs no essence" go, because the pips and the cost already show that. A line that is only mood once the tag is cut gets rewritten whole. Veto line: "just cut the tags".
- Same plan: cards speak as plain commands ("Close the gap between them"), not "You close the gap…", as the model encounter's cards already do. Each command is the god's own act on the world, never an order to the mortal. Veto line: "keep 'you' on the cards".
- Same plan: the "It argues for…" endings that show which way a card leans stay word for word. The Smugglers' Ford "honest way" card is left untouched until you pick its wording. Veto line: "drop the 'argues for' endings".
- Same plan: the five rules ("no strength talk", "no 'X held. Y did not.'", "name the mortal", "write each stake line fresh", "don't give away the secret in the summary") go into the factory's writing instructions, each pointing at the doctrine line it already breaks. The doctrine itself and the critic's checklist stay as they are, because changing the checks is [your conversation about the writing checks](https://linear.app/threadbare/issue/THR-2106). Veto line: "add them to the critic too".
- Same plan: the mortal in an encounter is always named. Titles like "the master" are kept for side characters only. Veto line: "titles for the mortal are fine".
- [Encounter story text, wave 2a](https://linear.app/threadbare/issue/THR-2108) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-02-thr-2108-encounter-story-text-wave-2.md)): the next batch of everyday encounters gets rewritten in plain game-master language in two rounds of ten-odd, not one big round of 23, so each build run finishes cleanly. Veto line: "one round".
- Same plan: an encounter only gets an "arrival" opening for the kinds of place it already appears in. No encounter starts showing up somewhere new. Veto line: "give every encounter all eight openings".
- Same plan: the short "what's at stake" lines are rewritten with the result lines, so the stake and the outcome say the same thing. Veto line: "keep the stake lines".
- Same plan: the older "success at a cost" and "critical" lines are rewritten too, because that is where the first round's leftover flowery wording sat. Veto line: "keep the older result lines".
- Same plan: "Assess Holdings" (counting your coin before you buy) becomes the model everyday encounter the writer and the checker copy, because the first round's fresh read found nothing wrong in it. Veto line: "a different model encounter".
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

Say "veto <title>" to reverse any of these. The text-positions decisions ([THR-2119](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit)) have passed their 12-hour veto window and stand. *— from the design lane ([21:27](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-01g.md), [00:27](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-01h.md), [03:40](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-02a.md), [06:37](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-02b.md))*

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Healthy (3 ready).** New: [THR-2132](https://linear.app/threadbare/issue/THR-2132/while-a-chapter-is-open-on-the-stage-its-place-where-it-is-happening) (the chapter's "where it is happening" tag draws on top of the rival-scheme toasts), filed by this morning's screen review and free for the next builder run. [THR-2108](https://linear.app/threadbare/issue/THR-2108) (story text for ten more everyday encounters) is held until 14:30 UTC, and the new [THR-2109](https://linear.app/threadbare/issue/THR-2109) (Encounter Factory habits, first round) until 17:30 UTC, while their decisions sit in the veto window. The builder's runs since 02:31 UTC have correctly stood down on those holds. Its two follow-on rounds ([THR-2129](https://linear.app/threadbare/issue/THR-2129/encounter-factory-habits-slice-b-the-seven-migrated-board-encounters), [THR-2130](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write)) wait on it. The four legibility plans ([THR-2122](https://linear.app/threadbare/issue/THR-2122)–[THR-2125](https://linear.app/threadbare/issue/THR-2125)) wait on the first one's veto window, which closes around 11:25 UTC.

Two items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) (a god's push onto a hex can pick the wrong nearest place) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (13 days). It is parked because unattended runs are refused the gate and CI edits it needs. Agents can un-park it in an attended run.

## Health

All green. Engine speed is normal (176 ms/tick, 11% above the 7-day median). One pull request is open and queued to merge: [#2700](https://github.com/christianspliid-ui/threadbare/pull/2700) (the screen review's journey tweaks). The live site serves the latest game build (fea5ff53; later commits were docs only). Checks on main and the scheduled background jobs pass. All ten enabled scheduled tasks are on time. The worktree reaper last ran at 06:40 UTC.
