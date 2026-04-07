/**
 * Item Art Registry — shared mapping from attachment template IDs to art asset paths.
 *
 * Used by both the Codex and the agent Attachments tab. Supports lookup by
 * either the base template ID or an instantiated instance ID (which embeds
 * the template ID as a suffix).
 */

const ITEM_ART: Record<string, string> = {
  // Template IDs (reward catalog) — also matched as suffix for instance IDs
  reward_arms_thornwood_staff: '/assets/items/thornwood-staff.jpg',
  reward_relics_talismans_stasis_pearl: '/assets/items/stasis-pearl.jpg',
  reward_mounts_beasts_shimmer_hart: '/assets/items/shimmer-hart.jpg',
  reward_arms_hollowfang: '/assets/items/hollowfang.png',
  reward_vestments_mantle_of_the_unremembered: '/assets/items/mantle-of-the-unremembered.png',
  reward_relics_talismans_heart_of_the_barrow: '/assets/items/heart-of-the-barrow.png',
  reward_mounts_beasts_smoke_tooth: '/assets/items/smoke-tooth.png',
  // Seeded IDs (gameInit hardcoded attachments for The First)
  first_hollowfang: '/assets/items/hollowfang.png',
  first_mantle_unremembered: '/assets/items/mantle-of-the-unremembered.png',
  first_heart_barrow: '/assets/items/heart-of-the-barrow.png',
  first_smoke_tooth: '/assets/items/smoke-tooth.png',
};

// Pre-compute sorted keys (longest first) so suffix matching is greedy
const TEMPLATE_KEYS = Object.keys(ITEM_ART).sort((a, b) => b.length - a.length);

/**
 * Look up art for an attachment by template ID or instance ID.
 * Instance IDs embed the template ID as a suffix (e.g. `reward_npc_30_0_reward_arms_hollowfang`).
 */
export function getItemArt(id: string): string | undefined {
  // Direct match first
  if (id in ITEM_ART) return ITEM_ART[id];
  // Suffix match for instantiated IDs
  for (const key of TEMPLATE_KEYS) {
    if (id.endsWith(key)) return ITEM_ART[key];
  }
  return undefined;
}

/** Raw map for codex registry bulk assignment. */
export { ITEM_ART };
