import type { WorldGraph } from '../../../../engine/graph';
import { getEffectiveUnifiedActionChoiceMemory } from '../../../../engine/encounterChoiceMemory';
import { resolveAttachmentTooltip } from '../../../../engine/attachmentTooltip';
import { getNarrativeLabel } from '../../../../engine/domainCapability';
import { getPortraitUrl } from '../../../../data/portrait-assets';
import { REWARD_CONDITIONS } from '../../../../data/reward-attachment-catalog';
import type { ClearanceGateRuntimeState } from '../../../../types/contentShells';
import type {
  EncounterChoiceMemory,
  EncounterSupportActorSpec,
  EncounterSupportBinding,
  EncounterSupportSpec,
  EncounterTemplate,
} from '../../../../types/encounter';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import { isStepSuccess, type UnifiedAction } from '../../../../types/unifiedAction';
import type { ReachDomain } from '../../../../types/traits';
import type { ThreadTier } from '../../TieredEncounterModal';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import { getAttachmentGlyph } from '../../attachmentGlyphs';
import type {
  EncounterCastRole,
  EncounterStageAftermathActorModel,
  EncounterStageAftermathHighlightModel,
  EncounterStageAftermathMarkModel,
  EncounterStageChoiceModel,
  EncounterStageHistoryModel,
  EncounterStageModel,
  EncounterStageNarrativeParagraph,
  EncounterStageNarrativeReference,
  EncounterStageSignalModel,
} from '../types';
import { buildLinkedParagraph } from '../narrativeLinker';

interface BuildGateDutyEncounterStageModelArgs {
  template: EncounterTemplate;
  encounter: ActiveEncounterDisplay;
  notification: EncounterNotification;
  agentName: string;
  threadTier: ThreadTier;
  graph: WorldGraph;
  activeAction?: UnifiedAction;
  clearanceGateState?: ClearanceGateRuntimeState;
  essence: number;
}

function titleCaseWords(raw: string): string {
  return raw
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(part => part[0] ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}

function humanizeTechnicalLabel(raw: string): string {
  if (raw.startsWith('sublocation-type.')) {
    return titleCaseWords(raw.replace('sublocation-type.', ''));
  }
  if (raw.includes('.')) {
    const tail = raw.split('.').pop();
    if (tail) return titleCaseWords(tail);
  }
  return raw;
}

const DOMAIN_NAME_TO_KEY: Record<string, ReachDomain> = {
  iron: 'iron',
  gold: 'gold',
  shadow: 'shadow',
  veil: 'veil',
  heart: 'heart',
  eye: 'eye',
  stone: 'stone',
  star: 'star',
};

const REWARD_CONDITION_BY_NAME = new Map(
  REWARD_CONDITIONS.map(node => [node.name.toLowerCase(), node]),
);

function getNodeName(graph: WorldGraph, nodeId: string | undefined, fallback: string): string {
  if (!nodeId) return fallback;
  const name = graph.getNode(nodeId)?.name;
  if (!name) return fallback;
  return name.includes('.') ? humanizeTechnicalLabel(name) : name;
}

function getActorPortrait(graph: WorldGraph, nodeId: string | undefined): string | null {
  if (!nodeId) return null;
  const archetypeId = graph.getNode(nodeId)?.properties?.narrativeArchetype as string | undefined;
  return getPortraitUrl(archetypeId);
}

function parseGrowthDomain(title: string): ReachDomain | undefined {
  const match = /^(.+?) grew$/i.exec(title.trim());
  if (!match) return undefined;
  return DOMAIN_NAME_TO_KEY[match[1].trim().toLowerCase()];
}

function parseTierShift(detail: string): { from: number; to: number } | undefined {
  const match = /Tier\s+(\d+)\s*->\s*(\d+)/i.exec(detail);
  if (!match) return undefined;
  return {
    from: Number(match[1]),
    to: Number(match[2]),
  };
}

function extractQuotedText(detail: string): string | undefined {
  const match = /"([^"]+)"/.exec(detail);
  return match?.[1];
}

function extractTrailingRewardName(detail: string): string | undefined {
  const gainMatch = /gained\s+(.+?)\.$/i.exec(detail.trim());
  if (gainMatch) return gainMatch[1];
  const markedMatch = /marked by\s+(.+?)\.$/i.exec(detail.trim());
  if (markedMatch) return markedMatch[1];
  return undefined;
}

function isGenericEncounterRoleName(name: string | undefined): boolean {
  if (!name) return true;
  const normalized = name.trim().toLowerCase();
  return normalized === 'gate captain'
    || normalized === 'watch sergeant'
    || normalized === 'gate guard'
    || normalized === 'harried courier'
    || normalized === 'courier'
    || normalized === 'shaken witness'
    || normalized === 'dock porter'
    || normalized === 'witness';
}

function toNarrativeHandle(name: string, fallback: string): string {
  return isGenericEncounterRoleName(name) ? fallback : name;
}

function getSupportSpec(template: EncounterTemplate, key: string): EncounterSupportSpec | undefined {
  return template.supportBundle?.find(spec => spec.key === key);
}

function getSupportBinding(action: UnifiedAction | undefined, key: string): EncounterSupportBinding | undefined {
  return action?.supportBindings?.find(binding => binding.key === key);
}

function getActorSpec(template: EncounterTemplate, key: string): EncounterSupportActorSpec | undefined {
  const spec = getSupportSpec(template, key);
  return spec?.kind === 'actor' ? spec : undefined;
}

function describeRole(role: EncounterCastRole, name: string): string {
  switch (role) {
    case 'authority': return `${name} is trying to keep order without letting the checkpoint look weak.`;
    case 'subject': return `${name} is carrying the risk that the whole line can suddenly see.`;
    case 'witness': return `${name} is already deciding how this story will travel once the line moves again.`;
    case 'support': return `${name} helps decide whether the gate feels disciplined or heavy-handed.`;
    case 'location': return `${name} is the place that will remember how this scene was handled.`;
  }
}

type GateDutyBranch = EncounterChoiceMemory['interventionType'] | 'unknown';

function getGateDutyBranch(memory?: EncounterChoiceMemory): GateDutyBranch {
  return memory?.interventionType ?? 'unknown';
}

function getChoiceMemoryForStep(
  encounter: Pick<ActiveEncounterDisplay, 'choiceHistory' | 'disregardRemaining' | 'startedTick'>,
  activeAction: UnifiedAction | undefined,
  stepIndex: number,
  stepId: string,
): EncounterChoiceMemory | undefined {
  return getEffectiveUnifiedActionChoiceMemory(
    activeAction ?? {
      choiceHistory: encounter.choiceHistory,
      disregardRemaining: encounter.disregardRemaining ?? false,
      startTick: encounter.startedTick,
    },
    stepIndex,
    stepId,
  )
    ?? encounter.choiceHistory?.find(entry => entry.stepIndex === stepIndex);
}

function getCurrentStepIndex(
  encounter: Pick<ActiveEncounterDisplay, 'currentStepIndex'>,
  activeAction: UnifiedAction | undefined,
): number {
  return activeAction?.currentStep ?? encounter.currentStepIndex;
}

function getGateDutyHeaderSubtitle(currentStepIndex: number): string {
  switch (currentStepIndex) {
    case 0:
      return 'The checkpoint is already under judgment.';
    case 1:
      return 'The seizure has begun, and the crowd is deciding what it means.';
    case 2:
      return 'The cart is stopped, but the story has only just begun.';
    default:
      return 'A checkpoint story is already unfolding without waiting for you.';
  }
}

function buildChoiceIntent(args: {
  choice: EncounterNotification['choices'][number];
  currentStepIndex: number;
  captainName: string;
  courierName: string;
  witnessName: string;
  essence: number;
}): EncounterStageChoiceModel {
  const { choice, currentStepIndex, captainName, courierName, witnessName, essence } = args;
  const type = choice.interventionType;
  const captainHandle = toNarrativeHandle(captainName, 'the gate captain');
  const courierHandle = toNarrativeHandle(courierName, 'the courier');
  const witnessHandle = toNarrativeHandle(witnessName, 'the witness');
  const essenceCost = choice.essenceCost ?? 0;
  const affordable = essence + 1e-9 >= essenceCost;

  const stepCopy: Record<number, Record<EncounterChoiceMemory['interventionType'], {
    label: string;
    intent: string;
    targetLabel: string;
    likelyBurden: string;
  }>> = {
    0: {
      supportive: {
        label: 'Steady the courier',
        intent: `${courierHandle[0] ? courierHandle[0].toUpperCase() + courierHandle.slice(1) : courierHandle} is the cheapest thread to take in hand — barely a breath of essence to steady her. Settle into the space behind her eyes, quiet the burning urgency, still the hand that wants to reach for the reins and force her way forward. Let her composure hold just long enough for the line to move, for the cart to pass without theatre, for the checkpoint to exhale. A small intervention. A gentle one. But panic does not vanish when you soothe it; it merely flows somewhere else, and that somewhere may be you.`,
        targetLabel: courierName,
        likelyBurden: 'Her panic may cling to you afterward as strain or the sour sense that someone noticed the touch.',
      },
      coercive: {
        label: 'Force the captain',
        intent: `${captainHandle[0] ? captainHandle[0].toUpperCase() + captainHandle.slice(1) : captainHandle} is the harder pull — five times the essence, and the thread fights you. Her mind is a locked room. To move her you must not soothe. You must press. Force her hand before the crowd’s silence curdles into judgment and the cart passes, the line moves, the moment breaks cleanly. But clean is not the same as kind, and the crowd may leave calling the watch decisive with one breath and a fist with the next.`,
        targetLabel: captainName,
        likelyBurden: 'You may win the gate while leaving the watch looking like power turned inward.',
      },
      withdrawn: {
        label: 'Keep your hand folded',
        intent: `Hold your essence. Keep your hands folded in the dark and let the scene unspool on its own terms. Let ${captainHandle} hesitate. Let ${courierHandle} fray. Let ${witnessHandle} watch. The gate will show its own nature when no god leans on the scales, and there is a terrible clarity in that. But if you do not shape this moment, ${witnessHandle} will, and the story that leaves the gate will be hers, not yours.`,
        targetLabel: witnessName,
        likelyBurden: 'You keep your strength, but you may lose authorship of the narrative entirely.',
      },
    },
    1: {
      supportive: {
        label: 'Guide the seizure into discipline',
        intent: `Enter the hands of the watch themselves — not to inflame them, but to cool them into precision. No roughness. No triumph. No unnecessary force. Guide the taking of ${courierHandle} until it reads as the hundredth sad duty of an orderly world rather than a rare chance to dominate the frightened. The line may still flinch, but it will have less reason to call what it saw hunger.`,
        targetLabel: captainName,
        likelyBurden: 'If your touch slips, the restraint may feel eerie instead of humane.',
      },
      coercive: {
        label: 'Break the courier open before the crowd can invent worse',
        intent: `Do not contain ${courierHandle}'s fear — sharpen it. Let the pressure crest. Let her move too fast, speak in the wrong tone, betray the cart with half an inch of panic, until the line stops imagining and starts believing. A confession need not be verbal to be complete. The watch may inherit legitimacy from her collapse before proof is ever named.`,
        targetLabel: courierName,
        likelyBurden: 'You may turn one mortal’s worst second into the hinge on which the evening swings.',
      },
      withdrawn: {
        label: 'Give the witness the scene',
        intent: `Yield a heartbeat of control so ${witnessHandle} and the queue begin naming the danger before the guards fully do. Let public attention become the force that pins the moment in place. Under that pressure, the captain will have to move — not because certainty has ripened, but because the crowd has begun to write the silence for her. It is a dangerous elegance: making the line itself seize the courier before the watch quite does.`,
        targetLabel: witnessName,
        likelyBurden: 'Once the crowd starts authoring the event, even the captain becomes a reader of it.',
      },
    },
    2: {
      supportive: {
        label: 'Cool the gate back into legitimacy',
        intent: `Lay your will lightly across the checkpoint and bleed heat from the moment. Not enough to erase what has happened — that is impossible now — but enough that ${captainHandle}'s next words and gestures feel like containment rather than punishment, enough that the barrier remembers its purpose instead of its appetite. This is the most difficult mercy: not preventing harm, but preventing harm from becoming identity.`,
        targetLabel: captainName,
        likelyBurden: 'You may keep the barrier humane by taking some of its tension into yourself.',
      },
      coercive: {
        label: 'Consecrate authority',
        intent: `Draw the whole gatehouse taut around a single idea: that the watch is right because it acts, and acts because it must. Pour certainty through ${captainHandle} until hesitation burns away and the whole barrier feels unassailable for one dangerous instant, even if that certainty arrives tasting more like dread than trust.`,
        targetLabel: captainName,
        likelyBurden: 'You may preserve power at the cost of quietly wounding legitimacy.',
      },
      withdrawn: {
        label: 'Leave the story to the living',
        intent: `Withdraw now, at the last and most tempting hour, and let the checkpoint keep only what mortal hands can hold. Let ${captainHandle} speak in her own voice. Let ${courierHandle} carry exactly what the evening has made of her. Let ${witnessHandle} shape the tale with no resistance but human uncertainty. There is honesty in that, perhaps even wisdom. There is also surrender.`,
        targetLabel: witnessName,
        likelyBurden: 'The story that leaves the gate may no longer bear your shape at all.',
      },
    },
  };

  const stepSpecific = stepCopy[currentStepIndex]?.[type];
  return {
    id: choice.id,
    label: stepSpecific?.label ?? choice.text,
    intent: stepSpecific?.intent ?? 'Shift the checkpoint pressure in your favor.',
    targetLabel: stepSpecific?.targetLabel,
    essenceCost,
    affordable,
    costLabel: essenceCost > 0 ? `${essenceCost.toFixed(2)} essence` : undefined,
    likelyBurden: stepSpecific?.likelyBurden,
  };
}

function buildSignalModels(
  template: EncounterTemplate,
  clearanceGateState: ClearanceGateRuntimeState | undefined,
): EncounterStageSignalModel[] {
  const gate = template.clearanceGates?.[0];
  if (!gate) return [];
  const revealed = new Set(clearanceGateState?.revealedSignalKeys ?? []);
  const signalCopy: Record<string, Record<EncounterStageSignalModel['visibility'], string>> = {
    forged_papers: {
      hidden: 'The captain keeps returning to the seal, even though no one has named the problem aloud yet.',
      known: 'There is something wrong with the papers, and the people nearest the desk can feel it.',
      revealed: 'The seal and signatures are wrong; anyone close enough to see the papers knows they will not survive a second inspection.',
    },
    hidden_cargo: {
      hidden: 'The cart rides heavier than its manifest suggests, but the line has not yet understood why that matters.',
      known: 'Something about the load feels wrong, even if the whole line cannot yet point to it.',
      revealed: 'The weight and packing do not match the story on the papers; the cargo is now part of the confrontation.',
    },
    witness_pressure: {
      hidden: 'No single voice owns the story yet, but the line is listening for one.',
      known: 'A witness in the queue is already deciding how this scene will be told once it is over.',
      revealed: 'The witness has become part of the event itself; whatever happens now will leave the gate on other people’s tongues.',
    },
  };
  const visibilityLabelMap: Record<EncounterStageSignalModel['visibility'], string> = {
    hidden: 'Unspoken',
    known: 'Felt',
    revealed: 'Named',
  };
  return gate.signals.map(signal => {
    const visibility = revealed.has(signal.key) ? 'revealed' : signal.visibility === 'known' ? 'known' : 'hidden';
    return {
      id: signal.key,
      label: signal.label,
      visibility,
      visibilityLabel: visibilityLabelMap[visibility],
      observation: signalCopy[signal.key]?.[visibility] ?? signal.label,
    };
  });
}

function buildCast(
  template: EncounterTemplate,
  graph: WorldGraph,
  activeAction: UnifiedAction | undefined,
  clearanceGateState: ClearanceGateRuntimeState | undefined,
) {
  const entries = new Map<string, {
    id: string;
    name: string;
    role: EncounterCastRole;
    roleLabel?: string;
    description: string;
    reused?: boolean;
  }>();

  const pushEntry = (
    nodeId: string | undefined,
    key: string,
    role: EncounterCastRole,
    fallbackName: string,
    reused?: boolean,
  ) => {
    if (!nodeId || entries.has(nodeId)) return;
    const name = getNodeName(graph, nodeId, fallbackName);
    entries.set(nodeId, {
      id: nodeId,
      name,
      role,
      roleLabel:
        role === 'authority' ? 'Authority at the gate'
          : role === 'subject' ? 'Subject under scrutiny'
            : role === 'witness' ? 'Witness in the queue'
              : role === 'support' ? 'Watch support'
                : 'Scene anchor',
      description: describeRole(role, name),
      reused,
    });
  };

  const guardSpec = getActorSpec(template, 'gate_guard');
  const captainSpec = getActorSpec(template, 'gate_captain');
  const courierSpec = getActorSpec(template, 'suspect_courier');
  const witnessSpec = getActorSpec(template, 'checkpoint_witness');

  const guardBinding = getSupportBinding(activeAction, 'gate_guard');
  const captainBinding = getSupportBinding(activeAction, 'gate_captain');
  const courierBinding = getSupportBinding(activeAction, 'suspect_courier');
  const witnessBindings = activeAction?.supportBindings?.filter(binding => binding.key === 'checkpoint_witness') ?? [];

  pushEntry(captainBinding?.nodeId ?? clearanceGateState?.authorityNodeId, 'gate_captain', 'authority', captainSpec?.spawnName ?? 'Gate Captain', captainBinding?.reused);
  pushEntry(guardBinding?.nodeId, 'gate_guard', 'support', guardSpec?.spawnName ?? 'Gate Guard', guardBinding?.reused);
  pushEntry(courierBinding?.nodeId ?? clearanceGateState?.subjectNodeId, 'suspect_courier', 'subject', courierSpec?.spawnName ?? 'Courier', courierBinding?.reused);

  if (witnessBindings.length > 0) {
    for (const binding of witnessBindings) {
      pushEntry(binding.nodeId, 'checkpoint_witness', 'witness', witnessSpec?.spawnName ?? 'Witness', binding.reused);
    }
  } else {
    for (const nodeId of clearanceGateState?.witnessNodeIds ?? []) {
      pushEntry(nodeId, 'checkpoint_witness', 'witness', witnessSpec?.spawnName ?? 'Witness');
    }
  }

  return Array.from(entries.values());
}

function buildHistory(
  template: EncounterTemplate,
  encounter: ActiveEncounterDisplay,
  activeAction: UnifiedAction | undefined,
): EncounterStageHistoryModel[] {
  const buildAfterimage = (stepIndex: number, choiceMemory: EncounterChoiceMemory | undefined, success: boolean): string | undefined => {
    const branch = getGateDutyBranch(choiceMemory);
    if (stepIndex === 0) {
      if (branch === 'supportive') {
        return success
          ? 'You steadied the courier long enough for the danger to sharpen without bursting.'
          : 'You steadied the courier, but the line still learned how thin her composure had become.';
      }
      if (branch === 'coercive') {
        return success
          ? 'You forced the captain into motion before hesitation could ripen into panic.'
          : 'You forced the captain’s hand, and the crowd felt the shove behind the order.';
      }
      if (branch === 'withdrawn') {
        return success
          ? 'You kept your hand folded and let the gate reveal its own fault lines.'
          : 'You kept your hand folded, and the witness began owning the story before the watch did.';
      }
    }
    if (stepIndex === 1) {
      if (branch === 'supportive') {
        return success
          ? 'You guided the seizure into discipline, keeping force just this side of spectacle.'
          : 'You tried to guide the seizure cleanly, but the act still came away looking strange and hard.';
      }
      if (branch === 'coercive') {
        return success
          ? 'You let the courier’s panic speak loudly enough that the line believed the watch.'
          : 'You pushed the courier toward collapse, and the checkpoint nearly broke with her.';
      }
      if (branch === 'withdrawn') {
        return success
          ? 'You gave the witness the moment, and public attention pinned the scene in place.'
          : 'You yielded the moment to the crowd, and the gatehouse lost the right to narrate itself.';
      }
    }
    if (stepIndex === 2) {
      if (branch === 'supportive') {
        return success
          ? 'You cooled the gate back toward legitimacy before fear could harden into memory.'
          : 'You tried to soften the checkpoint, but the bruise of the evening still remained.';
      }
      if (branch === 'coercive') {
        return success
          ? 'You consecrated authority and held the line by making order feel untouchable.'
          : 'You made authority absolute for a moment, and the crowd remembered the dread more than the order.';
      }
      if (branch === 'withdrawn') {
        return success
          ? 'You left the story to the living and trusted mortal memory to carry what mattered.'
          : 'You let the story go, and it left the gate in shapes no captain could call back.';
      }
    }
    return undefined;
  };

  const currentStepIndex = getCurrentStepIndex(encounter, activeAction);

  return template.steps.map((step, index) => {
    const unifiedOutcome = activeAction?.stepOutcomes[index];
    if (unifiedOutcome !== undefined) {
      const choiceMemory = getChoiceMemoryForStep(encounter, activeAction, index, step.id);
      const afterimage = buildAfterimage(index, choiceMemory, isStepSuccess(unifiedOutcome))
        ?? (isStepSuccess(unifiedOutcome) ? step.onSuccess.narrative : step.onFailure.narrative);
      return {
        stepId: step.id,
        stepLabel: step.name,
        status: 'resolved',
        afterimage,
      };
    }

    if (index < encounter.currentStepIndex) {
      const stepOutcome = encounter.history[index];
      const choiceMemory = getChoiceMemoryForStep(encounter, activeAction, index, step.id);
      const afterimage = buildAfterimage(index, choiceMemory, stepOutcome?.success ?? false)
        ?? (stepOutcome?.success ? step.onSuccess.narrative : step.onFailure.narrative);
      return {
        stepId: step.id,
        stepLabel: step.name,
        status: 'resolved',
        afterimage,
      };
    }
    if (!activeAction?.resolved && index === currentStepIndex) {
      return {
        stepId: step.id,
        stepLabel: step.name,
        status: 'current',
      };
    }
    return {
      stepId: step.id,
      stepLabel: step.name,
      status: 'future',
    };
  });
}

function buildGateDutyFalloutPreview(args: {
  currentStepIndex: number;
  firstChoice?: EncounterChoiceMemory;
  secondChoice?: EncounterChoiceMemory;
}): EncounterStageModel['falloutPreview'] {
  const firstBranch = getGateDutyBranch(args.firstChoice);
  const secondBranch = getGateDutyBranch(args.secondChoice);

  if (args.currentStepIndex === 1) {
    if (firstBranch === 'supportive') {
      return [
        { kind: 'reputation', label: 'Whether the courier’s borrowed calm reads as mercy or as something uncanny.' },
        { kind: 'suspicion', label: 'Whether suspicion clings to the papers alone or starts clinging to the watch as well.' },
        { kind: 'faction', label: 'Whether the Civic Guard keeps moral authority over the line while it seizes the cart.' },
        { kind: 'future_hook', label: 'What the witness carries away if restraint begins to feel eerie instead of humane.' },
        { kind: 'burden', label: 'Whether calming another mortal leaves part of her panic lodged in you afterward.' },
      ];
    }
    if (firstBranch === 'coercive') {
      return [
        { kind: 'reputation', label: 'Whether swift authority looks like competence or coercion once the line tells the story back to itself.' },
        { kind: 'suspicion', label: 'How much of the captain’s unnatural certainty the crowd notices and remembers.' },
        { kind: 'faction', label: 'Whether the Civic Guard leaves the gate looking firm or looking shoved into force.' },
        { kind: 'future_hook', label: 'What grievance the courier carries forward after being forced into the open.' },
        { kind: 'burden', label: 'Whether pressing a mortal mind this hard costs more than the essence you spend.' },
      ];
    }
    if (firstBranch === 'withdrawn') {
      return [
        { kind: 'reputation', label: 'Whether the crowd, not the watch, becomes the true author of the seizure.' },
        { kind: 'suspicion', label: 'How far witness-borne suspicion travels once the line starts narrating the scene for itself.' },
        { kind: 'faction', label: 'Whether the Civic Guard loses the right to explain what happened before the seizure is even finished.' },
        { kind: 'future_hook', label: 'What the witness story becomes once mortal mouths begin sharpening it without resistance.' },
        { kind: 'burden', label: 'Whether preserving your strength here costs you authorship over what the evening means.' },
      ];
    }
  }

  if (args.currentStepIndex === 2) {
    if (secondBranch === 'supportive') {
      return [
        { kind: 'reputation', label: 'Whether the line leaves remembering restraint instead of appetite.' },
        { kind: 'suspicion', label: 'How much bruised mistrust still clings to the checkpoint even after you cool it.' },
        { kind: 'faction', label: 'Whether the Civic Guard can act tomorrow without seeming secretly hungry for force.' },
        { kind: 'future_hook', label: 'Which version of the evening the witness carries beyond the gate once tempers settle.' },
        { kind: 'burden', label: 'Whether mercy leaves part of the checkpoint’s tension lodged in you when the scene is over.' },
      ];
    }
    if (secondBranch === 'coercive') {
      return [
        { kind: 'reputation', label: 'Whether order survives at the price of dread once the crowd remembers how absolute the gate felt.' },
        { kind: 'suspicion', label: 'How deeply overreach settles into checkpoint memory after authority hardens one final time.' },
        { kind: 'faction', label: 'Whether the Civic Guard keeps power while quietly losing legitimacy.' },
        { kind: 'future_hook', label: 'What story the courier and the witness tell about the watch’s appetite once they leave.' },
        { kind: 'burden', label: 'Whether divine force makes the whole barrier feel touched by something no report can explain.' },
      ];
    }
    if (secondBranch === 'withdrawn') {
      return [
        { kind: 'reputation', label: 'Whether the official account survives the witness’s sharper version of the evening.' },
        { kind: 'suspicion', label: 'How completely the story escapes the gate once no one reins it back in.' },
        { kind: 'faction', label: 'Whether the Civic Guard can still claim authorship over what happened here.' },
        { kind: 'future_hook', label: 'What the courier turns this humiliation into after tonight, and who hears it first.' },
        { kind: 'burden', label: 'Whether keeping your distance now costs you the future this story will bend.' },
      ];
    }
  }

  return [
    { kind: 'reputation', label: 'Whether the district leaves trusting the watch or quietly fearing it.' },
    { kind: 'suspicion', label: 'How much suspicion clings to this checkpoint once the line starts moving again.' },
    { kind: 'faction', label: 'How much room the Civic Guard has to act tomorrow without looking compromised.' },
    { kind: 'future_hook', label: 'What the courier and the witness carry into the next scene after this one breaks.' },
    { kind: 'burden', label: 'Whether divine pressure buys control now by leaving strain on you later.' },
  ];
}

function buildGateDutySceneFrame(args: {
  currentStepIndex: number;
  firstChoice?: EncounterChoiceMemory;
  secondChoice?: EncounterChoiceMemory;
  signalModels: EncounterStageSignalModel[];
  locationLabel: string;
  captainName: string;
  courierName: string;
  witnessName: string;
  stateSummaries: Record<string, string>;
  clearanceGateState?: ClearanceGateRuntimeState;
}) {
  const firstBranch = getGateDutyBranch(args.firstChoice);
  const secondBranch = getGateDutyBranch(args.secondChoice);

  if (args.currentStepIndex === 1) {
    const byFirstChoice: Record<GateDutyBranch, {
      situationProse: string;
      pressureProse: string;
      stakesProse: string;
      momentLine: string;
      noticeLines: string[];
    }> = {
      supportive: {
        situationProse: `${args.locationLabel} has tipped from waiting into action, but the panic at its center is wearing a stranger mask now. ${args.courierName} remains upright by borrowed calm while the watch closes in, and that composure is almost as unsettling as a scream would have been.`,
        pressureProse: `${args.captainName} still needs the seizure to look like discipline rather than appetite, yet the very steadiness surrounding ${args.courierName} risks making the whole checkpoint feel touched by something no one can name cleanly.`,
        stakesProse: 'If the taking stays measured, the barrier may keep its dignity. If that measured calm turns eerie, the crowd may fear the watch and the unseen pressure moving through it in the same breath.',
        momentLine: 'You cooled the first spark. Now decide whether the seizure feels humane, uncanny, or public enough to escape the watch entirely.',
        noticeLines: [
          `${args.courierName} is too composed for someone this near collapse, and the line is beginning to notice that strange steadiness.`,
          ...args.signalModels.map(signal => signal.observation),
        ],
      },
      coercive: {
        situationProse: `${args.locationLabel} moves at the pace of command now. The order to seize ${args.courierName} comes fast enough that everyone present can feel the shove of certainty behind it.`,
        pressureProse: `${args.captainName} has authority again, but it is authority edged with the memory of being pressed. The crowd is no longer asking whether the watch will act; it is deciding what that swiftness means.`,
        stakesProse: 'A clean seizure might still look decisive. A harsh one will teach the line that the barrier can harden faster than any ordinary judgment ought to.',
        momentLine: 'The order has already landed like a blow. Choose whether the next breath makes it look justified, brutal, or publicly owned.',
        noticeLines: [
          `${args.captainName}'s command arrives too quickly to feel wholly natural, and the crowd is measuring the force behind it as much as the words themselves.`,
          ...args.signalModels.map(signal => signal.observation),
        ],
      },
      withdrawn: {
        situationProse: `${args.locationLabel} is no longer only a checkpoint. It is a public stage. By leaving the first beat untouched, you let the crowd gather into a single listening thing, and now the seizure begins inside that collective attention rather than outside it.`,
        pressureProse: `${args.witnessName} is not merely observing anymore. She is becoming the channel through which the whole line understands what it is seeing, and ${args.captainName} is being forced to act inside a story the watch did not start writing.`,
        stakesProse: 'If the watch does not reclaim the scene, the crowd will. Once that happens, every official word spoken afterward will feel like an answer to a story already abroad.',
        momentLine: 'You let the crowd become the first author. Decide now whether the watch takes the scene back, breaks under it, or yields it completely.',
        noticeLines: [
          `${args.witnessName} no longer feels like a bystander. The rest of the queue is reading the scene through her attention.`,
          ...args.signalModels.map(signal => signal.observation),
        ],
      },
      unknown: {
        situationProse: `${args.locationLabel} is turning into a seizure instead of a stoppage, and everyone in the line knows it now.`,
        pressureProse: `${args.captainName}, ${args.courierName}, and ${args.witnessName} are all trying to survive the same public second for different reasons.`,
        stakesProse: 'Once the taking begins, the question is no longer whether the gate acts. It is what kind of authority the act teaches people to remember.',
        momentLine: 'The ambiguity is dying now; choose who owns the reveal before the line turns seizure into story.',
        noticeLines: args.signalModels.map(signal => signal.observation),
      },
    };
    return byFirstChoice[firstBranch];
  }

  if (args.currentStepIndex === 2) {
    const bySecondChoice: Record<GateDutyBranch, {
      situationProse: string;
      pressureProse: string;
      stakesProse: string;
      momentLine: string;
      noticeLines: string[];
    }> = {
      supportive: {
        situationProse: `${args.locationLabel} has survived the seizure without fully surrendering to spectacle, but the calm around it feels hand-built and fragile. The cart is stopped. The line is breathing again. The danger now lives in what kind of memory that breathing becomes.`,
        pressureProse: `${args.captainName} still has a chance to make the checkpoint feel like shelter rather than hunger, but only if the next orders land with restraint clean enough to seem human rather than merely controlled.`,
        stakesProse: 'If the evening cools, the watch may leave with room to act tomorrow. If mercy lands too late or too strangely, the barrier will keep its facts and lose its legitimacy.',
        momentLine: 'The seizure is over. What remains is whether restraint becomes the thing the line remembers.',
        noticeLines: [
          'The line is no longer waiting to see what was hidden in the cart. It is waiting to decide what kind of people guard this gate.',
          ...args.signalModels.map(signal => signal.observation),
        ],
      },
      coercive: {
        situationProse: `${args.locationLabel} is quiet now in the worst way: the cart is stopped, the courier is broken open, and the checkpoint has bought silence with a taste of dread that still hangs in the dusk.`,
        pressureProse: `${args.captainName} can still turn that dread into durable authority if you let her, but every extra degree of certainty risks teaching the district that order and fear are the same thing.`,
        stakesProse: 'A hard finish will keep the barrier unassailable for one dangerous moment. It may also leave the watch feared exactly where it wanted to be trusted.',
        momentLine: 'You can still make the gate feel absolute. The question is whether anything absolute can survive being loved afterward.',
        noticeLines: [
          `${args.courierName}'s collapse has already done half the watch’s work. The rest of the evening will decide whether that looks like justice or appetite.`,
          ...args.signalModels.map(signal => signal.observation),
        ],
      },
      withdrawn: {
        situationProse: `${args.locationLabel} no longer belongs wholly to the watch. The seizure happened, but too much of the evening now lives in mortal mouths outside the guardhouse, and every official word arrives late to a story already on the move.`,
        pressureProse: `${args.witnessName} is carrying the sharper version of the scene, ${args.captainName} knows it, and the checkpoint can still either answer that story or surrender the rest of the night to it.`,
        stakesProse: 'If you keep your distance now, the gate may retain the facts while losing the meaning. Once meaning leaves in a witness’s voice, no captain can recall it with a report.',
        momentLine: 'The seizure is over. Decide whether the watch reclaims the story now, or whether the witness carries it beyond the gate unopposed.',
        noticeLines: [
          `${args.witnessName} is already holding the scene in the form it will take once it leaves this place.`,
          ...args.signalModels.map(signal => signal.observation),
        ],
      },
      unknown: {
        situationProse: `${args.locationLabel} has survived the seizure, but the aftermath is still deciding what kind of evening this was.`,
        pressureProse: `${args.captainName}, ${args.courierName}, and ${args.witnessName} are all still shaping what memory survives the report.`,
        stakesProse: 'The seizure is only the middle of the night. What matters now is whether what leaves the gate feels like shelter, overreach, or dread.',
        momentLine: 'The seizure is over. What remains is the shape of the fear and memory that survive it.',
        noticeLines: args.signalModels.map(signal => signal.observation),
      },
    };
    return bySecondChoice[secondBranch];
  }

  return {
    situationProse: `${args.locationLabel} is already in motion: a fever cart stalled at the barrier, a line curdling from waiting into watching, and dusk settling over the checkpoint like a held breath.`,
    pressureProse: `${args.captainName} is trying to hold the scene together without letting the watch look compromised, ${args.courierName} is one bad breath from unraveling, and ${args.witnessName} is close enough to carry the story farther than any report will reach.`,
    noticeLines: args.signalModels.map(signal => signal.observation),
    stakesProse: 'If the cart passes badly, the district will remember whether the barrier felt like shelter or like power turned inward. If it stays here much longer, the delay itself becomes a wound.',
    momentLine: 'Three threads pull taut beneath your fingers, and you must choose which one to pluck.',
  };
}

// buildLinkedParagraph is now imported from ../narrativeLinker

function buildNarrativeModel(args: {
  locationLabel: string;
  captainName: string;
  courierName: string;
  witnessName: string;
  currentStepIndex: number;
  firstChoice?: EncounterChoiceMemory;
  secondChoice?: EncounterChoiceMemory;
  shellStateLabel?: string;
  shellStateHint?: string;
  signalModels: EncounterStageSignalModel[];
  cast: EncounterStageModel['cast'];
  factions: EncounterStageModel['factions'];
  falloutPreview: EncounterStageModel['falloutPreview'];
}) {
  const references: EncounterStageNarrativeReference[] = [
    {
      id: 'location',
      label: args.locationLabel,
      detail: `${args.locationLabel} is the checkpoint where this scene will be remembered and retold.`,
      tone: 'accent',
    },
    ...args.cast.map(entry => ({
      id: `cast:${entry.id}`,
      label: entry.name,
      detail: entry.description ?? `${entry.name} is part of the scene.`,
      tone: entry.role === 'authority' ? 'accent' : entry.role === 'witness' ? 'warning' : 'default',
    })),
    ...args.factions.map(faction => ({
      id: `faction:${faction.id}`,
      label: faction.label,
      detail: faction.pressure ?? `${faction.label} is shaping the pressure around the scene.`,
      tone: 'default' as const,
    })),
    ...args.signalModels.map(signal => ({
      id: `signal:${signal.id}`,
      label: signal.label,
      detail: signal.observation,
      tone: signal.visibility === 'revealed' ? 'warning' : signal.visibility === 'known' ? 'accent' : 'default',
    })),
    ...(args.shellStateLabel
      ? [{
          id: 'state',
          label: args.shellStateLabel,
          detail: args.shellStateHint ?? 'The checkpoint is still deciding what kind of story this becomes.',
          tone: 'accent' as const,
        }]
      : []),
    ...args.falloutPreview.map(item => ({
      id: `fallout:${item.kind}:${item.label}`,
      label: item.label,
      detail: item.label,
      tone: item.kind === 'suspicion' || item.kind === 'burden' ? 'warning' as const : 'default' as const,
    })),
  ];

  const forgedPapers = args.signalModels.find(signal => signal.id === 'forged_papers');
  const hiddenCargo = args.signalModels.find(signal => signal.id === 'hidden_cargo');
  const witnessPressure = args.signalModels.find(signal => signal.id === 'witness_pressure');
  const civicGuard = args.factions.find(faction => faction.id === 'civic_guard');
  const checkpointPublic = args.factions.find(faction => faction.id === 'checkpoint_public');
  const trustFallout = args.falloutPreview.find(item => item.kind === 'reputation');
  const suspicionFallout = args.falloutPreview.find(item => item.kind === 'suspicion');
  const hookFallout = args.falloutPreview.find(item => item.kind === 'future_hook');

  const captainId = args.cast.find(entry => entry.name === args.captainName)?.id;
  const courierId = args.cast.find(entry => entry.name === args.courierName)?.id;
  const witnessId = args.cast.find(entry => entry.name === args.witnessName)?.id;
  const tokens = {
    location: { text: args.locationLabel, referenceId: 'location', emphasis: 'accent' as const },
    captain: { text: args.captainName, referenceId: captainId ? `cast:${captainId}` : undefined, emphasis: 'strong' as const },
    courier: { text: args.courierName, referenceId: courierId ? `cast:${courierId}` : undefined, emphasis: 'strong' as const },
    witness: { text: args.witnessName, referenceId: witnessId ? `cast:${witnessId}` : undefined, emphasis: 'strong' as const },
    state: { text: args.shellStateLabel?.toLowerCase() ?? 'unsettled', referenceId: args.shellStateLabel ? 'state' : undefined, emphasis: 'accent' as const },
    civic_guard: { text: civicGuard?.label ?? 'Civic Guard', referenceId: civicGuard ? `faction:${civicGuard.id}` : undefined, emphasis: 'strong' as const },
    checkpoint_public: { text: checkpointPublic?.label.toLowerCase() ?? 'checkpoint crowd', referenceId: checkpointPublic ? `faction:${checkpointPublic.id}` : undefined, emphasis: 'strong' as const },
    forged_papers: { text: 'the seal on the manifest', referenceId: forgedPapers ? `signal:${forgedPapers.id}` : undefined, emphasis: 'accent' as const },
    hidden_cargo: { text: 'the cart at the front', referenceId: hiddenCargo ? `signal:${hiddenCargo.id}` : undefined, emphasis: 'accent' as const },
    witness_pressure: { text: 'the crowd’s judgment', referenceId: witnessPressure ? `signal:${witnessPressure.id}` : undefined, emphasis: 'accent' as const },
    trust: { text: trustFallout?.label.toLowerCase() ?? 'the district’s trust', referenceId: trustFallout ? `fallout:${trustFallout.kind}:${trustFallout.label}` : undefined, emphasis: 'accent' as const },
    suspicion: { text: suspicionFallout?.label.toLowerCase() ?? 'suspicion', referenceId: suspicionFallout ? `fallout:${suspicionFallout.kind}:${suspicionFallout.label}` : undefined, emphasis: 'accent' as const },
    future_hook: { text: hookFallout?.label.toLowerCase() ?? 'the story that survives this', referenceId: hookFallout ? `fallout:${hookFallout.kind}:${hookFallout.label}` : undefined, emphasis: 'default' as const },
  };

  const firstBranch = getGateDutyBranch(args.firstChoice);
  const secondBranch = getGateDutyBranch(args.secondChoice);

  let paragraphs: EncounterStageNarrativeParagraph[];

  if (args.currentStepIndex === 0) {
    paragraphs = [
      buildLinkedParagraph(
        'scene-1',
        'You find {{location}} already in motion — that is the thing about this world, it never waits for you, it never pauses politely at the threshold of your attention. Dusk is choking the checkpoint and the scene is mid-stride: {{captain}}\'s hand drifting to {{forged_papers}} for the fourth time, her mind a tight weave of iron discipline over a doubt she will not permit herself to name. {{hidden_cargo}} rides heavier than its paperwork confesses. She knows. She has known since the first creak of its axles. But naming the problem aloud would turn a crowd that is merely waiting into one that is watching, and she can feel the difference between those two things the way a sailor feels the difference between a swell and a wave. Three carts back, {{courier}} is vibrating — her errand a coal burning behind her eyes, every lost minute a small death, her composure thinning toward something loud and regrettable. And at the crowd\'s edge, {{witness}}: the stillest mind at the gate, the most dangerous. She came for some errand of her own, already half-forgotten. The scene has claimed her instead. She is recording, with the helpless alertness of someone who has realized she is standing inside a story and cannot now step back out.',
        tokens,
      ),
      buildLinkedParagraph(
        'scene-2',
        'You can feel the omen-weight of the moment before anyone at the gate could name it. The crowd has gone quiet — not calm-quiet but judgment-quiet — and individual frustrations are curdling into a single shared attention that presses against {{captain}}\'s composure like a hand testing a wall for give. This is where threat lives: not in the cart, not in whatever {{forged_papers}} or {{hidden_cargo}} may yet expose, but in the way the next few minutes will change things. If it breaks badly, the district will not remember what was found. It will remember whether the watch looked steady or frightened, whether the barrier felt like shelter or like power turned inward. No one here will walk away unchanged. Even a clean resolution leaves residue: {{suspicion}} that settles into checkpoint stone does not wash away with the next rain, and you have watched enough gates to know that one bad evening can greet travellers for months like a ghost they cannot see but always feel.',
        tokens,
      ),
      buildLinkedParagraph(
        'scene-3',
        'And this is what holds your attention — not the cart, not the contraband if contraband it was, but the aftermath already taking shape inside the present moment. When this breaks, {{location}} will resume its rhythms. {{captain}} will file a report that captures the facts and misses the meaning. But the true wreckage will walk out on two legs. {{courier}} will stumble into the next scene trailing this delay like a scar, her frayed nerves rewriting whatever she touches next. {{witness}} will plant what she saw in taverns and market-stalls and across thresholds where the watch cannot follow, each retelling sharper and stranger than the last. The story is already separating from the event that birthed it. You know from long experience which thing will prove most durable. Not the seal. Not the manifest. The whisper — {{future_hook}} slipping through the gate in forms no captain can inspect, no decree can recall, bending the living current of the district long after everyone here has forgotten what happened at dusk on an unremarkable evening at an unremarkable gate.',
        tokens,
      ),
    ];
  } else if (args.currentStepIndex === 1) {
    const branchIntroByFirstChoice: Record<GateDutyBranch, string> = {
      supportive: 'You have already touched {{courier}} once, easing the worst of her panic without ever fully freeing her from it, and that stolen composure changes the shape of the seizure. The moment breaks all at once, but it breaks with an eerie neatness. {{courier}} does not bolt, not quite. She locks. Her fear has been cupped rather than quenched, and now it sits inside her like a hidden bell still ringing. The line sees restraint first and danger second, which buys the watch a breath of legitimacy — but only a breath. What looks orderly can turn uncanny in an instant when the wrong body stays too still under pressure.',
      coercive: 'You have already pressed {{captain}} once, setting weight on her judgment before she was ready to claim it as her own, and now the checkpoint is moving in the shape of that pressure. What had been hesitation becomes motion: a hand on the bridle, a barked order, the scrape of boots over grit. When the command comes to seize {{courier}}, it arrives too cleanly to be mistaken for hesitation. That is the gift and the danger of forcing a mortal into certainty: the scene breaks quickly, but everyone present can taste the shove behind the order.',
      withdrawn: 'You kept your hand folded when the queue first drew taut, and in that untouched space the crowd began writing the scene for itself. So when the seizure comes, it is not merely the watch moving on {{courier}}. It is the whole line leaning inward, hungry to see whether hesitation will finally harden into force. {{witness}} has already made the checkpoint public in the oldest way possible: by paying perfect attention. By the time the guards close in, the story is half-born and looking for a shape to inhabit.',
      unknown: 'The moment does not explode so much as snap into a new shape. A hand goes to the bridle, a barked order cuts through the held breath at the gate, and {{courier}}\'s body answers before her mind can.',
    };

    paragraphs = [
      buildLinkedParagraph('scene-1', branchIntroByFirstChoice[firstBranch], tokens),
      buildLinkedParagraph(
        'scene-2',
        'Now the manifest is no longer only paper. It is accusation, theatre, omen. {{forged_papers}} glints in {{captain}}\'s hand like something already broken, and under the canvas the load seems to deepen into itself, becoming more real precisely because it is still unseen. Cloth bolts. Cured hides. Or something else entirely — something wrapped not merely from light but from naming, something unmanifested waiting to meet the dusk. You can feel {{checkpoint_public}} leaning without moving, each person lending a grain of attention until the scene grows heavy enough to collapse under it.',
        tokens,
      ),
      buildLinkedParagraph(
        'scene-3',
        'This is the dangerous middle country of authority, where force must arrive and still somehow seem reluctant to exist. {{captain}} knows {{courier}} must be stopped now. {{witness}} knows that whatever happens next will outlive the manifest. And you, above them all, can feel the threads knotting tighter: guilt, discipline, spectacle, shame. Once hands close around the courier’s arm, there will be no returning to ambiguity. The line will remember whether order arrived as discipline or as humiliation. Whatever is hidden in the load may matter. The manner of its revealing will matter more.',
        tokens,
      ),
    ];
  } else {
    const firstChoiceEcho: Record<GateDutyBranch, string> = {
      supportive: 'Because you first met the evening by steadying {{courier}}, the checkpoint never fully tipped into open panic. The fear remained, but it wore a quieter face, and that quiet now hangs over the gatehouse like steam that never found the air. People remember that the line almost held. They also remember how strangely controlled the moment felt.',
      coercive: 'Because you first met the evening by forcing {{captain}} toward certainty, the whole checkpoint is still carrying the bruise of command. The line moved when it had to. The seizure happened before hesitation could ripen. But the crowd has not forgotten how quickly authority hardened under pressure, nor how thin the distance can be between discipline and appetite.',
      withdrawn: 'Because you first met the evening by withholding your hand, the gatehouse belongs partly to mortal interpretation now. {{witness}} and the waiting line began authoring the scene before the watch could control it, and everything that followed has carried that public charge. Even now the checkpoint feels less like a sealed report than a story still being argued into shape.',
      unknown: 'The seizure has happened. The line has seen enough to stop being innocent. What remains is not the fact of the checkpoint, but the meaning people will carry away from it.',
    };
    const secondChoiceEcho: Record<GateDutyBranch, string> = {
      supportive: 'Then you guided the seizure itself toward discipline, keeping the watch precise where it might easily have become hungry. That helped. It also made the whole scene feel almost too exact, as though order had arrived by way of some invisible correction. The crowd can forgive roughness more easily than it forgives strangeness.',
      coercive: 'Then you broke {{courier}} toward the edge of public collapse, letting fear speak loudly enough that the line could stop imagining worse and start believing what it saw. It was effective. It was also intimate in its cruelty. The checkpoint now stands atop a mortal’s worst second, and everyone can feel that beneath the official story.',
      withdrawn: 'Then you gave the moment further to {{witness}} and the crowd, letting public attention pin the event in place before the watch fully mastered it. That has left the gatehouse unstable in a different way. The official account still exists, but it no longer feels singular. The people present have begun to understand themselves as co-authors of the evening.',
      unknown: 'The seizure is over, yet the checkpoint has not decided whether it means shelter, spectacle, or warning.',
    };

    paragraphs = [
      buildLinkedParagraph('scene-1', firstChoiceEcho[firstBranch], tokens),
      buildLinkedParagraph('scene-2', secondChoiceEcho[secondBranch], tokens),
      buildLinkedParagraph(
        'scene-3',
        'After rupture comes burden. To hold the line now is not merely to keep the carts in order or the witness from stepping too close. It is to govern the meaning of the checkpoint after force has entered it. {{civic_guard}} must appear stern without becoming ravenous, certain without becoming eager, controlled without seeming cold. One wrong note and the whole barrier curdles in the public imagination. That is the poison that truly endures. Not fear of what passed through the gate, but fear of what stood guarding it. When {{location}} finally resumes its rhythms, what will remain is not the cart. It is the feeling that passed through the people who watched it. You can still influence that feeling. Perhaps that is all that has ever mattered.',
        tokens,
      ),
    ];
  }

  return { paragraphs, references };
}

function buildGateDutyAftermathNarrative(args: {
  locationLabel: string;
  captainName: string;
  courierName: string;
  witnessName: string;
  shellStateLabel?: string;
  outcomeLabel: string;
  overview: string;
}) {
  const references: EncounterStageNarrativeReference[] = [
    {
      id: 'after:location',
      label: args.locationLabel,
      detail: `${args.locationLabel} is resuming its rhythms, but the consequences of the night are still moving outward.`,
      tone: 'accent',
    },
    {
      id: 'after:captain',
      label: args.captainName,
      detail: `${args.captainName} will keep the official account, whether or not it captures the meaning of what happened.`,
      tone: 'default',
    },
    {
      id: 'after:courier',
      label: args.courierName,
      detail: `${args.courierName} will carry the night forward in the body before the mind can name it.`,
      tone: 'warning',
    },
    {
      id: 'after:witness',
      label: args.witnessName,
      detail: `${args.witnessName} will decide how the story leaves the gate and what texture it takes on in the telling.`,
      tone: 'accent',
    },
    ...(args.shellStateLabel
      ? [{
          id: 'after:state',
          label: args.shellStateLabel,
          detail: `The checkpoint ultimately settled into ${args.shellStateLabel.toLowerCase()}.`,
          tone: 'accent' as const,
        }]
      : []),
  ];

  const tokens = {
    location: { text: args.locationLabel, referenceId: 'after:location', emphasis: 'accent' as const },
    captain: { text: args.captainName, referenceId: 'after:captain', emphasis: 'strong' as const },
    courier: { text: args.courierName, referenceId: 'after:courier', emphasis: 'strong' as const },
    witness: { text: args.witnessName, referenceId: 'after:witness', emphasis: 'strong' as const },
    state: { text: args.shellStateLabel?.toLowerCase() ?? 'unsettled', referenceId: args.shellStateLabel ? 'after:state' : undefined, emphasis: 'accent' as const },
  };

  return {
    references,
    paragraphs: [
      buildLinkedParagraph(
        'aftermath-1',
        `The last act has finished and {{location}} is breathing again, but the evening has not ended cleanly. The checkpoint has settled into {{state}}, and that settlement carries the whole weight of what came before it. {{captain}} will be able to say how the line was handled. That is not the same as deciding what the district believes. {{courier}} and {{witness}} are already carrying the softer, more dangerous account away in their nerves and in their mouths.`,
        tokens,
      ),
      buildLinkedParagraph(
        'aftermath-2',
        `This is the true end of a gate story: not the report, not the seal, not even the cargo, but the way one moment enters the living current of the place and keeps travelling. ${args.overview} Whatever else the night meant, it has now become part of the district's memory, and memory is harder to search than any cart.`,
        tokens,
      ),
    ],
  };
}

function buildGateDutyAftermathPresentation(args: {
  encounter: ActiveEncounterDisplay;
  graph: WorldGraph;
}) {
  const actorMoments = new Map<string, {
    id: string;
    actorName: string;
    portraitUrl?: string | null;
    summaryLines: string[];
    marks: EncounterStageAftermathMarkModel[];
  }>();
  const highlights: EncounterStageAftermathHighlightModel[] = [];

  const ensureActorMoment = (actorId: string | undefined, fallbackName: string | undefined) => {
    const id = actorId ?? `actor:${fallbackName ?? 'unknown'}`;
    const actorName = fallbackName ?? 'Someone at the gate';
    let existing = actorMoments.get(id);
    if (!existing) {
      existing = {
        id,
        actorName,
        portraitUrl: actorId ? getActorPortrait(args.graph, actorId) : null,
        summaryLines: [],
        marks: [],
      };
      actorMoments.set(id, existing);
    }
    return existing;
  };

  for (const change of args.encounter.aftermathSummary?.changes ?? []) {
    const actorMoment = ensureActorMoment(change.actorId, change.actorName);

    if (change.kind === 'growth') {
      const domain = parseGrowthDomain(change.title);
      const tierShift = parseTierShift(change.detail);
      if (domain && tierShift && tierShift.to > tierShift.from) {
        actorMoment.summaryLines.push(
          `${actorMoment.actorName} is now ${getNarrativeLabel(domain, tierShift.to)} in ${titleCaseWords(domain)}.`,
        );
      }
      continue;
    }

    if (change.kind === 'trait') {
      const traitName = extractQuotedText(change.detail);
      if (traitName) {
        actorMoment.summaryLines.push(`${actorMoment.actorName} now carries ${traitName}.`);
      }
      continue;
    }

    if (change.kind === 'item') {
      const rewardName = extractTrailingRewardName(change.detail);
      if (rewardName) {
        const rewardCondition = REWARD_CONDITION_BY_NAME.get(rewardName.toLowerCase());
        if (rewardCondition) {
          const tooltip = resolveAttachmentTooltip({
            name: rewardCondition.name,
            subcategory: String(rewardCondition.properties.subcategory ?? 'condition'),
            tier: Number(rewardCondition.properties.tier ?? 1) as 1 | 2 | 3 | 4,
            mechanicalSummary: String(rewardCondition.properties.description ?? rewardCondition.properties.flavorText ?? ''),
          });
          actorMoment.summaryLines.push(`${actorMoment.actorName} did not leave the gate untouched.`);
          actorMoment.marks.push({
            id: `${change.id}:mark`,
            label: rewardCondition.name,
            iconGlyph: getAttachmentGlyph(String(rewardCondition.properties.tags?.includes?.('#curse') ? 'curse' : rewardCondition.properties.subcategory ?? 'condition')),
            tooltipLabel: tooltip.label,
            tooltipDesc: tooltip.desc,
            tone: 'warning',
          });
          continue;
        }

        highlights.push({
          id: change.id,
          title: 'Something tangible changed hands',
          detail: `${actorMoment.actorName} came away with ${rewardName}.`,
          tone: change.polarity,
        });
        continue;
      }
    }

    if (change.kind === 'shell_state') {
      highlights.push({
        id: change.id,
        title: 'The checkpoint settled into a new story',
        detail: change.detail,
        tone: 'info',
      });
      continue;
    }

    if (change.kind === 'future_hook') {
      highlights.push({
        id: change.id,
        title: 'The night will keep travelling',
        detail: change.detail,
        tone: 'info',
      });
      continue;
    }
  }

  const curatedActorMoments: EncounterStageAftermathActorModel[] = Array.from(actorMoments.values())
    .filter(moment => moment.summaryLines.length > 0 || (moment.marks?.length ?? 0) > 0)
    .map(moment => ({
      ...moment,
      summaryLines: Array.from(new Set(moment.summaryLines)),
      marks: moment.marks ? Array.from(new Map(moment.marks.map(mark => [mark.id, mark])).values()) : undefined,
    }));

  const curatedHighlights = highlights.slice(0, 3);

  let overview = 'Only a few consequences are heavy enough to keep their hands on tomorrow. These are the ones worth naming.';
  if (curatedActorMoments.length > 0) {
    const firstActor = curatedActorMoments[0];
    overview = `${firstActor.actorName} did not leave the gate unchanged. The rest of the evening will disperse into rumor and memory, but these consequences are the ones still pressing on the world.`;
  } else if (curatedHighlights.length > 0) {
    overview = 'The gate is finished with its evening, but the district is not finished with what it learned there.';
  }

  return {
    overview,
    actorMoments: curatedActorMoments,
    highlights: curatedHighlights,
  };
}

function rewriteGateDutyAftermathReactions(
  args: {
    captainName: string;
    witnessName: string;
    locationLabel: string;
  },
  reactions: readonly NonNullable<NonNullable<ActiveEncounterDisplay['aftermathSummary']>['reactions']>[number][] | undefined,
) {
  return reactions?.map(reaction => {
    if (reaction.id === 'follow_witness_story') {
      return {
        id: reaction.id,
        label: 'Follow the rumor while it is still warm',
        intent: `Choose this if you want the next consequence to come through gossip, retelling, and ${args.witnessName}'s version of the night. You are following the story ${args.locationLabel} will actually hear.`,
        disabled: false,
      };
    }
    if (reaction.id === 'mark_captain_for_later') {
      return {
        id: reaction.id,
        label: 'Keep the captain in your sights',
        intent: `Choose this if you want the lasting consequence to live in ${args.captainName} herself. You are preserving how she wore authority under pressure so it can matter later.`,
        disabled: false,
      };
    }
    if (reaction.id === 'let_it_settle') {
      return {
        id: reaction.id,
        label: 'Let the district decide what it remembers',
        intent: `Choose this if you want no further divine pressure after the gate. The mortals who stood at ${args.locationLabel} will decide what sort of memory survives.`,
        disabled: false,
      };
    }
    return {
      id: reaction.id,
      label: reaction.label,
      intent: reaction.intent,
      disabled: false,
    };
  });
}

export function buildGateDutyEncounterStageModel({
  template,
  encounter,
  notification,
  threadTier,
  graph,
  activeAction,
  clearanceGateState,
  essence,
}: BuildGateDutyEncounterStageModelArgs): EncounterStageModel {
  const gatehouseBinding = getSupportBinding(activeAction, 'gatehouse');
  const captainBinding = getSupportBinding(activeAction, 'gate_captain');
  const courierBinding = getSupportBinding(activeAction, 'suspect_courier');
  const witnessBinding = getSupportBinding(activeAction, 'checkpoint_witness');
  const cast = buildCast(template, graph, activeAction, clearanceGateState);

  const currentStepIndex = getCurrentStepIndex(encounter, activeAction);
  const firstChoice = getChoiceMemoryForStep(encounter, activeAction, 0, template.steps[0]?.id ?? 'step-1');
  const secondChoice = getChoiceMemoryForStep(encounter, activeAction, 1, template.steps[1]?.id ?? 'step-2');
  const locationLabel = getNodeName(
    graph,
    gatehouseBinding?.nodeId ?? clearanceGateState?.locationNodeId ?? clearanceGateState?.anchorLocationId,
    'Gatehouse',
  );
  const captainName = getNodeName(graph, captainBinding?.nodeId ?? clearanceGateState?.authorityNodeId, 'the captain');
  const courierName = getNodeName(graph, courierBinding?.nodeId ?? clearanceGateState?.subjectNodeId, 'the courier');
  const witnessName = getNodeName(graph, witnessBinding?.nodeId ?? clearanceGateState?.witnessNodeIds[0], 'a witness in the line');
  const signalModels = buildSignalModels(template, clearanceGateState);
  const history = buildHistory(template, encounter, activeAction);
  const isAftermath = notification.kind === 'aftermath' && Boolean(encounter.aftermathSummary);

  const stateSummaries: Record<string, string> = {
    pending: 'Nothing has broken open yet, but the entire checkpoint is one bad choice away from hardening.',
    flagged: 'The line can feel that something is wrong now, even if the whole truth is not yet public.',
    exposed: 'The hidden problem is out in the open; what remains is deciding who owns the fallout.',
    compromised: 'Control has slipped, and the crowd is reading the scene before the watch can contain it.',
    cleared: 'The checkpoint has a story it can stand behind, at least for tonight.',
    unresolved: 'No one owns the scene yet, and that uncertainty is becoming dangerous.',
  };
  const sceneFrame = buildGateDutySceneFrame({
    currentStepIndex,
    firstChoice,
    secondChoice,
    signalModels,
    locationLabel,
    captainName,
    courierName,
    witnessName,
    stateSummaries,
    clearanceGateState,
  });
  const shellStateModel = clearanceGateState
    ? {
        shellType: 'clearance_gate',
        state: clearanceGateState.state,
        stateLabel: clearanceGateState.state[0].toUpperCase() + clearanceGateState.state.slice(1),
        stateHint: stateSummaries[clearanceGateState.state] ?? 'The checkpoint is still deciding what kind of story this becomes.',
      }
    : undefined;
  const factionModels = [
    {
      id: 'civic_guard',
      label: 'Civic Guard',
      pressure: `${captainName} cannot simply wave people through now; if the watch folds too easily, every future search gets harder.`,
    },
    {
      id: 'checkpoint_public',
      label: 'Checkpoint Crowd',
      pressure: `${witnessName} is not the only one watching. The people in line are already deciding whether this is order, panic, or abuse.`,
    },
  ];
  const falloutPreview = buildGateDutyFalloutPreview({
    currentStepIndex,
    firstChoice,
    secondChoice,
  });
  const narrative = buildNarrativeModel({
    locationLabel,
    captainName,
    courierName,
    witnessName,
    currentStepIndex,
    firstChoice,
    secondChoice,
    shellStateLabel: shellStateModel?.stateLabel,
    shellStateHint: shellStateModel?.stateHint,
    signalModels,
    cast,
    factions: factionModels,
    falloutPreview: [...falloutPreview],
  });
  const illustration = !isAftermath && currentStepIndex === 0
    ? {
        src: '/concept-art/encounters/gate-duty.jpg',
        alt: 'A torchlit checkpoint beneath a stone gate at dusk, with a captain stopping a cart while the waiting line watches.',
        caption: 'Some encounters arrive with a remembered image already clinging to them.',
      }
    : undefined;
  if (isAftermath && encounter.aftermathSummary) {
    const aftermathPresentation = buildGateDutyAftermathPresentation({
      encounter,
      graph,
    });
    const aftermathNarrative = buildGateDutyAftermathNarrative({
      locationLabel,
      captainName,
      courierName,
      witnessName,
      shellStateLabel: shellStateModel?.stateLabel,
      outcomeLabel: titleCaseWords(encounter.aftermathSummary.outcome),
      overview: aftermathPresentation.overview,
    });

    return {
      header: {
        title: template.name,
        subtitle: 'The checkpoint has settled. Its consequences are still moving.',
        locationLabel,
        urgencyLabel: 'Aftermath',
        threatLabel: titleCaseWords(encounter.aftermathSummary.outcome),
        threadTier,
        familyLabel: 'Clearance Gate',
      },
      illustration: undefined,
      scene: {
        situationProse: `${locationLabel} is no longer deciding what to do. It is deciding what will be remembered.`,
        pressureProse: `${captainName}, ${courierName}, and ${witnessName} are all carrying different versions of the same night away from the barrier.`,
        noticeLines: signalModels.map(signal => signal.observation),
        stakesProse: 'The encounter is over, but the consequences have only just entered the world.',
        momentLine: 'This is what your intervention changed.',
      },
      narrative: aftermathNarrative,
      cast,
      factions: factionModels,
      shellState: shellStateModel,
      signals: signalModels,
      choices: [],
      falloutPreview: [...falloutPreview],
      history,
      resourceSummary: {
        quintessence: essence,
      },
      aftermath: {
        title: 'What Changed',
        overview: aftermathPresentation.overview,
        actorMoments: aftermathPresentation.actorMoments,
        highlights: aftermathPresentation.highlights,
        reactionPrompt: 'Choose what you keep hold of now that the checkpoint itself is over.',
        reactions: rewriteGateDutyAftermathReactions({
          captainName,
          witnessName,
          locationLabel,
        }, encounter.aftermathSummary.reactions),
      },
    };
  }

  return {
    header: {
      title: template.name,
      subtitle: getGateDutyHeaderSubtitle(currentStepIndex),
      locationLabel,
      urgencyLabel: 'Curfew pressure',
      threatLabel: titleCaseWords(template.threatRating),
      threadTier,
      familyLabel: 'Clearance Gate',
    },
    illustration,
    scene: {
      situationProse: sceneFrame.situationProse,
      pressureProse: sceneFrame.pressureProse,
      noticeLines: sceneFrame.noticeLines,
      stakesProse: sceneFrame.stakesProse,
      momentLine: sceneFrame.momentLine,
    },
    narrative,
    cast,
    factions: factionModels,
    shellState: shellStateModel,
    signals: signalModels,
      choices: notification.choices.map(choice =>
        buildChoiceIntent({
          choice,
          currentStepIndex,
          captainName,
          courierName,
          witnessName,
          essence,
        }),
      ),
    falloutPreview: [...falloutPreview],
    history,
    resourceSummary: {
      quintessence: essence,
    },
  };
}
