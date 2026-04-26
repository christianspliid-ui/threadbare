import * as Sentry from '@sentry/react';

// Dev-only: captures errors during `npm run dev` sessions (ours + agents via preview_start).
// No production telemetry — we have no real end users, only agents developing the game.
if (import.meta.env.DEV) {
  Sentry.init({
    dsn: 'https://a721b2a8463e75cdaf787a93e372cc82@o4511247184887808.ingest.de.sentry.io/4511247196356688',
    sendDefaultPii: true,
    environment: 'development',
  });
}
