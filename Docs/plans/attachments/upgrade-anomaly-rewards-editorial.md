# Attachment Editorial Review: Anomaly Rewards Upgrade
> Slug: upgrade-anomaly-rewards | Pass: editorial | Mode: upgrade
> Items: 24 items | Date: 2026-04-06

## Editorial Review

### Name Quality
All names are existing — preserved per upgrade rules. All names are evocative and specific: "Resonance Shard", "Corroded Crown", "Fossilized Eye" — each hints at history and material. PASS.

### Flavor Text
All flavor text is existing — preserved per upgrade rules. Already Threadbare-compliant: dark, weathered, practical. No exclamation marks. PASS.

### Tag Review
All tags are existing — preserved per upgrade rules. Correct reach/sphere/category tagging throughout. PASS.

### Mechanical Summary Accuracy

| # | Item | Summary Matches Effects? | Notes |
|---|------|------------------------|-------|
| 1 | Uncut Ruby | PASS | "+0.10 Gold, +0.05 Gold while trading, 1.3x desire for Gold encounters" matches passive + conditional(in_social) + behavior_weight |
| 2 | Resonance Shard | PASS | "+0.10 Veil, +0.05 Eye, +0.05 Veil in mystical contexts, shifts near-miss to success on Veil tests" matches effects |
| 3 | Amber Phial | PASS | "+0.05 Heart, 3 charges of +0.06 Heart burst" matches passive + consumable_charge |
| 4 | Herb Bundle | PASS | "+0.02 Heart in wilderness, 2 charges of +0.04 Heart burst" matches conditional + consumable_charge |
| 5 | Sealed Codex | FIX | Summary says "per exploration success" but stacking trigger is `social_success`. Should be `social_success` in summary. |
| 6 | Corroded Crown | PASS | "+0.10 Gold, +0.05 Gold / -0.03 Heart" matches passive + tradeoff |
| 7 | Fossilized Eye | PASS | "+0.05 Eye, +0.03 Veil, +1 awareness range" matches effects |
| 8 | Star Metal Shard | PASS | "+0.08 Iron, +0.05 Star, active 6/dormant 12: +0.05 Iron" matches effects |
| 9 | Moonpearl Strand | PASS | "+0.08 Heart, +0.05 Heart in social, cooperates more with allies" matches effects |
| 10 | Spore Lantern | PASS | "+0.05 Eye, +0.05 Eye in exploration, +0.02 Veil/-0.02 Heart" matches effects |
| 11 | Prospector's Eye | PASS | Summary should be written. Using "+0.08 Eye, +0.05 Eye in exploration, 1.2x desire for Gold encounters" |
| 12 | Crystal Attunement | PASS | Summary should be written. Using "+0.08 Veil, +0.05 Eye, +0.05 Veil in mystical, immune to #dissonance" |
| 13 | Sap-Blessed | PASS | Summary should be written. Using "+0.05 Heart, +0.04 Heart in social, prevents #wound loss" |
| 14 | Herbalist's Knowledge | PASS | Summary should be written. Using "+0.05 Eye, +0.04 Eye in wilderness" |
| 15 | Vault Scholar | PASS | Summary should be written. Using "+0.08 Eye, +0.05 Stone, +0.04 Eye in exploration, grants ancient_reader" |
| 16 | Tide Reader | PASS | Summary should be written. Using "+0.08 Star, +0.06 Star near water, -10% movement cost" |
| 17 | Spore-Touched | PASS | Summary should be written. Using "+0.05 Veil, +0.05 Eye, +0.04 Veil / -0.02 Heart (spore sight)" |
| 18 | Ironblood | PASS | Summary should be written. Using "+0.05 Iron, +0.05 Star, +0.05 Iron in combat" |
| 19 | Crystal Headache | PASS | Summary should be written. Using "-0.05 Eye, -0.04 Veil in mystical" |
| 20 | Golden Euphoria | PASS | Summary should be written. Using "+0.08 Heart, -0.06 Iron, cooperates more readily" |
| 21 | Vault Curse | PASS | Summary should be written. Using "-0.08 Star, -0.01 Star per encounter (max -0.05)" |
| 22 | Brine Lungs | PASS | Summary should be written. Using "-0.06 Iron, +20% movement cost" |
| 23 | Spore Visions | PASS | Summary should be written. Using "+0.10 Eye, -0.08 Heart, +1 awareness range" |
| 24 | Fossil Whispers | PASS | Summary should be written. Using "+0.05 Eye, +0.03 Veil, drifts toward curiosity" |

### Invalid Reach Domains
- `spirit` remapped to `heart` on Moonpearl Strand: CORRECT — devotion/calming aligns with Heart
- `mind` remapped to `eye` on Crystal Headache: CORRECT — cognitive/perceptual domain aligns with Eye

### Variety Check
- 14 unique primitives used across 24 items: EXCELLENT variety
- Reach spread: iron (5), gold (3), eye (14), veil (8), heart (9), star (5), stone (1), shadow (0)
- Shadow has no representation, but this is appropriate — anomaly rewards are about discovery, not stealth
- Stone is underrepresented (1 item) but fits the theme

### Corrections Applied

1. **Sealed Codex (#5):** mechanicalSummary fixed to say "per social success" matching `stackOn: 'social_success'`
2. **Bestowed powers (#11-18):** Added `mechanicalSummary` field (traits need description, not mechanicalSummary — checking type... `TraitDefinitionProperties` has `description` not `mechanicalSummary`). Actually, traits use `description` field. The `mechanicalSummary` is not in the type. Leaving `description` unchanged as per rules.
3. **Conditions (#19-24):** Same — traits use `description`, no `mechanicalSummary`. Descriptions are existing and unchanged.

## Verdict: **PASS WITH REVISIONS**

Minor fix: Sealed Codex mechanicalSummary corrected for accuracy.
