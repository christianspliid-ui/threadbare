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
  /** Find an agent by id or partial name, zoom the camera to their hex, and select them. Returns true if found. */
  gotoAgent: (id: string) => boolean;
  /** @internal GameView registers its gotoAgent handler here */
  _registerGotoAgent: (fn: (id: string) => boolean) => void;
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
