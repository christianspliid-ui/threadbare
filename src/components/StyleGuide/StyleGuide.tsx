/**
 * StyleGuide — visual component reference.
 *
 * Route: ?view=styleguide
 * Renders all shared primitives with sample data so agents and developers
 * can see what each component looks like without guessing from prop signatures.
 * No game state dependency — all sample data is hardcoded.
 */

import { useState, useMemo } from 'react';
import { Button } from '../shared/Button';
import { IconButton } from '../shared/IconButton';
import { Card } from '../shared/Card';
import { ListRow } from '../shared/ListRow';
import { Modal } from '../shared/Modal';
import { Tooltip } from '../shared/Tooltip';
import { Dropdown } from '../shared/Dropdown';
import { ProgressBar } from '../shared/ProgressBar';
import { StepDots } from '../shared/StepDots';
import { RarityBadge } from '../shared/RarityBadge';
import { RarityBorderBox } from '../shared/RarityBorderBox';
import { SphereIcon } from '../shared/SphereIcon';
import { RivalIcon } from '../shared/RivalIcon';
import { SectionHeading } from '../shared/SectionHeading';
import { AnimateMount } from '../shared/AnimateMount';
import { EntityCard } from '../shared/EntityCard';
import { DomainCard } from '../shared/DomainCard';
import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import type { RarityTier } from '../../types/rarity';
import { SPHERE_NAMES } from '../../types/index';
import { CulturePhoneticsInspector } from '../Game/debug/CulturePhoneticsInspector';
import { WorldGraph } from '../../engine/graph';
import { buildPhoneticSignature } from '../../engine/culturePhonetics';
import type { CultureIdentity } from '../../types/culture';

// ─── Phonetic sample graph ───────────────────────────────────────────────────

function buildSamplePhoneticGraph(): WorldGraph {
  const graph = new WorldGraph();
  const makeId: (foundation: string, sphere: string) => CultureIdentity = (f, s) => ({
    foundationBias: f, veneratedSpheres: [s as any],
    primaryBiome: 'grasslands', preferredBiomes: ['grasslands'], toleratedBiomes: [],
    archetypeLabel: `${f} / ${s}`, demonym: f === 'chaos' ? 'Kaoru' : 'Thalven',
    homePlaceName: f === 'chaos' ? 'Kaorheim' : 'Thalvenar',
    socialStructure: 'Flat', accountability: 'Personal',
    behavioralKeywords: [], materialVocabulary: [], metaphorPalette: [],
    formativeTraitSeedIds: [], behavioralTraitSeedIds: [],
    reachPreferences: { iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0, eye: 0, stone: 0, star: 0, flesh: 0 },
  });
  const cultures = [
    { id: 'sample_chaos', name: 'The Storm Kin', foundation: 'chaos', sphere: 'force', seed: 42 },
    { id: 'sample_order', name: 'The Stonewarden Pact', foundation: 'order', sphere: 'matter', seed: 77 },
    { id: 'sample_light', name: 'Dawnchildren of the Veil', foundation: 'light', sphere: 'spirit', seed: 13 },
  ];
  for (const c of cultures) {
    const identity = makeId(c.foundation, c.sphere);
    const sig = buildPhoneticSignature(identity, c.seed, c.id);
    graph.addNode({
      id: c.id, type: 'culture', name: c.name,
      properties: { cultureIdentity: identity, culturePhoneticSignature: sig },
    });
  }
  return graph;
}

// ─── Layout constants ────────────────────────────────────────────────────────

const NAV_WIDTH = 200;
const CONTENT_MAX_WIDTH = 1200;
const SECTION_GAP = '3rem';

// ─── Section registry ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'tokens', label: 'Design Tokens' },
  { id: 'buttons', label: 'Button' },
  { id: 'iconbutton', label: 'IconButton' },
  { id: 'card', label: 'Card' },
  { id: 'listrow', label: 'ListRow' },
  { id: 'modal', label: 'Modal' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'dropdown', label: 'Dropdown' },
  { id: 'progressbar', label: 'ProgressBar' },
  { id: 'stepdots', label: 'StepDots' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'spheres', label: 'SphereIcon' },
  { id: 'rivalicon', label: 'RivalIcon' },
  { id: 'sectionheading', label: 'SectionHeading' },
  { id: 'animatemount', label: 'AnimateMount' },
  { id: 'entitycard', label: 'EntityCard' },
  { id: 'domaincard', label: 'DomainCard' },
  { id: 'culture-phonetics', label: 'CulturePhoneticsInspector' },
];

// ─── Sample data ──────────────────────────────────────────────────────────────

const RARITY_TIERS: RarityTier[] = [1, 2, 3, 4];

const SAMPLE_ENTITY_HEADER = {
  name: 'Kael Thornweaver',
  subtitle: 'The Wandering Blade',
  accentColor: '#c87533',
  badges: [
    { label: 'Storied', color: '#c87533' },
    { label: 'Bonded', color: '#d4a82f' },
  ],
};

const SAMPLE_ENTITY_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    insightTier: 'known' as const,
    proseVoice: 'chronicle' as const,
    prose: 'A wandering mercenary who carries a blade older than the current age. His loyalties shift like the desert wind, but his skills are undeniable.',
    structuredData: {
      type: 'keyword_cloud' as const,
      keywords: ['mercenary', 'blade-sworn', 'wanderer', 'fortune-seeker'],
      accent: '#c87533',
    },
  },
  {
    id: 'associates',
    title: 'Associates',
    insightTier: 'recognised' as const,
    proseVoice: 'oral' as const,
    prose: 'Travels with a small band of sell-swords.',
    structuredData: {
      type: 'member_list' as const,
      members: [
        { id: 'm1', name: 'Sera Veth', role: 'Scout', tier: 2 },
        { id: 'm2', name: 'Bram Coldstone', role: 'Heavy', tier: 1 },
      ],
    },
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Row({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: `${gap}px` }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono, monospace)',
        display: 'block',
        marginBottom: '6px',
      }}
    >
      {children}
    </span>
  );
}

function Swatch({ token, hex }: { token: string; hex: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          backgroundColor: hex,
          border: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      />
      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{token}</code>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{hex}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [animShown, setAnimShown] = useState(true);
  const [activeSection, setActiveSection] = useState('tokens');

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-abyss)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ── Left Nav ──────────────────────────────────────────── */}
      <nav
        style={{
          width: `${NAV_WIDTH}px`,
          flexShrink: 0,
          backgroundColor: 'var(--bg-deep)',
          borderRight: '1px solid var(--border-subtle)',
          overflowY: 'auto',
          padding: '1.5rem 0',
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-gold)',
            padding: '0 1rem 0.75rem',
          }}
        >
          Style Guide
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '6px 1rem',
              fontSize: 'var(--text-xs)',
              color: activeSection === s.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
              backgroundColor: activeSection === s.id ? 'var(--accent-gold-glow)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderLeft: activeSection === s.id ? '2px solid var(--accent-gold)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        <div style={{ maxWidth: `${CONTENT_MAX_WIDTH}px`, margin: '0 auto' }}>

          {/* ── Design Tokens ─────────────────────────────────── */}
          <section id="section-tokens" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Design Tokens</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <Label>Backgrounds</Label>
                <Swatch token="--bg-abyss" hex="#0a0a0e" />
                <Swatch token="--bg-deep" hex="#111114" />
                <Swatch token="--bg-surface" hex="#1a1a1f" />
                <Swatch token="--bg-raised" hex="#222228" />
                <Swatch token="--bg-hover" hex="#2a2a32" />
              </div>
              <div>
                <Label>Text</Label>
                {[
                  { token: '--text-primary', label: 'The Watcher stirs.' },
                  { token: '--text-secondary', label: 'A thread pulls taut.' },
                  { token: '--text-tertiary', label: 'Seen by none.' },
                  { token: '--text-muted', label: 'Forgotten whispers.' },
                ].map(({ token, label }) => (
                  <div key={token} style={{ marginBottom: '6px' }}>
                    <span style={{ color: `var(${token})`, fontSize: 'var(--text-xs)' }}>{label}</span>
                    <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: '8px' }}>{token}</code>
                  </div>
                ))}
              </div>
              <div>
                <Label>Gold Accent</Label>
                <Swatch token="--accent-gold" hex="#d4a82f" />
                <Swatch token="--accent-gold-dim" hex="#a07820" />
                <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: 'var(--accent-gold-glow)', border: '1px solid var(--accent-gold-dim)', borderRadius: '4px', fontSize: 'var(--text-xs)', color: 'var(--accent-gold)' }}>
                  --accent-gold-glow (bg tint)
                </div>
              </div>
            </div>
          </section>

          {/* ── Button ─────────────────────────────────────────── */}
          <section id="section-buttons" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Button</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <GameErrorBoundary>
                <Label>variant: primary | secondary | ghost | danger (size: md)</Label>
                <Row>
                  <Button variant="primary" size="md">Primary</Button>
                  <Button variant="secondary" size="md">Secondary</Button>
                  <Button variant="ghost" size="md">Ghost</Button>
                  <Button variant="danger" size="md">Danger</Button>
                </Row>
                <Label>size: sm | md | lg (variant: primary)</Label>
                <Row>
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                </Row>
                <Label>disabled + loading + icon</Label>
                <Row>
                  <Button variant="primary" size="md" disabled>Disabled</Button>
                  <Button variant="secondary" size="md" loading>Loading...</Button>
                  <Button variant="ghost" size="md" icon={<span>✦</span>}>With Icon</Button>
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── IconButton ─────────────────────────────────────── */}
          <section id="section-iconbutton" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>IconButton</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GameErrorBoundary>
                <Label>size: sm | md, variant: default | close, with badge</Label>
                <Row>
                  <div><Label>md/default</Label><IconButton icon={<span>⚙</span>} size="md" /></div>
                  <div><Label>sm/default</Label><IconButton icon={<span>⚙</span>} size="sm" /></div>
                  <div><Label>md/close</Label><IconButton icon={<span>✕</span>} variant="close" /></div>
                  <div><Label>active</Label><IconButton icon={<span>★</span>} active /></div>
                  <div><Label>with badge</Label><IconButton icon={<span>🔔</span>} badge={3} /></div>
                  <div><Label>disabled</Label><IconButton icon={<span>⚙</span>} disabled /></div>
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Card ───────────────────────────────────────────── */}
          <section id="section-card" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Card</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <GameErrorBoundary>
                {(['surface', 'raised', 'glass'] as const).map((variant) => (
                  <div key={variant}>
                    <Label>variant="{variant}"</Label>
                    <Card variant={variant}>
                      <Card.Header title={`Card.${variant}`} />
                      <Card.Body>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                          A thread of fate is woven here. The pattern is not yet clear.
                        </p>
                      </Card.Body>
                      <Card.Footer>
                        <Button variant="ghost" size="sm">Action</Button>
                      </Card.Footer>
                    </Card>
                  </div>
                ))}
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── ListRow ────────────────────────────────────────── */}
          <section id="section-listrow" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>ListRow</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <GameErrorBoundary>
                <Label>basic title only</Label>
                <ListRow>
                  <ListRow.Title>Kael Thornweaver</ListRow.Title>
                </ListRow>

                <Label>title + subtitle</Label>
                <ListRow>
                  <ListRow.Title>Kael Thornweaver</ListRow.Title>
                  <ListRow.Subtitle>Wandering mercenary · Tier 2</ListRow.Subtitle>
                </ListRow>

                <Label>with leading + trailing + onClick</Label>
                <ListRow
                  onClick={() => {}}
                  trailing={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>→</span>}
                >
                  <ListRow.Leading>
                    <SphereIcon sphereName="force" size={16} />
                  </ListRow.Leading>
                  <ListRow.Title>Iron Domain</ListRow.Title>
                  <ListRow.Subtitle>Force-aligned</ListRow.Subtitle>
                </ListRow>

                <Label>selected + accentColor</Label>
                <ListRow selected accentColor="#d4a82f">
                  <ListRow.Title>Selected Item</ListRow.Title>
                  <ListRow.Subtitle>Gold accent active</ListRow.Subtitle>
                </ListRow>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Modal ──────────────────────────────────────────── */}
          <section id="section-modal" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Modal</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>open=true/false via button trigger. Escape or backdrop click to close.</Label>
                <Button variant="secondary" size="md" onClick={() => setModalOpen(true)}>
                  Open Sample Modal
                </Button>
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} aria-label="Sample Modal">
                  <Modal.Header title="The Watcher Stirs" />
                  <Modal.Body>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      A distant tremor passes through the web of fate. Something ancient has noticed your intervention.
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      Modal uses <code>createPortal</code> — renders at z:60. Max-height: 75vh. Escape or backdrop click closes.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Dismiss</Button>
                    <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>Acknowledge</Button>
                  </Modal.Footer>
                </Modal>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Tooltip ────────────────────────────────────────── */}
          <section id="section-tooltip" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Tooltip</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>Hover each target. Tooltip is viewport-aware and positions itself automatically.</Label>
                <Row gap={20}>
                  <Tooltip label="Force Sphere" desc="The raw power of physical momentum and kinetic energy.">
                    <Button variant="secondary" size="sm">Label only</Button>
                  </Tooltip>
                  <Tooltip label="Kael Thornweaver" desc="A wandering mercenary of Storied rank. His blade carries an edge of Old Steel.">
                    <Button variant="secondary" size="sm">Label + desc</Button>
                  </Tooltip>
                  <Tooltip label="Nested tooltip support" desc="Tooltips inside tooltips work up to depth 3.">
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px dashed var(--border-subtle)',
                        cursor: 'default',
                      }}
                    >
                      hover text trigger
                    </span>
                  </Tooltip>
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Dropdown ───────────────────────────────────────── */}
          <section id="section-dropdown" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Dropdown</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>Portal-based. Escape or outside-click closes. Compound: Dropdown.Item.</Label>
                <Dropdown
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                  trigger={
                    <Button variant="secondary" size="md" onClick={() => setDropdownOpen(!dropdownOpen)}>
                      Open Dropdown ▾
                    </Button>
                  }
                >
                  <Dropdown.Item onClick={() => setDropdownOpen(false)}>Inspect agent</Dropdown.Item>
                  <Dropdown.Item onClick={() => setDropdownOpen(false)}>Move to location</Dropdown.Item>
                  <Dropdown.Item onClick={() => setDropdownOpen(false)}>Dismiss</Dropdown.Item>
                </Dropdown>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── ProgressBar ────────────────────────────────────── */}
          <section id="section-progressbar" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>ProgressBar</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GameErrorBoundary>
                {[0, 0.25, 0.5, 0.75, 1.0].map((progress) => (
                  <div key={progress}>
                    <Label>progress={progress} color="#d4a82f"</Label>
                    <ProgressBar progress={progress} color="#d4a82f" />
                  </div>
                ))}
                <Label>color="#4b0082" (Mythic / doom bar)</Label>
                <ProgressBar progress={0.6} color="#4b0082" />
                <Label>glow=false</Label>
                <ProgressBar progress={0.4} color="#c87533" glow={false} />
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── StepDots ───────────────────────────────────────── */}
          <section id="section-stepdots" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>StepDots</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GameErrorBoundary>
                {[0, 1, 2, 3, 4].map((current) => (
                  <div key={current} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StepDots totalSteps={5} currentStepIndex={current} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>step {current + 1} of 5</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StepDots totalSteps={3} currentStepIndex={1} size={8} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>size=8, 3 steps</span>
                </div>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Rarity ─────────────────────────────────────────── */}
          <section id="section-rarity" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Rarity — Badge + BorderBox</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GameErrorBoundary>
                <Label>RarityBadge — all tiers</Label>
                <Row>
                  {RARITY_TIERS.map((tier) => (
                    <span key={tier} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RarityBadge tier={tier} />
                      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>tier={tier}</code>
                    </span>
                  ))}
                </Row>
                <Label>RarityBorderBox — wraps any content with left-border accent</Label>
                {RARITY_TIERS.map((tier) => (
                  <RarityBorderBox key={tier} tier={tier}>
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        tier={tier} — <RarityBadge tier={tier} /> entity row content here
                      </span>
                    </div>
                  </RarityBorderBox>
                ))}
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── SphereIcon ─────────────────────────────────────── */}
          <section id="section-spheres" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>SphereIcon</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>All 12 spheres — SVG path (default). Use useImage=true for PNG fallback.</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '1rem' }}>
                  {SPHERE_NAMES.map((name) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <SphereIcon sphereName={name} size={28} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{name}</span>
                    </div>
                  ))}
                </div>
                <Label>size=16 (inline)</Label>
                <Row gap={8}>
                  {SPHERE_NAMES.slice(0, 4).map((name) => (
                    <SphereIcon key={name} sphereName={name} size={16} />
                  ))}
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── RivalIcon ──────────────────────────────────────── */}
          <section id="section-rivalicon" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>RivalIcon</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>2–3 spheres → overlapping circles representing rival affinities</Label>
                <Row gap={24}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <RivalIcon spheres={['chaos', 'force']} size="2rem" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>2 spheres</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <RivalIcon spheres={['mind', 'spirit', 'entropy']} size="2rem" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>3 spheres</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <RivalIcon spheres={['light', 'order']} size="3rem" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>size="3rem"</span>
                  </div>
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── SectionHeading ─────────────────────────────────── */}
          <section id="section-sectionheading" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>SectionHeading</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <GameErrorBoundary>
                <Label>plain (default)</Label>
                <SectionHeading>Plain Heading</SectionHeading>
                <Label>ornamental (flanking gold rules)</Label>
                <SectionHeading ornamental>Ornamental Heading</SectionHeading>
                <Label>with count</Label>
                <SectionHeading count={12}>With Count</SectionHeading>
                <Label>as="h2"</Label>
                <SectionHeading as="h2">Heading Level 2</SectionHeading>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── AnimateMount ───────────────────────────────────── */}
          <section id="section-animatemount" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>AnimateMount</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>show prop controls mount/unmount with animation class. Toggle to see enter/exit.</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Button variant="secondary" size="sm" onClick={() => setAnimShown(!animShown)}>
                    {animShown ? 'Hide' : 'Show'} element
                  </Button>
                  <AnimateMount show={animShown} animation="anim-fade-up">
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--panel-radius)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Animated element — animation="anim-fade-up". This div mounts/unmounts with fade-up transition.
                    </div>
                  </AnimateMount>
                </div>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── EntityCard ─────────────────────────────────────── */}
          <section id="section-entitycard" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>EntityCard</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '380px' }}>
              <GameErrorBoundary>
                <Label>Structured entity display. Renders header + sections with StructuredBlock support.</Label>
                <EntityCard
                  header={SAMPLE_ENTITY_HEADER}
                  sections={SAMPLE_ENTITY_SECTIONS}
                  onBack={() => {}}
                  onViewCodex={() => {}}
                />
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── DomainCard ─────────────────────────────────────── */}
          <section id="section-domaincard" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>DomainCard</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '720px' }}>
              <GameErrorBoundary>
                {(['iron', 'shadow', 'heart', 'star'] as const).map((reach) => (
                  <div key={reach}>
                    <Label>reach="{reach}" tier=2 revealed=true</Label>
                    <DomainCard
                      reach={reach}
                      tier={2}
                      agentName="Kael Thornweaver"
                      revealed={true}
                    />
                  </div>
                ))}
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── CulturePhoneticsInspector ─────────────────────── */}
          <section id="section-culture-phonetics" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>CulturePhoneticsInspector</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '440px' }}>
              <GameErrorBoundary>
                <Label>Debug panel tab — shows phoneme inventory + sample names per culture. Re-roll samples button regenerates names.</Label>
                <SamplePhoneticInspector />
              </GameErrorBoundary>
            </div>
          </section>

          <div style={{ height: '4rem' }} />
        </div>
      </main>
    </div>
  );
}

function SamplePhoneticInspector() {
  const graph = useMemo(() => buildSamplePhoneticGraph(), []);
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
      <CulturePhoneticsInspector graph={graph} />
    </div>
  );
}
