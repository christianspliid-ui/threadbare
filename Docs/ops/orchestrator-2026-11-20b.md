---
lane: tb-orchestrator
run: 2026-11-20b
promoted: 2
filed: 0
resolved: 2
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-11-20 (run b, ~10:30Z)

## Needs Christian
Nothing needs you. The engine work behind the race between your Mandate and the Doom has shipped. So the two pieces built on it are now in the build queue: [the screen says which clock lands first](https://linear.app/threadbare/issue/THR-2252/the-player-can-read-the-race-the-mandate-row-says-which-clock-lands) and [the census checks that the forecast is honest](https://linear.app/threadbare/issue/THR-2253/the-agency-census-checks-the-race-forecast-it-turns-at-most-three).

## T1 — unblock sweep
- **Promoted THR-2252** (race UI). Its blocker THR-2251 went Done 2026-11-20T10:01Z. Its claimable-from window opened 2026-11-19T22:00Z. The plan doc `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md` is LIVE on origin/main. There were no comments, so no retire verdict. Verified: Ready for Dev, assignee null. The coordination block is posted, with a mutex against THR-2256 (both edit the Doom panel, `DoomClockDetail.tsx`).
- **Promoted THR-2253** (race census). Its blockers THR-2248 (Done 2026-11-19T22:34Z) and THR-2251 (Done 2026-11-20T10:01Z) are both met. The plan doc is LIVE. There were no comments. Verified: Ready for Dev, assignee null. The coordination block is posted, with a mutex against THR-2255, which is In Dev (both edit `scripts/agency-census.ts`).
- **Declined THR-2254** (race names a place). Blocked by THR-2252, which is Ready for Dev and not Done.
- **Declined THR-2256** (Doom panel "where it feeds"). Blocked by THR-2255, which is In Dev.
- **Not promoted: THR-2262** (the Mandate is named before its row appears) **and THR-2263** (back-to-back chapters). These are new cold-playtest round 8 tickets. Both say the design lane decides them under delegation and then files the implementation tickets. That is the wrong destination for T1, so they are left for the design lane. THR-2174 is the same shape.
- The other Todo skip reasons are unchanged from run 2026-11-20a.
- Shelf after this run: 7 items in Ready for Dev (THR-2252, THR-2253, THR-2257, THR-2258, THR-2259, THR-2260, THR-2261), none of them Deferrals. THR-2249, THR-2250 and THR-2251 have gone Done since run a. THR-2255 is In Dev.

## T1.5 — wayfinder sweep
No open maps.

## T2 — design authoring
Not triggered. Ready for Dev held 5 non-Deferral items before this run and 7 after. The floor is 2.

## T3 — architecture health
Already ran today (run 2026-11-20a). Not repeated.

## Escalations
None.

Product vs. process this week: product only. Today's completions (THR-2249, THR-2250, THR-2251) are product, and this run promoted product work only. **Headline: the endgame build chain is moving. Three tickets merged since 08:20Z, and the next two are queued.**
