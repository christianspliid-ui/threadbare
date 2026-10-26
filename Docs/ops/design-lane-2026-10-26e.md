---
lane: tb-design-lane
run: 2026-10-26e
promoted: 1
filed: 2
resolved: 0
newFindings: 1
needsChristian: false
---
# Design lane — 2026-10-26 (run e, ~17:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

[Salt: the good the smugglers carry does not exist](https://linear.app/threadbare/issue/THR-2069/plan-doc-salt-the-good-the-smugglers-carry-the-monopoly-scene-prices): four calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2069-salt.md#decisions). Each can be vetoed on its own until Tuesday 18:03 UTC.

- **Salt becomes a real good.** The smuggling scenes, the monopoly and the embargo already talk about salt, so the world gets salt rather than the scenes being rewritten to carry fish or ore. *Veto:* "the smugglers should carry something we already have".
- **Salt is a trade good, not food.** A town short of salt is not hungry; its line reads *"Salt is dear here."* It is worth a little less than ore and more than stone. *Veto:* "salt should count as food".
- **Salt comes from the steppe, the high plateau, the deserts and the shore.** Not the mountains: mountain towns already have stone and ore, and salt there would be everywhere. On three test worlds, 14 to 21 towns have salt, and it rides 14 to 19 of about 60 roads. *Veto:* "salt should be mined in the mountains too".
- **The ford smugglers' salt reaches the hamlet.** When the salt train gets over the ford, the hamlet that was short of salt gains some. That small stock counts toward the region's salt, so smugglers can dent a rival's monopoly. The tannery-yard smuggling scene gets no salt, because its salt is sold outside the town. *Veto:* "smuggled salt should not count toward a monopoly".

## Work

- **Claimed** a new plan-doc ticket, [Plan doc: salt](https://linear.app/threadbare/issue/THR-2069/plan-doc-salt-the-good-the-smugglers-carry-the-monopoly-scene-prices). It is the *missing salt good* row of [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954). The shelf was full (9 ready), no wayfinder map was open, and no veto was in the briefing. The mill-lease row was skipped because it rests on a lane decision less than a day old.
- **Measured** on `origin/main` @ `7502dd0f`:
  - There are 18 goods and no salt.
  - Every economy reader keys on the good's class, so one good is data only.
  - The monopoly, embargo, road cargo and purse pick a new good up for free.
  - No town stands on coast or desert on three medium worlds, so salt there alone would reach nobody.
- **Prototyped** on [proto/thr-2069-salt](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2069-salt), never merged. The resource tests pass. At the first quantities no road carried salt; the second try gives 5–7 surplus towns a world. No regional monopoly of *any* good formed in 30 days on these worlds. That is today's baseline, outside this plan.
- **Plan doc** [2026-10-26-thr-2069-salt.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2069-salt.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2069-salt-brainstorm.md), via [PR #2609](https://github.com/christianspliid-ui/threadbare/pull/2609).
  - Intent judge: Revise, then Allow. The fixes were dropping the tannery scene's salt (it would have inverted the scene), quoting the real embargo line, and an exact test Done-when.
  - NFP, pillar and Vision audits: PASS-with-notes, all notes answered.
- **Handed off** the plan to Ready for Dev, claimable from 2026-10-27T18:03Z.
- **Filed** the finding [A town short of stone "goes hungry"](https://linear.app/threadbare/issue/THR-2070/a-town-short-of-stone-goes-hungry-the-scarcity-chronicle-tells-every) (Todo, a bug). The scarcity chronicle tells every non-food good's shortage as famine, and capitalises the good mid-sentence. Salt would inherit both.

## Escalations

None.
