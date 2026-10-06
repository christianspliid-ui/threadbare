---
lane: tb-design-lane
run: 2026-10-06c
promoted: THR-1644
filed: THR-1754, THR-1755, THR-1756
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-06 (run c, ~12:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Threading as character creation](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the): **every time you thread a mortal, a short rite now plays**, built from the same scenes as Meet The First (your best-rated moment in the last playtest).
  - The rite shrinks as your court grows: your First gets the whole meeting, your second and third get one test and the bond, and later threads get the bond alone.
  - **Whoever you thread first becomes The First**, even through the Agent Thread card before the meeting.
  - The meeting keeps its three invented souls. It does not pick real townsfolk.
  - **Your First carries your mark**: one blessing in their own Reach (*Iron Will*, *Golden Tongue*…) that makes them better at their own work.
  - Every rite can be waved through with *Bond without a hand*.
  - *The calls to veto:* **"every thread gets the full rite"**, **"the meeting is the only way to get a First"**, **"pick the First from real people"** or **"no mark"**.
  - [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1644-threading-ceremony.md). Building waits until ~14:40 Wednesday your time.

## Work

- **Claimed** [THR-1644](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the) (Todo → In Design), marker `design-lane claim 2026-10-06-1214`.
  - Why this ticket: the shelf held 4, so it was not thin, and no wayfinder map is open.
  - THR-1748 / THR-1750 / THR-1753 were skipped, because they build on this lane's THR-1747 / THR-1749 decisions, which are still inside their 24 h veto window.
  - THR-1644's own precondition was met: round 2 of the cold playtest has reported.
- **Plan doc** [2026-10-06-thr-1644-threading-ceremony.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1644-threading-ceremony.md), with its brainstorm companion and a `[DESIGN]` rulebook paragraph, went in via [PR #2256](https://github.com/christianspliid-ui/threadbare/pull/2256).
  - Intent judge: Revise (a blast-radius section for the GameState type, one fail-soft row, and five player-text rows), then Allow.
  - Forked audits: NFP and Vision PASS-with-notes, pillar PASS.
  - Docs gates: `lint:plan-doc` clean, `check:generated-freshness` OK, `check:impediment-ids` OK.
- **Decision record** posted on THR-1644 with D1–D6 and their veto words.
- **Filed:**
  - [THR-1754](https://linear.app/threadbare/issue/THR-1754/threading-rite-s2-the-rite-on-screen-every-thread-opens-a-short-rite): S2, the rite on screen.
  - [THR-1755](https://linear.app/threadbare/issue/THR-1755/threading-rite-s3-the-firsts-mark-one-god-given-blessing-in-their): S3, The First's mark.
  - Both are in Todo, blocked by THR-1644, and carry `Claimable from`.
  - [THR-1756](https://linear.app/threadbare/issue/THR-1756/ul-proposal-the-first-the-first-mortal-the-god-threads-any-route-add): the UL proposal for The First, the Rite of the Thread and the god's mark.
- **Handoff:** THR-1644 (as slice S1) moved to Ready for Dev, unassigned, with `Claimable from: 2026-10-07T12:40:00Z` in the description.

## Escalations

None.
