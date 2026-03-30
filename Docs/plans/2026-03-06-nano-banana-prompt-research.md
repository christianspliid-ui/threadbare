# Nano Banana 2 — Prompt Research & Assessment

## Date: 2026-03-06

## Research Sources

- [Google Developers Blog: How to prompt Gemini 2.5 Flash for best results](https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/)
- [Google Blog: Nano Banana Pro prompt tips](https://blog.google/products/gemini/prompting-tips-nano-banana-pro/)
- [Google DeepMind: Nano Banana prompt guide](https://deepmind.google/models/gemini-image/prompt-guide/)
- [Google Cloud: Imagen prompt and image attribute guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)
- [DeepDreamGenerator: Nano Banana 2 best prompts](https://deepdreamgenerator.com/blog/nano-banana-2-best-prompts)
- [AIFreeAPI: Nano Banana 2 Lighting Guide](https://www.aifreeapi.com/en/posts/nano-banana-2-lighting-guide)
- [GitHub: awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro)
- [Reddit: r/promptingmagic — Ultimate Guide to Nano Banana 2](https://www.reddit.com/r/promptingmagic/comments/1rjt2r9/the_ultimate_guide_to_nano_banana_2_how_to/)

*(Note: Egress proxy blocked direct access to most sources. Findings synthesized from search result summaries.)*

---

## Key Findings

### 1. Narrative Over Keywords

**Finding:** "Keyword stacking (like '4k, high detail, masterpiece') is dead. Nano Banana 2 understands natural language. Write like you are telling a story."

**Our current approach:** Mixed. Our prompts are partly narrative ("A ruined stone temple overtaken by wild growth") but then shift to keyword-like stacking ("Painterly brushstrokes, atmospheric depth, dramatic chiaroscuro"). The magic descriptions are nicely narrative ("branching like mycelium and root networks, Fibonacci spirals curling from capillary nodes").

**Assessment:** ✅ Partially good — the subject and magic descriptions are already narrative. But the style/lighting/exclusion sections are still keyword-stacked. We should weave them into flowing descriptions.

### 2. Prompt Structure Order

**Finding:** Elements should be ordered by importance — earlier details have more influence on output:
1. Subject (who/what)
2. Action & relationships
3. Setting (place, time, weather)
4. Style & medium
5. Composition & camera (angle, lens, depth of field)
6. Lighting & color

**Our current approach:** We lead with subject (good), then immediately jump to "Dark fantasy oil painting style" (medium), then world tone, then magic, then lighting, then style anchors, then exclusions.

**Assessment:** ⚠️ Needs adjustment. Our order puts style before setting/composition. We should describe the scene more fully before mentioning the medium. Also missing: camera angle, depth of field, lens language — we have "perspective" in STYLE.md but don't embed it into prompt templates.

### 3. Lighting Is First-Class

**Finding:** NB2 "understands the physics of light." It can handle: light direction, intensity, color temperature, shadow behavior. Start with established lighting patterns (Rembrandt, three-point, rim lighting), then modify. The model's training data heavily features classic patterns.

**Our current approach:** We say "magic provides the primary illumination, deep chiaroscuro, no bright daylight" — this is vague. We don't specify direction, temperature, or established patterns.

**Assessment:** ❌ Needs significant improvement. We should use professional lighting vocabulary:
- "Rembrandt lighting from upper-left, warm amber key"
- "Cool rim light from behind, deep shadow fill"
- "Chiaroscuro with magic threads as the only light source, 2700K warm glow on adjacent stone"
- Specify shadow behavior: "deep hard shadows, soft penumbra around thread glow"

### 4. Camera/Composition Language

**Finding:** "Name real hardware and the model locks onto a precise aesthetic" — real camera names, lens focal lengths, film stocks. Also: "close/medium/wide shot, angle, lens, depth of field."

**Our current approach:** STYLE.md says "God's-eye view for world scenes, epic wide shot for cosmic, mid-distance for characters" — but our prompt templates don't include camera language. No focal lengths, no depth of field, no camera references.

**Assessment:** ❌ Missing entirely from templates. We should add for each content type:
- **Hex tiles:** "Satellite aerial photograph, 200mm telephoto lens, flat perspective, no depth of field"
- **Locations:** "35mm wide angle, establishing shot, shallow depth of field on foreground structure"
- **Actors (game):** "85mm portrait lens, f/2.8, subject isolated against dark background"
- **Actors (lore):** "50mm medium shot, environmental portrait, subject in context"
- **Events:** "28mm dramatic wide angle, forced perspective, deep depth of field"

### 5. Style References Are Powerful

**Finding:** "References like 'Wes Anderson color palette,' 'National Geographic editorial,' or 'Blade Runner 2049 lighting' are immensely powerful. Each activates a rich web of visual associations."

**Our current approach:** STYLE.md lists reference games (Diablo 3, Elden Ring, Path of Exile, Endless Legend, WoW), mentions Marc Simonetti, and says "painterly oil painting." The templates include "Diablo-like magic glow, Elden Ring dark grandeur."

**Assessment:** ✅ Good — we already use named references. But we could be more specific per content type. Different references work better for different subjects:
- **Locations:** "Marc Simonetti matte painting, Craig Mullins environmental concept"
- **Actors:** "Frank Frazetta figure composition, Brom character painting"
- **Artifacts:** "Diablo 3 item rendering, Greg Rutkowski object study"
- **Events/Doom:** "Wayne Barlowe hellscape composition, Zdzisław Beksiński surreal architecture"

### 6. Negative Prompting Strategy

**Finding:** Two camps: (a) "Place core request and critical restrictions as the final line" (Google official guidance); (b) "Describe what you want positively rather than listing 'no X'" (some community guides). Also: avoid instructive "no" language, instead describe the desired scene fully.

**Our current approach:** We end every prompt with a block of "No X, no Y, no Z" exclusions. This is the older keyword-stacking approach.

**Assessment:** ⚠️ Could be improved. Instead of "No bright daylight, no pastel colors," describe the desired state: "The scene exists in perpetual deep twilight, all colors desaturated except the magic itself." But some exclusions are genuinely useful for preventing common failures ("no text, no UI elements"). Hybrid approach recommended: describe what you want positively, but keep a few critical "no" exclusions at the very end.

### 7. Conversational Editing

**Finding:** "If an image is 80% correct, do not generate from scratch. Ask for the specific change."

**Our current approach:** We always generate from scratch. Our image-generation skill doesn't mention iterative refinement.

**Assessment:** ❌ Missing from workflow. We should add to the skill: "If a generated image is close but not right, use conversational follow-up to refine rather than re-generating with a completely new prompt."

### 8. Material Specificity

**Finding:** NB2's quality "hinges on three levers: camera language, lighting direction, and material specificity." Describing specific materials improves output.

**Our current approach:** STYLE.md has narrative vocabulary tags per location (e.g., "rough basalt, cold iron, cracked mortar, worn leather, polished steel" for Ardenmor Keep), but these aren't embedded into the prompt templates.

**Assessment:** ⚠️ Data exists but isn't used. Our prompt templates should pull material tags from the asset package's narrative vocabulary and weave them into the subject description: "A fortress of rough basalt and cold iron, cracked mortar between weathered grey blocks..."

---

## Specific Prompt Template Improvements

### Current Template (STYLE.md)
```
[Subject description]. Dark fantasy oil painting style.
Ancient weathered world in deep shadow and charcoal tones, 85-95% of the image is dark.
Thin luminous [sphere color] [sphere form language] magic threads break through...
Painterly brushstrokes, atmospheric depth, dramatic chiaroscuro.
No ambient magic glow, no diffuse color wash...
No UI elements, no text, no modern elements...
```

### Proposed Improved Template
```
[Subject as a narrative scene — 2-3 sentences describing what we see, weaving in
material textures from the asset package's vocabulary tags].

[Camera/composition — specify shot type, angle, lens equivalent, depth of field].

[Lighting — name an established pattern, specify direction, color temperature,
and shadow behavior. Magic threads are the primary light source].

[Magic specification — sphere color, form language, behavior, coverage percentage.
Only include if this content type allows baked magic].

Rendered as a dark fantasy oil painting in the style of [content-type-specific
artist references] — visible brushstrokes, textural impasto, atmospheric depth.
The world exists in perpetual deep twilight; all environmental colors sit in the
10-40% brightness range. Only magic breaks above 70% brightness.

[2-3 critical exclusions as a final line — only the most failure-prone issues].
```

### Example: Ardenmor Keep — Location Concept Art (Improved)

**Before (current style):**
```
Massive dark basalt fortress on a hill, weathered and battle-scarred,
multiple curtain walls and a central tower. Dark fantasy oil painting style.
Ancient weathered world in deep shadow and charcoal tones, 85-95% dark.
Faint crimson Force threads in the stone like veins.
Painterly brushstrokes, atmospheric depth, dramatic chiaroscuro.
No UI elements, no text, no modern elements, no cartoon style.
```

**After (improved):**
```
A scarred fortress of rough basalt and cold iron broods on a barren hilltop,
its twelve-foot walls cracked and rebuilt across centuries of siege. Multiple
curtain walls descend the slope in concentric rings, their crenellations
broken and patched. A squat central tower rises above, its arrow slits dark.
Cracked mortar lines run between weathered grey blocks. No magic visible —
this is the structure stripped of all supernatural elements, pure architecture
against a stormy twilight sky.

Mid-distance establishing shot, 35mm wide angle equivalent, the fortress
fills the center frame with storm clouds massing behind. Shallow depth of
field softens the foreground terrain.

Rembrandt lighting from upper-left — a single break in the cloud cover casts
warm amber across the western wall while the eastern face falls into deep
blue-grey shadow. Torchlight flickers in two arrow slits, casting narrow
warm pools on stone.

Dark fantasy oil painting in the style of Marc Simonetti and Craig Mullins —
visible brushstrokes, textural impasto on the stonework, atmospheric depth
through haze and distance. The world exists in perpetual deep twilight;
environmental colors sit at 10-40% brightness. No magic, no glowing elements.

No text, no UI, no modern elements.
```

---

## Summary of Changes Needed

| Area | Current State | Recommended Change | Priority |
|------|--------------|-------------------|----------|
| **Narrative flow** | Mixed keyword/narrative | Full narrative descriptions throughout | High |
| **Camera language** | Missing from templates | Add shot type, angle, lens, DoF per content type | High |
| **Lighting specificity** | Generic "chiaroscuro" | Named patterns, direction, color temp, shadow behavior | High |
| **Material textures** | In vocab tags, not in prompts | Weave vocabulary tags into subject description | Medium |
| **Artist references** | Generic game references | Content-type-specific artist names | Medium |
| **Negative prompting** | Long "no X" block | Positive descriptions + 1-2 critical exclusions only | Medium |
| **Iterative refinement** | Not in workflow | Add to skill: refine with follow-up, not re-generate | Low |
| **Element ordering** | Style before setting | Subject → Setting → Camera → Lighting → Style → Exclusions | Medium |

---

## Content-Type Camera & Lighting Defaults

These should be added to STYLE.md as defaults per content type:

| Content Type | Camera | Lighting | Artist References |
|-------------|--------|----------|-------------------|
| **Hex terrain** | Directly above, satellite aerial, flat perspective, no DoF | Dim overcast, flat even lighting, subtle shadow | Atlas of Mystara, satellite imagery |
| **Location (establishing)** | 35mm wide, mid-distance, slight low angle | Rembrandt or dramatic side-light, torchlight accents, deep shadow | Marc Simonetti, Craig Mullins |
| **Actor (game asset)** | 85mm portrait, f/2.8, isolated subject | Rim light from behind, warm fill from below-left, dark background | Frank Frazetta, Brom, Adrian Smith |
| **Actor (lore art)** | 50mm medium, environmental portrait | Scene-dependent, dramatic chiaroscuro, magic as key light if sphere-aligned | Malazan covers, Simonetti figures |
| **Artifact (game asset)** | Macro/close-up, slight overhead angle, isolated | Single directional light, soft shadow, dark background | Diablo 3 item art, D&D sourcebook objects |
| **Artifact (lore art)** | 35mm medium, object in environment | Atmospheric, object as focal point with environmental context | Greg Rutkowski, Donato Giancola |
| **Faction (heraldry)** | Flat/orthographic, straight-on, no perspective distortion | Even soft lighting, aged parchment/cloth texture | Medieval heraldry, Dark Souls covenant icons |
| **Event (general)** | 28mm dramatic wide, dynamic angle | Scene-dependent, dramatic, high contrast | MTG card art, Diablo cinematics |
| **Event (doom)** | Ultra-wide panoramic, cosmic scale | Apocalyptic, magic as primary illumination, extreme contrast | Wayne Barlowe, Beksiński, MTG Eldrazi art |
