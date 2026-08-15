/**
 * THR-1122 — the `attachment.*` registry prefix.
 *
 * Every sweep here walks the **shipped corpus** rather than a fixture list. A
 * hand-copied id list would pass forever while a template added next week went
 * unexplained — the vacuous-probe shape this repo has been bitten by often
 * enough to name (`conceptTooltipIds.test.ts` makes the same choice, for the
 * same reason). The first test guards the corpus itself, so an index that
 * silently emptied cannot green everything under it.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resolveTooltip, tooltipResolves } from '../tooltipResolver';
import {
  ATTACHMENT_TEMPLATE_SOURCES,
  ATTACHMENT_TOOLTIP_MAX_DESC,
  getAttachmentTemplateNode,
  resolveAttachmentTemplateTooltip,
  resetAttachmentTooltipWarnings,
  plainRegisterBody,
} from '../attachmentTemplateIndex';
import { attachmentDetailFromNode } from '../attachmentTemplateDetail';

/** The shipped templates that are genuinely attachments — the explainable set. */
function explainableTemplates() {
  return ATTACHMENT_TEMPLATE_SOURCES.filter(node => attachmentDetailFromNode(node) !== undefined);
}

describe('attachment tooltip registry (THR-1122)', () => {
  beforeEach(() => {
    resetAttachmentTooltipWarnings();
  });

  it('the corpus is non-empty — otherwise every sweep below is vacuous', () => {
    expect(ATTACHMENT_TEMPLATE_SOURCES.length).toBeGreaterThan(20);
    expect(explainableTemplates().length).toBeGreaterThan(20);
  });

  it('LAW 17: every shipped attachment template resolves through resolveTooltip', () => {
    const dangling = explainableTemplates()
      .filter(node => !tooltipResolves(`attachment.${node.id}`))
      .map(node => `${node.id} (${node.name})`);

    expect(
      dangling,
      dangling.length > 0
        ? `Attachment templates the registry cannot explain:\n${dangling.join('\n')}`
        : '',
    ).toEqual([]);
  });

  it('resolves with NO context — the same call Tooltip itself makes', () => {
    // The load-bearing property. `agent.*` needs a graph, so it is unreachable
    // from the `Tooltip` component (which calls `resolveTooltip(id)` bare) and
    // is excluded from the Law 17 corpus sweep by hand. This prefix must never
    // acquire that shape: the assertion is that no context argument is passed.
    expect(resolveTooltip('attachment.trait.condition.wounded')).toEqual({
      label: expect.stringContaining('Wounded'),
      desc: expect.stringContaining('injuries'),
    });
  });

  it('LAW 18: no description exceeds the 200-char ceiling', () => {
    const tooLong = explainableTemplates()
      .map(node => ({ id: node.id, desc: resolveTooltip(`attachment.${node.id}`)?.desc ?? '' }))
      .filter(({ desc }) => desc.length > 200)
      .map(({ id, desc }) => `${id}: ${desc.length} chars`);

    expect(tooLong, tooLong.join('\n')).toEqual([]);
  });

  it('LAW 13: no description carries a numeral', () => {
    // The reason `mechanicalSummary` is unreachable from this arm. That field
    // is where the corpus keeps its magnitudes — "-0.05 Iron (decays toward 0
    // over 24 ticks)" — and a tooltip is a player surface, not the sheet. If
    // this fails, the body-line precedence has started reading the wrong field.
    const withNumbers = explainableTemplates()
      .map(node => ({ id: node.id, desc: resolveTooltip(`attachment.${node.id}`)?.desc ?? '' }))
      .filter(({ desc }) => /\d/.test(desc))
      .map(({ id, desc }) => `${id}: "${desc}"`);

    expect(
      withNumbers,
      withNumbers.length > 0
        ? `Player-facing tooltip copy carrying raw magnitudes:\n${withNumbers.join('\n')}`
        : '',
    ).toEqual([]);
  });

  it('LAW 14: every description is non-empty — a template always has a line to draw', () => {
    const blank = explainableTemplates()
      .filter(node => !resolveTooltip(`attachment.${node.id}`)?.desc?.trim())
      .map(node => node.id);

    expect(blank).toEqual([]);
  });

  it('prefers the plain-register description over the numeric mechanical summary', () => {
    // `reward_condition_fractured_arm` carries both, and they differ sharply:
    // description "A broken bone limits striking power and grip strength."
    // mechanicalSummary "-0.05 Iron (decays toward 0 over 24 ticks, …)".
    const node = getAttachmentTemplateNode('reward_condition_fractured_arm');
    expect(node).toBeDefined();
    const props = node!.properties as Record<string, unknown>;
    expect(props.mechanicalSummary).toMatch(/\d/);

    const resolved = resolveTooltip('attachment.reward_condition_fractured_arm');
    expect(resolved?.desc).toBe(props.description);
  });

  it('falls back to flavour when a possession carries no description', () => {
    // Possessions in the reward catalog ship flavour and a numeric summary, and
    // no description — so the fallback is the only thing standing between the
    // player and a magnitude.
    const resolved = resolveTooltip('attachment.reward_arms_bronze_spear');
    expect(resolved?.desc).toBe('Pitted and green with age, but the point still bites.');
  });

  it('trims an over-long body at a sentence boundary rather than mid-word', () => {
    const long = 'A sentence that runs on and on. '.repeat(12);
    expect(long.length).toBeGreaterThan(ATTACHMENT_TOOLTIP_MAX_DESC);

    const trimmed = plainRegisterBody({
      id: 'test.condition.verbose',
      type: 'trait',
      name: 'Verbose',
      properties: { subcategory: 'condition', tier: 1, description: long, tags: [] },
    });

    expect(trimmed.length).toBeLessThanOrEqual(ATTACHMENT_TOOLTIP_MAX_DESC);
    expect(trimmed.endsWith('.')).toBe(true);
    // Whole sentences, not a severed clause: the 32-char sentence tiles the
    // 160-char ceiling exactly five times.
    expect(trimmed).toBe('A sentence that runs on and on. '.repeat(5).trim());
  });

  it('falls back to the name when a template carries neither description nor flavour', () => {
    // Law 14 — a blank slot is never an option; the name is the last resort and
    // is never empty.
    expect(
      plainRegisterBody({
        id: 'test.condition.bare',
        type: 'trait',
        name: 'Bare Condition',
        properties: { subcategory: 'condition', tier: 1, tags: [] },
      }),
    ).toBe('Bare Condition');
  });
});

describe('attachment tooltip fail-open (THR-1122)', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetAttachmentTooltipWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('LAW 14: an unshipped id resolves to nothing and warns exactly once', () => {
    expect(resolveTooltip('attachment.no.such.template')).toBeNull();
    expect(resolveTooltip('attachment.no.such.template')).toBeNull();
    expect(resolveTooltip('attachment.no.such.template')).toBeNull();

    expect(warn).toHaveBeenCalledTimes(1);
    // The id belongs in the log, never on screen — the null return is what
    // keeps it off the surface, and the message is what makes it findable.
    expect(String(warn.mock.calls[0][0])).toContain('no.such.template');
  });

  it('a shipped trait that is not an attachment resolves to nothing', () => {
    // A mastery is a real, seeded trait definition with no attachment sheet.
    // Resolving it would offer the player a hover into a concept class this
    // prefix does not own.
    expect(resolveTooltip('attachment.trait.mastery.battle-hardened')).toBeNull();
    expect(tooltipResolves('attachment.trait.mastery.battle-hardened')).toBe(false);
  });

  it('the resolver and tooltipResolves agree on both answers', () => {
    expect(tooltipResolves('attachment.trait.condition.wounded')).toBe(true);
    expect(tooltipResolves('attachment.nothing.here')).toBe(false);
    expect(resolveAttachmentTemplateTooltip('trait.condition.wounded')).not.toBeNull();
  });
});
