/**
 * Icon — THR-1834's carved family behind one primitive (THR-1885, plan THR-1821 § Icon).
 *
 * - **Registry name → shape**, through the one resolver `iconShape` (Law 3). `name` is an
 *   `IconName`, so an unknown literal does not compile; a name that still arrives unknown at
 *   runtime draws the `fallback` mark and warns once (Law 4).
 * - **Named sizes** (Law 11), in rem so they step up with the root at ≥ 2560.
 * - **`currentColor`** — every path fills the parent's colour. Sphere colour, gold and
 *   polarity reach the icon through `color`, never through a recoloured shape.
 * - **Meaning-bearing needs words.** The props are a union: `decorative` (a word sits
 *   beside it; renders `aria-hidden`) **or** `label` (it carries meaning alone; renders
 *   `role="img"` with that name). An unlabelled meaning-bearing icon does not type-check.
 *   `tooltipId` wraps it in `Tooltip` — the first-contact explanation (Law 12).
 */

import type { CSSProperties } from 'react';
import type { IconName } from '../../data/icons/iconRegistry';
import { iconShape } from './iconShape';
import { Tooltip } from './Tooltip';

export type IconSize = 'floor' | 'chip' | 'list' | 'alone';

/** Named icon sizes in rem — 14 / 18 / 24 / 34 px at 1080p (Law 11). */
export const ICON_SIZE_REM: Readonly<Record<IconSize, number>> = {
  floor: 0.875,
  chip: 1.125,
  list: 1.5,
  alone: 2.125,
};

interface IconBaseProps {
  name: IconName;
  /** Default `list`. `alone` is for an icon that carries meaning with no word beside it. */
  size?: IconSize;
  /** A tooltip registry id; wraps the icon in `Tooltip` (Law 12). */
  tooltipId?: string;
  className?: string;
  style?: CSSProperties;
}

/** A word label sits beside the icon, so it is hidden from assistive tech. */
interface DecorativeIconProps extends IconBaseProps {
  decorative: true;
  label?: never;
}

/** The icon carries meaning alone; `label` is its accessible name. */
interface LabelledIconProps extends IconBaseProps {
  label: string;
  decorative?: never;
}

export type IconProps = DecorativeIconProps | LabelledIconProps;

export function Icon(props: IconProps) {
  const { name, size = 'list', tooltipId, className, style } = props;
  const shape = iconShape(name);
  const rem = `${ICON_SIZE_REM[size]}rem`;
  const a11y = props.decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': props.label } as const);

  const svg = (
    <svg
      viewBox={shape.viewBox}
      width={rem}
      height={rem}
      fill="currentColor"
      focusable="false"
      data-icon={name}
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      {...a11y}
    >
      {shape.paths.map((path, i) => (
        <path key={i} d={path.d} opacity={path.opacity} />
      ))}
    </svg>
  );

  return tooltipId ? <Tooltip id={tooltipId}>{svg}</Tooltip> : svg;
}
