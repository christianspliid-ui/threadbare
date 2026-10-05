# Encounter Pipeline: The Vault Before the Rains
> Scale: medium | Slug: cathedral-vault | Pass: final
> Date: 2026-10-05 | Pipeline version: 2.0
> Status: **READY WITH CAVEATS**
> Batch: master-everyday (THR-1688), slot 7 · templateId `encounter.town.cathedral_vault`

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Opt-in complication on stone: test the mortar, then by the mortal's nerve strike the centering now or keep the frame sound until spring; relationship (abbot) + place (Festival on `$here`). |
| Editorial | PASS WITH REVISIONS | Opening + spine cut 95 → 75 words; cast de-gendered; seam, afterimage↔fragment and overview↔afterimage echoes removed; blame/trust moved into the chips; reaction conflict and unbacked "at their own cost" fixed; lexicon card names; strike-arm specials re-weighted to sum 1.00. |
| Systems | READY WITH CAVEATS | Every id/field verified live. Two aggregation over-claims fixed in the `success_at_cost` overviews; aftermath fallback re-authored for the step-0 terminal path; Stretch The Dry Spells re-plated to `generic.time-slow`; chip titles, durations, purpose lines, `narrativeTemplates` and `description` supplied. One corpus-wide engine gap (BACKLOG). |

### Caveats / Blockers

1. **Pre-fork critical failure (corpus-wide, BACKLOG).** A step-0 `critical_failure` ends the action after the `courage_prudence` pole is recorded, so the chosen arm's `critical_failure` page renders with a SCAR (town) and BOND (abbot's blame) whose step-1 writes never ran. Rare at 0.76 in the master window. The authored aftermath `fallback.critical_failure` tells the step-0 path truthfully once the engine fix (`debt-arbitration-systems.md` § 9) lands.
2. **`{location}` may name a Place** (raw `located_at`) in the openings, two chip details and one overview, while `$here` writes to the settlement. Precedent-consistent; "the town" is unsafe because the encounter also runs in hamlets.
3. **The Watcher arm compresses a season** into a 2–3-tick step; the Festival is written at resolution while the prose says the church opened in spring. Accepted under NFP 5; no write promises a later date.
4. In rural settings and cities the foreman (and in rural settings usually the abbot) is a minted walk-on.
5. Do not bind `libraryCardId` on any special.

### Systems rulings

- **near_miss stays on the success side.** `isStepSuccess` puts `near_miss` with the successes (engine law, `src/types/unifiedAction.ts:2996`); a step-1 near_miss aggregates to the `success_at_cost` band, whose success chips are backed by the success writes. A near-miss strike is a vault that stood with a flaw. Chip and write agree on every path.
- **Reactions** key on the five aggregate bands; `near_miss` is never an aggregate band. Success reactions on critical_success / success / success_at_cost, failure reactions on failure / critical_failure — every reachable page has a pair.
- **"{cast:abbot} has sent for another master"** is past and scene-local; no cast key, no seed, no chip. Lawful.
- **BOND noun `reputation with {target}` on a `bond_change` write** — the lawful pairing (precedent masons-commission); THR-1685 (shipped) makes `{target}` read the abbot.
- **Card ids** `vault.hurry_the_season`, `vault.show_the_hairline`, `vault.pace_the_crew`, `vault.wring_the_timber` are kept under their new names; no lint ties id to name (precedent `debt.counsel_patience` / "Plant Patience").
- `bond_change` keeps `reciprocal` at its default (true): the chip "{cast:abbot} trusts {actor}" is the abbot→actor edge.

### Prose changed by the systems pass (everything else is the revised file verbatim)

| Where | Revised | Final | Why |
|---|---|---|---|
| Vanguard `success_at_cost` overview | "The crew spent the last dry days filling the crack with fresh mortar. The church opened late, in the first rain." | "The last dry days went on the vault, and the church opened late, in the first rain." | The band also shows when step 1 was clean and step 0 carried the cost; the crack then contradicts "They struck the frame, and the vault took its own weight." |
| Watcher `success_at_cost` overview | "The crew rebuilt the course over the door in spring, and the church opened at midsummer." | "The church opened late in spring, once the last work on the vault was done." | Same aggregation; contradicted "They kept the frame sound until spring." |
| Aftermath fallback | Watcher text verbatim | overview "{actor} tested the vault for the abbey."; four Watcher bands; `critical_failure` "The frame stays under the vault, and the abbey has stopped all work on the church." (no chips) | The fallback's real path (post engine fix) is a step-0 critical failure, where no strike or winter happened and no write fires. |

**New strings supplied (absent from the revised file):** chip titles "The Abbot's Trust", "A Feast Day", "The Town's Doubt", "The Abbot's Blame"; `narrativeTemplates` (initiation / success / failure); `description`; purpose lines "Test the vault" / "Strike the centering" / "Keep the frame sound" (from § 6). Chips carry no `causeClause` (the revised packet's single-sentence captions; the field is optional).

### Editorial Notes Summary

The editorial cut the opening + spine to 75 words and gave P1 an arrival with a role ("sent for as master builder"); replaced "chapter" with "the monks"; de-gendered "a man at every wedge"; removed seam echoes across spine→step 1, six afterimage↔fragment echoes and three overview↔afterimage retellings; moved the abbot's blame and trust out of the overviews into the BOND chips; rewrote the failure reaction as **Defend Their Name** (true on both arms) and cut the unbacked "at their own cost"; extended the success reactions to success_at_cost; renamed cards onto the lexicon (Hasten The Strike, Reveal The Hairline Crack, Steady The Crew, Draw The Water Out) and away from bell-tower's *Show*; re-weighted Bind 0.12 → 0.10 and Steady 0.10 → 0.08; removed measured counts and jargon.

### Implementation File Map

Compiled set (not hand-edits): `Docs/plans/encounters/cathedral-vault.package.json` → `npm run compile:encounter` produces the module, its structural test and both registrations. Run `check:encounter` on the package too.

Beyond the compiled set:
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` for `hook.long_road` at closeout (brief).
- No engine, type or art file.

---

## Package transcription (authoritative — transcribe into `cathedral-vault.package.json`)

The package's `doc` array carries § 0 below (binding row and mechanical design block), the plotHook lines, and the known-caveat block from this file's Caveats 1 and the measurement note (the fork has no top-level difficulty, so `measure:roll-spread` reads step 0 only: stone 0.76). Every string below is final; where it differs from the packet sections that follow, the table above says why.

```json
{
  "slug": "cathedral-vault",
  "template": {
    "id": "encounter.town.cathedral_vault",
    "rarityTier": 2,
    "intrinsicTier": "shaping",
    "name": "The Vault Before the Rains",
    "reach": "stone",
    "crudType": "update",
    "scale": "local",
    "apCost": 1,
    "actorAffinities": [
      "individual"
    ],
    "motivations": [
      "courage_prudence"
    ],
    "settings": [
      "rural",
      "urban"
    ],
    "openings": {
      "rural": "{actor} arrives at the abbey outside {location}, sent for as master builder.",
      "urban": "{actor} arrives at the abbey in {location}, sent for as master builder."
    },
    "steps": [
      {
        "reach": "stone",
        "duration": {
          "min": 1,
          "max": 2
        },
        "difficulty": 0.76,
        "purposeLine": "Test the vault",
        "onSuccess": [],
        "onFailure": [],
        "failBehavior": "continue_weakened",
        "narrativeTemplate": "The abbey has finished its new church's stone vault. It still rests on its centering, the timber frame beneath it. The winter rains come next week. Wet timber swells and can crack the vault.\n\nAbbot {cast:abbot} wants the frame out and the church open by winter. The abbot has told the monks {actor} answers for the vault. First {actor} must test the mortar.",
        "criticalSuccessAfterimage": "They tested every course of the vault and found the mortar set through.",
        "successAfterimage": "They found the mortar set hard enough to carry the vault.",
        "successAtCostAfterimage": "They found the mortar set, but the test took most of the dry week.",
        "failureAfterimage": "They could not tell whether the mortar had set.",
        "criticalFailureAfterimage": "They judged the mortar set when it was still soft.",
        "deal": {
          "count": 4,
          "tags": [
            "craft",
            "insight"
          ]
        },
        "nudges": [
          {
            "id": "vault.hurry_the_season",
            "name": "Hasten The Strike",
            "sphere": "time",
            "essenceCost": 1,
            "forecastDelta": 0.06,
            "poleLean": {
              "axis": "courage_prudence",
              "toward": "positive"
            },
            "imageTag": "generic.memory",
            "effectLine": "Put the coming rain first in their thoughts. They lean toward taking the frame out this week.",
            "bandProse": {
              "success": "The coming rain kept them at the work, and they tested every course before dark.",
              "success_at_cost": "The coming rain hurried them, and they had to test the first courses again.",
              "near_miss": "The coming rain hurried them past the courses over the west door.",
              "failure": "The coming rain rushed the test, and they trusted courses they never checked."
            }
          },
          {
            "id": "vault.show_the_hairline",
            "name": "Reveal The Hairline Crack",
            "sphere": "light",
            "essenceCost": 1,
            "forecastDelta": 0.06,
            "poleLean": {
              "axis": "courage_prudence",
              "toward": "negative"
            },
            "imageTag": "generic.light",
            "effectLine": "Throw lamplight across a fine split in the mortar. They lean toward leaving the frame in until spring.",
            "bandProse": {
              "critical_success": "The lamplight found the fine split, and they traced it to a single course.",
              "success": "The lamplight showed them one fine split, and they knew the rest of the mortar held.",
              "failure": "The lamplight showed them a fine split, and they doubted every course after it.",
              "critical_failure": "The lamplight showed them one split, and they took it for the only one."
            }
          }
        ]
      },
      {
        "branchOnStep": 0,
        "decidedBy": {
          "axis": "courage_prudence"
        },
        "variants": {
          "positive": {
            "reach": "stone",
            "duration": {
              "min": 1,
              "max": 2
            },
            "difficulty": 0.82,
            "purposeLine": "Strike the centering",
            "onSuccess": [],
            "onFailure": [],
            "failBehavior": "fail_action",
            "narrativeTemplate": "{actor} orders the centering struck. Foreman {cast:foreman} puts a mason at every wedge under the frame. The wedges must come out together, a little at a time, so the vault takes its weight evenly. If one side drops first, the vault will split and fall into the nave. The monks watch from the door.",
            "criticalSuccessAfterimage": "They struck the frame in one day, and the vault never moved.",
            "successAfterimage": "They struck the frame, and the vault took its own weight.",
            "successAtCostAfterimage": "They struck the frame, and the vault settled with a fine crack along its crown.",
            "failureAfterimage": "The vault cracked along its crown, and they drove the wedges back in to hold it.",
            "criticalFailureAfterimage": "The vault fell into the nave.",
            "carryoverFactorLines": {
              "critical_success": {
                "text": "They know the mortar has set through.",
                "polarity": "for",
                "forecastDelta": 0.06
              },
              "success": {
                "text": "They know the mortar will carry the vault.",
                "polarity": "for",
                "forecastDelta": 0.04
              },
              "success_at_cost": {
                "text": "Most of the dry week is already gone.",
                "polarity": "against",
                "forecastDelta": -0.02
              },
              "near_miss": {
                "text": "They know most of the mortar has set.",
                "polarity": "for",
                "forecastDelta": 0.02
              },
              "failure": {
                "text": "They do not know whether the mortar has set.",
                "polarity": "against",
                "forecastDelta": -0.03
              }
            },
            "successMetadata": {
              "effects": [
                {
                  "kind": "bond_change",
                  "withAgentId": "$cast:abbot",
                  "sentimentDelta": 0.12,
                  "trustDelta": 0.1
                },
                {
                  "kind": "apply_condition",
                  "conditionTraitId": "trait.condition.location.festival",
                  "targetLocationId": "$here",
                  "intensity": 0.5,
                  "durationTicks": 36
                }
              ]
            },
            "failureMetadata": {
              "effects": [
                {
                  "kind": "reputation_with",
                  "targetLocationId": "$here",
                  "delta": -0.08
                },
                {
                  "kind": "bond_change",
                  "withAgentId": "$cast:abbot",
                  "sentimentDelta": -0.12,
                  "trustDelta": -0.12
                }
              ]
            },
            "deal": {
              "count": 4,
              "tags": [
                "craft",
                "peril"
              ]
            },
            "nudges": [
              {
                "id": "vault.bind_the_courses",
                "name": "Bind The Courses",
                "sphere": "matter",
                "essenceCost": 2,
                "forecastDelta": 0.1,
                "imageTag": "generic.matter",
                "effectLine": "Make the mortar grip each stone as the timber comes away. The vault settles as one piece.",
                "bandProse": {
                  "critical_success": "The mortar gripped every stone, and the vault settled without a sound.",
                  "success": "The mortar held each stone in place as the frame came away.",
                  "near_miss": "The mortar held, but one stone settled ahead of the rest.",
                  "failure": "The mortar gripped too late, and a stone slipped as the frame came away.",
                  "critical_failure": "The mortar gripped each stone, and the vault still fell as one piece."
                }
              },
              {
                "id": "vault.pace_the_crew",
                "name": "Steady The Crew",
                "sphere": "order",
                "essenceCost": 2,
                "forecastDelta": 0.08,
                "imageTag": "generic.oath",
                "effectLine": "Set every hand at the wedges to one count. No side of the vault drops before the others.",
                "bandProse": {
                  "success": "Every wedge came out on the same count, and the vault dropped evenly.",
                  "success_at_cost": "The crew kept the count, but slowly, and the work ran on past dark.",
                  "failure": "One gang lost the count, and the west side dropped first.",
                  "critical_failure": "The crew kept the count until the last wedges, then broke it."
                }
              }
            ]
          },
          "negative": {
            "reach": "stone",
            "duration": {
              "min": 2,
              "max": 3
            },
            "difficulty": 0.78,
            "purposeLine": "Keep the frame sound",
            "onSuccess": [],
            "onFailure": [],
            "failBehavior": "fail_action",
            "narrativeTemplate": "{actor} tells the monks the frame stays in until spring. The abbot calls it cowardice. All winter the rain will soak the frame and push it up against the new stone. {actor} and Foreman {cast:foreman} must loosen the wedges after every wet night, or the frame will break the vault.",
            "criticalSuccessAfterimage": "They kept the frame sound, and the vault never cracked.",
            "successAfterimage": "They kept the frame sound until spring.",
            "successAtCostAfterimage": "They kept the frame sound, except for one swell that cracked a course over the door.",
            "failureAfterimage": "One wet week they fell behind, and a bay of the vault cracked from below.",
            "criticalFailureAfterimage": "In midwinter the frame split the vault along its crown.",
            "carryoverFactorLines": {
              "critical_success": {
                "text": "They know which courses can bear a swelling frame.",
                "polarity": "for",
                "forecastDelta": 0.05
              },
              "success": {
                "text": "They know the mortar will hold through a wet season.",
                "polarity": "for",
                "forecastDelta": 0.03
              },
              "success_at_cost": {
                "text": "The rain reached the frame before the work began.",
                "polarity": "against",
                "forecastDelta": -0.02
              },
              "near_miss": {
                "text": "They know most of the courses will hold.",
                "polarity": "for",
                "forecastDelta": 0.02
              },
              "failure": {
                "text": "They do not know which courses will give first.",
                "polarity": "against",
                "forecastDelta": -0.03
              }
            },
            "successMetadata": {
              "effects": [
                {
                  "kind": "bond_change",
                  "withAgentId": "$cast:abbot",
                  "sentimentDelta": 0.1,
                  "trustDelta": 0.08
                },
                {
                  "kind": "apply_condition",
                  "conditionTraitId": "trait.condition.location.festival",
                  "targetLocationId": "$here",
                  "intensity": 0.5,
                  "durationTicks": 36
                }
              ]
            },
            "failureMetadata": {
              "effects": [
                {
                  "kind": "reputation_with",
                  "targetLocationId": "$here",
                  "delta": -0.05
                },
                {
                  "kind": "bond_change",
                  "withAgentId": "$cast:abbot",
                  "sentimentDelta": -0.08,
                  "trustDelta": -0.08
                }
              ]
            },
            "deal": {
              "count": 4,
              "tags": [
                "labor",
                "craft"
              ]
            },
            "nudges": [
              {
                "id": "vault.stretch_the_dry_spells",
                "name": "Stretch The Dry Spells",
                "sphere": "time",
                "essenceCost": 2,
                "forecastDelta": 0.1,
                "imageTag": "generic.time-slow",
                "effectLine": "Lengthen the gaps between storms. The timber has more nights to shed its water.",
                "bandProse": {
                  "critical_success": "The storms came far apart all winter, and the frame never swelled.",
                  "success": "The storms came far apart, and the frame gave back its water between them.",
                  "near_miss": "The storms came far apart until the new year, then came night after night.",
                  "failure": "The gaps between storms closed in the new year, and the frame swelled."
                }
              },
              {
                "id": "vault.wring_the_timber",
                "name": "Draw The Water Out",
                "sphere": "force",
                "essenceCost": 2,
                "forecastDelta": 0.1,
                "imageTag": "generic.strength",
                "effectLine": "Squeeze the frame dry between storms. The wedges stay loose through the wet nights.",
                "bandProse": {
                  "success": "The frame shed its water, and the wedges stayed loose.",
                  "success_at_cost": "The frame shed its water, but only after a night of swelling.",
                  "failure": "The frame held its water, and the wedges bound tight.",
                  "critical_failure": "The frame held its water through the worst storm, and the wedges would not move."
                }
              }
            ]
          }
        },
        "fallback": {
          "reach": "stone",
          "duration": {
            "min": 2,
            "max": 3
          },
          "difficulty": 0.78,
          "purposeLine": "Keep the frame sound",
          "onSuccess": [],
          "onFailure": [],
          "failBehavior": "fail_action",
          "narrativeTemplate": "{actor} tells the monks the frame stays in until spring. The abbot calls it cowardice. All winter the rain will soak the frame and push it up against the new stone. {actor} and Foreman {cast:foreman} must loosen the wedges after every wet night, or the frame will break the vault.",
          "criticalSuccessAfterimage": "They kept the frame sound, and the vault never cracked.",
          "successAfterimage": "They kept the frame sound until spring.",
          "successAtCostAfterimage": "They kept the frame sound, except for one swell that cracked a course over the door.",
          "failureAfterimage": "One wet week they fell behind, and a bay of the vault cracked from below.",
          "criticalFailureAfterimage": "In midwinter the frame split the vault along its crown.",
          "carryoverFactorLines": {
            "critical_success": {
              "text": "They know which courses can bear a swelling frame.",
              "polarity": "for",
              "forecastDelta": 0.05
            },
            "success": {
              "text": "They know the mortar will hold through a wet season.",
              "polarity": "for",
              "forecastDelta": 0.03
            },
            "success_at_cost": {
              "text": "The rain reached the frame before the work began.",
              "polarity": "against",
              "forecastDelta": -0.02
            },
            "near_miss": {
              "text": "They know most of the courses will hold.",
              "polarity": "for",
              "forecastDelta": 0.02
            },
            "failure": {
              "text": "They do not know which courses will give first.",
              "polarity": "against",
              "forecastDelta": -0.03
            }
          },
          "successMetadata": {
            "effects": [
              {
                "kind": "bond_change",
                "withAgentId": "$cast:abbot",
                "sentimentDelta": 0.1,
                "trustDelta": 0.08
              },
              {
                "kind": "apply_condition",
                "conditionTraitId": "trait.condition.location.festival",
                "targetLocationId": "$here",
                "intensity": 0.5,
                "durationTicks": 36
              }
            ]
          },
          "failureMetadata": {
            "effects": [
              {
                "kind": "reputation_with",
                "targetLocationId": "$here",
                "delta": -0.05
              },
              {
                "kind": "bond_change",
                "withAgentId": "$cast:abbot",
                "sentimentDelta": -0.08,
                "trustDelta": -0.08
              }
            ]
          },
          "deal": {
            "count": 4,
            "tags": [
              "labor",
              "craft"
            ]
          },
          "nudges": [
            {
              "id": "vault.stretch_the_dry_spells",
              "name": "Stretch The Dry Spells",
              "sphere": "time",
              "essenceCost": 2,
              "forecastDelta": 0.1,
              "imageTag": "generic.time-slow",
              "effectLine": "Lengthen the gaps between storms. The timber has more nights to shed its water.",
              "bandProse": {
                "critical_success": "The storms came far apart all winter, and the frame never swelled.",
                "success": "The storms came far apart, and the frame gave back its water between them.",
                "near_miss": "The storms came far apart until the new year, then came night after night.",
                "failure": "The gaps between storms closed in the new year, and the frame swelled."
              }
            },
            {
              "id": "vault.wring_the_timber",
              "name": "Draw The Water Out",
              "sphere": "force",
              "essenceCost": 2,
              "forecastDelta": 0.1,
              "imageTag": "generic.strength",
              "effectLine": "Squeeze the frame dry between storms. The wedges stay loose through the wet nights.",
              "bandProse": {
                "success": "The frame shed its water, and the wedges stayed loose.",
                "success_at_cost": "The frame shed its water, but only after a night of swelling.",
                "failure": "The frame held its water, and the wedges bound tight.",
                "critical_failure": "The frame held its water through the worst storm, and the wedges would not move."
              }
            }
          ]
        }
      }
    ],
    "traitVariants": [
      {
        "traitId": "trait.core.core_humility.virtue",
        "forecastDelta": 0.04,
        "factorLine": "Being Humble, they check their own work twice."
      }
    ],
    "supportBundle": [
      {
        "kind": "actor",
        "key": "abbot",
        "delivery": "lazy-materialize-on-trigger",
        "persistence": "must-persist",
        "reuseNpcRoles": [
          "monk",
          "priest"
        ],
        "supportRole": "abbot",
        "spawnNpcRole": "monk",
        "spawnName": "Anselm Hale"
      },
      {
        "kind": "actor",
        "key": "foreman",
        "delivery": "lazy-materialize-on-trigger",
        "persistence": "must-persist",
        "reuseNpcRoles": [
          "mason"
        ],
        "supportRole": "works_foreman",
        "spawnNpcRole": "mason",
        "spawnName": "Wat Durran"
      }
    ],
    "narrativeTemplates": {
      "initiation": "An abbey's new stone vault still rests on its timber frame. {actor} may strike the frame before the winter rains, or keep it sound until spring.",
      "success": "{actor} saw the abbey's new vault take its own weight.",
      "failure": "{actor} answered to the abbey for a broken vault."
    },
    "aftermathConfig": {
      "branchOnStep": 0,
      "variants": {
        "positive": {
          "overview": "{actor} struck the centering before the rains.",
          "changes": [],
          "byOutcome": {
            "critical_success": {
              "overview": "The church opened to {location} before the first rain, and the monks held their first service under the new vault that week.",
              "changes": [
                {
                  "id": "vault.pos.crit.abbot_trust",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "The Abbot's Trust",
                  "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.pos.crit.feast",
                  "kind": "trait",
                  "category": "boon",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "A Feast Day",
                  "detail": "{location} keeps a feast for the new church.",
                  "stateNoun": {
                    "text": "Festival",
                    "entityId": "trait.condition.location.festival",
                    "visualKind": "attachment"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.pos.crit.credit_crew",
                  "label": "Credit The Crew",
                  "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:foreman",
                      "sentimentDelta": 0.12
                    }
                  ]
                },
                {
                  "id": "vault.pos.crit.accept_thanks",
                  "label": "Accept The Thanks",
                  "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.04
                    }
                  ]
                }
              ]
            },
            "success": {
              "overview": "The church opened before winter, as {cast:abbot} wanted, and the vault needed no repair.",
              "changes": [
                {
                  "id": "vault.pos.succ.abbot_trust",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "The Abbot's Trust",
                  "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.pos.succ.feast",
                  "kind": "trait",
                  "category": "boon",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "A Feast Day",
                  "detail": "{location} keeps a feast for the new church.",
                  "stateNoun": {
                    "text": "Festival",
                    "entityId": "trait.condition.location.festival",
                    "visualKind": "attachment"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.pos.succ.credit_crew",
                  "label": "Credit The Crew",
                  "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:foreman",
                      "sentimentDelta": 0.12
                    }
                  ]
                },
                {
                  "id": "vault.pos.succ.accept_thanks",
                  "label": "Accept The Thanks",
                  "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.04
                    }
                  ]
                }
              ]
            },
            "success_at_cost": {
              "overview": "The last dry days went on the vault, and the church opened late, in the first rain.",
              "changes": [
                {
                  "id": "vault.pos.cost.abbot_trust",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "The Abbot's Trust",
                  "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.pos.cost.feast",
                  "kind": "trait",
                  "category": "boon",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "A Feast Day",
                  "detail": "{location} keeps a feast for the new church.",
                  "stateNoun": {
                    "text": "Festival",
                    "entityId": "trait.condition.location.festival",
                    "visualKind": "attachment"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.pos.cost.credit_crew",
                  "label": "Credit The Crew",
                  "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:foreman",
                      "sentimentDelta": 0.12
                    }
                  ]
                },
                {
                  "id": "vault.pos.cost.accept_thanks",
                  "label": "Accept The Thanks",
                  "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.04
                    }
                  ]
                }
              ]
            },
            "failure": {
              "overview": "The church stays shut until spring, and the cracked vault must be repaired before it opens. A builder sent for by name is only as good as the last vault they struck.",
              "changes": [
                {
                  "id": "vault.pos.fail.town_doubt",
                  "kind": "reputation",
                  "category": "scar",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Town's Doubt",
                  "detail": "{location} no longer trusts {actor}'s word on stone.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$here",
                    "visualKind": "location",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.pos.fail.abbot_blame",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Abbot's Blame",
                  "detail": "{cast:abbot} blames {actor} for the vault.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.pos.fail.stay_rebuild",
                  "label": "Stay And Rebuild",
                  "intent": "The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": 0.06,
                      "trustDelta": 0.04
                    }
                  ]
                },
                {
                  "id": "vault.pos.fail.defend_name",
                  "label": "Defend Their Name",
                  "intent": "The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.03
                    },
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": -0.06
                    }
                  ]
                }
              ]
            },
            "critical_failure": {
              "overview": "No one was hurt. The abbey must clear the broken stone and build its vault again.",
              "changes": [
                {
                  "id": "vault.pos.critfail.town_doubt",
                  "kind": "reputation",
                  "category": "scar",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Town's Doubt",
                  "detail": "{location} no longer trusts {actor}'s word on stone.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$here",
                    "visualKind": "location",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.pos.critfail.abbot_blame",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Abbot's Blame",
                  "detail": "{cast:abbot} blames {actor} for the vault.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.pos.critfail.stay_rebuild",
                  "label": "Stay And Rebuild",
                  "intent": "The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": 0.06,
                      "trustDelta": 0.04
                    }
                  ]
                },
                {
                  "id": "vault.pos.critfail.defend_name",
                  "label": "Defend Their Name",
                  "intent": "The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.03
                    },
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": -0.06
                    }
                  ]
                }
              ]
            }
          }
        },
        "negative": {
          "overview": "{actor} kept the centering in until spring.",
          "changes": [],
          "byOutcome": {
            "critical_success": {
              "overview": "In spring the frame came out in a day, and the church opened with the first fine weather.",
              "changes": [
                {
                  "id": "vault.neg.crit.abbot_trust",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "The Abbot's Trust",
                  "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.neg.crit.feast",
                  "kind": "trait",
                  "category": "boon",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "A Feast Day",
                  "detail": "{location} keeps a feast for the new church.",
                  "stateNoun": {
                    "text": "Festival",
                    "entityId": "trait.condition.location.festival",
                    "visualKind": "attachment"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.neg.crit.credit_crew",
                  "label": "Credit The Crew",
                  "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:foreman",
                      "sentimentDelta": 0.12
                    }
                  ]
                },
                {
                  "id": "vault.neg.crit.accept_thanks",
                  "label": "Accept The Thanks",
                  "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.04
                    }
                  ]
                }
              ]
            },
            "success": {
              "overview": "The frame came out in spring, and the vault took its own weight. The church opened a season late, with its vault whole.",
              "changes": [
                {
                  "id": "vault.neg.succ.abbot_trust",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "The Abbot's Trust",
                  "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.neg.succ.feast",
                  "kind": "trait",
                  "category": "boon",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "A Feast Day",
                  "detail": "{location} keeps a feast for the new church.",
                  "stateNoun": {
                    "text": "Festival",
                    "entityId": "trait.condition.location.festival",
                    "visualKind": "attachment"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.neg.succ.credit_crew",
                  "label": "Credit The Crew",
                  "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:foreman",
                      "sentimentDelta": 0.12
                    }
                  ]
                },
                {
                  "id": "vault.neg.succ.accept_thanks",
                  "label": "Accept The Thanks",
                  "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.04
                    }
                  ]
                }
              ]
            },
            "success_at_cost": {
              "overview": "The church opened late in spring, once the last work on the vault was done.",
              "changes": [
                {
                  "id": "vault.neg.cost.abbot_trust",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "The Abbot's Trust",
                  "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.neg.cost.feast",
                  "kind": "trait",
                  "category": "boon",
                  "direction": "gain",
                  "polarity": "gain",
                  "title": "A Feast Day",
                  "detail": "{location} keeps a feast for the new church.",
                  "stateNoun": {
                    "text": "Festival",
                    "entityId": "trait.condition.location.festival",
                    "visualKind": "attachment"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.neg.cost.credit_crew",
                  "label": "Credit The Crew",
                  "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:foreman",
                      "sentimentDelta": 0.12
                    }
                  ]
                },
                {
                  "id": "vault.neg.cost.accept_thanks",
                  "label": "Accept The Thanks",
                  "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.04
                    }
                  ]
                }
              ]
            },
            "failure": {
              "overview": "The cracked bay must come down and be built again before the church can open. The rest of the vault stands.",
              "changes": [
                {
                  "id": "vault.neg.fail.town_doubt",
                  "kind": "reputation",
                  "category": "scar",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Town's Doubt",
                  "detail": "{location} no longer trusts {actor}'s word on stone.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$here",
                    "visualKind": "location",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.neg.fail.abbot_blame",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Abbot's Blame",
                  "detail": "{cast:abbot} blames {actor} for the vault.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.neg.fail.stay_rebuild",
                  "label": "Stay And Rebuild",
                  "intent": "The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": 0.06,
                      "trustDelta": 0.04
                    }
                  ]
                },
                {
                  "id": "vault.neg.fail.defend_name",
                  "label": "Defend Their Name",
                  "intent": "The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.03
                    },
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": -0.06
                    }
                  ]
                }
              ]
            },
            "critical_failure": {
              "overview": "Half the vault had to come down. {cast:abbot} has sent for another master to build it again.",
              "changes": [
                {
                  "id": "vault.neg.critfail.town_doubt",
                  "kind": "reputation",
                  "category": "scar",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Town's Doubt",
                  "detail": "{location} no longer trusts {actor}'s word on stone.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$here",
                    "visualKind": "location",
                    "tooltipId": "ui.reputation_with"
                  }
                },
                {
                  "id": "vault.neg.critfail.abbot_blame",
                  "kind": "reputation",
                  "category": "bond",
                  "direction": "loss",
                  "polarity": "loss",
                  "title": "The Abbot's Blame",
                  "detail": "{cast:abbot} blames {actor} for the vault.",
                  "stateNoun": {
                    "text": "reputation with {target}",
                    "entityId": "$cast:abbot",
                    "visualKind": "agent",
                    "tooltipId": "ui.reputation_with"
                  }
                }
              ],
              "reactions": [
                {
                  "id": "vault.neg.critfail.stay_rebuild",
                  "label": "Stay And Rebuild",
                  "intent": "The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.",
                  "effects": [
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": 0.06,
                      "trustDelta": 0.04
                    }
                  ]
                },
                {
                  "id": "vault.neg.critfail.defend_name",
                  "label": "Defend Their Name",
                  "intent": "The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.",
                  "effects": [
                    {
                      "kind": "reputation_with",
                      "targetLocationId": "$here",
                      "delta": 0.03
                    },
                    {
                      "kind": "bond_change",
                      "withAgentId": "$cast:abbot",
                      "sentimentDelta": -0.06
                    }
                  ]
                }
              ]
            }
          }
        }
      },
      "fallback": {
        "overview": "{actor} tested the vault for the abbey.",
        "changes": [],
        "byOutcome": {
          "critical_success": {
            "overview": "In spring the frame came out in a day, and the church opened with the first fine weather.",
            "changes": [
              {
                "id": "vault.fb.crit.abbot_trust",
                "kind": "reputation",
                "category": "bond",
                "direction": "gain",
                "polarity": "gain",
                "title": "The Abbot's Trust",
                "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                "stateNoun": {
                  "text": "reputation with {target}",
                  "entityId": "$cast:abbot",
                  "visualKind": "agent",
                  "tooltipId": "ui.reputation_with"
                }
              },
              {
                "id": "vault.fb.crit.feast",
                "kind": "trait",
                "category": "boon",
                "direction": "gain",
                "polarity": "gain",
                "title": "A Feast Day",
                "detail": "{location} keeps a feast for the new church.",
                "stateNoun": {
                  "text": "Festival",
                  "entityId": "trait.condition.location.festival",
                  "visualKind": "attachment"
                }
              }
            ],
            "reactions": [
              {
                "id": "vault.fb.crit.credit_crew",
                "label": "Credit The Crew",
                "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                "effects": [
                  {
                    "kind": "bond_change",
                    "withAgentId": "$cast:foreman",
                    "sentimentDelta": 0.12
                  }
                ]
              },
              {
                "id": "vault.fb.crit.accept_thanks",
                "label": "Accept The Thanks",
                "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                "effects": [
                  {
                    "kind": "reputation_with",
                    "targetLocationId": "$here",
                    "delta": 0.04
                  }
                ]
              }
            ]
          },
          "success": {
            "overview": "The frame came out in spring, and the vault took its own weight. The church opened a season late, with its vault whole.",
            "changes": [
              {
                "id": "vault.fb.succ.abbot_trust",
                "kind": "reputation",
                "category": "bond",
                "direction": "gain",
                "polarity": "gain",
                "title": "The Abbot's Trust",
                "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                "stateNoun": {
                  "text": "reputation with {target}",
                  "entityId": "$cast:abbot",
                  "visualKind": "agent",
                  "tooltipId": "ui.reputation_with"
                }
              },
              {
                "id": "vault.fb.succ.feast",
                "kind": "trait",
                "category": "boon",
                "direction": "gain",
                "polarity": "gain",
                "title": "A Feast Day",
                "detail": "{location} keeps a feast for the new church.",
                "stateNoun": {
                  "text": "Festival",
                  "entityId": "trait.condition.location.festival",
                  "visualKind": "attachment"
                }
              }
            ],
            "reactions": [
              {
                "id": "vault.fb.succ.credit_crew",
                "label": "Credit The Crew",
                "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                "effects": [
                  {
                    "kind": "bond_change",
                    "withAgentId": "$cast:foreman",
                    "sentimentDelta": 0.12
                  }
                ]
              },
              {
                "id": "vault.fb.succ.accept_thanks",
                "label": "Accept The Thanks",
                "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                "effects": [
                  {
                    "kind": "reputation_with",
                    "targetLocationId": "$here",
                    "delta": 0.04
                  }
                ]
              }
            ]
          },
          "success_at_cost": {
            "overview": "The church opened late in spring, once the last work on the vault was done.",
            "changes": [
              {
                "id": "vault.fb.cost.abbot_trust",
                "kind": "reputation",
                "category": "bond",
                "direction": "gain",
                "polarity": "gain",
                "title": "The Abbot's Trust",
                "detail": "{cast:abbot} trusts {actor}'s judgement of stone now.",
                "stateNoun": {
                  "text": "reputation with {target}",
                  "entityId": "$cast:abbot",
                  "visualKind": "agent",
                  "tooltipId": "ui.reputation_with"
                }
              },
              {
                "id": "vault.fb.cost.feast",
                "kind": "trait",
                "category": "boon",
                "direction": "gain",
                "polarity": "gain",
                "title": "A Feast Day",
                "detail": "{location} keeps a feast for the new church.",
                "stateNoun": {
                  "text": "Festival",
                  "entityId": "trait.condition.location.festival",
                  "visualKind": "attachment"
                }
              }
            ],
            "reactions": [
              {
                "id": "vault.fb.cost.credit_crew",
                "label": "Credit The Crew",
                "intent": "The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.",
                "effects": [
                  {
                    "kind": "bond_change",
                    "withAgentId": "$cast:foreman",
                    "sentimentDelta": 0.12
                  }
                ]
              },
              {
                "id": "vault.fb.cost.accept_thanks",
                "label": "Accept The Thanks",
                "intent": "The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.",
                "effects": [
                  {
                    "kind": "reputation_with",
                    "targetLocationId": "$here",
                    "delta": 0.04
                  }
                ]
              }
            ]
          },
          "failure": {
            "overview": "The cracked bay must come down and be built again before the church can open. The rest of the vault stands.",
            "changes": [
              {
                "id": "vault.fb.fail.town_doubt",
                "kind": "reputation",
                "category": "scar",
                "direction": "loss",
                "polarity": "loss",
                "title": "The Town's Doubt",
                "detail": "{location} no longer trusts {actor}'s word on stone.",
                "stateNoun": {
                  "text": "reputation with {target}",
                  "entityId": "$here",
                  "visualKind": "location",
                  "tooltipId": "ui.reputation_with"
                }
              },
              {
                "id": "vault.fb.fail.abbot_blame",
                "kind": "reputation",
                "category": "bond",
                "direction": "loss",
                "polarity": "loss",
                "title": "The Abbot's Blame",
                "detail": "{cast:abbot} blames {actor} for the vault.",
                "stateNoun": {
                  "text": "reputation with {target}",
                  "entityId": "$cast:abbot",
                  "visualKind": "agent",
                  "tooltipId": "ui.reputation_with"
                }
              }
            ],
            "reactions": [
              {
                "id": "vault.fb.fail.stay_rebuild",
                "label": "Stay And Rebuild",
                "intent": "The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.",
                "effects": [
                  {
                    "kind": "bond_change",
                    "withAgentId": "$cast:abbot",
                    "sentimentDelta": 0.06,
                    "trustDelta": 0.04
                  }
                ]
              },
              {
                "id": "vault.fb.fail.defend_name",
                "label": "Defend Their Name",
                "intent": "The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.",
                "effects": [
                  {
                    "kind": "reputation_with",
                    "targetLocationId": "$here",
                    "delta": 0.03
                  },
                  {
                    "kind": "bond_change",
                    "withAgentId": "$cast:abbot",
                    "sentimentDelta": -0.06
                  }
                ]
              }
            ]
          },
          "critical_failure": {
            "overview": "The frame stays under the vault, and the abbey has stopped all work on the church.",
            "changes": []
          }
        }
      }
    },
    "description": "An opt-in master's call at an abbey: test the new vault's mortar (Stone), then, by the mortal's own nerve, strike the centering before the winter rains (a Vanguard, Stone) or keep the swelling frame sound until spring (a Watcher, Stone). A vault that stands puts a Festival on the settlement and wins the abbot's trust; one that fails costs the abbot's trust and the town's faith in the master's word on stone."
  }
}
```

---

## Encounter Packet

> The revised packet, verbatim except the three systems changes marked inline (§ 9 ladder annotation, § 11 Stretch imageTag, § 13 two success_at_cost overviews and the fallback).


## 0. Binding row and mechanical design block (designed before the prose)

```
Brief row       reach stone · steps stone 0.76 → stone 0.82 (mean 0.79, window fit 0.93) ·
                shape opt-in complication · settings rural + urban · consequence hand
                relationship + place (binding, no swap) · rarityTier 2 · scale local ·
                intrinsicTier shaping · id encounter.town.cathedral_vault (final)
Rolled          plotHookRolled: hook.impossible_heist, hook.meeting_to_keep, hook.long_road
                plotHookTaken:  hook.long_road, drifted — "the road itself, weather and
                                distance, is the thing that will decide it" becomes the
                                season between now and spring: the weather decides whether
                                the vault stands. impossible_heist and meeting_to_keep set
                                aside (no theft; the opt-in shape carries no appointment).
                p3Shape opportunity · opposition time (the clock is the enemy) ·
                disposition n/a · agentRole the_target (the monks will hear them blamed) ·
                scale settlement · system movement (advisory, not taken — brief override)
Crux            The abbey's new stone vault still rests on its timber frame, and {actor}
                must take the frame out before the winter rains or keep it safe until
                spring, knowing the abbot will blame them if the vault falls.
Title           The Vault Before the Rains — the crux (a vault, a deadline of weather).
Whose problem?  The agent's: they are the master builder the abbey sent for, and the abbot
                has named them answerable for the vault. Scene-local (the summons is the
                reason they arrived; no prior graph tie asserted — prose rule 7).
Reach = theme?  Stone throughout — building and endurance. Step 0 (stone 0.76) tests
                whether the vault's mortar has set hard enough to carry the vault. The fork:
                Vanguard strikes the centering now (stone 0.82, the brief's step 2) — one
                day of nerve and even hands; Watcher keeps the frame sound all winter
                (stone 0.78) — a season of wet nights loosening swollen wedges. Both
                arms are master tests (0.72–0.85 band).
Shape           Opt-in Complication. Step 0 is taken by every mortal. Then an agent-decided
                fork on courage_prudence (positive = Vanguard strikes now; negative =
                Watcher waits for spring). The decline arm (waiting) is LEGIBLE (no strike,
                no consecration feast before winter) and CHEAPER IN WHAT IT RISKS (smaller
                bond and reputation swings, no fallen vault — a cracked bay at worst), but
                priced in the master band, because declining the strike does not make the
                rain go away (the oath-breaker-rite ruling, applied). The two step-0
                specials carry opposite pole leans; the player never picks.
Carryover       Step 0 continue_weakened. Both arms author carryoverFactorLines keyed on
                step 0 (critical_failure omitted: a step-0 critical failure ends the
                action — the debt-arbitration caveat).
Forecast sums   step 0: 0.76 + 0.06 + 0.06 = 0.88 · strike: 0.82 + 0.10 + 0.08 = 1.00 ·
                wait: 0.78 + 0.10 + 0.10 = 0.98 — every step ≤ 1.
Opposition      Time — the winter rains. No villain. The abbot is the pressure, not the
                opposition: they want the church open and have named whom to blame.
Consequence hand (binding, THR-1145): relationship + place — no swap.
  relationship  bond_change with $cast:abbot on both arms: success side + (they trust the
                master's judgement of stone), failure side − (they blame the master).
                Reactions add bond_change with $cast:foreman.
  place         apply_condition trait.condition.location.festival on $here on every
                success side of both arms: the church is consecrated and the town keeps
                a feast for it. Ends warm (brief: slot 7 ends warm on success).
Extras          reputation_with $here on failure sides (master failure is the name before
                the purse: the town stops trusting their word on stone); reactions.
Cool failure?   None killed, jailed or branded. Strike-arm critical failure: the vault falls
                into an empty nave. Wait-arm critical failure: half the vault is pulled
                down and another master is sent for. The cost is the master's name.
Trait hooks     Gate: none. Variant: Humble (trait.core.core_humility.virtue) +0.04 —
                "Being Humble, they check their own work twice." Trait-only nudge: none.
                Trait fragment: none.
Systems quota   cast (abbot, foreman) + conditions (Festival on $here) + reputation
                (reputation_with $here, bond_change) — three.
Heavy Hand      none. No card grants. No libraryCardId bound on any special.
```

## 1. Inspiration Anchors

- **hook.long_road** (vault: Archetypes/Ordeal — Pilgrimage/Journey): the road itself decides it — weather, distance, isolation. Drifted from a journey to a season: the "road" is the winter between the finished vault and spring, and the weather is the thing that decides it. It gave the encounter its opposition (time) and the Watcher arm's whole shape: endurance over a long stretch, not one clever act.
- **Archetypes/Event — The Great Building** (rolled in the single-slot draw, not the packet; read as background): a community pouring itself into a building, and the argument over who decides. It gave the abbot's pressure — the abbey wants its church before winter — without making the abbot a villain.
- **Anti-patterns avoided:** the helpful passerby (the agent is the target — named answerable); the bandit opposition (the rain is the opposition); the player-picked ending (the fork is the mortal's nerve, recorded by `courage_prudence`); repeating the stone experts' verbs (bell tower: *find what holds it / reset the cracked courses*, cards *Show The Hidden / Slow The Settling / Stir Old Pride / Press The Wall*; flood dyke: *find why it fails / dig to the culvert / close the dyke*, cards *Remember The Old Craft / Raise Hidden Water / Ease Tired Backs / Hound A Rival / Harden Wet Earth / Call A Hard Frost*). This encounter's step verbs are *test the vault*, *strike the centering*, *keep the frame sound*; its card verbs are *hasten, reveal, bind, steady, stretch, draw* — none shared with either expert's cards (the draft's *Show* collided with bell tower's *Show The Hidden*; renamed).
- Dilemma library not consulted: the fork is courage against prudence, not a moral dilemma.

## 2. Scale Justification

Medium (two beats plus a fork). A master's job is one decisive judgement and one hard execution; three beats would pad the test. Settlement scale on the dice: the outcome touches the whole town — its church opens or stays shut, and the town keeps a feast or does not.

## 3. Pressure Knot

The abbey has finished its new church's stone vault. The vault still sits on its centering — the timber frame it was built on. The winter rains come next week; wet timber swells and can crack a new vault from below. The abbot wants the church open before winter and has told the monks that the master builder answers for the vault. The clock and the blame are both running before the agent does anything.

## 4. Intervention Fantasy

The god watches a master builder make the hardest call in the trade — strike the frame now and trust the mortar, or keep a swelling frame sound for a whole winter — while an abbot waits to blame them. The god can tilt the mortal's nerve, light a fine split in the mortar, bind the stones, steady the crew, stretch the dry spells, or draw the water out of the timber. Fate still decides whether the vault stands.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | acting agent | the master builder the abbey sent for |
| `{cast:abbot}` | actor, must-persist | the abbot; reuse `monk` / `priest`, spawn `monk` "Anselm Hale". Named in step 0; bond target on both arms |
| `{cast:foreman}` | actor, must-persist | the abbey's works foreman; reuse `mason`, spawn `mason` "Wat Durran". Named on both arms; reaction bond target |
| `{location}` / `$here` | settlement | carries the Festival condition on success |
| `trait.condition.location.festival` | location condition (live) | "Festival" — the consecration feast |
| reputation with `$here` | standing channel (live) | failure sides |
| the vault, the centering, the wedges, the mortar | scene-local | never chipped |

## 6. Beat Structure

1. **Step 0 — Test the vault** (stone 0.76, `continue_weakened`). Is the mortar hard enough to carry the vault without its frame?
2. **Step 1 — fork on `courage_prudence`:**
   - **positive (Vanguard) — Strike the centering** (stone 0.82, `fail_action`): the crew knocks the wedges out evenly and the vault takes its own weight in one day.
   - **negative (Watcher) — Keep the frame sound** (stone 0.78, `fail_action`): the frame stays in all winter; after every wet night the swelling wedges are loosened before they crack the vault.
   - **fallback** = the Watcher arm.

## 7. Branching Profile

- Branch depth: `light` · Branch count: `2`
- Where branching lives: step 1 (test, prose, hand), outcome ladder, aftermath.
- Convergence: none — each arm ends its own way; both end warm on success (Festival + the abbot's trust).
- Shape: Opt-in Complication (catalog) with an agent-decided Personality Fork on `courage_prudence`.

## 8. Branching Map

- **Step 0 result → step 1:** carryover lines on each arm (the mortar known set / doubted).
- **Vanguard:** strike now. Success: the church opens before winter, feast, the abbot's trust. Failure: the vault cracks (or falls), the abbot blames them, the town stops trusting their word on stone.
- **Watcher:** wait. Success: the vault comes through winter, struck in spring, feast, the abbot's trust. Failure: the frame cracks a bay of the vault (or half of it), the abbot blames them, smaller swings.

## 9. Outcome Ladder

| Band | Vanguard (strike now) | Watcher (wait for spring) |
|---|---|---|
| critical_success | the frame out in a day, not a crack; church open before the first rain; feast; abbot's trust | no crack all winter; frame out in a day in spring; feast; abbot's trust |
| success | vault takes its own weight; church open before winter; feast; abbot's trust | vault whole through winter; frame out in spring; feast; abbot's trust |
| success_at_cost | (when step 1 was at cost) one fine crack along the crown; in every case the last dry days go on the vault and the church opens late, in the first rain | (when step 1 was at cost) a course over the door cracked in a swell; in every case the church opens late in spring |
| failure | vault cracks as the frame comes down; wedges driven back; church shut till spring; abbot blames them; town's trust lost | one wet week the frame cracks a bay from below; the bay must be rebuilt; abbot blames them; town's trust lost (smaller) |
| critical_failure | the vault falls into the empty nave; abbot blames them | a midwinter swell splits the vault along its crown; half comes down; abbot sends for another master |

Master failure is the name before the purse: a builder sent for by name is only as good as the last vault they struck.

## 10. Sample Opening (narrator mode)

**Opening — rural:**
> {actor} arrives at the abbey outside {location}, sent for as master builder.

**Opening — urban:**
> {actor} arrives at the abbey in {location}, sent for as master builder.

**Step 0 spine (setting-neutral):**
> The abbey has finished its new church's stone vault. It still rests on its centering, the timber frame beneath it. The winter rains come next week. Wet timber swells and can crack the vault.
>
> Abbot {cast:abbot} wants the frame out and the church open by winter. The abbot has told the monks {actor} answers for the vault. First {actor} must test the mortar.

Word count: P1 12 + P2 34 + P3 29 = 75 (76 with "Anselm Hale" expanded).

## 11. The Hand Per Step

### Step 0 — Test the vault (stone 0.76) · deal `{ count: 4, tags: ['craft', 'insight'] }`

| id | Name | Type | Sphere | Ess | Δ | Lean |
|---|---|---|---|---|---|---|
| `vault.hurry_the_season` | Hasten The Strike | Whisper | time | 1 | 0.06 | courage_prudence → positive |
| `vault.show_the_hairline` | Reveal The Hairline Crack | Omen | light | 1 | 0.06 | courage_prudence → negative |

- **Hasten The Strike** — *Put the coming rain first in their thoughts. They lean toward taking the frame out this week.* · imageTag `generic.memory`
  - success: The coming rain kept them at the work, and they tested every course before dark.
  - success_at_cost: The coming rain hurried them, and they had to test the first courses again.
  - near_miss: The coming rain hurried them past the courses over the west door.
  - failure: The coming rain rushed the test, and they trusted courses they never checked.
- **Reveal The Hairline Crack** — *Throw lamplight across a fine split in the mortar. They lean toward leaving the frame in until spring.* · imageTag `generic.light`
  - critical_success: The lamplight found the fine split, and they traced it to a single course.
  - success: The lamplight showed them one fine split, and they knew the rest of the mortar held.
  - failure: The lamplight showed them a fine split, and they doubted every course after it.
  - critical_failure: The lamplight showed them one split, and they took it for the only one.

### Step 1, positive — Strike the centering (stone 0.82) · deal `{ count: 4, tags: ['craft', 'peril'] }`

| id | Name | Type | Sphere | Ess | Δ |
|---|---|---|---|---|---|
| `vault.bind_the_courses` | Bind The Courses | Signature | matter | 2 | 0.10 |
| `vault.pace_the_crew` | Steady The Crew | Signature | order | 2 | 0.08 |

Specials sum 0.18; 0.82 + 0.18 = 1.00 (machine-gate ceiling).

- **Bind The Courses** — *Make the mortar grip each stone as the timber comes away. The vault settles as one piece.* · imageTag `generic.matter`
  - critical_success: The mortar gripped every stone, and the vault settled without a sound.
  - success: The mortar held each stone in place as the frame came away.
  - near_miss: The mortar held, but one stone settled ahead of the rest.
  - failure: The mortar gripped too late, and a stone slipped as the frame came away.
  - critical_failure: The mortar gripped each stone, and the vault still fell as one piece.
- **Steady The Crew** — *Set every hand at the wedges to one count. No side of the vault drops before the others.* · imageTag `generic.oath`
  - success: Every wedge came out on the same count, and the vault dropped evenly.
  - success_at_cost: The crew kept the count, but slowly, and the work ran on past dark.
  - failure: One gang lost the count, and the west side dropped first.
  - critical_failure: The crew kept the count until the last wedges, then broke it.

### Step 1, negative — Keep the frame sound (stone 0.78) · deal `{ count: 4, tags: ['labor', 'craft'] }`

| id | Name | Type | Sphere | Ess | Δ |
|---|---|---|---|---|---|
| `vault.stretch_the_dry_spells` | Stretch The Dry Spells | Signature | time | 2 | 0.10 |
| `vault.wring_the_timber` | Draw The Water Out | Signature | force | 2 | 0.10 |

- **Stretch The Dry Spells** — *Lengthen the gaps between storms. The timber has more nights to shed its water.* · imageTag `generic.time-slow` *(systems: was `generic.warmth`, a Life plate)*
  - critical_success: The storms came far apart all winter, and the frame never swelled.
  - success: The storms came far apart, and the frame gave back its water between them.
  - near_miss: The storms came far apart until the new year, then came night after night.
  - failure: The gaps between storms closed in the new year, and the frame swelled.
- **Draw The Water Out** — *Squeeze the frame dry between storms. The wedges stay loose through the wet nights.* · imageTag `generic.strength`
  - success: The frame shed its water, and the wedges stayed loose.
  - success_at_cost: The frame shed its water, but only after a night of swelling.
  - failure: The frame held its water, and the wedges bound tight.
  - critical_failure: The frame held its water through the worst storm, and the wedges would not move.

The fallback arm is the negative arm verbatim.

Hand checks: specials per step 2 (cap 2), fill 4 → composed 6. No rider anywhere. Sphere spread from specials alone: step 0 time/light, strike matter/order, wait time/force; the dealer adds breadth. No card grants content. No card is free. Every card name opens with an `IMPERATIVE_VERB_LEXICON` verb (hasten, reveal, bind, steady, stretch, draw); no effect line repeats a word from its card's name. Card ids are unchanged from the draft (renamed faces only).

## 12. Branch-Dependent Later Paragraphs

**Vanguard — Strike the centering (step 1 narrativeTemplate):**
> {actor} orders the centering struck. Foreman {cast:foreman} puts a mason at every wedge under the frame. The wedges must come out together, a little at a time, so the vault takes its weight evenly. If one side drops first, the vault will split and fall into the nave. The monks watch from the door.

**Watcher — Keep the frame sound (step 1 narrativeTemplate):**
> {actor} tells the monks the frame stays in until spring. The abbot calls it cowardice. All winter the rain will soak the frame and push it up against the new stone. {actor} and Foreman {cast:foreman} must loosen the wedges after every wet night, or the frame will break the vault.

### Step-1 afterimages

Vanguard:
- critical_success: They struck the frame in one day, and the vault never moved.
- success: They struck the frame, and the vault took its own weight.
- success_at_cost: They struck the frame, and the vault settled with a fine crack along its crown.
- failure: The vault cracked along its crown, and they drove the wedges back in to hold it.
- critical_failure: The vault fell into the nave.

Watcher:
- critical_success: They kept the frame sound, and the vault never cracked.
- success: They kept the frame sound until spring.
- success_at_cost: They kept the frame sound, except for one swell that cracked a course over the door.
- failure: One wet week they fell behind, and a bay of the vault cracked from below.
- critical_failure: In midwinter the frame split the vault along its crown.

Step 0:
- critical_success: They tested every course of the vault and found the mortar set through.
- success: They found the mortar set hard enough to carry the vault.
- success_at_cost: They found the mortar set, but the test took most of the dry week.
- failure: They could not tell whether the mortar had set.
- critical_failure: They judged the mortar set when it was still soft.

### Carryover factor lines

Vanguard (keyed on step 0):
- critical_success · for · +0.06 — They know the mortar has set through.
- success · for · +0.04 — They know the mortar will carry the vault.
- success_at_cost · against · −0.02 — Most of the dry week is already gone.
- near_miss · for · +0.02 — They know most of the mortar has set.
- failure · against · −0.03 — They do not know whether the mortar has set.

Watcher (keyed on step 0):
- critical_success · for · +0.05 — They know which courses can bear a swelling frame.
- success · for · +0.03 — They know the mortar will hold through a wet season.
- success_at_cost · against · −0.02 — The rain reached the frame before the work began.
- near_miss · for · +0.02 — They know most of the courses will hold.
- failure · against · −0.03 — They do not know which courses will give first.

## 13. Aftermath Paragraphs (overviews, by arm and band)

Each overview starts where the step-1 afterimage stops. The abbot's trust and blame live only in the BOND chips; the overviews carry the church, the town, and what comes next.

**Vanguard** (variant overview: "{actor} struck the centering before the rains.")
- critical_success: The church opened to {location} before the first rain, and the monks held their first service under the new vault that week.
- success: The church opened before winter, as {cast:abbot} wanted, and the vault needed no repair.
- success_at_cost: The last dry days went on the vault, and the church opened late, in the first rain. *(systems fix: aggregation — the band also shows when step 1 was clean)*
- failure: The church stays shut until spring, and the cracked vault must be repaired before it opens. A builder sent for by name is only as good as the last vault they struck.
- critical_failure: No one was hurt. The abbey must clear the broken stone and build its vault again.

**Watcher** (variant overview: "{actor} kept the centering in until spring.")
- critical_success: In spring the frame came out in a day, and the church opened with the first fine weather.
- success: The frame came out in spring, and the vault took its own weight. The church opened a season late, with its vault whole.
- success_at_cost: The church opened late in spring, once the last work on the vault was done. *(systems fix: aggregation — the band also shows when step 1 was clean)*
- failure: The cracked bay must come down and be built again before the church can open. The rest of the vault stands.
- critical_failure: Half the vault had to come down. {cast:abbot} has sent for another master to build it again.

**Fallback** *(systems revision)* — overview "{actor} tested the vault for the abbey."; critical_success / success / success_at_cost / failure bands carry the Watcher overviews, chips and reactions (the fallback-step path); critical_failure is the step-0 terminal path: "The frame stays under the vault, and the abbey has stopped all work on the church." with no chips and no reactions (no write fires on it).

## 14. Aftermath Reaction Choices

Success side (critical_success, success, success_at_cost) on both arms — who gets the credit:
- **Credit The Crew** — *The mortal tells the monks the vault stands because of the crew's work. {cast:foreman} remembers it.* · `bond_change` `$cast:foreman` sentiment +0.12.
- **Accept The Thanks** — *The mortal takes the town's thanks in person. The town thinks better of the master who opened its church.* · `reputation_with` `$here` +0.04.

Failure side (failure, critical_failure) on both arms — how to carry the blame:
- **Stay And Rebuild** — *The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.* · `bond_change` `$cast:abbot` sentiment +0.06, trust +0.04.
- **Defend Their Name** — *The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.* · `reputation_with` `$here` +0.03, `bond_change` `$cast:abbot` sentiment −0.06.

Each pair is a stance: share the credit vs. keep the name; repair the bond vs. defend the name. Both failure intents are true on both arms (no reference to haste or to waiting).

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path order) | Backing write |
|---|---|---|
| success sides, both arms | BOND · reputation with {target} (`$cast:abbot`, gain) — "{cast:abbot} trusts {actor}'s judgement of stone now." · BOON · Festival (`trait.condition.location.festival`) — "{location} keeps a feast for the new church." | successMetadata: `bond_change` abbot +0.12/+0.10 (Vanguard) +0.10/+0.08 (Watcher); `apply_condition` festival on `$here`, intensity 0.5, 36 ticks |
| failure sides, Vanguard | SCAR · reputation with {target} (`$here`, loss) — "{location} no longer trusts {actor}'s word on stone." · BOND · reputation with {target} (`$cast:abbot`, loss) — "{cast:abbot} blames {actor} for the vault." | failureMetadata: `reputation_with $here` −0.08; `bond_change` abbot −0.12/−0.12 |
| failure sides, Watcher | same two chips | failureMetadata: `reputation_with $here` −0.05; `bond_change` abbot −0.08/−0.08 |

Engine note: step effects fire per success side (critical_success, success, success_at_cost, near_miss) vs failure side (failure, critical_failure), so every success-side band shares the success chips and every failure-side band shares the failure chips; bands differ in overview prose only. Chip captions are single sentences (no causeClause), 7–8 words each.

What the world remembers: a feast in the town for the new church; an abbot who trusts or blames the builder; a town that trusts or doubts their word on stone.

### Page read (assembled, Vanguard failure)

```
The church stays shut until spring, and the cracked vault must be repaired before it opens. A builder sent for by name is only as good as the last vault they struck.
- SCAR · reputation with {target} — {location} no longer trusts {actor}'s word on stone.
- BOND · reputation with {target} — {cast:abbot} blames {actor} for the vault.
> Stay And Rebuild — The mortal offers to rebuild what failed. {cast:abbot} thinks a little better of them.
> Defend Their Name — The mortal tells the town the winter rains broke the vault. The town hears them out; {cast:abbot} does not forgive it.
```

All ten band pages (5 × 2 arms) read clean as one text: no fact told twice, no block contradicting another.

## 16. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| abbot (`$cast:abbot`) | lazy-materialize-on-trigger | reuse `monk`/`priest`, spawn `monk` | must-persist | bond_change targets | live |
| foreman (`$cast:foreman`) | lazy-materialize-on-trigger | reuse `mason`, spawn `mason` | must-persist | reaction bond target | live |
| Festival on `$here` | lazy (aftermath write) | `trait.condition.location.festival` | must-persist (36 ticks) | location page, pool | live |
| reputation with `$here` | aftermath write | `reputation_with` | must-persist | standing | live |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Brief row: id, reach, steps, settings, rarity, tier, scale | PASS | stone 0.76 → stone 0.82 on the Vanguard arm; Watcher arm 0.78, inside 0.72–0.85 |
| Opening per declared class | PASS | rural, urban |
| Opening + step-0 spine ≤80 words | PASS | 75 (76 with the abbot's name expanded) — editorial rewrite |
| Hands: 0–2 specials + deal on every nudge-bearing step | PASS | 2 + 4 each |
| Forecast arithmetic ≤ 1 per step | PASS | 0.88 / 1.00 / 0.98 |
| ≥1 failure fragment per card | PASS | |
| Cards: lexicon verb + noun, no name word in effect line, no digits | PASS | hasten, reveal, bind, steady, stretch, draw |
| Consequence hand wired | PASS | relationship (bond_change abbot), place (Festival on $here) |
| Every chip backed by a write on its band | PASS | step metadata per side |
| Systems ≥3 | PASS | cast, conditions, reputation |
| No apply_condition on $actor | PASS | |
| Over-exposed cards | PASS | none used as specials |
| Prose rule 7 / 7b | PASS | no agent history; no later promises without an effect ("has sent for another master" is past, scene-local); "at their own cost" cut |
| Gendered cast wording | PASS | "a mason at every wedge"; no pronoun for any cast member |
| Cool failure | PASS | no one killed, jailed or branded |

### Narrator's 12 questions

1. P1 arrival with graph names — {actor}, {location}, the abbey, and why they came (sent for as master builder). Yes.
2. P2 events with costs — the vault finished, the frame still in, the rains next week, the risk stated.
3. P3 one stake — Opportunity (open the church by winter, at the risk of the vault), with the agent as target ("answers for the vault").
4. ≤80 words — 75.
5. Read aloud as report — yes.
6. Facts stated, not encoded — the swelling-timber danger and the blame are stated.
7. Every sentence works — yes.
8. Nothing unintroduced — abbot, centering, mortar, wedges, foreman introduced before cards or chips use them.
9. One named person per beat — step 0 abbot; Vanguard foreman; Watcher foreman (the abbot role-voiced, unnamed).
10. Stake in a sentence — "Take the frame out before the rains and open the church, or keep it safe all winter, and answer to the abbot either way."
11. Cards verb+noun — yes, all six on the lexicon.
12. Opening per class — rural, urban.

## 18. Concept Art Direction

1. *Emotions:* responsibility carried alone; patience against weather; the held breath before a structure takes its own weight.
2. *Evocative image:* a single wooden wedge lying on wet flagstones under a pale stone arch, rain-dark timber stacked by a door, a mason's mallet left on a sill. No people. Residue of the decision, not the strike itself.

(No concept art is generated in this batch — runbook rule; the direction is recorded for later.)

## 19. Experience Differentiator Gate

1. YES · 2. YES · 3. YES (rain, mortar, frame, wedges, crew, timber all in prose) · 4. YES · 4b. YES (seams re-read after the editorial rewrite) · 5. YES · 6. YES (essence on every card) · 7. YES · 8. YES · 9. YES (nerve vs caution lean; light vs time; bind stones vs steady hands; weather vs timber) · 9b. YES · 10. YES · 11. YES · 11b. YES (overviews tell the event; chips own the abbot and the town) · 12. YES · 13. YES · 14. YES

## Branch Seduction Self-Check

- **Vanguard:** a mortal of courage trusts their test and their crew, and wants the church open before winter. The god watches one day of even hands and stone taking its weight. Protects the town's winter in its church.
- **Watcher:** a prudent mortal will not bet a vault on one week of dry weather, and takes a winter of wet nights instead — and is called a coward for it. The god watches a long endurance against the rain. Protects the vault itself.
- Without labels: one day of nerve versus a season of patience. Distinct.
