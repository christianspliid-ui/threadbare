// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CastTile, type CastTileData } from '../CastTile';

const baseTile: CastTileData = {
  id: 'veiren',
  name: 'Captain Veiren',
  sphere: 'iron',
  roleInScene: 'civic guard',
  disposition: 'suspicious',
  toHerLabel: 'a debt and a winter ago',
  tag: 'honour-bound',
  attentionPriority: 'primary',
};

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('CastTile', () => {
  it('renders name, tag, sphere-prefixed role, disposition, and to-her line', () => {
    renderInViewport(<CastTile data={baseTile} />);

    expect(screen.getByTestId('cast-tile-veiren')).toBeInTheDocument();
    expect(screen.getByTestId('cast-tile-name')).toHaveTextContent('Captain Veiren');
    expect(screen.getByTestId('cast-tile-tag')).toHaveTextContent('honour-bound');
    expect(screen.getByTestId('cast-tile-role')).toHaveTextContent(/iron · civic guard/);
    expect(screen.getByTestId('cast-tile-disposition')).toHaveTextContent('suspicious');
    expect(screen.getByTestId('cast-tile-to-her')).toHaveTextContent(
      'to her: a debt and a winter ago',
    );
  });

  it('omits the to-her line when toHerLabel is null', () => {
    renderInViewport(<CastTile data={{ ...baseTile, toHerLabel: null }} />);
    expect(screen.queryByTestId('cast-tile-to-her')).not.toBeInTheDocument();
  });

  it('exposes data-attention-priority and data-reach for the cascade', () => {
    renderInViewport(<CastTile data={baseTile} />);
    const tile = screen.getByTestId('cast-tile-veiren');
    expect(tile).toHaveAttribute('data-attention-priority', 'primary');
    expect(tile).toHaveAttribute('data-reach', 'iron');
  });

  it('renders the offstage badge and reduces opacity when attentionPriority is offstage', () => {
    renderInViewport(
      <CastTile data={{ ...baseTile, attentionPriority: 'offstage' }} />,
    );
    expect(screen.getByTestId('cast-tile-offstage-badge')).toHaveTextContent(/offstage/i);
    expect(screen.getByTestId('cast-tile-veiren')).toHaveStyle({ opacity: '0.65' });
  });

  it('omits the offstage badge for primary and background tiles', () => {
    const { rerender } = renderInViewport(<CastTile data={baseTile} />);
    expect(screen.queryByTestId('cast-tile-offstage-badge')).not.toBeInTheDocument();
    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CastTile data={{ ...baseTile, attentionPriority: 'background' }} />
      </div>,
    );
    expect(screen.queryByTestId('cast-tile-offstage-badge')).not.toBeInTheDocument();
  });

  it('is interactive and fires onClick with the actor id when handler is provided', () => {
    const onClick = vi.fn();
    renderInViewport(<CastTile data={baseTile} onClick={onClick} />);
    const tile = screen.getByTestId('cast-tile-veiren');
    expect(tile).toHaveAttribute('role', 'button');
    expect(tile).toHaveAttribute('tabindex', '0');

    fireEvent.click(tile);
    expect(onClick).toHaveBeenCalledWith('veiren');

    fireEvent.keyDown(tile, { key: 'Enter' });
    fireEvent.keyDown(tile, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('is non-interactive when onClick is not provided (no role, no tabindex)', () => {
    renderInViewport(<CastTile data={baseTile} />);
    const tile = screen.getByTestId('cast-tile-veiren');
    expect(tile).not.toHaveAttribute('role');
    expect(tile).not.toHaveAttribute('tabindex');
  });

  it('renders an image when portraitUrl is supplied, otherwise a fallback swatch', () => {
    const { rerender } = renderInViewport(<CastTile data={baseTile} />);
    expect(screen.getByTestId('cast-tile-portrait-fallback')).toBeInTheDocument();

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CastTile data={{ ...baseTile, portraitUrl: '/portraits/veiren.png' }} />
      </div>,
    );
    expect(screen.queryByTestId('cast-tile-portrait-fallback')).not.toBeInTheDocument();
    const img = screen.getByAltText('Captain Veiren portrait') as HTMLImageElement;
    expect(img.src).toContain('/portraits/veiren.png');
  });

  it('matches the snapshot for a primary tile with full data in a 1920x1080 container', () => {
    const { asFragment } = renderInViewport(<CastTile data={baseTile} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
