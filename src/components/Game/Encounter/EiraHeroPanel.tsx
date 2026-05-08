import React from 'react';
import { CapabilityStrip } from './CapabilityStrip';

export interface EncounterHeroPanelCapability {
  id: string;
  label: string;
  sphereLabel?: string;
  narrativeHint?: string;
  filledDots: number;
  totalDots?: number;
  accentColor?: string;
}

export interface EncounterHeroPanelItem {
  id: string;
  title: string;
  detail: string;
  tone?: 'default' | 'highlight';
}

export interface EncounterHeroPanelMoment {
  id: string;
  title: string;
  detail: string;
}

export interface EncounterHeroPanelVow {
  title: string;
  detail: string;
  accentColor?: string;
}

export interface EncounterHeroPanelData {
  name: string;
  subtitle?: string;
  statusLine?: string;
  portraitUrl?: string | null;
  portraitAlt?: string;
  capabilities: EncounterHeroPanelCapability[];
  items: EncounterHeroPanelItem[];
  activeVow?: EncounterHeroPanelVow;
  recentMoments: EncounterHeroPanelMoment[];
}

interface EiraHeroPanelProps {
  data: EncounterHeroPanelData;
  onOpenProfile?: () => void;
  registrationSlot?: React.ReactNode;
}

const PORTRAIT_WIDTH_PX = 212;
const PORTRAIT_HEIGHT_PX = 236;

function PortraitFallback({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      aria-hidden="true"
      style={{
        width: PORTRAIT_WIDTH_PX,
        height: PORTRAIT_HEIGHT_PX,
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at 35% 20%, color-mix(in srgb, var(--accent-gold) 20%, transparent), transparent 35%), linear-gradient(180deg, var(--bg-raised), var(--bg-deep))',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.12em',
        fontSize: 'var(--text-sm)',
      }}
    >
      {initials || 'EP'}
    </div>
  );
}

export function EiraHeroPanel({ data, onOpenProfile, registrationSlot }: EiraHeroPanelProps) {
  return (
    <aside
      data-testid="encounter-eira-hero-panel"
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-surface))',
        overflowY: 'auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            color: 'var(--accent-gold)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          The Protagonist
        </span>
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Open Her Sheet
          </button>
        )}
      </header>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        {data.portraitUrl ? (
          <img
            src={data.portraitUrl}
            alt={data.portraitAlt ?? `${data.name} portrait`}
            style={{
              width: PORTRAIT_WIDTH_PX,
              height: PORTRAIT_HEIGHT_PX,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              objectFit: 'cover',
              background: 'var(--bg-raised)',
            }}
          />
        ) : (
          <PortraitFallback name={data.name} />
        )}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
          }}
        >
          {data.name}
        </h2>
        {data.subtitle && (
          <div
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginTop: 2,
            }}
          >
            {data.subtitle}
          </div>
        )}
        {data.statusLine && (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            {data.statusLine}
          </div>
        )}
      </div>

      <section>
        <div
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 8,
          }}
        >
          Capability In This Scene
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {data.capabilities.map((capability) => (
            <CapabilityStrip
              key={capability.id}
              label={capability.label}
              sphereLabel={capability.sphereLabel}
              narrativeHint={capability.narrativeHint}
              filledDots={capability.filledDots}
              totalDots={capability.totalDots}
              accentColor={capability.accentColor}
            />
          ))}
        </div>
      </section>

      <section>
        <div
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 8,
          }}
        >
          She Carries Into This Scene
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {data.items.map((item) => (
            <article
              key={item.id}
              style={{
                borderRadius: 10,
                border: `1px solid ${
                  item.tone === 'highlight' ? 'var(--border-gold)' : 'var(--border-subtle)'
                }`,
                background: 'var(--bg-raised)',
                padding: '8px 10px',
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{item.title}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{item.detail}</div>
            </article>
          ))}

          {data.activeVow && (
            <article
              style={{
                borderRadius: 10,
                border: `1px solid ${data.activeVow.accentColor ?? 'var(--sphere-spirit)'}`,
                background:
                  'linear-gradient(90deg, color-mix(in srgb, var(--sphere-spirit-bright) 18%, transparent), transparent)',
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  color: data.activeVow.accentColor ?? 'var(--sphere-spirit-bright)',
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Vow - Active Now
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{data.activeVow.title}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
                {data.activeVow.detail}
              </div>
            </article>
          )}
        </div>
      </section>

      <section>
        <div
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 8,
          }}
        >
          Recent Moments
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {data.recentMoments.map((moment) => (
            <article
              key={moment.id}
              style={{
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-raised)',
                padding: '8px 10px',
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{moment.title}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{moment.detail}</div>
            </article>
          ))}
        </div>
      </section>

      {registrationSlot ? <div data-testid="hero-registration-slot">{registrationSlot}</div> : null}
    </aside>
  );
}
