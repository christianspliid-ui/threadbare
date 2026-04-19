// Shared types for the CC review wrapper system (THR-182)

export interface ReviewFinding {
  severity: 'minor' | 'major';
  category: string;
  description: string;
  file?: string;
  line?: number;
}

export interface ReviewFindings {
  verdict: 'none' | 'minor' | 'major' | 'skipped' | 'error';
  summary: string;
  findings: ReviewFinding[];
  reviewedAt: string; // ISO
}

export interface ReviewWrapperTrace {
  type: 'review-wrapper';
  wrapperVersion: string;
  started_at: string; // ISO
  ended_at: string; // ISO
  outcome: 'clean' | 'heartbeat-timeout' | 'wall-clock-timeout' | 'nonzero-exit' | 'user-cancel' | 'wrapper-crash';
  exit_code: number | null;
  elapsed_s: number;
  last_heartbeat_at: string | null;
  heartbeat_count: number;
  partial_output_path: string | null;
  findings_path: string | null;
  commit_trailer: string | null; // e.g. "review:ok", "review:skipped:heartbeat"
  findings: ReviewFindings | null;
}

export interface HeartbeatLine {
  heartbeat: true;
  elapsed_s: number;
  step: string;
}

export function isHeartbeat(line: unknown): line is HeartbeatLine {
  return (
    typeof line === 'object' &&
    line !== null &&
    (line as Record<string, unknown>).heartbeat === true
  );
}

export function isFindings(line: unknown): line is ReviewFindings {
  return (
    typeof line === 'object' &&
    line !== null &&
    typeof (line as Record<string, unknown>).verdict === 'string' &&
    Array.isArray((line as Record<string, unknown>).findings)
  );
}
