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
import { Medallion } from '../shared/Medallion';
import { FlavorQuote } from '../shared/FlavorQuote';
import { RevealCard } from '../shared/RevealCard';
import { REVEAL_CATEGORY_TITLES, REVEAL_KINDS, pickFallbackFlavor } from '../../data/reveal-content';
import { Tooltip } from '../shared/Tooltip';
import { Dropdown } from '../shared/Dropdown';
import { ProgressBar } from '../shared/ProgressBar';
import { StepDots } from '../shared/StepDots';
import { RarityBadge } from '../shared/RarityBadge';
import { RarityBorderBox } from '../shared/RarityBorderBox';
import { SphereIcon } from '../shared/SphereIcon';
import { CardKeywordChip } from '../shared/CardKeywordChip';
import { CostPips, OddsPips } from '../shared/OddsPips';
import { DeltaCluster } from '../shared/DeltaCluster';
import {
  PIP_ODDS_TIERS,
  PIP_PENALTY_TIER,
  PIP_STEP_PERCENT,
} from '../../data/nudge-pip-vocabulary';
import { NUDGE_CARD_TYPE_ICONS } from '../../data/nudge-card-display';
import { NUDGE_CARD_TYPES } from '../../data/nudge-card-library';
import { RivalIcon } from '../shared/RivalIcon';
import { SectionHeading } from '../shared/SectionHeading';
import { AnimateMount } from '../shared/AnimateMount';
import { EntityCard } from '../shared/EntityCard';
import { EntityVisual } from '../shared/EntityVisual';
import type { EntityVisualDescriptor } from '../shared/entityVisualResolver';
import { ENTITY_GRADIENT_COUNT } from '../../data/entity-visual-fallbacks';
import { DomainCard } from '../shared/DomainCard';
import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import type { RarityTier } from '../../types/rarity';
import { SPHERE_NAMES } from '../../types/index';
import { ActivityIcon } from '../shared/ActivityIcon';
import type { ActivityKind } from '../shared/ActivityIcon';
import { ProgressBand } from '../shared/ProgressBand';
import { Divider } from '../shared/Divider';
import { DetailBreadcrumb } from '../shared/DetailBreadcrumb';
import { DetailModal } from '../shared/DetailModal';
import { Section } from '../shared/Section';
import { DetailModalStackProvider, useDetailStack } from '../../contexts/DetailModalStackContext';
import {
  DETAIL_BREADCRUMB_COLLAPSE_AT,
  type DetailPage,
  type Section as DetailPageSection,
} from '../../types/detailPage';
import { CulturePhoneticsInspector } from '../Game/debug/CulturePhoneticsInspector';
import { EncounterChoiceCard } from '../Game/Encounter/EncounterChoiceCard';
import type { EncounterChoiceContract } from '../../types/encounter-contract';
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
    reachPreferences: { iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0, eye: 0, stone: 0, star: 0 },
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
  { id: 'medallion', label: 'Medallion (THR-799)' },
  { id: 'flavorquote', label: 'FlavorQuote (THR-799)' },
  { id: 'revealcard', label: 'RevealCard (THR-799)' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'dropdown', label: 'Dropdown' },
  { id: 'progressbar', label: 'ProgressBar' },
  { id: 'progressband', label: 'ProgressBand' },
  { id: 'divider', label: 'Divider' },
  { id: 'stepdots', label: 'StepDots' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'spheres', label: 'SphereIcon' },
  { id: 'odds-pips', label: 'OddsPips / CostPips (THR-890)' },
  { id: 'delta-cluster', label: 'DeltaCluster (THR-1082)' },
  { id: 'card-keyword-chip', label: 'CardKeywordChip (THR-890)' },
  { id: 'rivalicon', label: 'RivalIcon' },
  { id: 'sectionheading', label: 'SectionHeading' },
  { id: 'animatemount', label: 'AnimateMount' },
  { id: 'entitycard', label: 'EntityCard' },
  { id: 'entity-visual', label: 'EntityVisual (THR-637)' },
  { id: 'domaincard', label: 'DomainCard' },
  { id: 'activityicon', label: 'ActivityIcon' },
  { id: 'detail-page', label: 'DetailBreadcrumb / Section / DetailModal' },
  { id: 'culture-phonetics', label: 'CulturePhoneticsInspector' },
  { id: 'encounter-choice-c2', label: 'EncounterChoiceCard (C2)' },
];

// ─── Detail-page sample data ──────────────────────────────────────────────────
// The detail-page cluster (DetailBreadcrumb / Section / DetailModal) has no
// production mount — THR-966 defers that call. These fixtures exist so the
// cluster still satisfies Law 29's "every shared primitive renders at
// ?view=styleguide with sample data" while its disposition is open.

const SAMPLE_DETAIL_TRAIL = ['ENCOUNTER', 'CAPTAIN VEIREN'];

/** One crumb past DETAIL_BREADCRUMB_COLLAPSE_AT, so the ellipsis branch renders. */
const SAMPLE_DETAIL_TRAIL_LONG = [
  'ENCOUNTER',
  'THE IRON MARKET',
  'CAPTAIN VEIREN',
  'THE ASHEN COMPACT',
  'HER WRIT OF PASSAGE',
].slice(0, DETAIL_BREADCRUMB_COLLAPSE_AT + 2);

const SAMPLE_DETAIL_SECTIONS: DetailPageSection[] = [
  {
    kind: 'prose',
    label: 'DISPOSITION TOWARD HER',
    gold: true,
    tier: 'notable',
    typeId: 'disposition_toward_her',
    source: 'styleguide.sample',
    prose:
      'She keeps the gate because someone must, and because the keeping is the only claim she has left on the city.',
  },
  {
    kind: 'chips',
    label: 'WHAT HOLDS HER',
    gold: false,
    tier: 'routine',
    typeId: 'holds',
    source: 'styleguide.sample',
    chips: [
      { label: 'authority taut', sphere: 'order', sentiment: 'neutral' },
      { label: 'owed a debt', sphere: 'exchange', sentiment: 'negative', flavour: 'unpaid since the thaw' },
      { label: 'trusted by the watch', sphere: 'bond', sentiment: 'positive' },
    ],
  },
  {
    kind: 'event-card',
    label: 'WHEN YOU LAST TOUCHED HER THREAD',
    gold: false,
    tier: 'chronicle',
    typeId: 'last_touch',
    source: 'styleguide.sample',
    whenLabel: 'MANY TURNS AGO · THE IRON MARKET',
    prose: 'You leaned on the scales and she chose not to see it.',
    eventRef: { nodeId: 'styleguide-sample-event', pageKind: 'event' },
  },
  {
    kind: 'panel',
    label: 'STANDING AMONG THE COMPACTS',
    gold: false,
    tier: 'routine',
    typeId: 'standing',
    source: 'styleguide.sample',
    rows: [
      { left: 'The Ashen Compact', right: 'warm', sentiment: 'positive' },
      { left: 'The Gilded Table', right: 'cooling', sentiment: 'negative' },
      { left: 'The Watch', right: 'steady', sentiment: 'neutral' },
    ],
  },
  {
    kind: 'portrait',
    label: 'AS SHE IS SEEN',
    gold: false,
    tier: 'notable',
    typeId: 'portrait',
    source: 'styleguide.sample',
    portraitRef: { subject: 'Captain Veiren', sphere: 'order' },
    bodyProse: 'Grey at the temple, and unhurried about it.',
  },
];

const SAMPLE_DETAIL_PAGE: DetailPage = {
  kind: 'actor',
  nodeId: 'styleguide-sample-actor',
  trail: SAMPLE_DETAIL_TRAIL,
  kindLabel: 'ACTOR',
  displayName: 'Captain Veiren',
  subtitle: 'Gatekeeper of the Iron Market · sworn to Order',
  sphere: 'order',
  isShowcase: true,
  sections: SAMPLE_DETAIL_SECTIONS,
  hasFullSheet: true,
};

/**
 * DetailModal renders from the stack context and draws nothing while the stack
 * is empty, so a styleguide entry needs a control that pushes a page onto it.
 */
function SampleDetailModalLauncher() {
  const { push, isOpen } = useDetailStack();
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => push(SAMPLE_DETAIL_PAGE)} disabled={isOpen}>
        {isOpen ? 'Sample page open — Escape closes it' : 'Open sample detail page'}
      </Button>
      <DetailModal />
    </>
  );
}

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

const STYLEGUIDE_CHOICE_FIXTURES: readonly EncounterChoiceContract[] = [
  {
    reach: 'iron',
    cost: 'small_breath',
    god_verb: 'Stir her resolve.',
    agent_reaction: "Her shoulders set. She closes the distance and meets Veiren's eye.",
    tilts_toward: 'a wound, a debt, or his favour earned',
    moral_axis_pole: 'conqueror',
    fail_forward: 'she stands her ground; the queue notices',
  },
  {
    reach: 'eye',
    cost: 'fuller_breath',
    god_verb: 'Sharpen her sight.',
    agent_reaction: 'Her gaze flicks past Veiren to the trader. Whatever he hides, she will see it.',
    tilts_toward: 'knowledge, a thread to follow',
    moral_axis_pole: 'seeker',
    fail_forward: 'she sees too much; what she sees marks her',
    consumes_item: "Captain's token",
  },
  {
    reach: 'heart',
    cost: 'deep_draught',
    god_verb: 'Soften her stance.',
    agent_reaction: "She finds the small folk's silence and gives it. Veiren picks another.",
    tilts_toward: 'a vow deepened, a story moved sideways',
    moral_axis_pole: 'sworn',
    fail_forward: 'the trader runs anyway; the vow holds',
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
  const [revealOpen, setRevealOpen] = useState(false);
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

          {/* ── Medallion (THR-799) ────────────────────────────── */}
          <section id="section-medallion" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Medallion (THR-799)</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>
                  Circular icon frame — outer ring, dark gap, clipping content disc. sm 40 / md 64 / lg 96.
                  lg defaults to full --accent-gold (the single bright-gold element on a ceremonial surface);
                  sm/md default to dim gold. Frames an already-resolved visual — it is not a second art path.
                </Label>
                <Row gap={20}>
                  <Medallion size="sm" title="sm — sphere">
                    <SphereIcon sphere="force" size={20} />
                  </Medallion>
                  <Medallion size="md" title="md — sphere">
                    <SphereIcon sphere="mind" size={30} />
                  </Medallion>
                  <Medallion size="lg" title="lg — sphere (hero)">
                    <SphereIcon sphere="chaos" size={44} />
                  </Medallion>
                  <Medallion size="md" title="md — glyph child">
                    <span style={{ color: 'var(--accent-gold)' }}>{'⚔'}</span>
                  </Medallion>
                  <Medallion size="md" accentColor="#c87533" title="md — custom accentColor" />
                </Row>
                <Label>No children → the fallback glyph, never an empty disc (fail-soft).</Label>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── FlavorQuote (THR-799) ──────────────────────────── */}
          <section id="section-flavorquote" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>FlavorQuote (THR-799)</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '520px' }}>
              <GameErrorBoundary>
                <Label>Inset quote well — ornamental divider, --type-flavor body, right-aligned attribution.</Label>
                <FlavorQuote attribution="Kael Thornweaver">
                  The thread was spun this way from the first. The weave simply reached it.
                </FlavorQuote>
                <Label>divider={'{false}'} — no ornament, for inline section use.</Label>
                <FlavorQuote divider={false}>What is held changes the hand that holds it.</FlavorQuote>
                <Label>
                  No children → renders nothing at all (zone omission, not an empty well). The bordered
                  box below is the StyleGuide's own marker, and is intentionally empty:
                </Label>
                <div style={{ border: '1px dashed var(--border-subtle)', padding: '8px', minHeight: '32px' }}>
                  <FlavorQuote>{null}</FlavorQuote>
                </div>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── RevealCard (THR-799) ───────────────────────────── */}
          <section id="section-revealcard" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>RevealCard (THR-799)</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>
                  Ceremonial presentation tier, composed on Modal (z-60, Escape/backdrop close inherited).
                  Zones: Title → Medallion → Banner → Body → Consequences → Quote → Dismiss, separated by
                  --space-ceremonial. A zone with no data is omitted entirely.
                </Label>
                <Button variant="secondary" size="md" onClick={() => setRevealOpen(true)}>
                  Open Sample RevealCard
                </Button>
                <RevealCard
                  open={revealOpen}
                  onClose={() => setRevealOpen(false)}
                  aria-label="Sample reveal card"
                >
                  <RevealCard.Title>{REVEAL_CATEGORY_TITLES.attachment}</RevealCard.Title>
                  <RevealCard.Medallion title="Old Steel">
                    <SphereIcon sphere="force" size={44} />
                  </RevealCard.Medallion>
                  <RevealCard.Banner>Old Steel</RevealCard.Banner>
                  <RevealCard.Body>
                    A blade carried through three winters and one betrayal. It has learned the shape of the hand.
                  </RevealCard.Body>
                  <RevealCard.Consequences
                    label="What follows"
                    items={[
                      { id: 'c1', title: 'Steadier in a press', desc: 'Force reads one step kinder.', icon: <SphereIcon sphere="force" size={18} /> },
                      { id: 'c2', title: 'Known blade', desc: 'Some will recognise it, and act on that.', icon: <SphereIcon sphere="mind" size={18} /> },
                      { id: 'c3', title: 'A debt of keeping', desc: 'What is held asks to be maintained.', icon: <SphereIcon sphere="matter" size={18} /> },
                    ]}
                  />
                  <RevealCard.Quote attribution="A smith of Darkhollow">
                    {pickFallbackFlavor('attachment', 'styleguide.sample')}
                  </RevealCard.Quote>
                  <RevealCard.Dismiss onClick={() => setRevealOpen(false)} />
                </RevealCard>

                <Label>RevealCard.Frame — the same zone stack with no Modal wrapper, for embedding inside a surface that is already a modal (no nested modals):</Label>
                <div className="frame-ceremonial" style={{ maxWidth: '520px', borderRadius: '12px', background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))' }}>
                  <RevealCard.Frame>
                    <RevealCard.Title>{REVEAL_CATEGORY_TITLES.action_card}</RevealCard.Title>
                    <RevealCard.Medallion title="Kindle">
                      <SphereIcon sphere="energy" size={44} />
                    </RevealCard.Medallion>
                    <RevealCard.Banner>Kindle the Long Road</RevealCard.Banner>
                    <RevealCard.Quote>{pickFallbackFlavor('action_card', 'styleguide.sample')}</RevealCard.Quote>
                    <RevealCard.Dismiss label="Receive" onClick={() => {}} />
                  </RevealCard.Frame>
                </div>

                <Label>Category titles per reveal kind (REVEAL_CATEGORY_TITLES):</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {REVEAL_KINDS.map((kind) => (
                    <div key={kind} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      <code>{kind}</code> → {REVEAL_CATEGORY_TITLES[kind]}
                    </div>
                  ))}
                </div>
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

          {/* ── ProgressBand ───────────────────────────────────── */}
          <section id="section-progressband" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>ProgressBand</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <GameErrorBoundary>
                <Label>low / mid / high values</Label>
                <ProgressBand label="Prosperity" value={18} />
                <ProgressBand label="Reputation" value={54} />
                <ProgressBand label="Doom" value={87} />
                <Label>with prose label</Label>
                <ProgressBand label="Essence" value={62} prose="recovering slowly" />
                <Label>sphere colors</Label>
                <ProgressBand label="Force" value={40} color="var(--sphere-force, #e87040)" />
                <ProgressBand label="Spirit" value={75} color="var(--sphere-spirit, #a070e8)" />
                <ProgressBand label="Mind" value={30} color="var(--sphere-mind, #70b8e8)" />
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Divider ────────────────────────────────────────── */}
          <section id="section-divider" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>Divider</SectionHeading>
            <div style={{ marginTop: '1.25rem', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <GameErrorBoundary>
                <Label>subtle (default)</Label>
                <Divider />
                <Label>gold</Label>
                <Divider gold />
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
                <Label>variant=&quot;base&quot; — size 16, all 12 spheres</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '1rem' }}>
                  {SPHERE_NAMES.map((name) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <SphereIcon sphereName={name} size={16} variant="base" />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{name}</span>
                    </div>
                  ))}
                </div>
                <Label>variant=&quot;bright&quot; — size 24, all 12 spheres</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '1rem' }}>
                  {SPHERE_NAMES.map((name) => (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <SphereIcon sphereName={name} size={24} variant="bright" />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{name}</span>
                    </div>
                  ))}
                </div>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── OddsPips / CostPips (THR-890) ──────────────────── */}
          <section id="section-odds-pips" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>OddsPips / CostPips — the odds vocabulary</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>
                  Four tiers, five ~{PIP_STEP_PERCENT}% steps each. Shape carries magnitude
                  (colourblind-safe); colour reinforces it.
                </Label>
                {[...PIP_ODDS_TIERS, PIP_PENALTY_TIER].map((tier) => (
                  <div
                    key={tier.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}
                  >
                    <span style={{ width: 70, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {tier.label}
                    </span>
                    {[1, 2, 3, 4, 5].map((step) => {
                      // Reconstruct each step's raw magnitude from the tier's own
                      // band, so this gallery cannot drift from the tiering rule.
                      const percent = tier.minPercent + (step - 1) * PIP_STEP_PERCENT;
                      const value = (tier.id === 'penalty' ? -percent : percent) / 100;
                      return <OddsPips key={step} value={value} />;
                    })}
                  </div>
                ))}

                <Label>CostPips — essence price, never a digit on the card face</Label>
                <Row>
                  {[0, 1, 2, 3, 8].map((cost) => (
                    <span key={cost} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CostPips cost={cost} />
                      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>cost={cost}</code>
                    </span>
                  ))}
                </Row>
                <Label>CostPips — emphasised (an unaffordable card)</Label>
                <Row>
                  <CostPips cost={3} emphasised />
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── DeltaCluster (THR-1082) ────────────────────────── */}
          <section id="section-delta-cluster" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>DeltaCluster — how much a state changed</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>
                  The aftermath's magnitude idiom. Same triangle family as the encounter
                  hand's setback marker — a separate component from `OddsPips`, because
                  pips mean effect on the odds and these mean realised change (Law 10).
                </Label>
                <Row>
                  {([1, 2, 3] as const).map((count) => (
                    <span key={`gain-${count}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DeltaCluster
                        direction="gain"
                        count={count}
                        label={`Stone rose, ${['a slight', 'a clear', 'a great'][count - 1]} amount`}
                      />
                      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>gain ×{count}</code>
                    </span>
                  ))}
                </Row>
                <Row>
                  {([1, 2, 3] as const).map((count) => (
                    <span key={`loss-${count}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DeltaCluster
                        direction="loss"
                        count={count}
                        label={`Standing fell, ${['a slight', 'a clear', 'a great'][count - 1]} amount`}
                      />
                      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>loss ×{count}</code>
                    </span>
                  ))}
                </Row>
                <Label>PATH — a way opening has no scale, so it never draws a run</Label>
                <Row>
                  <DeltaCluster direction="opens" count={1} label="A way opens" />
                </Row>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── CardKeywordChip (THR-890) ──────────────────────── */}
          <section id="section-card-keyword-chip" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>CardKeywordChip — the 21 card keywords</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>One chip per library card type — the player&apos;s vocabulary</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                  {NUDGE_CARD_TYPES.map((type) => (
                    <CardKeywordChip
                      key={type.id}
                      keyword={type.keyword}
                      icon={NUDGE_CARD_TYPE_ICONS[type.id]}
                    />
                  ))}
                </div>
                <Label>muted — an unaffordable card</Label>
                <Row>
                  <CardKeywordChip keyword="Boost" icon={NUDGE_CARD_TYPE_ICONS.boost} muted />
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

          {/* ── ActivityIcon ───────────────────────────────────── */}
          <section id="section-activityicon" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>ActivityIcon</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <GameErrorBoundary>
                <Label>All 6 kinds at size=18 (default color)</Label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {(['boot', 'swords', 'coin', 'hammer', 'bandage', 'hourglass'] as ActivityKind[]).map((k) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <ActivityIcon kind={k} size={18} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{k}</span>
                    </div>
                  ))}
                </div>
                <Label>All 6 kinds at size=24, color=var(--accent-gold)</Label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {(['boot', 'swords', 'coin', 'hammer', 'bandage', 'hourglass'] as ActivityKind[]).map((k) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <ActivityIcon kind={k} size={24} color="var(--accent-gold)" />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{k}</span>
                    </div>
                  ))}
                </div>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── Detail page cluster ───────────────────────────── */}
          <section id="section-detail-page" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>DetailBreadcrumb / Section / DetailModal</SectionHeading>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <GameErrorBoundary>
                <Label>
                  The detail-page cluster. Reachability is undecided — THR-966 defers the mount-vs-prune
                  call to a coordinated decision with THR-951, so these three render here with sample
                  data to satisfy Law 29 without prejudging that outcome. If the cluster is pruned, this
                  section goes with it.
                </Label>

                <div>
                  <Label>DetailBreadcrumb — trail under the collapse threshold, every crumb but the last clickable</Label>
                  <DetailBreadcrumb trail={SAMPLE_DETAIL_TRAIL} onNavigate={() => {}} />
                </div>

                <div>
                  <Label>
                    DetailBreadcrumb — trail over DETAIL_BREADCRUMB_COLLAPSE_AT, leading crumbs collapse to an ellipsis
                  </Label>
                  <DetailBreadcrumb trail={SAMPLE_DETAIL_TRAIL_LONG} onNavigate={() => {}} />
                </div>

                <div>
                  <Label>Section — one renderer per SectionKind, dispatched on `kind`</Label>
                  <div
                    style={{
                      maxWidth: '520px',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                    }}
                  >
                    {SAMPLE_DETAIL_SECTIONS.map((section) => (
                      <Section key={section.typeId} section={section} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>
                    DetailModal — reads the stack context and renders nothing while the stack is empty, so the
                    sample below supplies its own provider and pushes one page
                  </Label>
                  <DetailModalStackProvider>
                    <SampleDetailModalLauncher />
                  </DetailModalStackProvider>
                </div>
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

          {/* ── EncounterChoiceCard (Phase C2) ── */}
          <section id="section-encounter-choice-c2" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>EncounterChoiceCard (C2)</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <Label>
                  Center-column primitive. Choice cards take the encounter-author-supplied
                  `moral_axis_pole` directly. Sample shows the three classic Iron / Eye / Heart
                  leans; the rightmost card is the selected state.
                </Label>
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {STYLEGUIDE_CHOICE_FIXTURES.map((choice, idx) => (
                      <EncounterChoiceCard
                        key={choice.god_verb}
                        choice={choice}
                        selected={idx === 2}
                        dimmed={false}
                      />
                    ))}
                  </div>
                </div>
              </GameErrorBoundary>
            </div>
          </section>

          {/* ── EntityVisual (THR-637) ─────────────────────────── */}
          <section id="section-entity-visual" style={{ marginBottom: SECTION_GAP }}>
            <SectionHeading ornamental>EntityVisual — Entity Visual Header (THR-637)</SectionHeading>
            <div style={{ marginTop: '1.25rem' }}>
              <GameErrorBoundary>
                <EntityVisualDemo />
              </GameErrorBoundary>
            </div>
          </section>

          <div style={{ height: '4rem' }} />
        </div>
      </main>
    </div>
  );
}

// ─── EntityVisual demo (THR-637) ──────────────────────────────────────────────

function mkVisual(partial: Partial<EntityVisualDescriptor> & Pick<EntityVisualDescriptor, 'tier' | 'glyph' | 'kind' | 'alt'>): EntityVisualDescriptor {
  return { gradientIndex: 0, ...partial };
}

function EntityVisualDemo() {
  const heroArt = mkVisual({ tier: 'art', src: '/concept-art/mountains.png', glyph: '⌂', gradientIndex: 4, alt: 'Ashen Peaks', kind: 'location' });
  const heroFallback = mkVisual({ tier: 'fallback', glyph: '⌂', gradientIndex: 2, alt: 'Unmapped Reach', kind: 'location' });
  const portraitArt = mkVisual({ tier: 'art', src: '/portraits/trickster.png', glyph: 'K', gradientIndex: 1, alt: 'Kael', kind: 'agent' });
  const portraitFallback = mkVisual({ tier: 'fallback', glyph: 'S', gradientIndex: 3, alt: 'Serafina', kind: 'agent' });
  const chipArt = mkVisual({ tier: 'art', src: '/portraits/oathkeeper.png', glyph: 'V', gradientIndex: 5, alt: 'Veiren', kind: 'agent' });
  const chipFaction = mkVisual({ tier: 'fallback', glyph: '⚜', gradientIndex: 0, alt: 'The Covenant', kind: 'faction' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Label>
        Three sizes (hero 16:9 · portrait 3:4 · chip), each shown in the art tier
        (curated image) and the designed fallback tier (authored glyph on an
        id-hashed Threadbare gradient). Fallbacks are deliberate states, never
        placeholder gray.
      </Label>

      <Row>
        <div style={{ width: 280 }}>
          <Label>hero — art</Label>
          <EntityVisual size="hero" descriptor={heroArt} />
        </div>
        <div style={{ width: 280 }}>
          <Label>hero — fallback</Label>
          <EntityVisual size="hero" descriptor={heroFallback} />
        </div>
      </Row>

      <Row>
        <div style={{ width: 120 }}>
          <Label>portrait — art</Label>
          <EntityVisual size="portrait" descriptor={portraitArt} />
        </div>
        <div style={{ width: 120 }}>
          <Label>portrait — fallback</Label>
          <EntityVisual size="portrait" descriptor={portraitFallback} />
        </div>
      </Row>

      <div>
        <Label>chip — art · fallback (person initial) · fallback (faction glyph)</Label>
        <Row>
          <EntityVisual size="chip" descriptor={chipArt} />
          <EntityVisual size="chip" descriptor={portraitFallback} />
          <EntityVisual size="chip" descriptor={chipFaction} />
        </Row>
      </div>

      <div>
        <Label>Fallback gradient palette — {ENTITY_GRADIENT_COUNT} id-hashed gradients</Label>
        <Row>
          {Array.from({ length: ENTITY_GRADIENT_COUNT }, (_, i) => (
            <EntityVisual
              key={i}
              size="chip"
              descriptor={mkVisual({ tier: 'fallback', glyph: '◇', gradientIndex: i, alt: `gradient ${i}`, kind: 'unknown' })}
            />
          ))}
        </Row>
      </div>
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
