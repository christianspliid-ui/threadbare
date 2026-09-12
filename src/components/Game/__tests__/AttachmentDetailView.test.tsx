// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentDetailView } from '../AttachmentDetailView';
import type { AttachmentDetailData } from '../AttachmentDetailView';
import { resolveTooltip } from '../../../engine/tooltipResolver';

const basePossession: AttachmentDetailData = {
  id: 'item.1',
  name: "Ashenmane's Fang",
  subcategory: 'arms',
  tier: 2,
  mechanicalSummary: '+Iron in open terrain',
  flavorText: 'Won in a border raid. Still bites strangers.',
  tags: ['weapon', 'iron', 'mount'],
  lossCondition: 'breakable',
  source: 'Battle of the Ash Ford',
};

const transientCondition: AttachmentDetailData = {
  id: 'cond.1',
  name: 'Bruised Ribs',
  subcategory: 'wound',
  tier: 1,
  mechanicalSummary: '-Iron (minor)',
  tags: ['wound'],
  ticksRemaining: 8,
  totalTicks: 20,
};

const triggeredItem: AttachmentDetailData = {
  id: 'item.2',
  name: 'Cursed Blade',
  subcategory: 'arms',
  tier: 3,
  mechanicalSummary: '+Iron, +Shadow',
  tags: ['weapon', 'cursed'],
  actionTriggers: [{
    type: 'action_trigger',
    on: 'encounter_critical_failure',
    probability: 0.10,
    payload: { kind: 'self_remove' },
    narrativeTemplate: 'The blade shatters against the shield...',
  }],
};

describe('AttachmentDetailView', () => {
  it('renders attachment name in header', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText("Ashenmane's Fang")).toBeTruthy();
  });

  it('renders tier and subcategory subtitle', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText(/Storied/)).toBeTruthy();
  });

  it('renders flavor text as italic prose', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText('Won in a border raid. Still bites strangers.')).toBeTruthy();
  });

  it('renders effect section with mechanical summary', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText(/\+Iron in open terrain/)).toBeTruthy();
  });

  it('renders loss condition in effect section', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText(/Loss: breakable/)).toBeTruthy();
  });

  it('renders tags as keyword cloud', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText('weapon')).toBeTruthy();
    expect(screen.getByText('iron')).toBeTruthy();
  });

  it('renders source section', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText('Battle of the Ash Ford')).toBeTruthy();
  });

  it('renders duration section for transient conditions', () => {
    render(<AttachmentDetailView attachment={transientCondition} onBack={vi.fn()} />);
    // THR-1423: was `8 / 20 ticks` — two raw magnitudes (Law 13) in an engine unit named
    // nowhere player-facing (Law 14). The `x / y` pair is the quantity the row's ProgressBar
    // already draws, so the reading keeps only the remaining term.
    const duration = screen.getByText(/remaining$/);
    expect(duration.textContent).not.toMatch(/\d/);
    expect(duration.textContent).not.toMatch(/tick/i);
  });

  it('does not render duration section for permanent items', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    const text = screen.queryByText(/ticks$/);
    expect(text).toBeNull();
  });

  it('renders triggers section when triggers exist', () => {
    render(<AttachmentDetailView attachment={triggeredItem} onBack={vi.fn()} />);
    expect(screen.getByTestId('trigger-block')).toBeTruthy();
    expect(screen.getByText(/Critical failure/)).toBeTruthy();
  });

  it('does not render triggers section when no triggers', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.queryByTestId('trigger-block')).toBeNull();
  });

  it('renders glyph fallback when no image', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    // Arms glyph ⚔
    expect(screen.getByText('\u2694')).toBeTruthy();
  });

  it('renders image when provided', () => {
    const withImage = { ...basePossession, image: '/art/fang.png' };
    render(<AttachmentDetailView attachment={withImage} onBack={vi.fn()} />);
    const img = screen.getByAltText("Ashenmane's Fang");
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/art/fang.png');
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<AttachmentDetailView attachment={basePossession} onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('close'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

/**
 * THR-1475 — the condition effect line, on the rendered surface.
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server` (verification-gates.md, the THR-754 route list). These arms stand in for
 * the screenshot: they render the real component with **real shipped template ids**
 * and assert every face the change produces, plus its absence where it must not
 * render. The ids matter — the suite above uses synthetic ones (`cond.1`), which
 * resolve to no template and therefore exercise none of this.
 *
 * The hover face is asserted through `resolveTooltip`, the production entry point
 * `Tooltip` itself calls, rather than by mounting the tooltip: the thing under test
 * is the content the registry hands it.
 */
describe('THR-1475 — a condition says what it does, on both faces', () => {
  /** A granted condition, shaped the way `getAgentAttachments` shapes one. */
  const granted = (
    id: string,
    name: string,
    over: Partial<AttachmentDetailData> = {},
  ): AttachmentDetailData => ({
    id,
    name,
    subcategory: 'wound',
    tier: 1,
    mechanicalSummary: 'Pushed beyond their limits. Everything takes more effort.',
    tags: ['#condition'],
    ...over,
  });

  it('renders the effect line on the sheet, above the mood line', () => {
    render(
      <AttachmentDetailView
        attachment={granted('trait.condition.exhausted', 'Exhausted', {
          ticksRemaining: 4,
          totalTicks: 12,
        })}
        onBack={vi.fn()}
      />,
    );

    // The Effect section now answers the question Christian asked of it.
    expect(screen.getByText(/Iron, Eye and Stone slightly lower\./)).toBeTruthy();
    expect(screen.getByText(/Lasts about one day\./)).toBeTruthy();
    // The mood line it used to be the only occupant of is still there.
    expect(screen.getByText(/Everything takes more effort/)).toBeTruthy();
  });

  it('keeps the term and the remaining count as two different readings', () => {
    render(
      <AttachmentDetailView
        attachment={granted('trait.condition.wounded', 'Wounded', {
          // Most of a six-day term already served.
          ticksRemaining: 12,
          totalTicks: 72,
        })}
        onBack={vi.fn()}
      />,
    );

    // Effect states the term the bearer was given; Duration states what is left of
    // it. Two questions, each answered once — not one sentence twice. They are only
    // distinguishable on a part-served term, which is why this arm uses one: at
    // four ticks of twelve both rows round to "one day" and the arm would pass
    // against a sheet that printed the same reading in both places.
    expect(screen.getByText(/Lasts about six days\./)).toBeTruthy();
    expect(screen.getByText(/one day remaining/)).toBeTruthy();
  });

  it("states the grant's own term, not the template default", () => {
    render(
      <AttachmentDetailView
        attachment={granted('trait.condition.wounded', 'Wounded', { totalTicks: 72 })}
        onBack={vi.fn()}
      />,
    );
    // The default is two days; this grant ran six.
    expect(screen.getByText(/Lasts about six days\./)).toBeTruthy();
    expect(screen.queryByText(/Lasts about two days\./)).toBeNull();
  });

  it('renders a real term for Shaken, which used to be permanent', () => {
    render(
      <AttachmentDetailView
        attachment={granted('trait.condition.shaken', 'Shaken')}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText(/Star and Heart slightly lower\. Lasts about two days\./)).toBeTruthy();
    expect(screen.queryByText(/until it lifts/)).toBeNull();
  });

  it("reads a place's condition off its travel cost", () => {
    render(
      <AttachmentDetailView
        attachment={granted('trait.condition.location.pass_closed', 'Closed for the Season')}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText(/Travel through here costs far more\./)).toBeTruthy();
    expect(screen.getByText(/Lasts about four weeks\./)).toBeTruthy();
  });

  it('renders NO effect line for a condition with no live effect', () => {
    // The absence arm. `under_watch` is in `CONDITION_IDS_WITHOUT_EFFECT` — nothing
    // reads the trait, so the sheet must stay silent rather than invent a claim.
    const { container } = render(
      <AttachmentDetailView
        attachment={granted('trait.condition.location.under_watch', 'Under Watch', {
          mechanicalSummary: 'Someone is keeping eyes on this place.',
        })}
        onBack={vi.fn()}
      />,
    );

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/slightly (lower|higher)/);
    expect(text).not.toMatch(/Travel through here costs/);
    expect(text).not.toMatch(/Lasts /);
    // And the sheet is still a sheet: the mood line it always had is intact.
    expect(screen.getByText(/keeping eyes on this place/)).toBeTruthy();
  });

  it('leaves a possession sheet exactly as it was', () => {
    // The no-regression arm, with a real shipped possession id rather than a
    // synthetic one, so the resolver genuinely runs and genuinely declines.
    const { container } = render(
      <AttachmentDetailView
        attachment={{ ...basePossession, id: 'reward_arms_bronze_spear' }}
        onBack={vi.fn()}
      />,
    );
    expect(container.textContent ?? '').not.toMatch(/Lasts |slightly /);
    expect(screen.getByText(/\+Iron in open terrain/)).toBeTruthy();
  });

  it('puts no numeral and no raw id on the condition sheet (Laws 13 and 14)', () => {
    const { container } = render(
      <AttachmentDetailView
        attachment={granted('trait.condition.exhausted', 'Exhausted', {
          ticksRemaining: 4,
          totalTicks: 12,
        })}
        onBack={vi.fn()}
      />,
    );

    const text = container.textContent ?? '';
    // Swept over the whole rendered surface rather than the Effect row, so a
    // numeral reaching any future section fails here too.
    expect(text).not.toMatch(/\d/);
    expect(text).not.toContain('trait.condition');
    expect(text).not.toContain('domainContributions');
  });

  it('carries the same line on the hover face, through the live registry', () => {
    const resolved = resolveTooltip('attachment.trait.condition.exhausted');

    expect(resolved).not.toBeNull();
    expect(resolved!.desc).toContain('Iron, Eye and Stone slightly lower. Lasts about one day.');
    // The mood line survives above it — the effect is added, not substituted.
    expect(resolved!.desc).toContain('Everything takes more effort');
    expect(resolved!.desc).not.toMatch(/\d/);
    // Law 18's ceiling, on the composed reading rather than on the body alone.
    expect(resolved!.desc!.length).toBeLessThanOrEqual(200);
  });

  it('adds nothing to the hover face of an effectless condition', () => {
    const resolved = resolveTooltip('attachment.trait.condition.location.under_watch');
    expect(resolved!.desc).not.toMatch(/slightly|Travel through here|Lasts /);
  });
});
