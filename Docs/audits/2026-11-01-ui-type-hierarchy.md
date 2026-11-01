> **title:** Type hierarchy — one size ladder per panel, hierarchy by weight and colour before size — THR-2118
> **linear_issue:** THR-2118
> **author:** Claude Code (design lane, wayfinder prototype ticket on the THR-2114 legibility map, 2026-11-01, unattended — decided by delegation, process.md rule 4; human gate released via Discord 2026-11-01, "Let the design lane do the work"; veto in chat)
> **created:** 2026-11-01

# Type hierarchy — THR-2118

*Can a player tell title, heading, value and label apart at a glance? Today, on the Inspector, not reliably: a person page draws on eight sizes, two of them below the 16 px floor. Decision: **keep the six-step scale, and give each panel a ladder of roles that skips a step wherever two sizes would sit next to each other.** Weight and colour do the rest. One heading treatment per panel: the label rule plus its carved icon plus space above.*

Inputs: [census](2026-11-01-ui-legibility-census.md) (THR-2115, measured), [reading-patterns rulebook](2026-11-01-ui-reading-patterns-research.md) (THR-2116, cited as "rule N"), [panel anatomy](2026-11-01-ui-panel-anatomy.md) (THR-2117), [text positions](2026-11-01-ui-text-positions.md) (THR-2119), `Docs/design-system/typography.md`, art-led rules R1–R8 (`Docs/plans/2026-10-31-art-led-ui-pass.md`), Laws 13, 31, 57. Settled and not reopened: the three faces, the label rule (Alegreya Sans 700, sentence case, tertiary, 16 px), Cinzel only at 22 px and up, the 16 px floor, words not numerals.

## 1. The prototype

[`mock.html`](2026-11-01-ui-type-hierarchy/mock.html) is static HTML, not game code. It draws the god rail and a docked person Inspector page (the census's own Kael Thornweaver content), using the real font files and colour tokens. There are four variants (`?v=`), each at both viewports (`?vp=1920|2560`; 2560 sets the 18 px root, as `index.css` does):

| Variant | What changes from today |
|---|---|
| **Today** | The census's measured sizes: body 0.9rem, chips 0.75rem, R5 headline `--text-xl`, three section-heading treatments (gold with a rule, tertiary, secondary) |
| **A · snap** | Off-scale sizes snap to the nearest token (body → `--text-sm`, chips → `--text-xs`); nothing else |
| **B · the ladder** | A, plus one heading treatment (label rule + icon, 26 px above / 8 px below), the R5 headline at `--text-lg`, essence quantities at `--text-sm` |
| **C · carved headings** | B, but section headings in Cinzel at `--text-lg` (the scale's documented "section headings" step) |

Captured with headless Chrome (the `scripts/ux-review/capture.mjs` runtime). Sizes are counted from the computed `font-size` of every element with its own text, and characters per line are measured on the first body paragraph:

| 1920×1080 | Rail sizes (px × elements) | Inspector sizes | Body chars/line |
|---|---|---|---|
| Today | 22×1 16×41 | 32, 26, 22, 20, 18, 16, **14.4, 12** (8) | 93 |
| A · snap | 22×1 16×41 | 32, 26, 22, 20, 18, 16 (6) | 78 |
| **B · ladder** | **22×1 18×8 16×33 (3)** | **32, 22, 20, 18, 16 (5: title, headline, story, text, label)** | 78 |
| C · carved | 22, 18, 16 (3) | 32, 26, 22×5, 20, 18, 16 (6) | 78 |

At 2560×1440 every rem size scales ×1.125 and the counts are the same. The docked page is 717 px wide there, and body text capped at `--measure-prose` (34em) runs **91 characters per line** in all three fixed variants (see § 3.4).

Screens: [Inspector, four variants side by side](2026-11-01-ui-type-hierarchy/cmp-inspector-1920.jpg) · [god rail, four variants](2026-11-01-ui-type-hierarchy/cmp-rail-1920.jpg) · [blur test, today / B / C](2026-11-01-ui-type-hierarchy/blur.jpg) · full frames [today 1920](2026-11-01-ui-type-hierarchy/1920-today.jpg), [B 1920](2026-11-01-ui-type-hierarchy/1920-ladder.jpg), [C 1920](2026-11-01-ui-type-hierarchy/1920-cinzel.jpg), [A 1920](2026-11-01-ui-type-hierarchy/1920-snap.jpg), [today 2560](2026-11-01-ui-type-hierarchy/2560-today.jpg), [B 2560](2026-11-01-ui-type-hierarchy/2560-ladder.jpg).

## 2. The judgement

- **Today fails on its own terms.** Body copy (14.4 px) and chips (12 px) sit below the 16 px floor, and eight sizes is far past rule 11. They come from literals in `src/components/shared/Section.tsx`: `fontSize: … '0.9rem'` (line 142, prose body; line 621), `'0.75rem'` (line 209, `ChipPill`), `'0.8rem'` / `'0.85rem'` (lines 319, 351, 376, 643). They are not a scale problem.
- **A fixes the floor but not the hierarchy.** The page still mixes three heading treatments (fails anatomy § 3: two ranks, one treatment). The R5 headline at 26 px sits one step under the 32 px title (ratio 1.23) and reads as a second title.
- **C has the strongest headings and fails the blur test (rule 14).** In the [blurred crop](2026-11-01-ui-type-hierarchy/blur.jpg), five carved section headings weigh as much as the subject's name. The Who line stops being the strongest shape, and the headings compete with the Now headline in the same face. It also uses 6 sizes (rule 11) and puts carved capitals on a working heading rank, which THR-1833 kept for names and titles.
- **B passes.** The name is the strongest shape under blur. Sections group by space, because the gap above a heading is 3× the gap below it (rule 8). Every pair of sizes used together is at least ~1.2× apart (32/22, 22/18), except text/label (18/16), which also differs in weight and colour (rule 12, rule 13). Its one cost: a section heading is smaller than the body text it heads. The carved icon (R2) and the space above carry it. The five comparison games use the same shallow, weight-led hierarchy (rulebook § Game practice).

## 3. Decision

### 3.1 The ladder: five roles, each with one size per panel kind

| Role | Face, weight, colour | Inspector page | Dialog · Stage | Rail · list · hover |
|---|---|---|---|---|
| **Title** (the Who line) | Cinzel 400–600, primary | `--text-2xl` (32), **at every Inspector size**. The wide page's off-scale 2.5rem retires | `--text-xl` (26) | `--text-lg` (22). A row name in a list is **Text 700**, not a title |
| **Headline** (R5's Now line; a card name on a full card face) | Cinzel, primary | `--text-lg` (22), **down from `--text-xl`** | `--text-lg` on card faces | not used |
| **Text** (values, rows, body, buttons, choices, effect lines) | Alegreya Sans 400; **700 for a name or the row's name** | `--text-sm` (18) | `--text-sm` | `--text-sm` |
| **Label** (kind label, section heading, field label, chip, caption, count) | the label rule: Alegreya Sans 700, tertiary, sentence case | `--text-xs` (16) | `--text-xs` | `--text-xs` |
| **Story** (prose only) | `--type-body-prose` / `--type-flavor` | `--text-base` (20) | `--text-base` | `--text-base` |

- **A panel draws its operating text from Title, Text and Label: three sizes.** Story is the one permitted fourth, wherever a panel carries prose (rule 11). The Inspector also allows the Headline, because R5 is an agreed rule that asks for a display-face line and Cinzel cannot go below 22 px. At most one Headline per surface (R5).
- **`--text-xl` is the dialog and Stage title step, and nothing else.** On the Inspector the steps in use are 32 / 22 / 18 / 16: each neighbour pair is at least 1.2× apart, except 18/16, which the label rule's weight and colour separate.
- **The six-step scale, its tokens and the 2560 root step are unchanged.** This decides which steps a panel uses, not the steps themselves.

### 3.2 One section-heading treatment

A section heading is **the label rule (16 px, 700, tertiary) with its carved icon (R2), and space above it at least 3× the space below it** (`1.625rem` above, `0.5rem` below, as the mock draws it). This is the Detail slot's one rank (anatomy § 3).

- The **gold heading with a rule** (`.section-heading-gold` on Inspector section heads) and the **secondary-colour 700 sub-head** retire from Inspector Detail sections. Gold is the god's attention (Law 31); a section about the god's tie belongs in the Now slot or R4's bond strip, which anatomy § 1 already moves there. The gold variant stays where it is not a section rank (ornamental use elsewhere is out of scope).
- A sub-head inside a section is a Text 700 row, not a third rank (anatomy § 3).

### 3.3 Per surface, what the ladder changes (from the census)

| Surface | Change |
|---|---|
| Inspector, every page | Body 0.9rem → `--text-sm`; chips 0.75rem → `--text-xs`; 0.8 / 0.85rem rows → `--text-xs` (labels) or `--text-sm` (values); wide title 2.5rem → `--text-2xl`; R5 headline → `--text-lg`; one heading treatment |
| God rail | Essence quantities → **`--text-sm` 600, primary, tabular, right-aligned in their column** (the spendable state reads first; rule 16); pool names stay `--text-xs` secondary. Measured to fit 320 px (mock) |
| Encounter Stage | Title → Title role at `--text-xl`, Cinzel, primary: the header's strongest text (anatomy § 2). Stakes line (Now) → Text, `--text-sm`, primary, upright. Scene prose → `--type-body-prose` (today 16 px italic). Fixed 14 / 12 / 11 px → `--text-xs`. Palatino → the token faces. Drop cap → em-relative to the prose, not fixed px |
| Dialogs (choice, ledger, readers) | Title once at `--text-xl`; options' names Text 700 (or Headline on a full card face); flavour is Story. Fixed 11 / 14 px → `--text-xs` |
| Ledger rail · lists | "Threads" and "Chronicle" both take the rail Title (`--text-lg`), with group heads as Labels. One treatment for the three heads the census found. The thread row's name is Text 700 at `--text-sm`, replacing fixed 17 px Cinzel, which is already below Cinzel's 22 px minimum |
| Tooltips · hover card | Tooltip heading: Cinzel at 16 px breaks the 22 px minimum, so it becomes Text 700 (Alegreya Sans, colour unchanged). Hover card name 1.05rem → Text 700 `--text-sm`; kind stays Label |
| Top bar | No change (2 sizes, passes) |

### 3.4 A measure for UI text

THR-2119 gave UI paragraphs of three lines or more `--measure-prose` to reach about 70 characters. Measured, that does not hold. `--measure-prose` is 34em, calibrated on the Alegreya story face at 20 px. Alegreya Sans at `--text-sm` is narrower, and 34em of it runs **91 characters per line** at 2560 (mock, § 1). Decision: **a second token, `--measure-ui: 26em`** (≈70 characters of Alegreya Sans at any root), for UI text that wraps to three lines or more. THR-2119's intent (about 70 characters) stands; only the token changes.

## 4. What lands where (for the plan docs this map produces)

- `typography.md` gets § *The ladder* (3.1–3.2) and `--measure-ui` (3.4).
- `Section.tsx`'s literals and the Stage veil's fixed px take the bulk of the build. They sit inside the art-led slices' surfaces, so each plan doc builds after its art-led slice merges, as the map's coordination note says.
- No new review probe before 2026-11-13 (the pipeline freeze, THR-1946). Rule 11's three-size count is a review rule a reader runs on a screenshot.
- Which modules get a plan doc, and in what order, waits on THR-2120 (modules and composition), the map's last open ticket.

## 5. Would change the call

- Christian preferring carved section headings ("headings in Cinzel"). C is fully mocked; switching costs one token change, and the blur-test failure is the trade-off to accept.
- Christian wanting the R5 highlight to stay at 26 px ("keep the highlight big").
- A playtest showing players miss sections whose headings are smaller than the body. The fallback is the same label rule at `--text-sm` (18), which keeps the faces and the label rule's weight and colour.
