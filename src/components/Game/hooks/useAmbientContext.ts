// src/components/Game/hooks/useAmbientContext.ts
import { useEffect, useRef } from 'react';
import type { HexCoord, HexTile, LocationSubtype } from '../../../types';
import { terrainToSoundKey } from '../../../audio/terrainSoundKey';
import { locationToSoundKey } from '../../../audio/locationSoundKey';
import { pushAmbient, popAmbient } from '../../../audio/BackgroundChannel';
import { swapMusicTrack, restoreMusicDefault } from '../../../audio/MusicChannel';
import { AMBIENT_CONTEXT_DEBOUNCE_MS } from '../../../audio/audioConstants';

export interface AmbientContextInput {
  /** The hex to read terrain from: selectedHex ?? cameraCenter */
  terrainHex: HexCoord;
  tiles: HexTile[];
  /** Dominant location subtype at focusedHex when hex chronicle panel is open, else null */
  hexChronicleSubtype: LocationSubtype | null;
  /** Location subtype of the currently open location detail panel, else null */
  locationDetailSubtype: LocationSubtype | null;
  /** The active encounter template if one is in progress, else null */
  activeEncounterTemplate: { musicTrack?: string; backgroundTrack?: string } | null;
}

export function useAmbientContext({
  terrainHex, tiles,
  hexChronicleSubtype, locationDetailSubtype,
  activeEncounterTemplate,
}: AmbientContextInput): void {
  const terrainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTerrainKeyRef = useRef<string | null>(null);
  const encounterOverrideRef = useRef<{ channel: 'music' | 'background' } | null>(null);

  // ── Priority 0: terrain (debounced, always active) ──────────────────────────
  useEffect(() => {
    if (terrainDebounceRef.current) clearTimeout(terrainDebounceRef.current);
    terrainDebounceRef.current = setTimeout(() => {
      const tile = tiles.find(
        t => t.coord.col === terrainHex.col && t.coord.row === terrainHex.row
      );
      const key = tile ? terrainToSoundKey(tile.terrain) : 'grassland';
      if (key !== lastTerrainKeyRef.current) {
        lastTerrainKeyRef.current = key;
        pushAmbient(0, key);
      }
    }, AMBIENT_CONTEXT_DEBOUNCE_MS);
    return () => {
      if (terrainDebounceRef.current) clearTimeout(terrainDebounceRef.current);
    };
  }, [terrainHex, tiles]);

  // ── Priority 1: hex chronicle (location at focused hex) ─────────────────────
  useEffect(() => {
    if (hexChronicleSubtype !== null) {
      const key = locationToSoundKey(hexChronicleSubtype);
      if (key) { pushAmbient(1, key); return; }
    }
    popAmbient(1);
  }, [hexChronicleSubtype]);

  // ── Priority 2: location detail panel ───────────────────────────────────────
  useEffect(() => {
    if (locationDetailSubtype !== null) {
      const key = locationToSoundKey(locationDetailSubtype);
      if (key) { pushAmbient(2, key); return; }
    }
    popAmbient(2);
  }, [locationDetailSubtype]);

  // ── Priority 3: encounter override ──────────────────────────────────────────
  useEffect(() => {
    if (activeEncounterTemplate) {
      const { musicTrack, backgroundTrack } = activeEncounterTemplate;
      if (musicTrack) {
        encounterOverrideRef.current = { channel: 'music' };
        swapMusicTrack(musicTrack);
      } else if (backgroundTrack) {
        encounterOverrideRef.current = { channel: 'background' };
        pushAmbient(3, backgroundTrack);
      }
    } else if (encounterOverrideRef.current) {
      const { channel } = encounterOverrideRef.current;
      encounterOverrideRef.current = null;
      if (channel === 'music') restoreMusicDefault();
      else popAmbient(3);
    }
  }, [activeEncounterTemplate]);
}
