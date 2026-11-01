/**
 * StoryBeatModal — the story-beat moment (the pacing governor's story_beat tier).
 *
 * Fires when the pacing governor fires a story_beat encounter. The simulation
 * auto-pauses while it is open. The player reads the encounter details and
 * continues; it auto-resolves in the background, returning to normal play.
 *
 * THR-1892 (plan THR-1877 § D4): a story beat plays on the Stage, in the compact
 * layout — `StoryBeatStageBody` is its body there, with the Stage's context line
 * ("Maren Ashfold at Millbrook") under its title. `StoryBeatModal` keeps the same
 * words in a `Modal` for any host that has no Stage (a lab or a test).
 */

import { memo, type ReactNode } from 'react';
import { Modal } from '../shared/Modal';
import { EntityLink } from '../shared/EntityLink';
import { REACH_DISPLAY_NAMES } from '../../engine/aftermathWords';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { StageContextLineVM } from '../../engine/views/stage/stageView';
import { STAGE_WORDS } from '../../data/view-content';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';
import type { ReachDomain } from '../../types/traits';
import { ReachIcon } from '../icons/ReachIcon';
import { REACH_TO_SPHERE } from '../icons/constants';
import { StageLabelIcon } from './stage/StageLabelIcon';
import { StageSubjectPortrait } from './stage/StageSubjectPortrait';

/** The words a story beat says (unchanged by its move onto the Stage). */
export const STORY_BEAT_WORDS = {
  eyebrow: 'Story beat',
  unfolding: 'This encounter is unfolding in the world. The outcome will be resolved automatically.',
  continue: 'Continue',
  /** Fills `{actor}` when the beat has no named mortal. */
  someone: 'someone',
} as const;

// ─── Props ──────────────────────────────────────────────────────────

interface StoryBeatModalProps {
  open: boolean;
  onDismiss: () => void;
  template: UnifiedActionTemplate | null;
  agentName: string;
}

// ─── Reach Badge ────────────────────────────────────────────────────

function ReachBadge({ reach }: { reach: string }) {
  // THR-2100 (R2) — the reach word keeps its mark beside it; an unknown reach shows the word alone.
  const known = Object.prototype.hasOwnProperty.call(REACH_TO_SPHERE, reach);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      background: 'var(--dlg-inset, var(--bg-surface))',
      border: '1px solid var(--border-subtle)',
      borderRadius: '4px',
      padding: '2px 8px',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 'var(--text-xs)',
      color: 'var(--text-secondary)',
    }}>
      {known && <ReachIcon reach={reach as ReachDomain} size={16} />}
      {REACH_DISPLAY_NAMES[reach] ?? reach}
    </span>
  );
}

// ─── Shared parts ───────────────────────────────────────────────────

function StoryBeatTitle({ template, byline }: { template: UnifiedActionTemplate; byline: ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      alignItems: 'center',
      textAlign: 'center',
      padding: 'var(--space-2) 0',
    }}>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 'var(--text-xs)',
        color: 'var(--dlg-accent-text, var(--accent-gold))',
      }}>
        <StageLabelIcon label="storyBeatEyebrow" />
        {STORY_BEAT_WORDS.eyebrow}
      </span>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        color: 'var(--text-primary)',
        margin: 0,
      }}>
        {template.name}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {byline}
        <ReachBadge reach={template.reach} />
      </div>
    </div>
  );
}

/**
 * A template's prose names its actor as `{actor}`; the beat fills it with the mortal's name,
 * so no token reaches the screen (Law 43). With no name the word is "someone".
 */
export function fillStoryBeatActor(text: string, agentName: string): string {
  return text.replace(/\{actor\}/g, agentName || STORY_BEAT_WORDS.someone);
}

function StoryBeatProse({ template, agentName }: { template: UnifiedActionTemplate; agentName: string }) {
  return (
    <>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        fontStyle: 'italic',
        textAlign: 'center',
        margin: '0 auto var(--space-4)',
        maxWidth: 'var(--measure-prose)',
      }}>
        {fillStoryBeatActor(template.description ?? '', agentName)}
      </p>

      {template.narrativeTemplates?.initiation && (
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textAlign: 'center',
          margin: '0 auto var(--space-4)',
          maxWidth: 'var(--measure-prose)',
        }}>
          {/* THR-1040: fail-soft — omitted by whole faction sets despite being required on the type. */}
          {fillStoryBeatActor(template.narrativeTemplates?.initiation ?? '', agentName)}
        </p>
      )}

      <div style={{
        background: 'var(--dlg-inset, var(--bg-surface))',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 'var(--measure-prose)',
        margin: '0 auto',
      }}>
        {STORY_BEAT_WORDS.unfolding}
      </div>
    </>
  );
}

function ContinueButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button
        onClick={onDismiss}
        data-story-beat-continue=""
        style={{
          background: 'var(--accent-gold)',
          color: 'var(--bg-deep)',
          border: 'none',
          borderRadius: '4px',
          padding: 'var(--space-2) var(--space-6)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        {STORY_BEAT_WORDS.continue}
      </button>
    </div>
  );
}

/** The Stage's compact context line: each name is a link with its tooltip (Laws 1, 21). */
export function StageContextLine({ line }: { line: StageContextLineVM | null }) {
  if (!line) return null;
  const { subject, place } = line;
  return (
    <span data-stage-context-line="" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
      {subject && <EntityLink id={subject.ref.id} name={subject.name} entityRef={subject.ref} />}
      {subject && place && STAGE_WORDS.contextJoin}
      {!subject && place && STAGE_WORDS.contextAtOnly}
      {place && <EntityLink id={place.ref.id} name={place.name} entityRef={place.ref} />}
    </span>
  );
}

// ─── On the Stage (compact) ─────────────────────────────────────────

export function StoryBeatStageBody({
  template,
  contextLine,
  subjectVisual = null,
  agentName,
  onDismiss,
}: {
  template: UnifiedActionTemplate;
  contextLine: StageContextLineVM | null;
  /** THR-2100 — the mortal's face (`StageVM.subjectVisual`), at the left of the title block. */
  subjectVisual?: EntityVisualDescriptor | null;
  agentName: string;
  onDismiss: () => void;
}) {
  // The context line names the subject and the place; without one, the old byline.
  const byline = contextLine
    ? <StageContextLine line={contextLine} />
    : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{agentName}</span>;
  return (
    <div data-story-beat-stage="" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: 'var(--panel-padding, 20px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <StageSubjectPortrait visual={subjectVisual} subject={contextLine?.subject} />
        <StoryBeatTitle template={template} byline={byline} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-4) 0' }}>
        <StoryBeatProse template={template} agentName={agentName} />
      </div>
      <ContinueButton onDismiss={onDismiss} />
    </div>
  );
}

// ─── As a dialog (no Stage) ─────────────────────────────────────────

export const StoryBeatModal = memo(function StoryBeatModal({
  open,
  onDismiss,
  template,
  agentName,
}: StoryBeatModalProps) {
  if (!template) return null;

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      context="story"
      aria-label={`Story beat: ${template.name}`}
    >
      <Modal.Header>
        <StoryBeatTitle
          template={template}
          byline={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{agentName}</span>}
        />
      </Modal.Header>
      <Modal.Body>
        <StoryBeatProse template={template} agentName={agentName} />
      </Modal.Body>
      <Modal.Footer>
        <ContinueButton onDismiss={onDismiss} />
      </Modal.Footer>
    </Modal>
  );
});
