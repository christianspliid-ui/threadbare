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
  offerAwakeHungers,
  generateDivineName,
  buildPersonalitySeed,
} from '../../engine/remembrance';
import { STIRRING_IMAGES, REMEMBRANCE_STIRRING_PICK_ENABLED } from '../../data/stirring-images';
import { drawStirringBackdrop } from './stirringBackdrop';
import { ORIGIN_FRAGMENTS, DRIVE_FRAGMENTS } from '../../data/remembrance-fragments';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import type { AccountRecord } from '../../types/account';
import { awakeHungers, emptyAccount, openCourts, wakeHunger } from '../../engine/accountRecord';
import { WorldRemembersBeat } from './WorldRemembersBeat';
import { toStoredHungerId } from '../../types/hunger';
import { StirringBeat } from './StirringBeat';
import { OriginBeat } from './OriginBeat';
import { DriveBeat } from './DriveBeat';
import { TransformationBeat } from './TransformationBeat';
import { RevealBeat } from './RevealBeat';
import { deriveAlignmentFromPoints, presetFromAlignment, type SpherePoints } from '../../engine/spherePoints';

interface RemembranceFlowProps {
  seed: number;
  /**
   * THR-1844 — the record this Remembrance reads: its awake hungers and open courts gate
   * Transformation, and from run 2 on *The world remembers* opens the flow. Absent → an
   * empty record (run 1: four hungers, default courts).
   */
  account?: AccountRecord;
  /** `account` carries the hunger woken on *The world remembers*, when one was. */
  onComplete: (identity: AscendantIdentity, account: AccountRecord) => void;
  /** THR-1813 — a line for the first step (the account could not be read on this device). */
  accountNotice?: string;
  /** THR-1989 — defaults to REMEMBRANCE_STIRRING_PICK_ENABLED; a prop so tests can flip it. */
  stirringPickEnabled?: boolean;
}

export function RemembranceFlow({
  seed,
  account: accountProp,
  onComplete,
  accountNotice,
  stirringPickEnabled = REMEMBRANCE_STIRRING_PICK_ENABLED,
}: RemembranceFlowProps) {
  // THR-1989: with the pick off, the flow opens on Origin and the stirring image
  // is drawn from the seed — it still feeds filterOriginFragments as the pick did.
  const firstBeat: RemembranceBeat = stirringPickEnabled ? 'stirring' : 'origin';
  const baseAccount = useMemo(() => accountProp ?? emptyAccount(seed), [accountProp, seed]);
  // THR-1844: from run 2 on the flow opens on *The world remembers*; a first run never sees it.
  const [beat, setBeat] = useState<RemembranceBeat>(() => (baseAccount.cycleCount > 0 ? 'world_remembers' : firstBeat));
  const [account, setAccount] = useState<AccountRecord>(baseAccount);
  const [wokenHungerId, setWokenHungerId] = useState<string | null>(null);

  // Accumulated state
  const [stirringImage, setStirringImage] = useState<StirringImage | null>(
    () => (stirringPickEnabled ? null : drawStirringBackdrop(STIRRING_IMAGES, seed)),
  );
  const [originFragment, setOriginFragment] = useState<RemembranceFragment | null>(null);
  const [mortalName, setMortalName] = useState<string | null>(null);
  const [driveFragment, setDriveFragment] = useState<RemembranceFragment | null>(null);
  const [hunger, setHunger] = useState<HungerDefinition | null>(null);
  const [courtType, setCourtType] = useState<string | null>(null);
  const [spherePoints, setSpherePoints] = useState<SpherePoints | null>(null);

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
    return offerAwakeHungers(originFragment, driveFragment, awakeHungers(account, HUNGER_CATALOG), seed, wokenHungerId);
  }, [originFragment, driveFragment, seed, account, wokenHungerId]);

  const courtsFor = useCallback((h: HungerDefinition) => openCourts(account, h), [account]);

  const suggestedDivineName = useMemo(() => {
    if (!hunger || !originFragment) return 'The Unnamed';
    return generateDivineName(hunger, originFragment, seed);
  }, [hunger, originFragment, seed]);

  // Beat handlers
  const handleWorldRemembered = useCallback((woken: string | null) => {
    if (woken) {
      setAccount(prev => wakeHunger(prev, woken));
      setWokenHungerId(woken);
    }
    setBeat(firstBeat);
  }, [firstBeat]);

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

  const handleTransformationSelect = useCallback((h: HungerDefinition, court: string, points?: SpherePoints) => {
    setHunger(h);
    setCourtType(court);
    // THR-1749: an older caller without points falls back to the hunger's preset.
    setSpherePoints(points ?? presetFromAlignment(h.sphereAlignment));
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
      hungerId: toStoredHungerId(hunger.id),
      hungerName: hunger.name,
      mandateDirection: hunger.mandateDirection,
      courtType: courtType as AscendantIdentity['courtType'],
      sphereAlignment: (spherePoints && deriveAlignmentFromPoints(spherePoints)) ?? hunger.sphereAlignment,
      spherePoints: spherePoints ?? presetFromAlignment(hunger.sphereAlignment),
      domainAffinities: hunger.domainAffinities,
      personalitySeed,
      ascendantLens: hunger.ascendantLens,
    };

    onComplete(identity, account);
  }, [originFragment, driveFragment, hunger, courtType, spherePoints, mortalName, seed, onComplete, account]);

  // Render current beat
  switch (beat) {
    case 'world_remembers':
      return <WorldRemembersBeat account={account} onContinue={handleWorldRemembered} />;
    case 'stirring':
      return <StirringBeat images={STIRRING_IMAGES} onSelect={handleStirringSelect} notice={accountNotice} />;
    case 'origin':
      return stirringPickEnabled ? (
        <OriginBeat fragments={originFragments} onSelect={handleOriginSelect} />
      ) : (
        <OriginBeat
          fragments={originFragments}
          onSelect={handleOriginSelect}
          backdrop={stirringImage}
          notice={accountNotice}
        />
      );
    case 'drive':
      return <DriveBeat fragments={driveFragments} onSelect={handleDriveSelect} />;
    case 'transformation':
      return (
        <TransformationBeat
          hungers={hungerOptions}
          driveFragment={driveFragment!}
          courtsFor={courtsFor}
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
          spherePoints={spherePoints ?? undefined}
          suggestedDivineName={suggestedDivineName}
          onComplete={handleRevealComplete}
        />
      );
  }
}
