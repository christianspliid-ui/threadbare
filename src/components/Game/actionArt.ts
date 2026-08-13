/**
 * Action art registry (extracted from ActionCard.tsx — THR-727).
 *
 * Maps slot/template IDs to art asset paths under public/assets/actions/. Keyed by both
 * legacy wheel IDs (bare: "dream") and unified template IDs ("divine.dream") so art
 * resolves from either code path.
 *
 * This is the SINGLE UI-side art lookup — ActionCard and DivineReceiptModal both import
 * `getActionArt` from here, and since THR-740 `codexRegistry.ts` imports and spreads
 * `ACTION_ART` rather than hand-copying it. One entry added here reaches every surface;
 * do NOT reintroduce a parallel copy anywhere.
 */
export const ACTION_ART: Record<string, string> = {
  // ─── Divine actions (legacy bare + unified prefixed) ────────────────
  'dream': '/assets/actions/oneiric-sending.jpg',
  'persuade': '/assets/actions/divine-compulsion.jpg',
  'deceive': '/assets/actions/veil-of-falsehood.jpg',
  'intimidate': '/assets/actions/wrath-descending.jpg',
  'inspire': '/assets/actions/breath-of-purpose.jpg',
  'coincidence': '/assets/actions/thread-of-fate.jpg',
  'omen': '/assets/actions/starfall-omen.jpg',
  'afflict_bless': '/assets/actions/aegis-of-grace.jpg',
  'divine.dream': '/assets/actions/oneiric-sending.jpg',
  'divine.persuade': '/assets/actions/divine-compulsion.jpg',
  'divine.deceive': '/assets/actions/veil-of-falsehood.jpg',
  'divine.intimidate': '/assets/actions/wrath-descending.jpg',
  'divine.inspire': '/assets/actions/breath-of-purpose.jpg',
  'divine.coincidence': '/assets/actions/thread-of-fate.jpg',
  'divine.omen': '/assets/actions/starfall-omen.jpg',
  'divine.afflict_bless': '/assets/actions/aegis-of-grace.jpg',

  // ─── Thread-binding actions ────────────────────────────────────────
  'bind_thread_agent': '/assets/actions/agent-thread.jpg',
  'bind_thread_agent_strong': '/assets/actions/strong-agent-thread.jpg',
  'bind_thread_location': '/assets/actions/place-thread.jpg',
  'bind_thread_faction': '/assets/actions/faction-thread.jpg',
  'bind_thread_army': '/assets/actions/army-thread.jpg',
  'bind_thread_artifact': '/assets/actions/artifact-thread.jpg',

  // ─── Agent observation actions ─────────────────────────────────────
  'observe_agent': '/assets/actions/piercing-gaze.jpg',
  'scry_agent': '/assets/actions/far-sight.jpg',
  'whisper_insight': '/assets/actions/illuminating-whisper.jpg',
  'dream_sending': '/assets/actions/prophetic-dream.jpg',

  // ─── Location actions (loc.*) ──────────────────────────────────────
  'loc.ward': '/assets/actions/rune-of-warding.jpg',
  'loc.place_of_power': '/assets/actions/leyline-nexus.jpg',
  'loc.incite_unrest': '/assets/actions/seeds-of-discord.jpg',
  'loc.fortify': '/assets/actions/iron-bulwark.jpg',
  'loc.open_markets': '/assets/actions/awning-unfurled.jpg',

  // ─── Sublocation actions (sub.*) ───────────────────────────────────
  'sub.sanctify': '/assets/actions/sacred-ground.jpg',
  'sub.trap': '/assets/actions/hidden-snare.jpg',
  'sub.vision': '/assets/actions/place-memory.jpg',

  // ─── Artifact actions (artifact.*) ─────────────────────────────────
  'artifact.enchant': '/assets/actions/rune-inscription.jpg',
  // THR-1074. Empower is Enchant's martial counterpart — Iron reach, so the plate
  // carries Force crimson where Enchant's carries Veil. Filename derives from the
  // template's spellName ("Forge Rite"), not its id.
  'artifact.empower': '/assets/actions/forge-rite.jpg',
  'artifact.attune': '/assets/actions/sphere-resonance.jpg',
  'artifact.nullify': '/assets/actions/void-unraveling.jpg',
  'artifact.curse': '/assets/actions/malediction-bound.jpg',

  // ─── Hex actions — sensing / survey / reading ──────────────────────
  'hex.survey': '/assets/actions/divine-survey.jpg',
  'hex.dowse_resources': '/assets/actions/earthen-dowsing.jpg',
  'hex.read_currents': '/assets/actions/current-reading.jpg',
  'hex.forge_seer_token': '/assets/actions/token-of-far-sight.jpg',
  'hex.mark_ground': '/assets/actions/questing-beacon.jpg',
  'hex.plant_dream': '/assets/actions/memory-dream.jpg',
  'hex.read_stones': '/assets/actions/stone-memory.jpg',
  'hex.whisper_intuition': '/assets/actions/ruin-intuition.jpg',

  // ─── Hex actions — land / terrain manipulation ─────────────────────
  'hex.bless_land': '/assets/actions/lands-blessing.jpg',
  'hex.corrupt_land': '/assets/actions/taint-of-entropy.jpg',
  'hex.seed_life': '/assets/actions/verdant-awakening.jpg',
  'hex.raise_landmark': '/assets/actions/stones-rising.jpg',
  'hex.shift_season': '/assets/actions/seasonal-turn.jpg',
  'hex.scorch_earth': '/assets/actions/iron-scorching.jpg',
  'hex.rend_earth': '/assets/actions/earth-sundering.jpg',
  'hex.restore_fragment': '/assets/actions/fragment-restoration.jpg',
  'hex.bury_past': '/assets/actions/earth-burial.jpg',
  'hex.desecrate': '/assets/actions/ruin-desecration.jpg',

  // ─── Hex actions — magic / leyline manipulation ────────────────────
  'hex.attune_leyline': '/assets/actions/leyline-forging.jpg',
  'hex.shift_dominion': '/assets/actions/arcane-rebalance.jpg',
  'hex.amplify_flow': '/assets/actions/current-surge.jpg',
  'hex.sever_flow': '/assets/actions/arcane-silencing.jpg',
  'hex.dispel_wild': '/assets/actions/wild-purging.jpg',
  'hex.rewrite_history': '/assets/actions/memory-revision.jpg',
  'hex.consecrate_past': '/assets/actions/past-consecration.jpg',
  'hex.spark_encounter': '/assets/actions/convergence-weaving.jpg',
  'hex.forge_instrument': '/assets/actions/instrument-forging.jpg',

  // ─── Hex actions — social / people / combat ────────────────────────
  'hex.stir_people': '/assets/actions/hearts-stirring.jpg',
  'hex.summon_congregation': '/assets/actions/gathering-call.jpg',
  'hex.bestow_vision': '/assets/actions/prophetic-sending.jpg',
  'hex.scatter': '/assets/actions/iron-dispersal.jpg',
  'hex.smite': '/assets/actions/divine-smiting.jpg',
  'hex.incite_exodus': '/assets/actions/umbral-exodus.jpg',
  'hex.send_herald': '/assets/actions/herald-sending.jpg',

  // ─── Company actions (company.*) ───────────────────────────────────
  // THR-769. Filenames derive from each template's `spellName`, not its id.
  'company.bless': '/assets/actions/blessing-of-the-bound-road.jpg',
  'company.draw_together': '/assets/actions/the-gathering-thread.jpg',
  'company.reunite': '/assets/actions/the-unfinished-road.jpg',
  'company.sunder': '/assets/actions/the-widening-silence.jpg',

  // ─── Hex actions — sustained ───────────────────────────────────────
  'hex.claim_dominion': '/assets/actions/sovereign-claim.jpg',
  'hex.cultivate': '/assets/actions/sustained-bloom.jpg',
  'hex.claim_resource': '/assets/actions/resource-binding.jpg',
  'hex.anchor_sphere': '/assets/actions/sphere-anchoring.jpg',
  'hex.tap_source': '/assets/actions/source-tapping.jpg',
  'hex.attune_thread': '/assets/actions/thread-attunement.jpg',
  'hex.channel_current': '/assets/actions/current-channeling.jpg',
  'hex.shepherd_flock': '/assets/actions/flock-shepherding.jpg',
  'hex.install_champion': '/assets/actions/champion-installation.jpg',
  'hex.strengthen_thread': '/assets/actions/thread-strengthening.jpg',
  'hex.impose_decree': '/assets/actions/divine-decree.jpg',
  'hex.bind_echoes': '/assets/actions/echo-binding.jpg',
  'hex.compel_exploration': '/assets/actions/exploration-compulsion.jpg',
  'hex.seal_tomb': '/assets/actions/tomb-sealing.jpg',
  'hex.ward_against_deep': '/assets/actions/delvers-ward.jpg',
};

/** Resolve art path from any slot ID format (legacy bare, or target_action_ prefixed, or a bare template id). */
export function getActionArt(slotId: string): string | undefined {
  const templateId = slotId.replace(/^target_action_/, '');
  return ACTION_ART[templateId];
}
