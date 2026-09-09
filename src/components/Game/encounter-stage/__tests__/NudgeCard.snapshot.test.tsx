// @vitest-environment jsdom
/**
 * The nudge card's DOM, pinned — THR-1002.
 *
 * ─── Why this test exists, and why it was written *before* the change ───
 *
 * THR-1002 extracts the nudge card's zone stack into a shared `CardFace`
 * primitive so the action card can render the same face. The whole ticket moves
 * the action card *toward* the nudge card; the nudge card itself must not move
 * at all. This snapshot is the only available proof of that: it is written and
 * committed against the pre-extraction component, and it must pass **unchanged**
 * after `NudgeCard` becomes a thin adapter over `CardFace`.
 *
 * The plan states the failure reading explicitly (§ Kill criteria): *if the
 * snapshot fails after the extraction, the primitive is wrong, not the
 * snapshot.* Updating this file to match a changed face would destroy the only
 * evidence the extraction was faithful, so it is never the right fix.
 *
 * ─── Why a hand-built card model is correct here, unusually ───
 *
 * This repo's `fixture_invents_both_sides` trap says a fixture that supplies
 * both halves of a contract verifies fiction. That trap binds tests asserting a
 * *pipeline's* behaviour — it does not bind this one, because the proposition
 * under test is not "the producer fills these fields correctly" but "given these
 * fields, the component emits exactly this DOM". The fields are the *input* to
 * the thing being pinned, so authoring them here is the point; the producer's
 * own correctness is pinned by `dealtCardProvenance.test.tsx` and the nudge-stage
 * model tests, which build through the real `buildNudgePhaseModel`.
 *
 * What does matter is **zone coverage**: a snapshot of a minimal card would
 * silently permit the extraction to drop the optional zones. So the fixtures
 * below exercise every branch in the component — keyword chip present and
 * absent, sphere present and absent, cost channels, provenance with and without
 * a tooltipped concept, the dimmed/blocked-reason arm, the selected arm, and the
 * designer-view arm. Each is its own snapshot, so a regression names the zone it
 * broke instead of dumping one unreadable diff.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { NudgeCard } from '../shells/NudgePhaseShell';
import type { NudgeHandCard } from '../useNudgeHand';

// ─── Fixtures ─────────────────────────────────────────────────────

/**
 * The ordinary card: every common zone populated, nothing exotic. Deliberately
 * carries no `imageTag`, so the art resolver misses and the face renders its
 * `EntityVisual` gradient+glyph fallback — the branch that must survive, since a
 * 404 on a registered path degrades into exactly this.
 */
const BASE: NudgeHandCard = {
  id: 'nudge.steady_hand',
  libraryCardId: 'card.boost',
  keyword: 'Boost',
  keywordIcon: '◆',
  name: 'Steady The Hand',
  effectLine: 'His grip stops shaking.',
  essenceCost: 2,
  sphere: 'force',
  state: 'available',
  forecastDelta: 0.08,
  selected: false,
  interactive: true,
};

function card(overrides: Partial<NudgeHandCard>): NudgeHandCard {
  return { ...BASE, ...overrides };
}

function renderCard(model: NudgeHandCard, designerView = false) {
  const { container } = render(
    <NudgeCard card={model} designerView={designerView} onToggle={() => {}} />,
  );
  return container.firstElementChild;
}

// ─── The pins ─────────────────────────────────────────────────────

describe('NudgeCard DOM (pre-extraction pin — THR-1002)', () => {
  afterEach(cleanup);

  it('renders the ordinary card', () => {
    expect(renderCard(BASE)).toMatchSnapshot();
  });

  it('renders a selected card', () => {
    expect(renderCard(card({ selected: true }))).toMatchSnapshot();
  });

  it('renders a dimmed card with its reason', () => {
    expect(
      renderCard(
        card({
          state: 'dimmed',
          blockedCode: 'essence_unavailable',
          blockedReason: 'Not enough essence.',
          interactive: false,
        }),
      ),
    ).toMatchSnapshot();
  });

  it('renders a chipless one-off card with no sphere', () => {
    // A one-off authored option is in no library: no keyword, no icon, and the
    // empty <span /> placeholder has to stay so the price remains right-aligned
    // across a row of mixed cards.
    expect(
      renderCard(
        card({ libraryCardId: undefined, keyword: undefined, keywordIcon: undefined, sphere: undefined }),
      ),
    ).toMatchSnapshot();
  });

  it('renders alternate cost channels', () => {
    expect(
      renderCard(
        card({
          costChannels: [
            { id: 'standing', icon: '⚖', label: 'Costs standing with the guild', delta: 0.05 },
            { id: 'relief', icon: '☼', label: 'The debt is forgiven', delta: -0.04 },
          ],
        }),
      ),
    ).toMatchSnapshot();
  });

  it('renders provenance with a tooltipped concept', () => {
    expect(
      renderCard(
        card({
          provenance: {
            prefix: 'From your repertoire',
            conceptLabel: 'Darkness',
            conceptTooltipId: 'sphere.darkness',
            suffix: 'signature',
            // Required by the model and assembled from the parts by
            // construction: it is the accessible name, so omitting it here
            // would pin a DOM the producer never emits.
            text: 'From your repertoire — Darkness signature',
          },
        }),
      ),
    ).toMatchSnapshot();
  });

  it('renders provenance without a concept', () => {
    expect(
      renderCard(card({ provenance: { prefix: 'From your repertoire', text: 'From your repertoire' } })),
    ).toMatchSnapshot();
  });

  it('renders the designer view line', () => {
    expect(
      renderCard(card({ discounted: true, riderLabel: 'waxing' }), true),
    ).toMatchSnapshot();
  });
});
