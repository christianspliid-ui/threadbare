import type { TraceEntry } from './types/trace';

export interface EncounterLogExportResult {
  allAgentsTsv: string;
  allAgentsFilename: string;
  perAgent: {
    id: string;
    name: string;
    tsv: string;
    filename: string;
  }[];
}

export interface EncounterLogSummary {
  trackedAgentCount: number;
  totalEvents: number;
  agentIds: string[];
}

export interface DebugBridge {
  openDebugPanel: () => void;
  closeDebugPanel: () => void;
  toggleDebugPanel: () => void;
  /** @internal React registers its toggle callback here */
  _registerDebugPanelToggle: (fn: (open?: boolean) => void) => void;
  getTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  enableTracing: () => Promise<void>;
  disableTracing: () => Promise<void>;
  isTracingEnabled: () => Promise<boolean>;
  clearTraces: () => Promise<void>;
  getCrashLog: () => Promise<unknown>;
  clearCrashLog: () => Promise<void>;
  getHealthReport: () => Promise<unknown>;
  exportDiagnostics: () => Promise<unknown>;
  getEncounterLogAll: () => Promise<EncounterLogSummary>;
  exportEncounterLogAll: (agentNames?: Record<string, string>, seed?: string) => Promise<EncounterLogExportResult>;
}

declare global {
  interface Window {
    __DEBUG?: DebugBridge;
  }
}
