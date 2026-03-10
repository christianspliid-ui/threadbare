import type { TraceEntry } from './types/trace';

export interface DebugBridge {
  getTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  enableTracing: () => Promise<void>;
  disableTracing: () => Promise<void>;
  isTracingEnabled: () => Promise<boolean>;
  clearTraces: () => Promise<void>;
}

declare global {
  interface Window {
    __DEBUG?: DebugBridge;
  }
}
