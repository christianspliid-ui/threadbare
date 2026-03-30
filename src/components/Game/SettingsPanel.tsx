import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../shared/IconButton';
import type { NotificationPreferences, NotificationCategoryKey, NotificationMode } from '../../types/notification';
import { NOTIFICATION_CATEGORY_ORDER, NOTIFICATION_CATEGORY_LABELS } from '../../types/notification';
import {
  getActivePaletteId,
} from '../HexMapV2/palette/activePalette';
import {
  PALETTE_THEMES,
  type PaletteThemeId,
} from '../HexMapV2/palette/paletteTheme';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  // Display settings
  fogDisabled: boolean;
  onToggleFog: () => void;
  // Debug settings
  debugPanelOpen: boolean;
  onToggleDebug: () => void;
  showOrganicShore: boolean;
  onToggleOrganicShore: () => void;
  // Notification preferences
  notificationPrefs?: NotificationPreferences;
  onToggleNotificationCategory?: (key: NotificationCategoryKey) => void;
  onSetNotificationMode?: (key: NotificationCategoryKey, mode: NotificationMode) => void;
  onResetNotificationPrefs?: () => void;
}

export function SettingsPanel({
  open,
  onClose,
  fogDisabled,
  onToggleFog,
  debugPanelOpen,
  onToggleDebug,
  showOrganicShore,
  onToggleOrganicShore,
  notificationPrefs,
  onToggleNotificationCategory,
  onSetNotificationMode,
  onResetNotificationPrefs,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [paletteId, setPaletteId] = useState<PaletteThemeId>(getActivePaletteId());

  // Handle Escape key and click-outside
  useEffect(() => {
    if (!open) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    // Defer click-outside listener so the opening click doesn't
    // immediately trigger close via event propagation.
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handlePaletteChange = (id: PaletteThemeId) => {
    if (id === paletteId) return;
    setPaletteId(id);
    // Palette change requires full reload because module-level constants
    // (label halos, label colors) are computed at import time.
    const url = new URL(window.location.href);
    if (id === 'golden-hour') {
      url.searchParams.delete('palette');
    } else {
      url.searchParams.set('palette', id);
    }
    window.location.href = url.toString();
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '52px',
    right: '8px',
    width: '280px',
    maxHeight: '85vh',
    backgroundColor: 'rgba(10, 10, 14, 0.95)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    fontFamily: 'var(--font-body)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
    flexShrink: 0,
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  };

  const contentStyle: React.CSSProperties = {
    padding: '12px 0',
    overflow: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    paddingBottom: '8px',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '8px 16px 4px 16px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-tertiary)',
  };

  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
  };

  const settingLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-primary)',
    flex: 1,
  };

  const toggleStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: enabled
      ? 'var(--accent-gold-glow)'
      : 'rgba(100, 100, 110, 0.3)',
    border: `1px solid ${
      enabled ? 'var(--accent-gold-dim)' : 'rgba(100, 100, 110, 0.4)'
    }`,
    transition: 'background-color var(--anim-fast) ease, border-color var(--anim-fast) ease',
  });

  const toggleDotStyle = (enabled: boolean): React.CSSProperties => ({
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: enabled ? 'var(--accent-gold)' : 'rgba(200, 200, 210, 0.5)',
    transition: 'transform var(--anim-fast) ease',
    transform: enabled ? 'translateX(8px)' : 'translateX(-8px)',
  });

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'rgba(30, 30, 36, 0.9)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    outline: 'none',
  };

  const paletteOptions = Object.values(PALETTE_THEMES);

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      role="menu"
      aria-label="Settings"
    >
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={headerTitleStyle}>Settings</h2>
        <IconButton
          icon={<span>×</span>}
          variant="close"
          size="sm"
          onClick={onClose}
          aria-label="Close settings"
        />
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Display Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Display</div>
          <div style={settingRowStyle}>
            <label style={settingLabelStyle}>Fog of War</label>
            <button
              onClick={onToggleFog}
              style={toggleStyle(!fogDisabled)}
              aria-label="Toggle fog of war"
              title={fogDisabled ? 'Fog is off' : 'Fog is on'}
            >
              <div style={toggleDotStyle(!fogDisabled)} />
            </button>
          </div>
          <div style={settingRowStyle}>
            <label style={settingLabelStyle}>Map Palette</label>
            <select
              value={paletteId}
              onChange={(e) => handlePaletteChange(e.target.value as PaletteThemeId)}
              style={selectStyle}
              aria-label="Select map color palette"
            >
              {paletteOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications Section */}
        {notificationPrefs && onToggleNotificationCategory && onSetNotificationMode && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Notifications</div>
            {NOTIFICATION_CATEGORY_ORDER.map(key => {
              const catPrefs = notificationPrefs[key];
              return (
                <div key={key} style={settingRowStyle}>
                  <label style={{ ...settingLabelStyle, fontSize: '12px' }}>
                    {NOTIFICATION_CATEGORY_LABELS[key]}
                  </label>
                  {/* On/Off toggle */}
                  <button
                    onClick={() => onToggleNotificationCategory(key)}
                    style={toggleStyle(catPrefs.enabled)}
                    aria-label={`Toggle ${NOTIFICATION_CATEGORY_LABELS[key]} notifications`}
                    title={catPrefs.enabled ? 'Enabled' : 'Disabled'}
                  >
                    <div style={toggleDotStyle(catPrefs.enabled)} />
                  </button>
                  {/* Mode toggle: ⏱ temporary / 📌 permanent */}
                  <div style={{ display: 'flex', gap: '2px', marginLeft: '6px' }}>
                    <button
                      onClick={() => onSetNotificationMode(key, 'temporary')}
                      style={{
                        fontSize: '12px',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: catPrefs.enabled ? 'pointer' : 'default',
                        background: catPrefs.mode === 'temporary' ? 'var(--accent-gold-glow)' : 'transparent',
                        color: catPrefs.mode === 'temporary' ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                        opacity: catPrefs.enabled ? 1 : 0.4,
                      }}
                      disabled={!catPrefs.enabled}
                      title="Auto-expire"
                      aria-label={`Set ${NOTIFICATION_CATEGORY_LABELS[key]} to temporary mode`}
                    >
                      ⏱
                    </button>
                    <button
                      onClick={() => onSetNotificationMode(key, 'permanent')}
                      style={{
                        fontSize: '12px',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: catPrefs.enabled ? 'pointer' : 'default',
                        background: catPrefs.mode === 'permanent' ? 'var(--accent-gold-glow)' : 'transparent',
                        color: catPrefs.mode === 'permanent' ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                        opacity: catPrefs.enabled ? 1 : 0.4,
                      }}
                      disabled={!catPrefs.enabled}
                      title="Stay until dismissed"
                      aria-label={`Set ${NOTIFICATION_CATEGORY_LABELS[key]} to permanent mode`}
                    >
                      📌
                    </button>
                  </div>
                </div>
              );
            })}
            {onResetNotificationPrefs && (
              <div style={{ padding: '8px 16px' }}>
                <button
                  onClick={onResetNotificationPrefs}
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    background: 'none',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                  aria-label="Reset notification preferences to defaults"
                >
                  Reset to Defaults
                </button>
              </div>
            )}
          </div>
        )}

        {/* Debug Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Debug</div>
          <div style={settingRowStyle}>
            <label style={settingLabelStyle}>Debug Trace Panel</label>
            <button
              onClick={onToggleDebug}
              style={toggleStyle(debugPanelOpen)}
              aria-label="Toggle debug trace panel"
              title={debugPanelOpen ? 'Debug panel is open' : 'Debug panel is closed'}
            >
              <div style={toggleDotStyle(debugPanelOpen)} />
            </button>
          </div>
          <div style={settingRowStyle}>
            <label style={settingLabelStyle}>Organic Shore</label>
            <button
              onClick={onToggleOrganicShore}
              style={toggleStyle(showOrganicShore)}
              aria-label="Toggle organic shore"
              title={showOrganicShore ? 'Organic shore is on' : 'Organic shore is off'}
            >
              <div style={toggleDotStyle(showOrganicShore)} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
