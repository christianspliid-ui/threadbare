# THR-43 — `bind_thread_army` property filter via existing `requiredNodeProperties` gate

**Issue:** [THR-43](https://linear.app/threadbare/issue/THR-43/action-template-targetrequiredproperties-property-filtering)
**Project:** Content Architecture
**Priority:** Low · **Labels:** Deferral, Engine
**Size:** XS (single template edit + one test)
**Route:** Ready for Codex (pure mechanical pattern adoption)

---

## 1. Context

The original THR-43 description proposed adding `targetRequiredProperties: ['armyState']` support to `targetActions.ts`. Audit on 2026-04-23 shows the capability has already shipped under a slightly different, richer name — **`requiredNodeProperties`** (Record form, supports both presence checks via `undefined` values and exact-value checks).

- **Gate 3b** in `src/engine/targetActions.ts` (lines 153–165) already filters templates whose `requiredNodeProperties` do not all match the target's `properties`.
- Type declaration: `src/types/unifiedAction.ts:609` — `readonly requiredNodeProperties?: Readonly<Record<string, unknown>>`.
- Pattern is already in production use — 17 templates in `src/data/npc-action-templates.ts` (all gated on `npcRole`), plus 1 in `src/data/unified-action-templates.ts:1556` (gated on `sublocationTypeId`).
- Gate 3b has dedicated test coverage at `src/engine/__tests__/targetActions.test.ts:597–680`.

All that remains of THR-43 is the narrow consumer edit the original deferral flagged: make `bind_thread_army` opt into the gate so it no longer matches non-army `group` actors (guilds), and update its now-stale comment.

## 2. The exact change

### File: `src/data/unified-action-templates.ts`

Around lines 3802–3808, template id `bind_thread_army`. Current shape:

```ts
    targetCategories: ['actor'],
    // targetSubtypes: ['group'] would match armies (actorType: 'group') but also guilds.
    // Armies are distinguished by the presence of armyState property on the node.
    // For now, this template matches all 'group' subtype actors. The ThreadsPanel
    // classifies thread targets post-hoc so army vs guild distinction is preserved in the UI.
    // TODO(THR-43): add targetRequiredProperties: ['armyState'] when targetActions.ts supports property filtering.
    targetSubtypes: ['group'],
```

Replace with:

```ts
    targetCategories: ['actor'],
    // Narrow 'group' subtype to actors that are actually armies — they carry
    // an armyState property bag (guilds are also 'group' subtype but have no armyState).
    // See Gate 3b (requiredNodeProperties) in src/engine/targetActions.ts.
    targetSubtypes: ['group'],
    requiredNodeProperties: { armyState: undefined },
```

Two substantive changes:

1. **Add `requiredNodeProperties: { armyState: undefined }`.** Using `undefined` as the value triggers the presence check (`target.properties[key] != null`) in Gate 3b, not an exact-value match.
2. **Replace the 5-line TODO comment block** with a 3-line explanatory comment that references the gate. The TODO marker must be removed (`npm run check:process` lints for orphan `TODO(THR-` markers).

### File: `src/engine/__tests__/unifiedActionResolution.test.ts`

Immediately after the existing test at line 957 (`bind_thread_army targets actor category with group subtype`), add one sibling test:

```ts
    it('bind_thread_army requires armyState property (narrows group subtype to armies)', () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'bind_thread_army')!;
      expect(template.requiredNodeProperties).toBeDefined();
      expect(template.requiredNodeProperties).toHaveProperty('armyState');
      // Presence check (undefined value) rather than exact-value match.
      expect(template.requiredNodeProperties!.armyState).toBeUndefined();
    });
```

Sibling style deliberately mirrors the `bind_thread_faction targets actor category with faction subtype` / `bind_thread_army targets actor category with group subtype` assertions above it, per the existing file's convention.

No other test changes. The existing `bind_thread_army targets actor category with group subtype` test continues to pass — adding `requiredNodeProperties` is additive.

## 3. Three-pillar coverage

| Pillar | Status | Notes |
|---|---|---|
| **Engine** | N/A — already shipped | Gate 3b (`requiredNodeProperties` filter) exists in `src/engine/targetActions.ts:153–165`. No engine change required. |
| **Content** | In scope | Single template edit in `unified-action-templates.ts`. |
| **UI** | N/A | ThreadsPanel's post-hoc classification continues to work regardless. No player-visible change required — the fix prevents a mis-selection that rarely surfaced in play. If an author later wants to add a `bind_thread_guild` companion, that's a separate ticket. |

## 4. NFP compliance

| # | Priority | Status | Note |
|---|---|---|---|
| 1 | Tunability | PASS | No new constants introduced. |
| 2 | Inspectability | PASS | `targetActions.ts` already emits the `byNodeProperties` filter count; no new traces needed. |
| 3 | Determinism | PASS | Filter is a pure predicate — no PRNG. |
| 4 | Fail-soft | PASS | If `target.properties.armyState` is missing, the template is filtered out (correct behavior, no throw). Gate 3b already handles the missing-property path. |
| 5 | Narrative over mechanical | PASS | Fix aligns mechanics with narrative intent — "Bind Thread — Army" should target armies, not guilds. |
| 6 | Additive over destructive | PASS | Adds a field to one template; no existing fields removed. |
| 7 | Performance budget | PASS | Gate 3b runs in O(entries of requiredNodeProperties); adding one key to one template is a no-op for hot paths. |

## 5. Acceptance checklist (binary)

- [ ] `src/data/unified-action-templates.ts` edited: `bind_thread_army` template has `requiredNodeProperties: { armyState: undefined }` added.
- [ ] The 5-line TODO comment block above `targetSubtypes: ['group']` is replaced with the 3-line explanatory comment shown in §2.
- [ ] No remaining `TODO(THR-43)` marker anywhere in `src/` (verified via grep).
- [ ] New test added at `src/engine/__tests__/unifiedActionResolution.test.ts` immediately after the existing `bind_thread_army targets actor category with group subtype` test, matching the signature shown in §2.
- [ ] `npm test` — full suite green (baseline is green post-THR-160).
- [ ] `npx tsc --noEmit` — clean.
- [ ] `npx vite build` — succeeds.
- [ ] `npm run check:process` — no new violations.
- [ ] Commit message body contains `Fixes THR-43` so the merge-to-main auto-close fires.

## 6. Out of scope

- Adding `requiredNodeProperties` to other thread templates. `bind_thread_faction` already uses `targetSubtypes: ['faction']` which is sufficiently specific; `bind_thread_location` targets the `location` category; `bind_thread_artifact` targets `artifact`.
- Creating a `bind_thread_guild` companion template. If an ascendant needs to thread a guild specifically, that is a future feature, not part of this fix.
- Refactoring the ThreadsPanel's post-hoc classification. It is still needed for pre-existing threads created before this fix lands, and it remains a useful safety net.
- Touching any other `TODO(THR-XX)` markers in the file.
