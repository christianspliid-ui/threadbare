---
lane: tb-design-lane
run: 2026-11-19a
promoted: 2
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-19 (run a, ~09:35Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A well-played age can be won](https://linear.app/threadbare/issue/THR-2245) — a god's spell cast on a place in one of the Mandate's spheres now fills the Mandate by what it cost, at the same rate as essence spent on a mortal's chapter. Measured, a god who plays everything then finishes the Mandate before Doom's last stage on 2 of 3 worlds; today it does on none. A god who only plays chapters comes close (82–96%) but never finishes, and a hands-off god never gets past 12%. The Mandate's targets stay as they are.
- Same ticket — when an age ends, the closing screen adds one line: where your hand raised the Mandate if you fulfilled it, or how near it stood ("within reach", "half-raised", "had barely begun") if Doom ended the age. Words, never numbers; it never grades you.
- Veto either in one chat line. The three build tickets cannot be picked up before 21:30Z today (2026-11-19).

## Work

- **Resumed** this lane's own claim from last night's run, which the machine's sleep cut off. Salvaged its first census data and brainstorm, repaired its worktree (corrupt index, a census script written as blank bytes), and logged it as impediment row 1259.
- **Measured** the agency census on main @ `210bdbec` across three worlds: hands-off, chapters-only, a naive full player and a careful full player, plus a fine-grained run for the fit. Branch: [proto/thr-2245-full-player-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2245-full-player-census), never merged. The shipped census never counted chapter spend toward the Mandate, which is why every arm read 0.06–0.15 before.
- **Plan doc merged:** [2026-11-19-thr-2245-a-well-played-age-can-be-won.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-19-thr-2245-a-well-played-age-can-be-won.md) ([PR #2862](https://github.com/christianspliid-ui/threadbare/pull/2862)). The intent judge said Revise on its first pass (player-facing text, the browser-verify lever); both were fixed and its second pass said Allow. The NFP, pillar and Vision audits all passed with notes, which are folded in. Liveness: LIVE.
- **Filed** three build tickets:
  - [The agency census plays the whole game](https://linear.app/threadbare/issue/THR-2248) — Ready for Dev.
  - [A place you tend fills the Mandate by what it cost](https://linear.app/threadbare/issue/THR-2249) — Todo, blocked by the census ticket.
  - [The Twilight says what the Mandate came to](https://linear.app/threadbare/issue/THR-2250) — Ready for Dev.
- The plan ticket is released to Todo, blocked by the three builds, with the decision record and the handoff on it.

## Escalations

None. One thing to watch: the fit's margin is thin on one world (Doom 0.799 against the 0.80 line). The build ticket re-measures it and steps the rate to 1.25, then 1.5, if the census disagrees.
