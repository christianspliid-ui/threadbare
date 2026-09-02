/**
 * FollowToggle — the follow affordance (THR-1299 slice 4).
 *
 * One state, two surfaces: the JourneyTab header and the EncounterVeil context
 * strip both render this, and both write through `followAgent` / `unfollowAgent`
 * (the single writer). The toggle renders the three-way read **honestly** — a
 * mortal followed by bond shows *followed by bond — mute?* rather than a lying
 * unchecked box, because un-following them is a mute, not a removal, and the
 * player should see which gesture they are making.
 *
 * Follow state is game state (per save), not a Law 51 preference.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../../engine/graph';
import { isDefaultFollowed, isMuted } from '../../engine/followedAgents';
import { Button } from '../shared/Button';
import { Tooltip } from '../shared/Tooltip';

export interface FollowDescriptor {
  /** The one predicate — what `isFollowed` answers. */
  readonly followed: boolean;
  /** On the explicit list. */
  readonly explicit: boolean;
  /** Followed by court position (the god reached down to them). */
  readonly byBond: boolean;
  /** Default-followed but silenced. */
  readonly muted: boolean;
}

/** The three-way read for one agent, as the toggle renders it. */
export function describeFollow(
  state: Pick<GameState, 'followedAgentIds' | 'mutedAgentIds' | 'ascendantId'>,
  graph: WorldGraph,
  agentId: string,
): FollowDescriptor {
  const explicit = state.followedAgentIds?.includes(agentId) ?? false;
  const byBond = isDefaultFollowed(graph, state.ascendantId, agentId);
  const muted = isMuted(state as GameState, agentId);
  return { followed: !muted && (explicit || byBond), explicit, byBond, muted };
}

/** What the button says and what pressing it does, per state. */
export function followToggleCopy(d: FollowDescriptor): { label: string; action: string; tooltip: string } {
  if (d.muted) {
    return {
      label: 'Muted',
      action: 'Unmute',
      tooltip: 'Their bond follows them, but you have silenced their moments. Unmute to be interrupted again.',
    };
  }
  if (d.byBond && !d.explicit) {
    return {
      label: 'Followed by bond',
      action: 'Mute',
      tooltip: 'Your thread to them follows them by itself. Mute to keep the thread and stop the interruptions.',
    };
  }
  if (d.explicit) {
    return {
      label: 'Following',
      action: 'Unfollow',
      tooltip: 'Their moments interrupt you — a costly step, trouble, a finish. Unfollow and they wait on the thread row.',
    };
  }
  return {
    label: 'Not following',
    action: 'Follow',
    tooltip: 'Follow them and their moments interrupt you — a costly step, trouble, a doubling-down, a finish.',
  };
}

export interface FollowToggleProps {
  descriptor: FollowDescriptor;
  /** Flips follow state; the caller routes to `followAgent` or `unfollowAgent`. */
  onToggle: () => void;
  /** Where the toggle sits, for the trace and the test id. */
  surface: 'arc_panel' | 'encounter_ui';
  /** Compact renders the state as the button label only. */
  compact?: boolean;
}

export function FollowToggle({ descriptor, onToggle, surface, compact }: FollowToggleProps) {
  const copy = followToggleCopy(descriptor);
  return (
    <span
      data-testid={`follow-toggle-${surface}`}
      data-follow-state={descriptor.muted ? 'muted' : descriptor.followed ? (descriptor.explicit ? 'explicit' : 'bond') : 'none'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
    >
      {!compact && (
        <span style={{ fontSize: 'var(--text-xs)', color: descriptor.followed ? 'var(--accent-gold)' : 'var(--text-tertiary)' }}>
          {copy.label}
        </span>
      )}
      <Tooltip id="ui.follow_toggle" desc={copy.tooltip}>
        <Button
          variant={descriptor.followed ? 'secondary' : 'primary'}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          data-testid={`follow-toggle-${surface}-button`}
          aria-label={`${copy.action} — currently ${copy.label.toLowerCase()}`}
        >
          {copy.action}
        </Button>
      </Tooltip>
    </span>
  );
}
