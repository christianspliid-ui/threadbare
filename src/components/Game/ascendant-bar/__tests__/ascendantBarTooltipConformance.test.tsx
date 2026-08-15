// @vitest-environment jsdom
/**
 * THR-1118 — the ascendant bar's two hover tooltips bypassed the tooltip registry
 * (Law 17) and two raw internal keys reached the surface (Law 14).
 *
 * These tests assert the two laws on the **rendered surface**, not on the wiring:
 * a component can import `resolveTooltip` and still print an enum beside the result,
 * which is exactly the shape THR-1118 found — `IdentityStrip` already had the resolved
 * sphere label in scope one line below the eyebrow that rendered the raw enum.
 *
 * The Law 14 assertions are written as *absence* checks against a specific offending
 * string, so each one needs a premise guard proving the surface rendered at all —
 * otherwise "the enum is not on screen" passes trivially against an empty container.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IdentityStrip } from '../IdentityStrip';
import { HooksBlock, __resetHookLabelWarnings } from '../HooksBlock';
import type { AscendantIdentityView, QuintessenceView } from '../selectors';
import type { GameState } from '../../../../types/gameState';
import type { WorldGraph } from '../../../../engine/graph';
import { resolveTooltip } from '../../../../engine/tooltipResolver';
import { TOOLTIP_SHOW_DELAY } from '../../../../types/tooltip';
import { HOOK_LABEL_FALLBACK } from '../../../../data/ascendant-bar-content';

const IDENTITY: AscendantIdentityView = {
  divineName: 'Vess of the Long Dark',
  mortalName: 'Vess',
  // A real generated title, from ARCHETYPE_TITLES.mind — not one of the four words
  // the deleted ARCHETYPE_COPY was keyed on, because no run ever produces those.
  archetypeTitle: 'The Unblinking',
  epithet: null,
  portraitSrc: null,
  primarySphere: 'mind',
  secondarySphere: 'spirit',
};

const QUINTESSENCE: QuintessenceView = {
  ratio: 0.72,
  band: 'healthy',
  lexiconWord: 'Resonant',
};

function renderStrip() {
  return render(
    <IdentityStrip identity={IDENTITY} quintessence={QUINTESSENCE} onOpen={vi.fn()} />,
  );
}

/** Hover a trigger and run out the shared Tooltip's show delay. */
function hoverAndSettle(target: HTMLElement): void {
  fireEvent.pointerEnter(target);
  act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });
}

// ─── Law 17 — the registry owns the hover explanation ────────────────────────

describe('IdentityStrip — Law 17: hover explanations come from the registry (THR-1118)', () => {
  it('shows the registry sphere copy on the portrait hover, not component-local copy', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderStrip();

      // The registry is the expectation's source, so this cannot drift into asserting
      // a hardcoded string that the component happens to also hardcode.
      const registry = resolveTooltip(`sphere.${IDENTITY.primarySphere}`);
      expect(registry, 'sphere.mind must resolve or the surface has a dead id').not.toBeNull();

      const portrait = container.querySelector('[class*="portraitFrame"]');
      expect(portrait, 'premise: the portrait rendered').not.toBeNull();

      hoverAndSettle(portrait!.parentElement as HTMLElement);

      expect(screen.getByText(registry!.label)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the registry quintessence-band copy on the band-word hover', () => {
    vi.useFakeTimers();
    try {
      renderStrip();

      const registry = resolveTooltip(`quintessence.${QUINTESSENCE.band}`);
      expect(registry, 'quintessence.healthy must resolve').not.toBeNull();

      const bandWord = screen.getByText(QUINTESSENCE.lexiconWord);
      hoverAndSettle(bandWord.parentElement as HTMLElement);

      expect(screen.getByText(registry!.desc!)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the registry archetype concept on the generated-title hover', () => {
    vi.useFakeTimers();
    try {
      renderStrip();

      const registry = resolveTooltip('ui.ascendant_archetype');
      expect(registry, 'ui.ascendant_archetype must resolve').not.toBeNull();

      const title = screen.getByText(IDENTITY.archetypeTitle);
      hoverAndSettle(title.parentElement as HTMLElement);

      expect(screen.getByText(registry!.desc!)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not route the generated archetype title through archetype.* — that prefix is a different vocabulary', () => {
    // Guards the reasoning, not just the result. `archetype.*` resolves *narrative*
    // archetypes (`tragic_hero`), so `archetype.<generated title>` dangles — a dead
    // link that looks live (Law 21). If someone "fixes" the id to look more canonical,
    // this fails and says why.
    expect(resolveTooltip(`archetype.${IDENTITY.archetypeTitle}`)).toBeNull();
    expect(resolveTooltip('archetype.tragic_hero')).not.toBeNull();
  });
});

// ─── Law 14 — no raw internal keys reach the surface ─────────────────────────

describe('IdentityStrip — Law 14: no raw sphere enum on the surface (THR-1118)', () => {
  it('never renders the bare sphere enum, at rest or while the sphere tooltip is open', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderStrip();

      // Premise: the strip really rendered, so the absence assertions below are about
      // the enum being gone rather than about nothing having been drawn.
      expect(screen.getByText(IDENTITY.divineName)).toBeInTheDocument();

      const portrait = container.querySelector('[class*="portraitFrame"]');
      expect(portrait, 'premise: the portrait rendered').not.toBeNull();
      hoverAndSettle(portrait!.parentElement as HTMLElement);

      // Premise: the sphere tooltip is actually OPEN. Without this the absence checks
      // below would pass against a surface that simply never showed the tooltip — the
      // exact vacuity that makes "the bad string is gone" a worthless assertion.
      const registry = resolveTooltip(`sphere.${IDENTITY.primarySphere}`)!;
      expect(screen.getByText(registry.label)).toBeInTheDocument();

      // `Sphere · mind` was the eyebrow the bespoke tooltip printed. Assert on the
      // enum token with a word boundary rather than the whole eyebrow string, so a
      // re-introduction under any new wrapper still trips this.
      const ENUM_ON_SURFACE = /\bmind\b/; // case-sensitive: the label is "Mind"
      // Falsification guard: the pattern must match the string it exists to forbid,
      // or "no match" says nothing about the surface.
      expect('Sphere · mind').toMatch(ENUM_ON_SURFACE);

      const surface = `${document.body.textContent ?? ''}`;
      expect(surface.length, 'premise: the surface has text at all').toBeGreaterThan(0);
      expect(surface).not.toMatch(ENUM_ON_SURFACE);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── Law 14 — the chip label never falls through to a node id ────────────────

function makeHooksState(properties: Record<string, unknown>): GameState {
  const graph = {
    getOutgoingEdges: (source: string, type: string) =>
      source === 'ascendant-1' && type === 'has_attachment'
        ? [{ source, target: 'mark.hollow_touched.7f3a', type }]
        : [],
    getNode: (id: string) =>
      id === 'mark.hollow_touched.7f3a' ? { id, properties } : undefined,
  } as unknown as WorldGraph;

  return { ascendantId: 'ascendant-1', graph } as unknown as GameState;
}

describe('HooksBlock — Law 14: an unnamed attachment never renders as its node id (THR-1118)', () => {
  beforeEach(() => { __resetHookLabelWarnings(); });

  it('renders the named label when the node has one (premise for the fallback cases)', () => {
    render(<HooksBlock gameState={makeHooksState({
      name: 'Hollow-Marked', description: 'A thinning.', category: 'condition', valence: 'curse',
    })} />);

    expect(screen.getByText('Hollow-Marked')).toBeInTheDocument();
    // The fallback must NOT be what we see here, or the tests below prove nothing.
    expect(screen.queryByText(HOOK_LABEL_FALLBACK.condition)).toBeNull();
  });

  it('falls back to plain English, not the node id, when the node has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(<HooksBlock gameState={makeHooksState({
        description: 'A thinning.', category: 'condition', valence: 'curse',
      })} />);

      expect(screen.getByText(HOOK_LABEL_FALLBACK.condition)).toBeInTheDocument();
      expect(document.body.textContent).not.toContain('mark.hollow_touched.7f3a');
    } finally {
      warn.mockRestore();
    }
  });

  it('names the bucket in the fallback — a clue does not read as a mark', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(<HooksBlock gameState={makeHooksState({
        description: 'Something overheard.', category: 'clue',
      })} />);

      expect(screen.getByText(HOOK_LABEL_FALLBACK.clue)).toBeInTheDocument();
      expect(screen.queryByText(HOOK_LABEL_FALLBACK.condition)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('warns once for the missing name, not once per render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const state = makeHooksState({ description: 'A thinning.', category: 'condition' });
      const { rerender } = render(<HooksBlock gameState={state} />);
      rerender(<HooksBlock gameState={state} />);
      rerender(<HooksBlock gameState={state} />);

      const forThisNode = warn.mock.calls.filter(
        ([msg]) => typeof msg === 'string' && msg.includes('mark.hollow_touched.7f3a'),
      );
      expect(forThisNode).toHaveLength(1);
      // The warn must name the id — that is the whole point of warning rather than
      // silently swallowing it, since the id is no longer visible on the surface.
      expect(forThisNode[0][0]).toContain('mark.hollow_touched.7f3a');
    } finally {
      warn.mockRestore();
    }
  });

  it('does not warn when the node is properly named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(<HooksBlock gameState={makeHooksState({
        name: 'Hollow-Marked', category: 'condition',
      })} />);

      const forThisNode = warn.mock.calls.filter(
        ([msg]) => typeof msg === 'string' && msg.includes('mark.hollow_touched.7f3a'),
      );
      expect(forThisNode).toHaveLength(0);
    } finally {
      warn.mockRestore();
    }
  });
});
