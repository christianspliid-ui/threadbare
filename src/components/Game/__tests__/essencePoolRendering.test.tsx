// @vitest-environment jsdom
/**
 * THR-1034 — no player-facing essence balance renders raw float noise.
 *
 * THR-1006 shipped `formatEssence` / `formatEssencePool` and fixed the surface the
 * defect was reported on (`EncounterVeil`'s three diamond readouts). It did not
 * reach the other surfaces that quote the same pool, and THR-1034 is a *predicate*
 * rather than that one instance: "any player-facing essence-balance render that
 * skips whole-number rounding."
 *
 * So these are deliberately **surface** tests, not more helper tests. The helper is
 * already pinned by value in `shared/__tests__/formatEssence.test.ts`; what was
 * missing — and what actually broke — is the call site *reaching* it. A unit test on
 * the formatter cannot fail when a component bypasses it, which is precisely how
 * three sites stayed raw through a fix that named this exact defect.
 *
 * ## Both vacuity traps THR-1006 documented are closed here, on purpose
 *
 * 1. **The fixture is genuinely fractional.** THR-1006's first verification sampled a
 *    pool at `190` — an integer renders identically with and without a formatter, so
 *    the assertion passed against a value incapable of failing. Every fixture below
 *    carries a real fractional tail.
 * 2. **Each assertion is falsifiable.** Asserting "the text is 192" would also pass if
 *    the component rendered something unrelated, so each case additionally asserts the
 *    rendered output *differs* from what raw interpolation would have produced —
 *    `String(RAW_POOL)`, the literal string the defect put on screen.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadTheThreadsPanel } from '../ReadTheThreadsPanel';
import { InterventionConfirm } from '../InterventionConfirm';

/**
 * The reported shape, one accumulation apart from THR-1006's `193.60000000000005`:
 * ordinary fractional regen/spend arithmetic, not a single bad value.
 */
const RAW_POOL = 192.60000000000005;

/** What a raw `{value} essence` interpolation puts on screen. The thing to never see. */
const RAW_RENDERED = String(RAW_POOL); // '192.60000000000005'

describe('THR-1034 — essence balances render as whole numbers on every surface', () => {
  it('ReadTheThreadsPanel floors the available-essence balance (Law 13)', () => {
    render(
      <ReadTheThreadsPanel
        open
        onClose={vi.fn()}
        digestBuffer={[]}
        currentTick={0}
        essenceAvailable={RAW_POOL}
        onSpendEssence={vi.fn()}
      />,
    );

    const body = document.body.textContent ?? '';

    // The balance is present and whole.
    expect(body).toContain('192 essence');
    // Falsifiable: the raw float must be absent. A formatter that degenerated to
    // String() would satisfy the line above via substring match and fail this one.
    expect(body).not.toContain(RAW_RENDERED);
    expect(body).not.toMatch(/\d+\.\d{3,}/);
  });

  it('InterventionConfirm floors the balance it quotes back when the god cannot afford', () => {
    render(
      <InterventionConfirm
        interventionType="dream"
        label="Send a Dream"
        deliveryMode="local"
        essenceCost={999}
        sphere="spirit"
        detectionRisk={0}
        rangeStatus="in_range"
        hexDistance={1}
        description="A test intervention."
        availableEssence={RAW_POOL}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // The shortfall line is the one that quotes the balance: "have {N}".
    expect(screen.getByText(/have 192\)/)).toBeTruthy();

    const body = document.body.textContent ?? '';
    expect(body).not.toContain(RAW_RENDERED);
    expect(body).not.toMatch(/\d+\.\d{3,}/);
  });

  it('floors rather than rounds, so the balance shown is a balance that can be spent', () => {
    // `191.9` rounds *up* to 192 — a number the player cannot actually spend, and the
    // reason `formatEssencePool` floors. This is the assertion that fails if a call
    // site reaches for `Math.round` instead of the shared owner, which is what
    // InterventionConfirm did before this ticket.
    render(
      <ReadTheThreadsPanel
        open
        onClose={vi.fn()}
        digestBuffer={[]}
        currentTick={0}
        essenceAvailable={191.9}
        onSpendEssence={vi.fn()}
      />,
    );

    const body = document.body.textContent ?? '';
    expect(body).toContain('191 essence');
    expect(body).not.toContain('192 essence');
  });
});
