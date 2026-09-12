/**
 * EntityLink — a named entity that opens its own card when the surface can route there,
 * and reads as plain text when it cannot.
 *
 * Lifted out of `ChapterView` unchanged (THR-1298 slice 7) when the grievance surfaces
 * needed the same affordance in two more places. Four copies of a button's inline style
 * is how a design system stops being one; the fallback branch is the load-bearing half —
 * a surface with no route still renders the name, so a caller that forgets to thread the
 * handler loses the click and never the prose (UI Law 17).
 *
 * **THR-1490 — it now takes an `entityRef` and routes itself.** Every caller before this resolved
 * to an agent and passed an `onOpenEntity(id)` its host had to wire; a caller naming an
 * artifact or an army had no way to say so, which is why those names were text on a
 * surface where a person's name was a link. With an `entityRef` the component asks the router
 * what the kind opens, hovers into a card after a dwell, and clicks into the card
 * proper — with no host wiring at all.
 *
 * `onOpenEntity` is kept for one release (NFP #6). A caller passing both gets `entityRef`; a
 * caller passing neither gets text, as before.
 *
 * **The prop is `entityRef`, not `ref`** — the plan and the ticket both write `ref`, and
 * that name is React's. React 19 hands an unclaimed `ref` to a function component as an
 * ordinary prop, so `ref={{ kind: 'agent', … }}` would *work*, which is the problem: the
 * collision is silent rather than loud, it costs this component the ability to ever take
 * a DOM ref, and every reader has to stop and check which `ref` is meant. The shape the
 * plan agreed — one prop, a `WorldRef`, routing by kind — is unchanged.
 */

import { useCallback, useRef } from 'react';
import type { WorldRef } from '../../types/worldRef';
import { useRefRouterContext } from '../../contexts/RefRouterContext';

interface EntityLinkProps {
  id: string;
  name: string;
  /**
   * What this name *is* — the kind decides what it opens.
   *
   * Preferred over `onOpenEntity`: it routes by kind through the one router rather than
   * by whatever the host happened to wire.
   */
  entityRef?: WorldRef;
  /** @deprecated THR-1490 — pass `entityRef` instead. Kept one release for un-migrated callers. */
  onOpenEntity?: (id: string) => void;
}

const LINK_STYLE = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: 'var(--accent-gold, #d4af37)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  font: 'inherit',
} as const;

export function EntityLink({ id, name, entityRef, onOpenEntity }: EntityLinkProps) {
  const router = useRefRouterContext();
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  // An entityRef with no router in scope (styleguide, isolated preview) is the fail-open case,
  // not an error — the name renders, the click does not.
  const routes = Boolean(entityRef && router);

  const handleEnter = useCallback(() => {
    if (!entityRef || !router || !anchorRef.current) return;
    router.armHover(entityRef, anchorRef.current);
  }, [entityRef, router]);

  const handleLeave = useCallback(() => {
    if (!router) return;
    router.disarmHover();
    router.closeHover();
  }, [router]);

  const handleClick = useCallback(() => {
    if (entityRef && router) {
      router.closeHover();
      router.open(entityRef, 'card', { via: 'entity-link' });
      return;
    }
    onOpenEntity?.(id);
  }, [entityRef, router, onOpenEntity, id]);

  if (!routes && !onOpenEntity) {
    return <span style={{ color: 'var(--text-primary)' }}>{name}</span>;
  }

  return (
    <button
      type="button"
      ref={anchorRef}
      onClick={handleClick}
      onMouseEnter={routes ? handleEnter : undefined}
      onMouseLeave={routes ? handleLeave : undefined}
      onFocus={routes ? handleEnter : undefined}
      onBlur={routes ? handleLeave : undefined}
      style={LINK_STYLE}
      aria-label={`${name} — open profile`}
    >
      {name}
    </button>
  );
}
