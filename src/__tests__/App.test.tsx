// @vitest-environment jsdom
import { describe, it } from 'vitest';

describe('App', () => {
  describe('GamePhase start screen', () => {
    it.todo('defaults to start phase when no URL params');  // SC-2
    it.todo('transitions from start to worldgen on New World'); // SC-2
  });

  describe('dev view shortcuts', () => {
    it.todo('?view=game bypasses start screen');   // SC-3
    it.todo('?view=hexv2 bypasses start screen');  // SC-3
  });
});
