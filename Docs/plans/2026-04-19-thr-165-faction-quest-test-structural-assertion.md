# THR-165 — Replace brittle count assertion with structural tier-prefix checks

**Status:** Ready for Dev
**Deferred from:** THR-160
**Priority:** Low
**Suggested model:** haiku
**Scope:** single-file test change, ~6 lines
**Pillars:** Engine N/A · Content N/A · UI N/A (pure test refactor — no runtime behavior change)

## Problem

`src/engine/__tests__/factionQuestAndReputation.test.ts` still contains a hardcoded count assertion at line 212:

```ts
it('returns all quests for lieutenant rank', () => {
  joinFaction(graph, 'agent_1', factionId, 0.65); // lieutenant
  const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);
  expect(candidates).toHaveLength(10); // all 10 templates
});
```

This is brittle: any new faction quest template added to `ag.quest.*`, `ag.senior.*`, or `ag.elite.*` will break this test for reasons unrelated to what it is actually asserting (that a lieutenant sees every tier). It violates the same structural-test principle THR-160 established for the peer tests in the same describe block.

## Fix

Replace the single `toHaveLength(10)` assertion with three structural assertions — one per tier prefix — mirroring the pattern already used at lines 186–193 (civilian → standard quests) and 201–204 (sergeant → standard + senior quests).

### Target state

```ts
it('returns all quests for lieutenant rank', () => {
  joinFaction(graph, 'agent_1', factionId, 0.65); // lieutenant
  const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);

  const standardQuests = candidates.filter(c => c.templateId.startsWith('ag.quest.'));
  const seniorQuests = candidates.filter(c => c.templateId.startsWith('ag.senior.'));
  const eliteQuests = candidates.filter(c => c.templateId.startsWith('ag.elite.'));

  expect(standardQuests.length).toBeGreaterThan(0);
  expect(seniorQuests.length).toBeGreaterThan(0);
  expect(eliteQuests.length).toBeGreaterThan(0);
});
```

### Why `toBeGreaterThan(0)` and not exact tier counts

The peer tests use exact tier counts (`toHaveLength(5)`, `toHaveLength(3)`, `toHaveLength(2)`) — that is acceptable here too, but the semantic point of this test is "lieutenant unlocks every tier," not "there are exactly 5 + 3 + 2 templates." Using `toBeGreaterThan(0)` expresses that intent and is fully forward-compatible with new template additions. If a stronger guarantee is wanted, use exact tier counts — either choice is an improvement over the current state. CC should pick whichever reads most naturally alongside the existing peer tests (both styles are already present in the file). Author leans toward `toBeGreaterThan(0)` for the lieutenant case and exact counts for the civilian/sergeant cases, to keep the "all-tiers" test semantically distinct from the "which-tiers" tests.

## Verification

- [ ] `npx vitest run src/engine/__tests__/factionQuestAndReputation.test.ts` — passes
- [ ] `npx tsc --noEmit` — type-check clean
- [ ] `npm test` — full suite still green

Pre-commit minimum from CLAUDE.md applies (tests + typecheck + build).

## Rejected alternatives

- **Leave as-is.** Rejected: the deferral exists specifically because this was flagged in Codex review for THR-160; leaving it contradicts the structural-test standard the peer tests now follow.
- **Delete the test entirely.** Rejected: the test covers a real behavior (lieutenant rank unlocks all three tiers) that the peer tests do not cover.
- **Use `expect(standardQuests).toHaveLength(5)` etc.** Acceptable alternative — CC can take either approach. See "Why `toBeGreaterThan(0)`" above.

## Files

- `src/engine/__tests__/factionQuestAndReputation.test.ts` — the `returns all quests for lieutenant rank` block, lines ~207–213.

No other files touched.

## NFP compliance

| NFP | Status |
|-----|--------|
| Tunability | N/A (test file) |
| Inspectability | PASS — test name and assertion structure clearly state intent |
| Determinism | PASS (no new randomness) |
| Fail-soft | N/A (test file) |
| Narrative over mechanical | N/A |
| Additive over destructive | PASS — replaces one brittle assertion with structural peers already present in the file |
| Performance budget | PASS (test cost unchanged) |
