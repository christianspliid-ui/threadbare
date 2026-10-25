# THR-1843 — the tilt census (tick 0)

Owed by [THR-1813](https://linear.app/threadbare/issue/THR-1813) and the slice-2 Done-when of `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md`: the new god's Touched-or-better place count at tick 0, with and without the account's tilt. Kill criterion: the tilt adds more than 5 Touched-or-better places for a kin god → `FUNDAMENT_BLEND_PER_RUN` is the lever.

## Setup

- `initializeGameStateFromIdentity(KIN, seed, undefined, 'medium', undefined, account)`, seeds 42 / 99 / 7.
- `KIN` = `DEV_ASCENDANT_IDENTITY` with `spherePoints: { life: 3, spirit: 2 }` — kin to `sampleAccount()`'s Life/Spirit echoes.
- Count: places from `getLocationNodes` whose `dominionOf(...).band` ranks at or above `touched`.
- Columns: no account; `sampleAccount()` with its fundament reset to even (echoes only, no tilt); `sampleAccount()` as shipped; the same with a fundament blended 1 run and 5 runs toward Life 0.6 / Spirit 0.4 (`blendFundaments(…, FUNDAMENT_BLEND_PER_RUN)` then `blendFundaments(…, even, FUNDAMENT_REVERT)` per run).

## Result

| Seed | No account | Echoes, even fundament | Sample account | 1-run tilt | 5-run tilt |
|---|---|---|---|---|---|
| 42 | 41 | 42 | 42 | 42 | 42 |
| 99 | 53 | 54 | 54 | 54 | 54 |
| 7 | 52 | 53 | 53 | 53 | 53 |

The one extra place in every account column is the still-warm monument's host, lifted Foreign → Held (`seedEchoes`). The tilt itself adds **0** places at 1 run and at 5 runs.

**Kill criterion: not tripped** (+1, all of it the monument; threshold > 5).

## Finding

The tilt does not reach the map at all. The sum of `life` scores over every place is identical across the four account columns (seed 42: 172; 99: 253; 7: 229 — each +2 over no account, the monument's lift). `tiltCosmology` changes the cosmology profile, but place sphere seeding does not read it, so Decided 8's "the cosmology profile is what actually shapes a world's spheres" does not hold for place scores. Filed: [The world tilt never reaches a place](https://linear.app/threadbare/issue/THR-2028).

## Command

The census ran as a throwaway vitest file (not committed), inside the worktree's `src/engine/__tests__/`:

```ts
const KIN = { ...DEV_ASCENDANT_IDENTITY, sphereAlignment: { primary: 'life', secondary: 'spirit' }, spherePoints: { life: 3, spirit: 2 } };
for (const seed of [42, 99, 7]) {
  // account: undefined | sampleAccount() (fundament as shipped, reset to 1/12 each, or blended N runs)
  const s = initializeGameStateFromIdentity(KIN, seed, undefined, 'medium', undefined, account).state;
  const god = s.graph.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant')!.id;
  const count = getLocationNodes(s.graph)
    .filter(p => DOMINION_BAND_RANK[dominionOf(s.graph, god, p.id).band] >= DOMINION_BAND_RANK.touched).length;
}
```

`npx vitest run <file>`; the full script is the census test kept with the THR-1843 PR description.

## After the fix (THR-2028, 2026-10-25)

Place seeding now reads the tilt: `placeTiltFactors` (the Decided-8 world factor scaled by `PLACE_TILT_GAIN` = 0.05), with seeded whole-point rounding. Same setup. The "1-run" and "5-run" columns use the blend described above. The census is committed as `src/engine/__tests__/worldTilt.test.ts`.

| Seed | Even fundament (echoes) | Sample account | 1-run tilt | 5-run tilt | Place `life` sum (even → 5-run) |
|---|---|---|---|---|---|
| 42 | 42 | 43 | 44 | 46 | 172 → 191 |
| 99 | 54 | 55 | 55 | 59 | 253 → 269 |
| 7 | 53 | 53 | 54 | 55 | 229 → 238 |

**Kill criterion: holds** (at most +5 after 5 runs, seed 99 at the limit). The world-strength multiplier (gain 1) added +14 to +63 places, which is why the gain is a separate place-only constant. `FUNDAMENT_BLEND_PER_RUN` is unchanged.
