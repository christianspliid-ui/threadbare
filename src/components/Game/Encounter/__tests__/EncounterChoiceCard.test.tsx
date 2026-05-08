// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EncounterChoiceCard } from '../EncounterChoiceCard';
import type { EncounterChoiceContract } from '../../../../types/encounter-contract';

const sampleChoice: EncounterChoiceContract = {
  reach: 'iron',
  cost: 'fuller_breath',
  god_verb: 'Stir her resolve.',
  agent_reaction:
    "Her shoulders set. She closes the distance and meets Veiren's eye.",
  tilts_toward: 'a wound, a debt, or his favour earned',
  moral_axis_pole: 'conqueror',
  fail_forward: 'she draws steel and the queue splinters',
  consumes_item: 'captain-token',
};

function renderInViewport(node: React.ReactElement) {
  return render(
    <div style={{ width: 1920, height: 1080 }}>{node}</div>,
  );
}

describe('EncounterChoiceCard', () => {
  it('renders the full choice anatomy: sphere line, god-verb, body, tilts, moral-axis pole, fail-forward, consumes-item', () => {
    renderInViewport(<EncounterChoiceCard choice={sampleChoice} />);

    const card = screen.getByTestId('encounter-choice-card-iron');
    expect(card).toBeInTheDocument();

    // Sphere · cost line — uppercased via CSS but text is lower-case in DOM.
    expect(screen.getByTestId('encounter-choice-card-sphere-line')).toHaveTextContent(
      'iron · fuller breath',
    );

    // God-verb display
    expect(screen.getByTestId('encounter-choice-card-god-verb')).toHaveTextContent(
      'Stir her resolve.',
    );

    // Body prose (agent reaction)
    expect(
      screen.getByTestId('encounter-choice-card-agent-reaction'),
    ).toHaveTextContent("Her shoulders set. She closes the distance");

    // Tilts toward line
    expect(
      screen.getByTestId('encounter-choice-card-tilts-toward'),
    ).toHaveTextContent('Tilts toward: a wound, a debt, or his favour earned');

    // Moral-axis pole label is rendered — pole word is the canonical
    // archetype name, uppercased visually via CSS textTransform.
    const moralAxis = screen.getByTestId('encounter-moral-axis-tilt');
    expect(moralAxis).toHaveTextContent(/tilts toward/i);
    expect(moralAxis).toHaveTextContent(/conqueror/);
    const poleSpan = moralAxis.querySelector('span:last-child');
    expect(poleSpan).not.toBeNull();
    expect(poleSpan?.textContent).toBe('conqueror');
    // Visual uppercasing is applied via inline style.
    expect(poleSpan).toHaveStyle({ textTransform: 'uppercase' });

    // Fail-forward
    expect(
      screen.getByTestId('encounter-choice-card-fail-forward'),
    ).toHaveTextContent(/on fail/);
    expect(
      screen.getByTestId('encounter-choice-card-fail-forward'),
    ).toHaveTextContent('she draws steel and the queue splinters');

    // Consumes-item indicator
    expect(
      screen.getByTestId('encounter-choice-card-consumes-item'),
    ).toHaveTextContent('consumes: captain-token');
  });

  it('matches snapshots for full, selected, dimmed, and no-consume variants in a 1920x1080 container', () => {
    const { asFragment, rerender } = renderInViewport(
      <EncounterChoiceCard choice={sampleChoice} selected={false} dimmed={false} />,
    );
    expect(asFragment()).toMatchSnapshot('default');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EncounterChoiceCard choice={sampleChoice} selected dimmed={false} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('selected');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EncounterChoiceCard choice={sampleChoice} selected={false} dimmed />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('dimmed');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EncounterChoiceCard
          choice={{ ...sampleChoice, consumes_item: null }}
          selected={false}
          dimmed={false}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('consumes-null');
  });

  it('activates onSelect via Enter and Space keypresses', () => {
    const onSelect = vi.fn();
    renderInViewport(<EncounterChoiceCard choice={sampleChoice} onSelect={onSelect} />);

    const card = screen.getByTestId('encounter-choice-card-iron');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('activates onSelect via click', () => {
    const onSelect = vi.fn();
    renderInViewport(<EncounterChoiceCard choice={sampleChoice} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('encounter-choice-card-iron'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not bubble click on consumes-item glyph to onSelect', () => {
    const onSelect = vi.fn();
    const onConsumesItemHover = vi.fn();
    renderInViewport(
      <EncounterChoiceCard
        choice={sampleChoice}
        onSelect={onSelect}
        onConsumesItemHover={onConsumesItemHover}
      />,
    );

    fireEvent.click(screen.getByTestId('encounter-choice-card-consumes-item'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onConsumesItemHover).toHaveBeenCalledWith('captain-token');
  });

  it('reflects selected state via aria-pressed and a sphere-bright border', () => {
    const { rerender } = renderInViewport(
      <EncounterChoiceCard choice={sampleChoice} selected={false} />,
    );
    const card = screen.getByTestId('encounter-choice-card-iron');
    expect(card).toHaveAttribute('aria-pressed', 'false');
    // jsdom serialises the inline border via the `border` style attribute
    // string. Read it directly to avoid longhand normalisation differences.
    expect(card.getAttribute('style')).toContain('var(--border-subtle)');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EncounterChoiceCard choice={sampleChoice} selected />
      </div>,
    );
    const selectedCard = screen.getByTestId('encounter-choice-card-iron');
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true');
    expect(selectedCard.getAttribute('style')).toContain(
      'var(--reach-sphere-bright)',
    );
  });

  it('has data-reach attribute matching the reach for CSS sphere mapping', () => {
    renderInViewport(<EncounterChoiceCard choice={sampleChoice} />);
    expect(screen.getByTestId('encounter-choice-card-iron')).toHaveAttribute(
      'data-reach',
      'iron',
    );
  });

  it('omits data-reach for quintessence (falls back to gold accent)', () => {
    const quintChoice: EncounterChoiceContract = {
      ...sampleChoice,
      reach: 'quintessence',
      moral_axis_pole: 'vanguard',
    };
    renderInViewport(<EncounterChoiceCard choice={quintChoice} />);
    const card = screen.getByTestId('encounter-choice-card-quintessence');
    expect(card).not.toHaveAttribute('data-reach');
  });

  it('renders no number-like substring in visible text', () => {
    renderInViewport(<EncounterChoiceCard choice={sampleChoice} selected />);
    const card = screen.getByTestId('encounter-choice-card-iron');
    const visibleText = card.textContent ?? '';
    // No percentages
    expect(visibleText).not.toMatch(/[0-9]+%/);
    // No decimal numbers
    expect(visibleText).not.toMatch(/[0-9]+\.[0-9]+/);
    // No standalone integer runs of 1+ digits anywhere in the body.
    expect(visibleText).not.toMatch(/[0-9]/);
  });
});
