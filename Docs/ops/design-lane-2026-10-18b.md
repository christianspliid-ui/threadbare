---
lane: tb-design-lane
run: 2026-10-18b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-18 (run b, ~07:25Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Encounters that broker an oath](https://linear.app/threadbare/issue/THR-1944/encounters-that-broker-an-oath-faction-unification-and-the-warlords): **a mortal who wins The Faction Unification swears one of the factions in the room to the realm they serve.** Veto: "mortals should not be able to swear factions".
- Same spec: **a mortal who wins The Warlord's Tribute by demanding the oath swears the warlord's company too, but that oath is forced.** It starts disloyal and breaks first, like a siege oath, because the warlord's own scene says it was "given under pressure". Veto: "a demanded oath should start loyal".
- Same spec: **if the mortal's realm has itself sworn to a crown, the new oath goes to that crown.** One layer only means a sworn realm cannot hold oaths of its own. Veto: "a brokered oath should go to the mortal's own lord or not at all".
- Same spec: **winning the scene is the persuasion; there is no second hidden test.** The crown's hard rules still apply: one layer, factions that never swear, and the 20-day wait after a broken oath. Veto: "the faction should still weigh the offer".
- Same spec: **accepting the warlord's tribute swears nothing.** In that scene he honours the mortal and does not kneel to a realm. Veto: "accepting the tribute should bind his company too".

The builder holds this spec until 19 Oct 07:23 UTC, so you have a day to veto.

## Work

- **Claimed** [encounters that broker an oath](https://linear.app/threadbare/issue/THR-1944/encounters-that-broker-an-oath-faction-unification-and-the-warlords) with the `design-lane claim 2026-10-18b` marker. Why this ticket: no wayfinder map is open, the build shelf is full (22 ready), and the only plan-doc ticket left, [hiring a free company](https://linear.app/threadbare/issue/THR-1974/plan-doc-hiring-a-free-company-a-realm-buys-a-companys-oath-then-pays), is inside its veto day until 19 Oct 01:35 UTC. The direction for this one was agreed in [the crown decision](https://linear.app/threadbare/issue/THR-1917), and its blocker, [the crown build](https://github.com/christianspliid-ui/threadbare/pull/2448), is merged.
- **Wrote the spec on the ticket.** Its Done-when allows "a plan or a small spec on this ticket", and the work is one aftermath effect plus two content edits, so no plan-doc PR was opened. All three pillars are covered: the engine extracts the crown's announcement path and adds the effect, the content adds outcome tables and chronicle lines, and the UI adds the faction-sheet wording, a debug column and browser evidence. Every claim about the code was measured on main @ 502e3423 and cites file and line. While drafting, the spec gave the effect two fields both named `kind`; the oath's field was renamed to `oathKind` before handoff.
- **Handed off** to Ready for Dev, unassigned and verified. The description carries `Claimable from: 2026-10-19T07:23:00Z`, and the coordination block is the latest comment. It is mutex with the [hiring a free company](https://linear.app/threadbare/issue/THR-1974/plan-doc-hiring-a-free-company-a-realm-buys-a-companys-oath-then-pays) build, because both edit the crown module.
- **Vetoes:** the briefing carried no messages from you, so there was nothing to revert.

## Escalations

None.
