/**
 * Buy your spheres — the Remembrance spheres sub-step (THR-1749).
 *
 * Four opposed-pair rows; each is one `role="slider"` track with a pole at each
 * end and seven positions (three toward each pole, one in the middle for
 * neither). Opens pre-filled from the hunger's preset, so one Continue keeps
 * the god the hunger suggested. Positions that would overspend are dimmed and
 * carry their reason; Continue stays disabled, with its reason, until nothing
 * is left to pour. Levels and what is left read in words (Law 13).
 */

import { useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { SphereIcon } from '../shared/SphereIcon';
import { Tooltip } from '../shared/Tooltip';
import { getSphereColor } from '../../data/sphereIcons';
import {
  REMEMBRANCE_SPHERE_COPY,
  SPHERE_BUY_LINES,
  SPHERE_POINT_BUDGET,
  SPHERE_POINT_CAP,
  sphereLeftToPourWord,
} from '../../data/sphere-points-content';
import type { SpherePoints } from '../../engine/spherePoints';
import {
  SPHERE_BUY_PAIRS,
  isPositionAffordable,
  pointsFromPositions,
  positionsFromPoints,
  rowReading,
  spentOf,
  sphereWord,
} from './sphereBuy';
import { ChooseAgainButton } from './remembranceChoice';

interface SpheresStepProps {
  /** The hunger's preset — the step opens on it, and "As my hunger shaped me" returns to it. */
  preset: SpherePoints;
  visible: boolean;
  onConfirm: (points: SpherePoints) => void;
  onChooseAgain: () => void;
}

const POSITIONS = Array.from({ length: SPHERE_POINT_CAP * 2 + 1 }, (_, i) => i - SPHERE_POINT_CAP);

const proseFont = { fontFamily: 'var(--font-prose)', fontStyle: 'italic' as const };

export function SpheresStep({ preset, visible, onConfirm, onChooseAgain }: SpheresStepProps) {
  const presetPositions = useMemo(() => positionsFromPoints(preset), [preset]);
  const [positions, setPositions] = useState<number[]>(presetPositions);
  const [blockedRow, setBlockedRow] = useState<number | null>(null);

  const remaining = SPHERE_POINT_BUDGET - spentOf(positions);
  const isPreset = positions.every((v, i) => v === presetPositions[i]);

  const setRow = useCallback((row: number, position: number) => {
    if (!isPositionAffordable(positions, row, position)) {
      setBlockedRow(row);
      return;
    }
    setBlockedRow(null);
    const next = [...positions];
    next[row] = position;
    setPositions(next);
  }, [positions]);

  const handleKeyDown = useCallback((row: number, e: ReactKeyboardEvent<HTMLDivElement>) => {
    const current = positions[row];
    let target: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target = current - 1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target = current + 1;
    else if (e.key === 'Home') target = 0;
    if (target === null) return;
    e.preventDefault();
    if (Math.abs(target) > SPHERE_POINT_CAP) return;
    setRow(row, target);
  }, [positions, setRow]);

  const handleContinue = useCallback(() => {
    if (remaining !== 0) return;
    onConfirm(pointsFromPositions(positions));
  }, [remaining, positions, onConfirm]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      data-testid="spheres-step"
      style={{
        padding: '4vh 6vw',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}
    >
      <p style={{ ...proseFont, fontSize: '1.5rem', color: 'rgba(196,180,155,0.6)', letterSpacing: '0.06em', marginBottom: '3vh' }}>
        {REMEMBRANCE_SPHERE_COPY.prompt}
      </p>

      <div className="flex flex-col" style={{ gap: '2.2vh', width: 'min(1100px, 100%)' }}>
        {SPHERE_BUY_PAIRS.map(([left, right], row) => {
          const position = positions[row];
          const reading = rowReading(row, position, REMEMBRANCE_SPHERE_COPY.neither);
          const leftLabel = sphereWord(left);
          const rightLabel = sphereWord(right);
          const pole = (sphere: typeof left, active: boolean, align: 'left' | 'right') => {
            const color = getSphereColor(sphere);
            return (
              <div
                className="flex flex-col"
                data-testid={`sphere-pole-${sphere}`}
                data-active={active ? 'true' : 'false'}
                style={{
                  width: '300px',
                  alignItems: align === 'left' ? 'flex-end' : 'flex-start',
                  textAlign: align,
                  opacity: active ? 1 : 0.55,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <Tooltip id={`sphere.${sphere}`}>
                  <span className="inline-flex items-center" style={{ gap: '8px', flexDirection: align === 'left' ? 'row-reverse' : 'row' }}>
                    <span style={{
                      display: 'inline-flex',
                      borderRadius: '50%',
                      boxShadow: active ? `0 0 18px ${color}88` : 'none',
                      transition: 'box-shadow 0.4s ease',
                    }}>
                      <SphereIcon sphere={sphere} size={28} />
                    </span>
                    <span style={{ ...proseFont, fontSize: '1.2rem', color: active ? color : 'rgba(212,196,158,0.75)' }}>
                      {sphereWord(sphere)}
                    </span>
                  </span>
                </Tooltip>
                <span style={{ ...proseFont, fontSize: 'var(--text-xs)', color: 'rgba(180,170,140,0.55)', marginTop: '2px' }}>
                  {SPHERE_BUY_LINES[sphere as keyof typeof SPHERE_BUY_LINES]}
                </span>
              </div>
            );
          };
          return (
            <div key={left} className="flex flex-col items-center" data-testid={`sphere-row-${left}-${right}`}>
              <div className="flex items-center" style={{ gap: '24px' }}>
                {pole(left, position < 0, 'left')}
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label={`${leftLabel} and ${rightLabel}: ${reading}`}
                  aria-valuemin={-SPHERE_POINT_CAP}
                  aria-valuemax={SPHERE_POINT_CAP}
                  aria-valuenow={position}
                  aria-valuetext={reading}
                  data-testid={`sphere-track-${row}`}
                  onKeyDown={e => handleKeyDown(row, e)}
                  className="flex items-center remembrance-choice"
                  style={{ gap: '10px', padding: '6px 10px', borderRadius: '999px', outlineOffset: '4px' }}
                >
                  {POSITIONS.map(p => {
                    const affordable = isPositionAffordable(positions, row, p);
                    const selected = p === position;
                    const filled = p !== 0 && Math.sign(p) === Math.sign(position) && Math.abs(p) <= Math.abs(position);
                    const tint = p < 0 ? getSphereColor(left) : p > 0 ? getSphereColor(right) : 'rgba(196,180,155,0.8)';
                    return (
                      <button
                        key={p}
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        data-testid={`sphere-pos-${row}-${p}`}
                        data-affordable={affordable ? 'true' : 'false'}
                        title={affordable ? rowReading(row, p, REMEMBRANCE_SPHERE_COPY.neither) : REMEMBRANCE_SPHERE_COPY.overspend}
                        onClick={() => setRow(row, p)}
                        className="cursor-pointer"
                        style={{
                          width: p === 0 ? '14px' : '22px',
                          height: p === 0 ? '14px' : '22px',
                          borderRadius: '50%',
                          border: `1px solid ${selected ? tint : 'rgba(196,180,155,0.3)'}`,
                          background: filled ? `${tint}cc` : selected ? `${tint}55` : 'transparent',
                          boxShadow: filled ? `0 0 10px ${tint}66` : 'none',
                          opacity: affordable ? 1 : 0.2,
                          cursor: affordable ? 'pointer' : 'not-allowed',
                          transition: 'background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
                          padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
                {pole(right, position > 0, 'right')}
              </div>
              <p style={{ ...proseFont, fontSize: 'var(--text-xs)', color: 'rgba(212,196,158,0.7)', marginTop: '4px' }} data-testid={`sphere-reading-${row}`}>
                {reading}
              </p>
              <p style={{ ...proseFont, fontSize: 'var(--text-xs)', color: 'rgba(150,140,120,0.45)' }}>
                {REMEMBRANCE_SPHERE_COPY.pairCaption.replace('{left}', leftLabel).replace('{right}', rightLabel)}
              </p>
              {blockedRow === row && (
                <p role="status" data-testid={`sphere-blocked-${row}`} style={{ ...proseFont, fontSize: 'var(--text-xs)', color: 'rgba(222,170,140,0.8)' }}>
                  {REMEMBRANCE_SPHERE_COPY.overspend}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p data-testid="sphere-left-to-pour" style={{ ...proseFont, fontSize: '1.1rem', color: 'rgba(212,196,158,0.75)', marginTop: '3vh' }}>
        {REMEMBRANCE_SPHERE_COPY.leftToPour} {sphereLeftToPourWord(remaining)}
      </p>

      <div className="flex flex-col items-center" style={{ marginTop: '1.5vh', gap: '4px' }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={remaining !== 0}
          aria-disabled={remaining !== 0}
          data-testid="spheres-confirm"
          className="remembrance-choice"
          style={{
            background: 'transparent',
            border: 'none',
            ...proseFont,
            fontSize: '1.1rem',
            color: remaining === 0 ? 'rgba(212,196,158,0.85)' : 'rgba(180,164,138,0.3)',
            letterSpacing: '0.08em',
            cursor: remaining === 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {REMEMBRANCE_SPHERE_COPY.continue}
        </button>
        {remaining !== 0 && (
          <p data-testid="spheres-confirm-reason" style={{ ...proseFont, fontSize: 'var(--text-xs)', color: 'rgba(180,164,138,0.55)' }}>
            {REMEMBRANCE_SPHERE_COPY.continueBlocked}
          </p>
        )}
        {!isPreset && (
          <button
            type="button"
            data-testid="spheres-preset"
            onClick={() => { setPositions(presetPositions); setBlockedRow(null); }}
            className="remembrance-choice cursor-pointer"
            style={{ background: 'transparent', border: 'none', ...proseFont, fontSize: 'var(--text-xs)', color: 'rgba(180,164,138,0.5)' }}
          >
            {REMEMBRANCE_SPHERE_COPY.preset}
          </button>
        )}
        <ChooseAgainButton onClick={onChooseAgain} color="rgba(180,164,138,0.4)" />
      </div>
    </div>
  );
}
