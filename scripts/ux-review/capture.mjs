// UX review — replay the fixed journey on the deployed build, capture every moment at
// 1920×1080, measure each composed screen, and build the week-over-week contact sheet.
// Usage: node scripts/ux-review/capture.mjs [--date YYYY-MM-DD] [--only id,id] [--base URL]
//                                           [--previous auto|none|YYYY-MM-DD] [--stage]
//   writes %USERPROFILE%\.threadbare\ux-review\<date>\ (full PNGs, thumbs/, manifest.json,
//   contact-sheet.jpg) and prints the manifest summary.
//   --stage also copies the publish set into Docs/ops/ux-review/<date>/ and appends this
//   run's rows to Docs/ops/ux-review-metrics.tsv, ready for scripts/ops-publish.sh.
// Skill: .claude/skills/ux-review/SKILL.md. Lane: tb-ux-review (weekly).
//
// Runs from the repo root. Playwright is NOT a repo dependency: the pinned playwright-core
// lives in a machine-local runtime (bootstrapped on first use) and drives the installed
// Chrome, so CI never pays for it. sharp (a repo devDependency) makes the thumbnails.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const journey = JSON.parse(fs.readFileSync(path.join(here, 'journey.json'), 'utf8'));
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const date = arg('date', localDate());
const base = arg('base', journey.base);
const only = arg('only', '') ? new Set(arg('only', '').split(',')) : null;
const previousArg = arg('previous', 'auto');
const stage = argv.includes('--stage');
const home = path.join(process.env.USERPROFILE ?? process.env.HOME, '.threadbare', 'ux-review');
const runDir = path.join(home, date);
const runtimeDir = path.join(home, 'runtime');
const OPS_DIR = 'Docs/ops/ux-review';
const METRICS_TSV = 'Docs/ops/ux-review-metrics.tsv';
const METRIC_KEYS = ['words', 'interactive', 'smallTargets', 'offscreenControls', 'dialogs', 'coachMarks', 'fontSizes', 'consoleErrors'];

// ── Runtime ──
// Pinned in journey.json so a Playwright release never changes what the lane sees mid-series.
async function loadChromium() {
  const entry = path.join(runtimeDir, 'node_modules', 'playwright-core', 'index.mjs');
  const pkg = path.join(runtimeDir, 'node_modules', 'playwright-core', 'package.json');
  const installed = fs.existsSync(pkg) ? JSON.parse(fs.readFileSync(pkg, 'utf8')).version : null;
  if (installed !== journey.playwrightCore) {
    fs.mkdirSync(runtimeDir, { recursive: true });
    if (!fs.existsSync(path.join(runtimeDir, 'package.json'))) fs.writeFileSync(path.join(runtimeDir, 'package.json'), '{"private":true}\n');
    console.log(`[ux-review] installing playwright-core@${journey.playwrightCore} into ${runtimeDir}`);
    execFileSync('npm', ['install', '--no-audit', '--no-fund', `playwright-core@${journey.playwrightCore}`], { cwd: runtimeDir, stdio: 'inherit', shell: true });
  }
  return (await import(pathToFileURL(entry).href)).chromium;
}

// ── Measuring a composed screen ──
// Cheap proxies, measured the same way every week, so the deltas mean something even where
// the absolute numbers are rough. An element counts only when a hit test at its centre lands
// on it, so whatever an overlay covers or a scroll panel clips away is not counted.
function measure() {
  const vw = innerWidth;
  const vh = innerHeight;
  const visible = el => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw)) return false;
    const x = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
    const hit = document.elementFromPoint(x, y);
    return !!hit && (el === hit || el.contains(hit));
  };
  let words = 0;
  const sizes = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim();
    const parent = walker.currentNode.parentElement;
    if (!text || !parent || !visible(parent)) continue;
    words += text.split(/\s+/).length;
    sizes.add(getComputedStyle(parent).fontSize);
  }
  const controls = [...document.querySelectorAll('button,a[href],[role=button],[role=link],[role=tab],[role=switch],input,select,textarea')].filter(visible);
  const rects = controls.map(c => c.getBoundingClientRect());
  const se = document.scrollingElement;
  return {
    viewport: `${vw}x${vh}`,
    pageScrolls: se.scrollWidth > vw || se.scrollHeight > vh,
    words,
    interactive: controls.length,
    smallTargets: rects.filter(r => r.width < 24 || r.height < 24).length,
    offscreenControls: rects.filter(r => r.right > vw + 1 || r.bottom > vh + 1 || r.left < -1 || r.top < -1).length,
    dialogs: [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].filter(visible).length,
    coachMarks: controls.filter(c => /^got it$/i.test(c.textContent.trim())).length,
    fontSizes: sizes.size,
  };
}

// ── Steps ──
function locatorFor(page, target) {
  if (target.text) return page.getByText(target.text, { exact: false }).first();
  if (target.selector) return page.locator(target.selector).first();
  const name = target.nameRegex ? new RegExp(target.nameRegex, 'i') : target.name;
  return page.getByRole(target.role, name ? { name } : {}).first();
}

async function waitForConsole(logs, marker, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (logs.some(l => l.text.includes(marker))) return;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`console marker "${marker}" not seen in ${timeout} ms`);
}

async function runStep(page, logs, step) {
  const timeout = step.timeout ?? 15000;
  if ('goto' in step) await page.goto(new URL(step.goto, base).href, { waitUntil: 'load', timeout: 60000 });
  else if ('wait' in step) await page.waitForTimeout(step.wait);
  else if (step.waitFor?.console) await waitForConsole(logs, step.waitFor.console, timeout);
  else if (step.waitFor) await locatorFor(page, step.waitFor).waitFor({ state: 'visible', timeout });
  else if (step.ensure) {
    const target = locatorFor(page, step.ensure);
    if (!(await target.isVisible())) {
      await page.keyboard.press(step.press);
      await target.waitFor({ state: 'visible', timeout });
    }
  } else if (step.press) await page.keyboard.press(step.press);
  else if (step.click) await locatorFor(page, step.click).click({ timeout });
  else if (step.type) await page.keyboard.type(step.type, { delay: 40 });
  else throw new Error(`unknown step ${JSON.stringify(step)}`);
}

// ── Previous week (from ops) ──
function git(args, opts = {}) {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024, ...opts });
}
function findPrevious() {
  if (previousArg === 'none') return null;
  try { git(['fetch', 'origin', 'ops', '--quiet']); } catch { /* offline: use what we have */ }
  let dates = [];
  try {
    dates = git(['ls-tree', '--name-only', `origin/ops:${OPS_DIR}`], { encoding: 'utf8' })
      .split('\n').map(s => s.trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  } catch { return null; }
  const pick = previousArg === 'auto' ? dates.filter(d => d < date).pop() : dates.find(d => d === previousArg);
  if (!pick) return null;
  const read = p => { try { return git(['show', `origin/ops:${OPS_DIR}/${pick}/${p}`]); } catch { return null; } };
  const manifest = read('manifest.json');
  return { date: pick, manifest: manifest ? JSON.parse(manifest.toString('utf8')) : null, thumb: id => read(`${id}.jpg`) };
}

// ── Contact sheet ──
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function metricLine(now, before) {
  if (!now) return '';
  return METRIC_KEYS.map(k => {
    const v = now[k];
    const b = before?.[k];
    const delta = typeof b === 'number' && v !== b ? ` <b class="${v > b ? 'up' : 'down'}">${v > b ? '+' : ''}${v - b}</b>` : '';
    return `<span>${k} ${v}${delta}</span>`;
  }).join('');
}
function sheetHtml(manifest, previous, thumbs) {
  const rows = manifest.moments.map(m => {
    const prevM = previous?.manifest?.moments?.find(p => p.id === m.id);
    const prevImg = thumbs.prev[m.id] ? `<img src="data:image/jpeg;base64,${thumbs.prev[m.id]}">` : '<div class="none">no earlier frame</div>';
    const nowImg = thumbs.now[m.id] ? `<img src="data:image/jpeg;base64,${thumbs.now[m.id]}">` : '<div class="none">not captured</div>';
    const flag = m.status === 'reached' ? '' : `<em class="bad">${esc(m.status)}: ${esc(m.error ?? '')}</em>`;
    return `<section><h2>${esc(m.label)} <small>${esc(m.what)}</small>${flag}</h2>
      <div class="pair"><figure>${prevImg}<figcaption>${previous ? esc(previous.date) : '—'}</figcaption></figure>
      <figure>${nowImg}<figcaption>${esc(manifest.date)} · ${metricLine(m.metrics, prevM?.metrics)}</figcaption></figure></div></section>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#14110f;color:#e8dfd0;font:15px/1.4 Georgia,serif;width:1560px}
    h1{font-size:26px;margin:0 0 4px} .sub{color:#a89b86;margin-bottom:20px}
    section{margin:0 0 22px;border-top:1px solid #3a322a;padding-top:10px}
    h2{font-size:18px;margin:0 0 8px} h2 small{font-weight:normal;color:#a89b86;margin-left:8px}
    .pair{display:flex;gap:16px} figure{margin:0;width:772px} img{width:772px;display:block;border:1px solid #3a322a}
    figcaption{font:12px/1.5 Consolas,monospace;color:#a89b86;margin-top:4px} figcaption span{margin-right:10px}
    .up{color:#e07a5f} .down{color:#81b29a} .bad{color:#e07a5f;font-size:13px;margin-left:10px}
    .none{width:772px;height:434px;display:flex;align-items:center;justify-content:center;border:1px dashed #3a322a;color:#6b6155}
  </style></head><body>
    <h1>Threadbearer — the week's screens</h1>
    <div class="sub">${esc(manifest.date)} · deployed ${esc(manifest.deployedCommit?.slice(0, 7) ?? 'unknown')} · left: ${previous ? esc(previous.date) : 'no earlier week'} · right: this week · 1920×1080, journey v${manifest.journeyVersion}</div>
    ${rows}</body></html>`;
}

// ── Main ──
const moments = journey.moments.filter(m => !only || only.has(m.id));
fs.mkdirSync(path.join(runDir, 'thumbs'), { recursive: true });
let deployedCommit = null;
try { git(['fetch', 'origin', 'main', '--quiet']); deployedCommit = git(['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim(); } catch { /* fail-soft */ }

const chromium = await loadChromium();
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  // Software WebGL: the hex map renders headless without a GPU (proven 2026-10-27).
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: journey.viewport, deviceScaleFactor: 1 });
const sharp = (await import('sharp')).default;

const results = [];
let page = null;
let logs = [];
for (const m of moments) {
  if (!m.continue || !page) {
    if (page) await page.close();
    page = await context.newPage();
    logs = [];
    page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => logs.push({ type: 'error', text: String(err) }));
  }
  const errorsBefore = logs.filter(l => l.type === 'error').length;
  const started = Date.now();
  const result = { id: m.id, label: m.label, what: m.what, status: 'reached' };
  try {
    for (const step of m.steps) {
      await runStep(page, logs, step);
      // Keep the marker line itself: the warm-start one says how far the world really got.
      if (step.waitFor?.console) result.marker = logs.find(l => l.text.includes(step.waitFor.console))?.text.slice(0, 400);
    }
  } catch (err) {
    // Fail-soft: capture whatever is on screen. A broken journey is itself worth reading.
    result.status = 'not-reached';
    result.error = String(err.message ?? err).split('\n')[0].slice(0, 200);
  }
  try {
    const shot = path.join(runDir, `${m.id}.png`);
    await page.setViewportSize(journey.viewport);
    await page.screenshot({ path: shot });
    result.metrics = { ...(await page.evaluate(measure)), consoleErrors: logs.filter(l => l.type === 'error').length - errorsBefore };
    await sharp(shot).resize({ width: journey.thumbWidth }).jpeg({ quality: 78 }).toFile(path.join(runDir, 'thumbs', `${m.id}.jpg`));
  } catch (err) {
    result.status = 'capture-failed';
    result.error = String(err.message ?? err).split('\n')[0].slice(0, 200);
  }
  result.ms = Date.now() - started;
  results.push(result);
  console.log(`[ux-review] ${m.id} ${result.status} ${result.ms} ms${result.error ? ` — ${result.error}` : ''}`);
}

const manifest = { date, base, journeyVersion: journey.journeyVersion, deployedCommit, capturedAt: new Date().toISOString(), moments: results };
fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const previous = findPrevious();
const thumbs = { now: {}, prev: {} };
for (const r of results) {
  const f = path.join(runDir, 'thumbs', `${r.id}.jpg`);
  if (fs.existsSync(f)) thumbs.now[r.id] = fs.readFileSync(f).toString('base64');
  const p = previous?.thumb(r.id);
  if (p) thumbs.prev[r.id] = p.toString('base64');
}
const sheetPage = await context.newPage();
await sheetPage.setViewportSize({ width: 1608, height: 1000 });
await sheetPage.setContent(sheetHtml(manifest, previous, thumbs), { waitUntil: 'load' });
await sheetPage.screenshot({ path: path.join(runDir, 'contact-sheet.jpg'), type: 'jpeg', quality: 80, fullPage: true });
await browser.close();

if (stage) {
  const dest = path.join(OPS_DIR, date);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(path.join(runDir, 'thumbs'))) fs.copyFileSync(path.join(runDir, 'thumbs', f), path.join(dest, f));
  fs.copyFileSync(path.join(runDir, 'contact-sheet.jpg'), path.join(dest, 'contact-sheet.jpg'));
  fs.copyFileSync(path.join(runDir, 'manifest.json'), path.join(dest, 'manifest.json'));
  let tsv = '';
  try { tsv = git(['show', `origin/ops:${METRICS_TSV}`], { encoding: 'utf8' }); } catch { /* first run */ }
  if (!tsv.trim()) tsv = ['date', 'journeyVersion', 'deployedCommit', 'moment', 'status', ...METRIC_KEYS].join('\t') + '\n';
  for (const r of results) {
    tsv += [date, journey.journeyVersion, deployedCommit?.slice(0, 8) ?? '', r.id, r.status, ...METRIC_KEYS.map(k => r.metrics?.[k] ?? '')].join('\t') + '\n';
  }
  fs.writeFileSync(METRICS_TSV, tsv);
  console.log(`[ux-review] staged ${dest}/ and ${METRICS_TSV}`);
}

// Keep the newest keepLocalRuns full-resolution runs; ops keeps the thumbnails for good.
const runs = fs.readdirSync(home).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
for (const old of runs.slice(0, Math.max(0, runs.length - journey.keepLocalRuns))) {
  fs.rmSync(path.join(home, old), { recursive: true, force: true });
  console.log(`[ux-review] pruned ${old}`);
}

const reached = results.filter(r => r.status === 'reached').length;
console.log(JSON.stringify({ runDir, previous: previous?.date ?? null, reached: `${reached}/${results.length}`, deployedCommit }, null, 2));
