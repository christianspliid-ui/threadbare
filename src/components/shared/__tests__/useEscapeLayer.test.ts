// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { getEscapeLayerCount, pushEscapeLayer } from '../useEscapeLayer';

const escape = () => fireEvent.keyDown(document, { key: 'Escape' });

describe('escape layer registry (THR-1816)', () => {
  const pops: Array<() => void> = [];
  afterEach(() => {
    while (pops.length) pops.pop()!();
  });

  it('runs only the highest band, whatever the registration order', () => {
    const modal = vi.fn();
    const veil = vi.fn();
    pops.push(pushEscapeLayer(65, modal));
    pops.push(pushEscapeLayer(50, veil));
    escape();
    expect(modal).toHaveBeenCalledTimes(1);
    expect(veil).not.toHaveBeenCalled();
  });

  it('breaks a band tie by the later registration', () => {
    const first = vi.fn();
    const second = vi.fn();
    pops.push(pushEscapeLayer(60, first));
    pops.push(pushEscapeLayer(60, second));
    escape();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('hands the next Escape to the layer below once the top unregisters', () => {
    const veil = vi.fn();
    const sheet = vi.fn();
    pops.push(pushEscapeLayer(50, veil));
    const popSheet = pushEscapeLayer(65, sheet);
    escape();
    popSheet();
    escape();
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(veil).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys and stays fail-soft when a handler throws', () => {
    const below = vi.fn();
    pops.push(pushEscapeLayer(10, below));
    pops.push(pushEscapeLayer(60, () => { throw new Error('boom'); }));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(() => escape()).not.toThrow();
    expect(below).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('empties when every layer unregisters', () => {
    const pop = pushEscapeLayer(60, () => {});
    expect(getEscapeLayerCount()).toBe(1);
    pop();
    expect(getEscapeLayerCount()).toBe(0);
  });
});
