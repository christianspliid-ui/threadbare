// @vitest-environment jsdom
/**
 * THR-1609 (S6, "Who am I") — every surface that shows the avatar frames it as the
 * player's own mortal shape: the hex-map hover line, the sheet header, and Beat 0.
 * Plan: Docs/plans/2026-09-27-thr-1605-the-opening.md § S6.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentProfileModal } from '../AgentProfileModal';
import { AscendantBeatModal } from '../AscendantBeatModal';
import { HexTooltip } from '../../HexMapV2/interaction/HexTooltip';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import { avatarHoverLine, avatarGodTitleLine, AVATAR_SHEET_SUFFIX } from '../../../data/avatar-framing';
import {
  SPINE_BEAT_PRESENTATION,
  SPINE_AVATAR_NAME_TOKEN,
  SPINE_AVATAR_NAME_FALLBACK,
  fillSpineAvatarName,
} from '../../../data/ascendant-beat-content';

const avatarCard: AgentInfoCardData = {
  id: 'actor.avatar',
  name: 'Maren',
  locationId: 'loc.start',
  locationName: 'Sacred Grove',
  knowledgeLevel: 'transparent',
};

describe('avatar framing copy (THR-1609)', () => {
  it('hover line names the avatar as the player', () => {
    expect(avatarHoverLine('Maren')).toBe('You walk here as Maren.');
    expect(avatarHoverLine('  ')).toBe('You walk here.');
  });

  it('god title line leads with the divine name, then the archetype title or the hunger', () => {
    expect(avatarGodTitleLine('Mira', 'The Living Balm')).toBe('You are Mira, The Living Balm');
    expect(avatarGodTitleLine(undefined, 'The Living Balm')).toBe('You are The Living Balm');
    expect(avatarGodTitleLine('Vara', '', 'Witness')).toBe('You are Vara, the Witness');
    expect(avatarGodTitleLine('Vara', 'Vara', 'Witness')).toBe('You are Vara, the Witness');
    expect(avatarGodTitleLine('Vara', 'Vara')).toBe('You are Vara');
    expect(avatarGodTitleLine(undefined, undefined)).toBe('You are the god who wears it');
  });
});

describe('avatar sheet header (THR-1609)', () => {
  it('reads "{name} — your mortal shape" above the god\'s title when mortalShape is set', () => {
    render(
      <AgentProfileModal
        card={avatarCard}
        onClose={() => {}}
        mortalShape={{ godTitleLine: 'You are Mira, The Living Balm' }}
      />,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe(`Maren — ${AVATAR_SHEET_SUFFIX}`);
    expect(screen.getByTestId('mortal-shape-god-title').textContent).toBe('You are Mira, The Living Balm');
  });

  it('the player\'s own shape is never labelled a stranger', () => {
    render(
      <AgentProfileModal
        card={{ ...avatarCard, knowledgeLevel: 'stranger' }}
        onClose={() => {}}
        mortalShape={{ godTitleLine: 'You are Vara, the Witness', portraitUrl: '/portraits/origin.png' }}
      />,
    );
    expect(screen.queryByText('stranger')).toBeNull();
  });

  it('a mortal\'s sheet carries no mortal-shape framing', () => {
    render(<AgentProfileModal card={{ ...avatarCard, id: 'actor.kael', name: 'Kael' }} onClose={() => {}} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Kael');
    expect(screen.queryByTestId('mortal-shape-suffix')).toBeNull();
    expect(screen.queryByTestId('mortal-shape-god-title')).toBeNull();
  });
});

describe('hex tooltip avatar line (THR-1609)', () => {
  const base = {
    terrainName: 'Plains',
    coord: { col: 3, row: 4 },
    screenX: 300, screenY: 300, canvasWidth: 1920, canvasHeight: 1080,
  };

  it('shows the avatar line on the avatar\'s hex', () => {
    render(<HexTooltip {...base} avatarLine={avatarHoverLine('Maren')} avatarColor="#7fd1b9" />);
    expect(screen.getByTestId('hex-tooltip-avatar-line').textContent).toBe('You walk here as Maren.');
  });

  it('shows no avatar line elsewhere', () => {
    render(<HexTooltip {...base} />);
    expect(screen.queryByTestId('hex-tooltip-avatar-line')).toBeNull();
  });
});

describe('Beat 0 names the avatar (THR-1609)', () => {
  const opening = SPINE_BEAT_PRESENTATION['beat.spine.opening'];

  it('the authored line carries the avatar token exactly once', () => {
    expect(opening.prose.split(SPINE_AVATAR_NAME_TOKEN).length - 1).toBe(1);
  });

  it('fills the name and never leaks the raw token', () => {
    expect(fillSpineAvatarName(opening.prose, 'Maren')).toContain('You walk the world again as Maren');
    const unnamed = fillSpineAvatarName(opening.prose, undefined);
    expect(unnamed).toContain(SPINE_AVATAR_NAME_FALLBACK);
    expect(unnamed).not.toContain('{');
  });

  it('the beat modal renders the filled line', () => {
    render(
      <AscendantBeatModal
        open={true}
        pending={{ beatId: 'beat.spine.opening', kind: 'spine' } as never}
        onResolve={() => {}}
        avatarName="Maren"
      />,
    );
    expect(screen.getByText(/You walk the world again as Maren/)).toBeTruthy();
    expect(screen.queryByText(/\{avatarName\}/)).toBeNull();
  });
});
