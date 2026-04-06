import { useState, useMemo, useCallback } from 'react';
import type {
  RemembranceBeat,
  RemembranceFragment,
  StirringImage,
  HungerDefinition,
  AscendantIdentity,
} from '../../types/remembrance';
import {
  filterOriginFragments,
  filterDriveFragments,
  filterHungers,
  generateDivineName,
  buildPersonalitySeed,
} from '../../engine/remembrance';
import { STIRRING_IMAGES } from '../../data/stirring-images';
import { ORIGIN_FRAGMENTS, DRIVE_FRAGMENTS } from '../../data/remembrance-fragments';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { StirringBeat } from './StirringBeat';
import { OriginBeat } from './OriginBeat';
import { DriveBeat } from './DriveBeat';
import { TransformationBeat } from './TransformationBeat';
import { RevealBeat } from './RevealBeat';

interface RemembranceFlowProps {
  seed: number;
  onComplete: (identity: AscendantIdentity) => void;
}

export function RemembranceFlow({ seed, onComplete }: RemembranceFlowProps) {
  const [beat, setBeat] = useState<RemembranceBeat>('stirring');

  // Accumulated state
  const [stirringImage, setStirringImage] = useState<StirringImage | null>(null);
  const [originFragment, setOriginFragment] = useState<RemembranceFragment | null>(null);
  const [mortalName, setMortalName] = useState<string | null>(null);
  const [driveFragment, setDriveFragment] = useState<RemembranceFragment | null>(null);
  const [hunger, setHunger] = useState<HungerDefinition | null>(null);
  const [courtType, setCourtType] = useState<string | null>(null);

  // Filtered content (computed from accumulated state)
  const originFragments = useMemo(() => {
    if (!stirringImage) return [];
    return filterOriginFragments(stirringImage, ORIGIN_FRAGMENTS, seed);
  }, [stirringImage, seed]);

  const driveFragments = useMemo(() => {
    if (!originFragment) return [];
    return filterDriveFragments(originFragment, DRIVE_FRAGMENTS, seed);
  }, [originFragment, seed]);

  const hungerOptions = useMemo(() => {
    if (!originFragment || !driveFragment) return [];
    return filterHungers(originFragment, driveFragment, HUNGER_CATALOG, seed);
  }, [originFragment, driveFragment, seed]);

  const suggestedDivineName = useMemo(() => {
    if (!hunger || !originFragment) return 'The Unnamed';
    return generateDivineName(hunger, originFragment, seed);
  }, [hunger, originFragment, seed]);

  // Beat handlers
  const handleStirringSelect = useCallback((image: StirringImage) => {
    setStirringImage(image);
    setBeat('origin');
  }, []);

  const handleOriginSelect = useCallback((fragment: RemembranceFragment, name: string) => {
    setOriginFragment(fragment);
    setMortalName(name);
    setBeat('drive');
  }, []);

  const handleDriveSelect = useCallback((fragment: RemembranceFragment) => {
    setDriveFragment(fragment);
    setBeat('transformation');
  }, []);

  const handleTransformationSelect = useCallback((h: HungerDefinition, court: string) => {
    setHunger(h);
    setCourtType(court);
    setBeat('reveal');
  }, []);

  const handleRevealComplete = useCallback((divineName: string) => {
    if (!originFragment || !driveFragment || !hunger || !courtType || !mortalName) return;

    const personalitySeed = buildPersonalitySeed(originFragment, driveFragment, hunger, seed);

    const identity: AscendantIdentity = {
      mortalName,
      originFragmentId: originFragment.id,
      driveFragmentId: driveFragment.id,
      timeSinceAscension: originFragment.timeSinceAscension ?? 'recent',
      mortalTags: [...originFragment.tags, ...driveFragment.tags],
      divineName,
      hungerId: hunger.id,
      hungerName: hunger.name,
      mandateDirection: hunger.mandateDirection,
      courtType: courtType as AscendantIdentity['courtType'],
      sphereAlignment: hunger.sphereAlignment,
      domainAffinities: hunger.domainAffinities,
      personalitySeed,
      ascendantLens: hunger.ascendantLens,
    };

    onComplete(identity);
  }, [originFragment, driveFragment, hunger, courtType, mortalName, seed, onComplete]);

  // Render current beat
  switch (beat) {
    case 'stirring':
      return <StirringBeat images={STIRRING_IMAGES} onSelect={handleStirringSelect} />;
    case 'origin':
      return <OriginBeat fragments={originFragments} onSelect={handleOriginSelect} />;
    case 'drive':
      return <DriveBeat fragments={driveFragments} onSelect={handleDriveSelect} />;
    case 'transformation':
      return (
        <TransformationBeat
          hungers={hungerOptions}
          driveFragment={driveFragment!}
          onSelect={handleTransformationSelect}
        />
      );
    case 'reveal':
      return (
        <RevealBeat
          originFragment={originFragment!}
          driveFragment={driveFragment!}
          hunger={hunger!}
          mortalName={mortalName!}
          courtType={courtType!}
          suggestedDivineName={suggestedDivineName}
          onComplete={handleRevealComplete}
        />
      );
  }
}
