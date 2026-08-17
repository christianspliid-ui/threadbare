/**
 * `faction.*` tooltip prefix (THR-1149).
 *
 * Keyed by *definition* id rather than node id on purpose: `Tooltip` calls
 * `resolveTooltip(id)` with no context of its own, so a graph-keyed faction
 * tooltip would resolve to null on every plain `<Tooltip id="faction…">` — a
 * dead hover that looks wired. The definition table is static, so this prefix
 * resolves context-free like `archetype.*` and `sphere.*` do.
 */

import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';
import {
  ALL_FACTION_DEFINITIONS,
  getFactionDefinition,
} from '../../data/faction-definition-lookup';

const KNOWN_DEF_ID = 'adventuring_guild';

describe('resolveTooltip — faction.* (THR-1149)', () => {
  it('resolves a shipped definition to its own description', () => {
    const definition = getFactionDefinition(KNOWN_DEF_ID)!;
    const resolved = resolveTooltip(`faction.${KNOWN_DEF_ID}`);

    expect(resolved).not.toBeNull();
    expect(resolved!.desc).toContain(definition.description);
  });

  it('carries the motto when the definition has one', () => {
    const definition = getFactionDefinition(KNOWN_DEF_ID)!;
    expect(definition.motto, 'fixture must name a definition that has a motto').toBeTruthy();

    expect(resolveTooltip(`faction.${KNOWN_DEF_ID}`)!.desc).toContain(definition.motto!);
  });

  it('returns null for an unknown definition id — fail-soft, not a throw', () => {
    expect(resolveTooltip('faction.no_such_definition')).toBeNull();
    expect(resolveTooltip('faction.')).toBeNull();
  });

  it('never leaks a generated name slot into the label', () => {
    // Monster definitions template an adjective that worldgen fills per
    // instance ('The {adj} Beast Pack'). The concept a tooltip names is the
    // family, and a raw '{adj}' on a player-facing surface is its own defect.
    for (const [defId, definition] of ALL_FACTION_DEFINITIONS) {
      const resolved = resolveTooltip(`faction.${defId}`);

      expect(resolved, `${defId} should resolve`).not.toBeNull();
      expect(resolved!.label, `${defId} label should carry no slot`).not.toMatch(/[{}]/);
      expect(resolved!.label.length, `${defId} label should not be empty`).toBeGreaterThan(0);
      // The stripping must not mangle the definitions that were already plain.
      if (!definition.nameTemplate.includes('{')) {
        expect(resolved!.label).toBe(definition.nameTemplate);
      }
    }
  });
});
