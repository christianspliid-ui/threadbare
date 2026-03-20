---
name: impediments
description: List and visualize the impediment log. Shows a formatted summary of all impediments from Docs/impediments.md and regenerates the HTML dashboard at Design/impediment-dashboard.html. Trigger with "/impediments" or "show impediments" or "impediment dashboard".
---

# Impediments Viewer

## Workflow

### Step 1: Read the log

Read `Docs/impediments.md` and parse all table rows.

### Step 2: Display summary in terminal

Present the data grouped and sorted for quick scanning:

```
## Impediment Summary — {date}

**{total} impediments logged, {total_occurrences} total occurrences**

### Hot Items (count > 3)
| # | Count | Category | Description | Impact |
(sorted by count descending)

### By Category
- tool-failure: N items (M total occurrences)
- api-quirk: N items (M total occurrences)
...

### Unresolved (no workaround)
| # | Count | Category | Description | Impact |
(items where Workaround Found = No)

### Impact Distribution
- S: N occurrences
- M: N occurrences
- L: N occurrences
- Blocked: N occurrences
- Est. time lost: ~Xh Ym (S=1m, M=8m, L=20m, Blocked=30m)
```

### Step 3: Regenerate HTML dashboard

Read the current impediment data and regenerate `Design/impediment-dashboard.html` with the data embedded as JSON. Use the HTML template defined below.

### Step 4: Tell the user

Report the summary and tell them the dashboard is updated:
> "Dashboard updated at `Design/impediment-dashboard.html` — open in browser to view."

## HTML Dashboard Template

The dashboard must be a **single self-contained HTML file** with:
- No external dependencies (inline CSS, vanilla JS)
- Data embedded as a `const DATA = [...]` JSON array in a script tag
- Dark theme consistent with the project aesthetic

### Required dashboard sections:

1. **Header** — Title, total count, total occurrences, estimated time lost
2. **Hot items alert** — Red-highlighted cards for any item with count > 5 (retro threshold), amber for count > 3
3. **Table view** — Full sortable table of all impediments (click column headers to sort)
4. **Category breakdown** — Bar chart (CSS-only, no libraries) showing items per category
5. **Impact distribution** — Visual breakdown of S/M/L/Blocked
6. **Timeline** — Items sorted by date, most recent first
7. **Unresolved section** — Items with no workaround, prominently displayed

### Color scheme:
- Background: `#1a1a2e`
- Cards: `#16213e`
- Accent: `#e94560` (hot items), `#f59e0b` (warnings), `#10b981` (resolved)
- Text: `#e2e8f0`
- Muted: `#94a3b8`
