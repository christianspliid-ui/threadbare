export type ActivityKind =
  | 'boot'
  | 'swords'
  | 'coin'
  | 'hammer'
  | 'bandage'
  | 'hourglass'
  // THR-418 — sustained-control category icons (Hexes / Sources / folded-in Locations)
  | 'hex-claim'
  | 'source-bound'
  | 'claim-flag';

export interface ActivityIconProps {
  kind: ActivityKind;
  size?: number;
  color?: string;
}

const warned = new Set<string>();

export function ActivityIcon({ kind, size = 18, color = 'var(--text-secondary)' }: ActivityIconProps): JSX.Element | null {
  const glyph: Record<ActivityKind, JSX.Element> = {
    boot: (
      <path d="M6 4 L6 14 L4 14 L4 18 L16 18 L16 14 Q16 11 13 11 L10 11 L10 4 Z"
            fill={color} fillRule="evenodd"/>
    ),
    swords: (
      <g fill={color}>
        <path d="M3 3 L5 3 L14 12 L12 14 Z"/>
        <path d="M19 3 L17 3 L8 12 L10 14 Z"/>
        <rect x="11" y="13" width="2" height="7"/>
        <rect x="9" y="18" width="6" height="2"/>
      </g>
    ),
    coin: (
      <g fill={color}>
        <circle cx="11" cy="11" r="8"/>
        <circle cx="11" cy="11" r="5" fill="var(--bg-deep)"/>
        <rect x="10" y="7" width="2" height="8" fill={color}/>
        <path d="M8 11 L14 11" stroke="var(--bg-deep)" strokeWidth="1.5"/>
      </g>
    ),
    hammer: (
      <g fill={color}>
        <path d="M3 3 L11 3 L11 7 L17 7 L17 11 L11 11 L11 7 Z"/>
        <rect x="8.5" y="10" width="2" height="10" transform="rotate(-20 9.5 15)"/>
      </g>
    ),
    bandage: (
      <g fill={color}>
        <rect x="3" y="8" width="16" height="6" rx="2" transform="rotate(-20 11 11)"/>
        <circle cx="11" cy="11" r="1.5" fill="var(--bg-deep)"/>
        <circle cx="8" cy="12.5" r="1" fill="var(--bg-deep)"/>
        <circle cx="14" cy="9.5" r="1" fill="var(--bg-deep)"/>
      </g>
    ),
    hourglass: (
      <g fill={color}>
        <path d="M5 3 L17 3 L17 5 L13 11 L17 17 L17 19 L5 19 L5 17 L9 11 L5 5 Z"
              fillRule="evenodd"/>
        <path d="M7 5 L15 5 L11 10 Z" fill="var(--bg-deep)"/>
      </g>
    ),
    // THR-418 — sustained-control icons.
    // Pointy-top hex outline with a faint claim dot inside.
    'hex-claim': (
      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M11 2 L19 7 L19 15 L11 20 L3 15 L3 7 Z" />
        <circle cx="11" cy="11" r="1.5" fill={color} stroke="none" />
      </g>
    ),
    // Wellspring/spring glyph — a node with two converging streams.
    'source-bound': (
      <g fill={color}>
        <circle cx="11" cy="6" r="2.6" />
        <path d="M11 8.5 Q5 12 5 19 L7 19 Q7 13 11 11 Q15 13 15 19 L17 19 Q17 12 11 8.5 Z" />
      </g>
    ),
    // Pennant claim-flag.
    'claim-flag': (
      <g fill={color}>
        <rect x="5" y="3" width="1.8" height="17" />
        <path d="M7 3 L17 3 L13 7 L17 11 L7 11 Z" />
      </g>
    ),
  };

  const content = glyph[kind];
  if (!content) {
    if (import.meta.env.DEV && !warned.has(kind)) {
      warned.add(kind);
      console.warn(`ActivityIcon: unknown kind "${kind}"`);
    }
    return null;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 22 22" style={{ display: 'block', flexShrink: 0 }}>
      {content}
    </svg>
  );
}
