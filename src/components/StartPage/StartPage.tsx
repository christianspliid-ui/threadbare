import { useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useThemeMusic } from './useThemeMusic';
import { SettingsModal } from './SettingsModal';
import { CreditsModal } from './CreditsModal';
import {
  START_PAGE_TITLE,
  START_PAGE_WORDMARK,
  START_PAGE_LORE_LINE_1,
  START_PAGE_LORE_LINE_2,
  START_PAGE_FADE_DURATION_MS,
  THEME_VOLUME_DEFAULT,
  VERSION_STAMP_TEXT,
  START_PAGE_BG_IMAGE,
} from './startPageConstants';
import './StartPage.css';

interface StartPageProps {
  onNewWorld: () => void;
}

export function StartPage({ onNewWorld }: StartPageProps) {
  const { play, muted, toggleMute, setVolume } = useThemeMusic();
  const [volume, setVolumeState] = useState(THEME_VOLUME_DEFAULT);

  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolumeState(v);
      setVolume(v);
    },
    [setVolume],
  );
  const [fading, setFading] = useState(false);
  const hasInteracted = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const handleFirstInteraction = useCallback(() => {
    if (hasInteracted.current) return;
    hasInteracted.current = true;
    play();
  }, [play]);

  const handleNewWorld = useCallback(() => {
    if (fading) return;
    setFading(true);
    // Music continues playing — no fadeOut. Visual fade, then transition.
    setTimeout(() => {
      onNewWorld();
    }, START_PAGE_FADE_DURATION_MS);
  }, [fading, onNewWorld]);

  return (
    <>
      <div
        className={`start-page${fading ? ' start-page--fading' : ''}`}
        onClick={handleFirstInteraction}
        onKeyDown={handleFirstInteraction}
      >
        <img
          src={START_PAGE_BG_IMAGE}
          alt=""
          role="presentation"
          className="start-page__bg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="start-page__gradient" />
        <div className="start-page__mist start-page__mist--1" />
        <div className="start-page__mist start-page__mist--2" />
        <div className="start-page__shimmer" />
        <h1 className="start-page__title">
          <img
            src={START_PAGE_WORDMARK}
            alt={START_PAGE_TITLE}
            className="start-page__wordmark"
          />
        </h1>
        <div className="start-page__content">
          <p className="start-page__lore">
            {START_PAGE_LORE_LINE_1}
            <br />
            {START_PAGE_LORE_LINE_2}
          </p>
          <nav className="start-page__menu">
            <button className="start-page__menu-item" onClick={handleNewWorld}>
              New World
            </button>
            {/* Continue hidden until save system ships */}
            <button className="start-page__menu-item" onClick={() => setSettingsOpen(true)}>
              Settings
            </button>
            <button className="start-page__menu-item" onClick={() => setCreditsOpen(true)}>
              Credits
            </button>
          </nav>
        </div>
        <button
          className="start-page__mute"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute theme music' : 'Mute theme music'}
        >
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <span className="start-page__version">{VERSION_STAMP_TEXT}</span>
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        muted={muted}
        onToggleMute={toggleMute}
      />
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  );
}
