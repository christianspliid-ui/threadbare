/**
 * useView — the one place a component reads a view model (THR-1822 § D4).
 *
 * `useView(selector, args)` reads `{ runtime, state }` from `ViewSourceContext`
 * and returns `readView(...)`: the same object while the runtime's counter holds,
 * a fresh build once the world moved. GameView re-renders every tick, so the
 * hook needs no subscription of its own; outside a provider it returns the
 * selector's fallback (fail-soft).
 */
import { useContext } from 'react';
import { ViewSourceContext } from '../contexts/ViewSourceContext';
import { readView, type ViewSelector } from '../engine/views/readView';

export function useView<A, VM>(selector: ViewSelector<A, VM>, args: A): VM {
  const source = useContext(ViewSourceContext);
  if (!source) return selector.fallback(args, 'missing_node');
  return readView(source.runtime, source.state, selector, args, source.tiles);
}
