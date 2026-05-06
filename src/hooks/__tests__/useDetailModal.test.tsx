// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailModalStackProvider } from '../../contexts/DetailModalStackContext';
import { useDetailModal } from '../useDetailModal';
import type { DetailPage } from '../../types/detailPage';
import {
  DETAIL_AMBIENT_DUCK_DB,
  DETAIL_BEAT_INDICATOR_OPACITY_PAUSED,
} from '../../types/detailPage';

const samplePage: DetailPage = {
  kind: 'actor',
  nodeId: 'actor-1',
  trail: ['Captain Veiren'],
  kindLabel: 'ACTOR',
  displayName: 'Captain Veiren',
  subtitle: 'IRON · CIVIC GUARD',
  sphere: 'force',
  isShowcase: false,
  sections: [],
  hasFullSheet: false,
};

function Harness() {
  const detail = useDetailModal();
  return (
    <div>
      <button data-testid="open" onClick={() => detail.openDetail(samplePage)}>
        open
      </button>
      <button data-testid="replace" onClick={() => detail.replaceDetail({ ...samplePage, displayName: 'Replaced' })}>
        replace
      </button>
      <button data-testid="close" onClick={detail.closeDetail}>
        close
      </button>
      <div data-testid="is-open">{String(detail.isOpen)}</div>
      <div data-testid="ambient-duck">{detail.ambientDuckDb}</div>
      <div data-testid="beat-opacity">{detail.pausedBeatIndicatorOpacity}</div>
      <div data-testid="top-name">{detail.stack[detail.stack.length - 1]?.displayName ?? 'none'}</div>
    </div>
  );
}

describe('useDetailModal', () => {
  it('exposes pause contract values when detail modal is open', () => {
    render(
      <DetailModalStackProvider>
        <Harness />
      </DetailModalStackProvider>,
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('ambient-duck')).toHaveTextContent('0');
    expect(screen.getByTestId('beat-opacity')).toHaveTextContent('1');

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('ambient-duck')).toHaveTextContent(String(DETAIL_AMBIENT_DUCK_DB));
    expect(screen.getByTestId('beat-opacity')).toHaveTextContent(
      String(DETAIL_BEAT_INDICATOR_OPACITY_PAUSED),
    );
  });

  it('replaceDetail swaps the current top entry', () => {
    render(
      <DetailModalStackProvider>
        <Harness />
      </DetailModalStackProvider>,
    );

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('top-name')).toHaveTextContent('Captain Veiren');
    fireEvent.click(screen.getByTestId('replace'));
    expect(screen.getByTestId('top-name')).toHaveTextContent('Replaced');
  });
});
