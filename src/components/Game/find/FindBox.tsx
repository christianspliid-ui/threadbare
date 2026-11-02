/**
 * FindBox — Find anything (THR-1915, Inspector plan § D11, THR-1832).
 *
 * The labelled field sits in the top bar's centre slot; Ctrl+K / Cmd+K, or `/` when no
 * input has focus, puts the cursor in it. The box drops from the field, centred under the
 * top bar, `--find-box-w` wide and at most `FIND_BOX_MAX_VH` tall. It never dims the map
 * and never pauses time.
 *
 * Results come from the engine (`findIndexSelector` + `matchFind`), so the seen floor
 * decides what can be named — this component only draws and routes:
 * - a world result flies the camera there and opens in the Inspector (`onPickWorld`);
 * - a card result arms the card (`onArmCard`);
 * - a Codex result opens the Codex at that entry (`onOpenCodex`);
 * - the eye flies without opening (`onShowOnMap`).
 *
 * Esc closes the box through the escape stack, above the Inspector. Keyboard: ↑/↓ move the
 * active row, Enter picks it (the combobox pattern, Law 50).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { GameState } from '../../../types/gameState';
import type { WorldRef } from '../../../types/worldRef';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import { readView } from '../../../engine/views/readView';
import { findIndexSelector, findIndexStamp, matchFind, type FindCodexSeed, type FindEntryVM, type FindIndexVM, type FindListId } from '../../../engine/views/find';
import { FIND_BOX_MAX_VH } from '../../../engine/views/viewConstants';
import { FIND_WORDS, type ListHeadingId } from '../../../data/view-content';
import { ListHeadingIcon } from '../../shared/ListHeadingIcon';
import { RowPicture, rowDressingAttrs } from '../../shared/RowPicture';
import { FIND_CTRL_KEY, FIND_HOTKEYS } from '../../../data/top-bar-keys';
import { ICON_FOR_WORLD_REF_KIND } from '../../../data/icons/conceptIcons';
import type { IconName } from '../../../data/icons/iconRegistry';
import { Icon } from '../../shared/Icon';
import { Panel } from '../../shared/Panel';
import { Button } from '../../shared/Button';
import { IconButton } from '../../shared/IconButton';
import { useEscapeLayer } from '../../shared/useEscapeLayer';
import { Z_BAND } from '../../shared/zBands';
import { TOPBAR_INERT_OPACITY, TOPBAR_LIVE_HEIGHT_VAR } from '../GameView/GameViewTopBar';

export interface FindBoxProps {
  gameState: GameState;
  runtime: SimulationRuntime | null;
  /** The debug fog lever: with fog off everything is nameable. */
  fogOff: boolean;
  /** Inspector history keys, newest first. */
  recentKeys: readonly string[];
  /** The Codex's entries (lazy-loaded by the host). */
  codex: readonly FindCodexSeed[];
  onPickWorld: (ref: WorldRef, hexKey: string | null) => void;
  onArmCard: (actionId: string) => void;
  onOpenCodex: (entryId: string) => void;
  onShowOnMap: (hexKey: string) => void;
  /** An encounter holds the screen: the field dims and its keys are ignored (THR-1814). */
  disabled?: boolean;
}

/** THR-2103 (S7.3) — each Find group's row in `LIST_HEADING_ICONS` (Law 58). */
const FIND_GROUP_HEADING: Readonly<Record<FindListId, ListHeadingId>> = {
  places: 'findPlaces',
  people: 'findPeople',
  yourPeople: 'findYours',
  powers: 'findPowers',
  things: 'findThings',
  cards: 'findCards',
  codex: 'findCodex',
  recent: 'findRecent',
};

function iconFor(e: FindEntryVM): IconName {
  if (e.entryKind === 'card') return 'cards';
  if (e.entryKind === 'codex') return 'codex';
  return ICON_FOR_WORLD_REF_KIND[e.entryKind];
}

function isInputActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.hasAttribute('contenteditable');
}

export function FindBox({ gameState, runtime, fogOff, recentKeys, codex, onPickWorld, onArmCard, onOpenCodex, onShowOnMap, disabled = false }: FindBoxProps) {
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<FindListId | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  // Built when the box opens (THR-1822 § D10): the index reads the world at that moment.
  const [index, setIndex] = useState<FindIndexVM>({ entries: [] });
  useEffect(() => {
    if (!open) return;
    try {
      setIndex(readView(runtime, gameState, findIndexSelector, { fogOff, codex: [...codex], stamp: findIndexStamp(gameState) }, gameState.tiles));
    } catch (err) {
      console.warn('[FindBox] index build failed:', err);
      setIndex({ entries: [] });
    }
    // Rebuild when the box opens, and as the world moves while it is open.
  }, [open, gameState, runtime, fogOff, codex]);

  const results = useMemo(() => matchFind(index, query, recentKeys, { expand: expanded }), [index, query, recentKeys, expanded]);
  const groups = results.groups;
  const flat = useMemo(() => groups.flatMap(g => g.rows), [groups]);
  useEffect(() => {
    setActive(0);
    setExpanded(null);
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setExpanded(null);
  }, []);

  const openBox = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Ctrl+K / Cmd+K anywhere; `/` when no input has focus.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || disabledRef.current) return;
      const ctrlK = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === FIND_CTRL_KEY;
      const slash = !e.ctrlKey && !e.metaKey && !e.altKey && FIND_HOTKEYS.includes(e.key) && !isInputActive();
      if (!ctrlK && !slash) return;
      e.preventDefault();
      openBox();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openBox]);

  // A press outside the field and the box closes it.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (t && (boxRef.current?.contains(t) || inputRef.current?.contains(t))) return;
      close();
    }
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [open, close]);

  useEffect(() => {
    if (disabled) close();
  }, [disabled, close]);

  useEscapeLayer(open, close, Z_BAND.drawer, FIND_WORDS.escapeLabel);

  const pick = useCallback((e: FindEntryVM) => {
    close();
    inputRef.current?.blur();
    if (e.entryKind === 'card') onArmCard(e.ref.id);
    else if (e.entryKind === 'codex') onOpenCodex(e.ref.id);
    else onPickWorld(e.ref as WorldRef, e.hexKey);
  }, [close, onArmCard, onOpenCodex, onPickWorld]);

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      const row = flat[active];
      if (row) {
        e.preventDefault();
        pick(row);
      }
    }
  };

  const activeRow = open ? flat[active] : undefined;
  const optionId = (e: FindEntryVM) => `${listId}-${e.key}`;

  return (
    <div data-testid="find-field-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
      <label
        className="focus-within-ring"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', maxWidth: 'var(--find-box-w)',
          height: '2rem', padding: '0 var(--space-2)', borderRadius: 'var(--radius-control)',
          border: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', color: 'var(--text-secondary)',
          opacity: disabled ? TOPBAR_INERT_OPACITY : undefined,
        }}
      >
        <Icon name="find" size="chip" decorative />
        <span className="sr-only">{FIND_WORDS.field}</span>
        <input
          ref={inputRef}
          data-testid="find-input"
          type="text"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeRow ? optionId(activeRow) : undefined}
          placeholder={FIND_WORDS.field}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKey}
          style={{
            flex: '1 1 auto', minWidth: 0, background: 'transparent', border: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
          }}
        />
        <kbd aria-hidden="true" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{FIND_WORDS.keyHint}</kbd>
      </label>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={boxRef}
          data-testid="find-box"
          role="region"
          aria-label={FIND_WORDS.regionLabel}
          style={{
            position: 'fixed', top: `calc(var(${TOPBAR_LIVE_HEIGHT_VAR}, var(--topbar-height)) + var(--space-1))`, left: '50%',
            transform: 'translateX(-50%)', width: 'var(--find-box-w)', maxWidth: 'calc(100vw - 2 * var(--space-4))',
            maxHeight: `${FIND_BOX_MAX_VH}vh`, zIndex: Z_BAND.drawer, display: 'flex', flexDirection: 'column',
          }}
        >
          <Panel level="panel" floating material="glass" padding="none" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div id={listId} role="listbox" aria-label={FIND_WORDS.regionLabel} style={{ overflowY: 'auto', padding: 'var(--space-2)', minHeight: 0 }}>
              {results.hint && (
                <p data-testid="find-hint" style={{ margin: 'var(--space-1) var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{results.hint}</p>
              )}
              {results.miss && (
                <p data-testid="find-miss" role="status" style={{ margin: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{results.miss}</p>
              )}
              {groups.map(g => (
                <div key={g.id} role="group" aria-label={g.label} data-find-group={g.id} style={{ marginTop: 'var(--space-2)' }}>
                  <div style={{ padding: '0 var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <ListHeadingIcon id={FIND_GROUP_HEADING[g.id]} />
                    {g.label}
                  </div>
                  {g.rows.map(row => {
                    const isActive = row === activeRow;
                    return (
                      <div
                        key={row.key}
                        id={optionId(row)}
                        role="option"
                        aria-selected={isActive}
                        data-find-row={row.key}
                        {...rowDressingAttrs(row.visual, row.visual !== undefined)}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => pick(row)}
                        onMouseEnter={() => setActive(flat.indexOf(row))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-control)', cursor: 'pointer', minWidth: 0,
                          background: isActive ? 'var(--bg-hover)' : 'transparent',
                        }}
                      >
                        {/* THR-2103: a world row's picture replaces its kind icon; the kind word stays its accessible name. */}
                        {row.visual ? (
                          <span title={row.kindLabel} style={{ display: 'inline-flex', flexShrink: 0 }}>
                            <span className="sr-only">{row.kindLabel}</span>
                            <span aria-hidden="true" style={{ display: 'inline-flex' }}><RowPicture visual={row.visual} /></span>
                          </span>
                        ) : (
                          <Icon name={iconFor(row)} size="chip" label={row.kindLabel} />
                        )}
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '0 1 auto', minWidth: 0 }}>{row.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto', minWidth: 0 }}>{row.fact}</span>
                        {row.mapLocated && row.hexKey && (
                          <IconButton
                            size="sm"
                            data-testid="find-eye"
                            aria-label={FIND_WORDS.showOnMap.replace('{name}', row.name)}
                            title={FIND_WORDS.showOnMap.replace('{name}', row.name)}
                            tabIndex={-1}
                            icon={<Icon name="reveal" size="chip" decorative />}
                            onMouseDown={e => e.preventDefault()}
                            onClick={e => {
                              e.stopPropagation();
                              onShowOnMap(row.hexKey!);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  {g.showAll && (
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="find-show-all"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setExpanded(g.id)}
                    >
                      {g.showAll}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>,
        document.body,
      )}
    </div>
  );
}
