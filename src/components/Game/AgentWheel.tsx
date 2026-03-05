/**
 * AgentWheel — SVG Radial Menu Component
 *
 * An interactive radial menu overlaid on a selected agent's hex.
 * Displays available interventions and observations in a circular layout.
 */

import type { WheelSlot } from '../../engine/wheel';

// ─── Constants ─────────────────────────────────────────────────────────────

const WHEEL_RADIUS = 80;
const SLOT_RADIUS = 14;
const BACKDROP_RADIUS = 120;

const SLOT_GLYPHS: Record<string, string> = {
  scry: '👁',
  dream: '💭',
  persuade: '🗣',
  deceive: '🎭',
  intimidate: '💀',
  inspire: '✨',
  coincidence: '🎲',
  omen: '🌑',
  afflict_bless: '⚡',
};

// ─── Polar to Cartesian Helper ─────────────────────────────────────────────

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

// ─── Component Props ──────────────────────────────────────────────────────

export interface AgentWheelProps {
  slots: WheelSlot[];
  agentName: string;
  agentTitle: string | null;
  cx: number;
  cy: number;
  onSlotClick: (slotId: string) => void;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AgentWheel(props: AgentWheelProps) {
  const { slots, agentName, agentTitle, cx, cy, onSlotClick, onDismiss } = props;

  // Separate center slot from action slots
  const actionSlots = slots.filter((s) => s.id !== 'center');

  return (
    <g className="agent-wheel">
      {/* Backdrop circle (semi-transparent dark) */}
      <circle
        cx={cx}
        cy={cy}
        r={BACKDROP_RADIUS}
        fill="#000000"
        opacity={0.3}
        style={{ cursor: 'pointer' }}
        data-backdrop="true"
        onClick={onDismiss}
      />

      {/* Outer ring circle (decorative) */}
      <circle
        cx={cx}
        cy={cy}
        r={WHEEL_RADIUS}
        fill="none"
        stroke="#d4a574"
        strokeWidth={2}
        opacity={0.6}
        data-ring="true"
      />

      {/* Render action slots (scry, dream, persuade, etc.) */}
      {actionSlots.map((slot) => {
        const { x: slotX, y: slotY } = polarToCartesian(
          cx,
          cy,
          WHEEL_RADIUS,
          slot.angleDeg
        );

        const isAvailable = slot.available;
        const slotColor = isAvailable ? '#d4a574' : '#57534e';
        const opacity = isAvailable ? 1 : 0.3;
        const glyph = SLOT_GLYPHS[slot.id] || '⚪';

        return (
          <g
            key={slot.id}
            data-slot-id={slot.id}
            opacity={opacity}
            onClick={() => {
              if (isAvailable) {
                onSlotClick(slot.id);
              }
            }}
            style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
          >
            {/* Slot circle background */}
            <circle
              cx={slotX}
              cy={slotY}
              r={SLOT_RADIUS}
              fill="none"
              stroke={slotColor}
              strokeWidth={2}
            />

            {/* Slot glyph/icon */}
            <text
              x={slotX}
              y={slotY}
              textAnchor="middle"
              dy="0.3em"
              fontSize="20"
              fill={slotColor}
              pointerEvents="none"
            >
              {glyph}
            </text>

            {/* Slot label below the circle */}
            <text
              x={slotX}
              y={slotY + SLOT_RADIUS + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#e8dcc4"
              fontFamily="Cinzel, serif"
              pointerEvents="none"
            >
              {slot.label}
            </text>
          </g>
        );
      })}

      {/* Center text: agent name and title */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#e8dcc4"
        fontFamily="Cinzel, serif"
        pointerEvents="none"
      >
        {agentName}
      </text>

      {agentTitle && (
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill="#a89968"
          fontFamily="Cinzel, serif"
          fontStyle="italic"
          pointerEvents="none"
        >
          {agentTitle}
        </text>
      )}
    </g>
  );
}
