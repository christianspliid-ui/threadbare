/**
 * Mentorship Trace Variants (THR-75)
 *
 * Strongly-typed trace entries emitted by phaseMentorship and mentorshipOutcomes.
 * Registered in `TRACE_CATEGORIES` and the trace union in `traceBuffer.ts`.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §4.7
 */

import type { ReachDomain } from '../traits';
// Type-only, and deliberately circular: `trace.ts` names these interfaces as
// `TraceEntry` members (THR-1065) while they extend its base. `import type` is
// erased at build, so the cycle never reaches the module graph.
import type { TraceBase } from '../trace';

/** Reasons a mentorship can be severed. */
export type MentorshipSeveredReason =
  | 'falling_out'
  | 'dissolution'
  | 'incomplete'
  | 'mentor_lost'
  | 'failed'
  | 'divine_sever';

export interface MentorshipOfferedTrace extends TraceBase {
  category: 'mentorship_offered';
  tick: number;
  agentId: string;       // apprentice (consistent with encounter-trace agentId convention)
  mentorId: string;
  apprenticeId: string;
  domain: ReachDomain;
  initiativeId: string;
  summary: string;
}

export interface MentorshipStartedTrace extends TraceBase {
  category: 'mentorship_started';
  tick: number;
  agentId: string;       // apprentice
  mentorId: string;
  apprenticeId: string;
  domain: ReachDomain;
  summary: string;
}

export interface MentorshipLessonTrace extends TraceBase {
  category: 'mentorship_lesson';
  tick: number;
  agentId: string;       // apprentice
  mentorId: string;
  apprenticeId: string;
  lessonNumber: number;  // 1..3 (one of MILESTONE_THRESHOLDS)
  progress: number;      // 0.0–1.0
  bondQuality: number;   // -1.0–+1.0
  summary: string;
}

export interface MentorshipGraduatedTrace extends TraceBase {
  category: 'mentorship_graduated';
  tick: number;
  agentId: string;       // apprentice
  mentorId: string;
  apprenticeId: string;
  domain: ReachDomain;
  traitId: string | null;  // null on fail-soft trait-grant failure
  bondQuality: number;
  summary: string;
}

export interface MentorshipSurpassedTrace extends TraceBase {
  category: 'mentorship_surpassed';
  tick: number;
  agentId: string;       // apprentice (the one who exceeded)
  mentorId: string;
  apprenticeId: string;
  domain: ReachDomain;
  apprenticeTier: number;
  mentorTier: number;
  summary: string;
}

export interface MentorshipSeveredTrace extends TraceBase {
  category: 'mentorship_severed';
  tick: number;
  agentId: string;       // apprentice
  mentorId: string;
  apprenticeId: string;
  reason: MentorshipSeveredReason;
  bondQuality: number;
  summary: string;
}

export type MentorshipTraceEntry =
  | MentorshipOfferedTrace
  | MentorshipStartedTrace
  | MentorshipLessonTrace
  | MentorshipGraduatedTrace
  | MentorshipSurpassedTrace
  | MentorshipSeveredTrace;

export const MENTORSHIP_TRACE_CATEGORIES = [
  'mentorship_offered',
  'mentorship_started',
  'mentorship_lesson',
  'mentorship_graduated',
  'mentorship_surpassed',
  'mentorship_severed',
] as const;

export type MentorshipTraceCategory = typeof MENTORSHIP_TRACE_CATEGORIES[number];
