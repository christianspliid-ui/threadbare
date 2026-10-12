/**
 * Tooltip System Integration Tests
 *
 * Verifies that the tooltip system forms valid chains across content packages,
 * with no broken links or circular references.
 */

import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';
import { UI_TOOLTIPS } from '../../data/ui-content';
import { TOOLTIP_LINK_PATTERN } from '../../types/tooltip';

describe('tooltip system integration', () => {
  // THR-1814 rewrote `ui.doom_bar` to say what Doom does to the game, dropping its
  // `{{sphere.entropy}}` link; the chain is now asserted from the entry that links to it.
  it('full chain: doom.unmaking → ui.doom_bar resolves at both depths', () => {
    const unmaking = resolveTooltip('doom.unmaking');
    expect(unmaking).not.toBeNull();
    expect(unmaking!.desc).toContain('{{ui.doom_bar}}');

    // The linked concept also resolves
    const doom = resolveTooltip('ui.doom_bar');
    expect(doom).not.toBeNull();
    expect(doom!.label).toContain('Doom');
  });

  it('all UI tooltips with links form valid chains', () => {
    const chainResults: { source: string; target: string; resolved: boolean }[] = [];

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        const target = match[1];
        const resolved = resolveTooltip(target);
        chainResults.push({ source: key, target, resolved: !!resolved });
      }
    }

    const broken = chainResults.filter(r => !r.resolved);
    expect(broken, `Broken chains: ${JSON.stringify(broken)}`).toHaveLength(0);
  });

  it('no circular references in depth-1 links', () => {
    // Ensure no tooltip links back to itself
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        expect(match[1], `${key} has self-referencing link`).not.toBe(key);
      }
    }
  });

  it('doom.unmaking and doom.clock both resolve with links', () => {
    const unmaking = resolveTooltip('doom.unmaking');
    expect(unmaking).not.toBeNull();
    expect(unmaking!.desc).toContain('{{ui.doom_bar}}');

    const clock = resolveTooltip('doom.clock');
    expect(clock).not.toBeNull();
    expect(clock!.desc).toContain('{{ui.mandate_tracker}}');
  });

  it('all sphere.* IDs referenced in UI tooltips resolve', () => {
    const sphereRefs: string[] = [];
    for (const [_key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        if (match[1].startsWith('sphere.')) {
          sphereRefs.push(match[1]);
        }
      }
    }

    for (const ref of sphereRefs) {
      const resolved = resolveTooltip(ref);
      expect(resolved, `${ref} should resolve`).not.toBeNull();
    }
  });
});
