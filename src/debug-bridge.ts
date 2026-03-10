/**
 * Dev-only debug bridge — exposes engine internals on window.__DEBUG
 * for Playwright-driven QA and interactive debugging.
 *
 * Tree-shaken in production: import.meta.env.DEV is statically replaced
 * by Vite, so the entire module becomes dead code in prod builds.
 */
if (import.meta.env.DEV) {
  window.__DEBUG = {
    getTraces: () => import('./engine/traceBuffer').then((m) => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then((m) => m.enableTracing()),
    disableTracing: () => import('./engine/traceBuffer').then((m) => m.disableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then((m) => m.isTracingEnabled()),
    clearTraces: () => import('./engine/traceBuffer').then((m) => m.clearTraces()),
  };
}
