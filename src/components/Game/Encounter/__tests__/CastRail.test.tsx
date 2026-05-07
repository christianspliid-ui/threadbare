// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CastRail } from '../CastRail';
import type { CastTileData } from '../CastTile';

function tilesIn(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>('[data-attention-priority]'));
}

const VEIREN: CastTileData = {
  id: 'veiren',
  name: 'Captain Veiren',
  sphere: 'iron',
  roleInScene: 'civic guard',
  disposition: 'suspicious',
  toHerLabel: 'a debt and a winter ago',
  tag: 'honour-bound',
  attentionPriority: 'primary',
};

const TRADER: CastTileData = {
  id: 'trader',
  name: 'A nervous trader',
  sphere: 'eye',
  roleInScene: 'hooded',
  disposition: 'about to bolt',
  tag: 'hidden cargo',
  attentionPriority: 'primary',
};

const HALREN: CastTileData = {
  id: 'halren',
  name: 'Halren the Lawful',
  sphere: 'heart',
  roleInScene: 'spice merchant',
  disposition: 'late for council',
  toHerLabel: 'a face she has seen at council',
  tag: 'watching',
  attentionPriority: 'background',
};

const SCRIBE: CastTileData = {
  id: 'scribe',
  name: 'The royal scribe',
  sphere: 'veil',
  roleInScene: 'taking minutes',
  disposition: 'measuring every word',
  attentionPriority: 'background',
};

const RIVAL_GOD: CastTileData = {
  id: 'rival',
  name: 'The rival god',
  sphere: 'shadow',
  roleInScene: 'whose mark may be on this place',
  disposition: 'turning its head',
  attentionPriority: 'offstage',
};

const SMALL_FOLK: CastTileData = {
  id: 'smallfolk',
  name: 'The small folk',
  sphere: 'gold',
  roleInScene: 'dying',
  disposition: 'praying for sundown',
  attentionPriority: 'offstage',
};

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('CastRail', () => {
  it('renders the empty state when given zero tiles', () => {
    renderInViewport(<CastRail tiles={[]} />);
    expect(screen.getByTestId('encounter-cast-rail-empty')).toBeInTheDocument();
    expect(screen.getByTestId('encounter-cast-rail-count')).toHaveTextContent('no one');
  });

  it('renders a single tile', () => {
    renderInViewport(<CastRail tiles={[VEIREN]} />);
    const list = screen.getByTestId('encounter-cast-rail-list');
    const tiles = tilesIn(list);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toHaveTextContent('Captain Veiren');
    expect(screen.getByTestId('encounter-cast-rail-count')).toHaveTextContent('1 of 1');
  });

  it('orders tiles primary → background → offstage regardless of input order', () => {
    renderInViewport(
      <CastRail
        tiles={[RIVAL_GOD, HALREN, VEIREN, SCRIBE]}
      />,
    );
    const list = screen.getByTestId('encounter-cast-rail-list');
    const tiles = tilesIn(list);
    expect(tiles.map((t) => t.dataset.attentionPriority)).toEqual([
      'primary',
      'background',
      'background',
      'offstage',
    ]);
    expect(tiles.map((t) => t.getAttribute('data-testid'))).toEqual([
      'cast-tile-veiren',
      'cast-tile-halren',
      'cast-tile-scribe',
      'cast-tile-rival',
    ]);
  });

  it('preserves intra-bucket input order (stable sort)', () => {
    renderInViewport(<CastRail tiles={[TRADER, VEIREN]} />);
    const list = screen.getByTestId('encounter-cast-rail-list');
    const tiles = tilesIn(list);
    expect(tiles.map((t) => t.getAttribute('data-testid'))).toEqual([
      'cast-tile-trader',
      'cast-tile-veiren',
    ]);
  });

  it('forwards tile clicks with the actor id', () => {
    const onTileClick = vi.fn();
    renderInViewport(
      <CastRail tiles={[VEIREN, HALREN]} onTileClick={onTileClick} />,
    );
    fireEvent.click(screen.getByTestId('cast-tile-veiren'));
    expect(onTileClick).toHaveBeenCalledWith('veiren');
    fireEvent.click(screen.getByTestId('cast-tile-halren'));
    expect(onTileClick).toHaveBeenCalledWith('halren');
  });

  it('renders 4-cast and 6-cast rails matching snapshots at 1920x1080', () => {
    const four = renderInViewport(
      <CastRail tiles={[VEIREN, TRADER, HALREN, RIVAL_GOD]} />,
    );
    expect(four.asFragment()).toMatchSnapshot('4 cast members');
    four.unmount();

    const six = renderInViewport(
      <CastRail tiles={[VEIREN, TRADER, HALREN, SCRIBE, RIVAL_GOD, SMALL_FOLK]} />,
    );
    expect(six.asFragment()).toMatchSnapshot('6 cast members');
  });

  it('renders an empty-state snapshot at 1920x1080', () => {
    const { asFragment } = renderInViewport(<CastRail tiles={[]} />);
    expect(asFragment()).toMatchSnapshot('0 cast members');
  });

  it('renders a single-tile snapshot at 1920x1080', () => {
    const { asFragment } = renderInViewport(<CastRail tiles={[VEIREN]} />);
    expect(asFragment()).toMatchSnapshot('1 cast member');
  });
});
