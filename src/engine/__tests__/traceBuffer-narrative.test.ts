import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ProseContext } from '../../types/narrative';
import { generateRoutineProse, generateNotableProse } from '../narrative';
import {
  enableTracing,
  disableTracing,
  getTraces,
  clearTraces,
} from '../traceBuffer';

describe('narrative generation tracing', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  describe('routine prose generation traces', () => {
    it('emits narrative_generation trace when routine prose is generated', () => {
      const context: ProseContext = {
        actorName: 'Thane Volkar',
        targetName: 'the Border Fortress',
        sphere: 'force',
      };

      generateRoutineProse('action_resolved', context, 42);

      const traces = getTraces();
      expect(traces.length).toBe(1);
      expect(traces[0].category).toBe('narrative_generation');
    });

    it('routine trace has tier=routine', () => {
      const context: ProseContext = {
        actorName: 'Kira',
        sphere: 'mind',
      };

      generateRoutineProse('trait_acquired', context, 99);

      const traces = getTraces();
      expect(traces[0].category).toBe('narrative_generation');
      const trace = traces[0] as any;
      expect(trace.tier).toBe('routine');
    });

    it('routine trace includes first 60 chars of prose in summary', () => {
      const context: ProseContext = {
        actorName: 'Champion Arven',
        sphere: 'energy',
      };

      generateRoutineProse('action_resolved', context, 77);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.summary).toBeDefined();
      expect(trace.summary.length).toBeGreaterThan(0);
      expect(trace.summary).toContain('Routine prose');
    });

    it('routine trace includes finalProse field', () => {
      const context: ProseContext = {
        actorName: 'Test Actor',
        sphere: 'matter',
      };

      const result = generateRoutineProse('action_resolved', context, 55);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.finalProse).toBeDefined();
      expect(trace.finalProse).toBe(result.text);
      expect(trace.finalProse.length).toBeGreaterThan(0);
    });

    it('routine trace includes sphereWords array', () => {
      const context: ProseContext = {
        actorName: 'Volkar',
        sphere: 'force',
      };

      generateRoutineProse('action_resolved', context, 42);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.sphereWords).toBeDefined();
      expect(Array.isArray(trace.sphereWords)).toBe(true);
      expect(trace.sphereWords.length).toBeGreaterThan(0);
    });
  });

  describe('notable prose generation traces', () => {
    it('emits narrative_generation trace when notable prose is generated', () => {
      const context: ProseContext = {
        actorName: 'Champion Arven',
        targetName: 'the Crystal Spire',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      generateNotableProse('action_critical', context, 42);

      const traces = getTraces();
      expect(traces.length).toBe(1);
      expect(traces[0].category).toBe('narrative_generation');
    });

    it('notable trace has tier=notable', () => {
      const context: ProseContext = {
        actorName: 'The Cunning Fox',
        sphere: 'mind',
        dominantValues: ['cunning_honesty'],
      };

      generateNotableProse('trait_acquired', context, 42);

      const traces = getTraces();
      expect(traces[0].category).toBe('narrative_generation');
      const trace = traces[0] as any;
      expect(trace.tier).toBe('notable');
    });

    it('notable trace includes first 60 chars of prose in summary', () => {
      const context: ProseContext = {
        actorName: 'Champion Arven',
        targetName: 'the Crystal Spire',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      generateNotableProse('action_critical', context, 77);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.summary).toBeDefined();
      expect(trace.summary.length).toBeGreaterThan(0);
      expect(trace.summary).toContain('Notable prose');
    });

    it('notable trace includes finalProse field', () => {
      const context: ProseContext = {
        actorName: 'Champion Arven',
        targetName: 'the Crystal Spire',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      const result = generateNotableProse('action_critical', context, 55);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.finalProse).toBeDefined();
      expect(trace.finalProse).toBe(result.text);
      expect(trace.finalProse.length).toBeGreaterThan(0);
    });

    it('notable trace includes personalityClause field', () => {
      const context: ProseContext = {
        actorName: 'Champion Arven',
        targetName: 'the Crystal Spire',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      generateNotableProse('action_critical', context, 42);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.personalityClause).toBeDefined();
    });

    it('notable trace includes sphereWords array', () => {
      const context: ProseContext = {
        actorName: 'Champion Arven',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      generateNotableProse('action_critical', context, 42);

      const traces = getTraces();
      const trace = traces[0] as any;
      expect(trace.sphereWords).toBeDefined();
      expect(Array.isArray(trace.sphereWords)).toBe(true);
      expect(trace.sphereWords.length).toBeGreaterThan(0);
    });
  });

  describe('tracing disabled', () => {
    it('emits no trace when tracing is disabled', () => {
      disableTracing();

      const context: ProseContext = {
        actorName: 'Volkar',
        sphere: 'force',
      };

      generateRoutineProse('action_resolved', context, 42);

      const traces = getTraces();
      expect(traces.length).toBe(0);
    });

    it('emits no trace for notable when tracing is disabled', () => {
      disableTracing();

      const context: ProseContext = {
        actorName: 'Champion Arven',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      generateNotableProse('action_critical', context, 42);

      const traces = getTraces();
      expect(traces.length).toBe(0);
    });
  });

  describe('multiple traces', () => {
    it('records multiple prose generations as separate traces', () => {
      const context1: ProseContext = {
        actorName: 'Volkar',
        sphere: 'force',
      };
      const context2: ProseContext = {
        actorName: 'Champion Arven',
        sphere: 'energy',
        dominantValues: ['courage_prudence'],
      };

      generateRoutineProse('action_resolved', context1, 42);
      generateNotableProse('action_critical', context2, 99);

      const traces = getTraces();
      expect(traces.length).toBe(2);
      expect(traces[0].category).toBe('narrative_generation');
      expect(traces[1].category).toBe('narrative_generation');

      const trace0 = traces[0] as any;
      const trace1 = traces[1] as any;
      expect(trace0.tier).toBe('routine');
      expect(trace1.tier).toBe('notable');
    });
  });
});
