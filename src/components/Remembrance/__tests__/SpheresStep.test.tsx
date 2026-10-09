// @vitest-environment jsdom
/**
 * THR-1749 — the Remembrance spheres buy cannot produce an illegal vector:
 * opposed poles share one track, overspending positions are disabled with the
 * reason, Continue is disabled until nothing is left to pour.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpheresStep } from '../SpheresStep';
import { describeSpherePour, pointsFromPositions, positionsFromPoints } from '../sphereBuy';
import { validateSpherePoints } from '../../../engine/spherePoints';
import { REMEMBRANCE_SPHERE_COPY } from '../../../data/sphere-points-content';

// Rows: 0 force↔mind, 1 matter↔time, 2 energy↔spirit, 3 life↔entropy.
const PRESET = { mind: 3, spirit: 2 };

function renderStep(onConfirm = vi.fn()) {
  render(<SpheresStep preset={PRESET} visible onConfirm={onConfirm} onChooseAgain={vi.fn()} />);
  return onConfirm;
}

describe('SpheresStep', () => {
  it('opens on the preset; Continue confirms it unchanged', () => {
    const onConfirm = renderStep();
    expect(screen.getByTestId('sphere-reading-0').textContent).toBe('a flood of Mind');
    expect(screen.getByTestId('sphere-reading-2').textContent).toBe('a current of Spirit');
    expect(screen.getByTestId('sphere-left-to-pour').textContent).toContain('nothing');
    expect(screen.queryByTestId('spheres-preset')).toBeNull();
    fireEvent.click(screen.getByTestId('spheres-confirm'));
    expect(onConfirm).toHaveBeenCalledWith({ mind: 3, spirit: 2 });
  });

  it('one track per opposed pair — moving to a pole clears the other', () => {
    renderStep();
    fireEvent.click(screen.getByTestId('sphere-pos-0--2')); // two toward Force
    expect(screen.getByTestId('sphere-reading-0').textContent).toBe('a current of Force');
    expect(screen.getByTestId('sphere-pole-mind').getAttribute('data-active')).toBe('false');
  });

  it('an overspending position is disabled and shows the reason', () => {
    renderStep();
    // All five points are poured; a third row cannot take any.
    expect(screen.getByTestId('sphere-pos-1-1').getAttribute('data-affordable')).toBe('false');
    fireEvent.click(screen.getByTestId('sphere-pos-1-1'));
    expect(screen.getByTestId('sphere-reading-1').textContent).toBe(REMEMBRANCE_SPHERE_COPY.neither);
    expect(screen.getByTestId('sphere-blocked-1').textContent).toBe(REMEMBRANCE_SPHERE_COPY.overspend);
  });

  it('Continue is disabled with its reason until everything is poured; the preset link restores', () => {
    const onConfirm = renderStep();
    fireEvent.click(screen.getByTestId('sphere-pos-0-1')); // Mind 3 → a trace of Mind (positive = the right pole)
    expect(screen.getByTestId('sphere-left-to-pour').textContent).toContain('some');
    const confirm = screen.getByTestId('spheres-confirm') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(screen.getByTestId('spheres-confirm-reason').textContent).toBe(REMEMBRANCE_SPHERE_COPY.continueBlocked);
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('spheres-preset'));
    expect(screen.getByTestId('sphere-reading-0').textContent).toBe('a flood of Mind');
  });

  it('keyboard: arrows move a track and its value text reads in words', () => {
    renderStep();
    const track = screen.getByTestId('sphere-track-0');
    expect(track.getAttribute('role')).toBe('slider');
    fireEvent.keyDown(track, { key: 'ArrowLeft' });
    expect(track.getAttribute('aria-valuetext')).toBe('a current of Mind');
    fireEvent.keyDown(track, { key: 'Home' });
    expect(track.getAttribute('aria-valuetext')).toBe(REMEMBRANCE_SPHERE_COPY.neither);
  });

  it('a 2/1/1/1 buy reaches Continue as a legal vector', () => {
    const onConfirm = renderStep();
    fireEvent.click(screen.getByTestId('sphere-pos-0-0'));   // clear Mind
    fireEvent.click(screen.getByTestId('sphere-pos-2-0'));   // clear Spirit
    fireEvent.click(screen.getByTestId('sphere-pos-0--2'));  // Force 2
    fireEvent.click(screen.getByTestId('sphere-pos-1--1'));  // Matter 1
    fireEvent.click(screen.getByTestId('sphere-pos-2--1'));  // Energy 1
    fireEvent.click(screen.getByTestId('sphere-pos-3--1'));  // Life 1
    fireEvent.click(screen.getByTestId('spheres-confirm'));
    const bought = onConfirm.mock.calls[0][0];
    expect(bought).toEqual({ force: 2, matter: 1, energy: 1, life: 1 });
    expect(validateSpherePoints(bought)).toEqual({ ok: true });
  });

  it('two stirring spheres take the plural verb', () => {
    expect(describeSpherePour({ force: 2, matter: 1, energy: 1, life: 1 }).stir).toBe('Energy and Life stir beneath.');
  });
});

describe('sphereBuy helpers', () => {
  it('positions and points round-trip', () => {
    const p = { force: 2, time: 1, spirit: 1, life: 1 };
    expect(pointsFromPositions(positionsFromPoints(p))).toEqual(p);
  });

  it('reveal words name the two largest and stir the rest, canonical order on ties', () => {
    expect(describeSpherePour({ mind: 3, spirit: 2 })).toEqual({ pour: 'Mind and Spirit pour through you.', stir: null });
    // 2/2/1: Matter before Spirit in canonical order; Life stirs beneath.
    expect(describeSpherePour({ spirit: 2, matter: 2, life: 1 })).toEqual({
      pour: 'Matter and Spirit pour through you.',
      stir: 'Life stirs beneath.',
    });
  });
});
