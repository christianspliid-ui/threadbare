---
lane: tb-design-lane
run: 2026-11-01g
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-01 (run g, ~20:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Type hierarchy — can a player tell title, heading, value and label apart at a glance?](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) ([decision](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-type-hierarchy.md), [side-by-side mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-type-hierarchy/cmp-inspector-1920.jpg)): the game keeps its six text sizes, but each panel uses only a few, so title, text and label are clearly different: one title size, 18 px for everything you read and press, and the small bold label style at 16. Veto line: "a different type ladder".
- Same ticket: Inspector body text grows from 14.4 to 18 px and chips from 12 to 16, back above the floor. Veto line: "keep the Inspector text small".
- Same ticket: every section heading looks the same: the small bold label, its carved icon, clear space above. The gold and brighter sub-heading styles leave Inspector sections. Carved Cinzel section headings were mocked and rejected, because they weigh as much as the name. Veto line: "headings in Cinzel".
- Same ticket: the one highlighted "what matters now" line on an Inspector page gets a smaller carved headline (22, down from 26), so it no longer reads as a second title. Veto line: "keep the highlight big".
- Same ticket: the god rail's essence numbers grow to 18 and line up in their column. Veto line: "keep the essence numbers small".
- Same ticket: the encounter's title becomes the strongest words in the Stage header, and the scene text moves to the normal story size instead of small italics. Veto line: "keep the Stage header as it is".
- Same ticket: interface paragraphs get their own line-length cap (about 70 letters), because the story text's cap lets the interface font run to 91 letters a line on the big screen. Veto line: "use the story cap for everything".

## Work

- **Claimed** [Type hierarchy](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) (claim `dl-20261101-2018`), with "human gate released via Discord 2026-11-01" recorded on the ticket. Period focus: [the UI legibility map](https://linear.app/threadbare/issue/THR-2114) takes priority. The shelf is thin (2 ready), but no focus plan-doc candidate exists: the map's plan docs graduate after [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built). So the frontier ticket Christian handed over was the unit.
- **Prototype:** a static [mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-type-hierarchy/mock.html) of the god rail and a person Inspector page, in four variants at 1920 and 2560, with real fonts and tokens. Measured: today's page uses 8 sizes (two below the floor); the chosen ladder uses title / headline / text / label / story. [Blur test](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-11-01-ui-type-hierarchy/blur.jpg): the name stays the strongest shape. The cause of today's small text is fixed sizes in one shared component, not the scale.
- **Decided and closed** the ticket (Done, verified) with the decision record; [PR #2692](https://github.com/christianspliid-ui/threadbare/pull/2692) carries the audit and captures, auto-merge queued. The map's Decisions so far are updated and its Reserved section is cleared.
- **Next on the map:** [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) is the last open ticket, unblocked. After it, the map closes with its plan-doc carve-up.

## Escalations

None.
