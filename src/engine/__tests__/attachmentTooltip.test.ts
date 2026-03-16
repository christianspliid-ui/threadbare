import { describe, it, expect } from 'vitest';
import { resolveAttachmentTooltip } from '../attachmentTooltip';

describe('resolveAttachmentTooltip', () => {
  it('formats a basic possession tooltip', () => {
    const result = resolveAttachmentTooltip({
      name: "Ashenmane's Fang",
      subcategory: 'arms',
      tier: 2,
      mechanicalSummary: '+Iron in open terrain',
    });
    expect(result.label).toContain("Ashenmane's Fang");
    expect(result.label).toContain('[Storied]');
    expect(result.desc).toContain('+Iron in open terrain');
  });

  it('includes loss condition when present', () => {
    const result = resolveAttachmentTooltip({
      name: 'Iron Blade',
      subcategory: 'arms',
      tier: 1,
      mechanicalSummary: '+Iron',
      lossCondition: 'breakable',
    });
    expect(result.desc).toContain('Loss: breakable');
  });

  it('includes tick countdown when transient', () => {
    const result = resolveAttachmentTooltip({
      name: 'Bruised Ribs',
      subcategory: 'wound',
      tier: 1,
      mechanicalSummary: '-Iron (minor)',
      ticksRemaining: 8,
      totalTicks: 20,
    });
    expect(result.desc).toContain('8 / 20 ticks remaining');
  });

  it('includes trigger summary for the highest-probability trigger', () => {
    const result = resolveAttachmentTooltip({
      name: 'Cursed Blade',
      subcategory: 'arms',
      tier: 3,
      mechanicalSummary: '+Iron',
      onUseTriggers: [
        {
          triggerCondition: 'critical_failure',
          probability: 0.10,
          effect: { type: 'remove_possession' },
          narrativeTemplate: 'The blade shatters...',
        },
        {
          triggerCondition: 'success',
          probability: 0.25,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Power surges...',
        },
      ],
    });
    // Should pick the 25% trigger (highest probability)
    expect(result.desc).toContain('\u26A1 25% chance: Success');
  });

  it('handles missing optional fields gracefully', () => {
    const result = resolveAttachmentTooltip({
      name: 'Simple Ration',
      subcategory: 'provisions',
      tier: 1,
      mechanicalSummary: 'Sustenance',
    });
    expect(result.label).toContain('Simple Ration');
    expect(result.label).toContain('[Mundane]');
    expect(result.desc).toBe('Sustenance');
  });

  it('uses subcategory glyph in label', () => {
    const result = resolveAttachmentTooltip({
      name: 'Holy Shield',
      subcategory: 'blessing',
      tier: 2,
      mechanicalSummary: '+Star',
    });
    expect(result.label).toContain('\u2726'); // ✦ four-pointed star
  });
});
