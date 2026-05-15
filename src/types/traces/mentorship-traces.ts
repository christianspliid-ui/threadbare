/**
 * Mentorship Trace Variants (THR-75)
 *
 * Strongly-typed trace entries emitted by phaseMentorship and mentorshipOutcomes.
 * Registered in `TRACE_CATEGORIES` and the trace union in `traceBuffer.ts`.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §4.7
 */

import type { ReachDomain } from '../traits';

/** Reasons a mentorship can be severed. */
export type MentorshipSeveredReason =
  | 'falling_out'
  | 'dissolution'
  | 'incomplete'
  | 'mentor_lost'
  | 'failed'
  | 'divine_sever';

export interface MentorshipOfferedTrace {
  category: 'mentorship_offered';
  tick: number;
  agentId: string;       // apprentice (consistent with encounter-trace agentId convention)
  mentorId: string;
  apprenticeId: string;
  domain: ReachDomain;
  initiativeId: string;
  summary: string;
}

export interface MentorshipStartedTrace {
  category: 'mentorship_started';
  tick: number;
  agentId: string;       // apprentice
  mentorId: string;
  apprenticeId: string;
  domain: ReachDomain;
  summary: string;
}

export interface MentorshipLessonTrace {
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

export interface MentorshipGraduatedTrace {
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

export interface MentorshipSurpassedTrace {
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

export interface MentorshipSeveredTrace {
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
