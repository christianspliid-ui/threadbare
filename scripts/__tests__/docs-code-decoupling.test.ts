/**
 * THR-922 — the invariants that keep documentation work off the code track.
 *
 * Two couplings used to force a documentation edit through the full ~15-minute
 * `Test · Typecheck · Build` gate, or make the test suite's outcome depend on doc
 * content:
 *
 * **A.** `npm test` read `Docs/impediments.md` live, so appending an impediment
 * could redden the suite — and because CI skips tests on the docs-only PR that
 * carries the append (THR-491), it reddened the *next unrelated code PR* instead.
 *
 * **B.** Generators whose inputs are documentation wrote their output into `src/`
 * or `public/`, so a UL-shard edit regenerated a non-doc file and the PR stopped
 * classifying as docs-only.
 *
 * Both fixes are the kind that rot silently — nothing fails when they regress,
 * the cost just quietly comes back. These tests are the pins.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DOC_EXCLUDED_GLOBS,
  DOC_TO_CODE_ALLOWLIST,
  STATIC_ARTIFACT_SOURCES,
  classifyCoupling,
  isDocPath,
} from '../generated-artifact-sources.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..', '..');
const CI_WORKFLOW = path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml');

/**
 * Built from parts so this file's own source does not contain the needle it
 * searches for — a self-matching literal is what made the first attempt at this
 * guard fail against itself.
 */
const LIVE_LOG_PATH = ['Docs', 'impediments.md'].join('/');

/** Test files that may legitimately read a live doc, with the reason. */
const LIVE_DOC_READ_EXEMPT: Readonly<Record<string, string>> = {
  // This file names the path in order to forbid it.
  'scripts/__tests__/docs-code-decoupling.test.ts': 'the guard itself',
};

function collectTestFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.cache') continue;
      collectTestFiles(absolute, acc);
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      acc.push(absolute);
    }
  }
  return acc;
}

/** Strip block and line comments so a path *named in prose* is not a false hit. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

describe('npm test does not read the live impediment log (THR-922 Done-when 1)', () => {
  const testFiles = [
    ...collectTestFiles(path.join(REPO_ROOT, 'src')),
    ...collectTestFiles(path.join(REPO_ROOT, 'scripts')),
  ];

  it('sweeps a non-empty population of test files', () => {
    // Without this the assertion below passes vacuously if the walker breaks.
    expect(testFiles.length).toBeGreaterThan(50);
  });

  it('no test file reads the live log as input', () => {
    const offenders = testFiles
      .map((absolute) => ({
        rel: path.relative(REPO_ROOT, absolute).replaceAll('\\', '/'),
        code: stripComments(fs.readFileSync(absolute, 'utf8')),
      }))
      .filter(({ rel, code }) => LIVE_DOC_READ_EXEMPT[rel] === undefined && code.includes(LIVE_LOG_PATH))
      .map(({ rel }) => rel);

    // A test that reads the live log makes `npm test` a function of documentation
    // content. The live-log invariants belong in `npm run check:impediment-ids`,
    // which runs on the docs track where a doc change is actually gated.
    expect(offenders).toEqual([]);
  });
});

describe('doc→code coupling classifier', () => {
  it('treats markdown and the doc directories as documentation', () => {
    expect(isDocPath('Docs/impediments.md')).toBe(true);
    expect(isDocPath('Docs/ubiquitous-language/')).toBe(true);
    expect(isDocPath('Design/retros/retro.md')).toBe(true);
    expect(isDocPath('.planning/ROADMAP.md')).toBe(true);
    expect(isDocPath('**/*.md')).toBe(true);
  });

  it('treats source and asset paths as code', () => {
    expect(isDocPath('src/data/ul-dashboard.generated.json')).toBe(false);
    expect(isDocPath('scripts/interface-contracts.ts')).toBe(false);
    expect(isDocPath('public/system-interface-map-reference.html')).toBe(false);
  });

  it('flags a doc-sourced artifact that lands outside the doc paths', () => {
    expect(classifyCoupling('src/data/ul-dashboard.generated.json', ['Docs/ubiquitous-language/'])).toBe(
      'doc-to-code-pure',
    );
  });

  it('flags a mixed-source artifact too — one doc source is enough to trigger it', () => {
    // The shape of public/system-interface-map-reference.html: a canon-page edit
    // alone regenerates it and drags the PR onto the code track, even though the
    // page also has code sources.
    expect(
      classifyCoupling('public/system-interface-map-reference.html', [
        'Docs/canon/interface-map.md',
        'scripts/interface-contracts.ts',
      ]),
    ).toBe('doc-to-code-mixed');
  });

  it('does not flag a doc-sourced artifact that lands INSIDE the doc paths', () => {
    // Design/ is doc-excluded, so this coupling costs a docs PR nothing.
    expect(classifyCoupling('Design/impediment-dashboard.html', ['Docs/impediments.md'])).toBe('none');
  });

  it('does not flag code→code or code→doc directions', () => {
    expect(
      classifyCoupling('public/action-catalog.generated.json', ['src/data/unified-action-templates.ts']),
    ).toBe('none');
    expect(
      classifyCoupling('Docs/canon/interface-map.generated.md', ['scripts/interface-contracts.ts']),
    ).toBe('none');
  });

  it('does not flag an artifact with no declared sources', () => {
    // Undeclared sources are caught by everyArtifactDeclaresSources instead, so
    // the classifier must not also guess a coupling from an empty list.
    expect(classifyCoupling('public/design-wiki.html', [])).toBe('none');
  });
});

describe('the allowlist and the CI filter cannot drift apart', () => {
  const workflow = fs.readFileSync(CI_WORKFLOW, 'utf8');

  /** The `- '!<path>'` negations inside the `code:` filter block. */
  function codeFilterNegations(): string[] {
    const start = workflow.indexOf('            code:');
    expect(start).toBeGreaterThan(-1);
    const end = workflow.indexOf('filter-docs', start);
    const block = workflow.slice(start, end === -1 ? undefined : end);
    return [...block.matchAll(/^\s*-\s*'!(.+)'\s*$/gm)].map((match) => match[1]);
  }

  it('the code filter still excludes the four base doc patterns', () => {
    const negations = codeFilterNegations();
    for (const glob of DOC_EXCLUDED_GLOBS) {
      expect(negations).toContain(glob);
    }
  });

  it('every allowlisted artifact is excluded from the code filter', () => {
    const negations = codeFilterNegations();
    for (const artifact of DOC_TO_CODE_ALLOWLIST) {
      expect(negations).toContain(artifact);
    }
  });

  it('the code filter excludes nothing beyond the base patterns and the allowlist', () => {
    // The direction that matters most: an exclusion added to ci.yml without a
    // corresponding allowlist entry is a hole in change detection that no other
    // gate would notice.
    const extra = codeFilterNegations().filter(
      (glob) =>
        !(DOC_EXCLUDED_GLOBS as readonly string[]).includes(glob) && !DOC_TO_CODE_ALLOWLIST.includes(glob),
    );
    expect(extra).toEqual([]);
  });

  it('allowlisted artifacts are also matched by the docs filter', () => {
    // Otherwise a PR touching only such an artifact reads code == 'false' AND
    // docs == 'false', and neither CI job runs.
    const start = workflow.indexOf('            docs:');
    expect(start).toBeGreaterThan(-1);
    const block = workflow.slice(start);
    for (const artifact of DOC_TO_CODE_ALLOWLIST) {
      expect(block).toContain(`- '${artifact}'`);
    }
  });

  it('CLAUDE.md classifies the diff with the same predicate', () => {
    const claudeMd = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');
    // The documented grep is what an agent actually runs to decide which gate
    // track it owes; if it disagrees with ci.yml, agents and CI classify the same
    // PR differently.
    for (const artifact of DOC_TO_CODE_ALLOWLIST) {
      expect(claudeMd).toContain(artifact.replaceAll('.', '\\.'));
    }
  });
});

/**
 * THR-946 — the merge-queue copy of the docs-only predicate.
 *
 * A `merge_group` event carries no changed-file list and no diff base
 * `dorny/paths-filter` can read, so `ci.yml` classifies merge groups itself with
 * a shell `grep` over `git diff --name-only <base_sha> HEAD`. That makes a THIRD
 * copy of a rule already written twice above it and described a fourth time in
 * CLAUDE.md.
 *
 * A drifted third copy fails nothing on its own — it just reclassifies merge
 * groups. One direction is merely wasteful (a docs group paying the full suite);
 * the other is the vacuous gate THR-768 is about, because a code group reading
 * as docs-only skips `Test · Typecheck · Build` on the exact tree that lands on
 * `main`. Structural containment is checked first, then the string is executed as
 * a RegExp — inspection alone cannot prove the fragments compose.
 */
describe('the merge-group predicate cannot drift from the paths-filter one (THR-946)', () => {
  const workflow = fs.readFileSync(CI_WORKFLOW, 'utf8');

  function mergeGroupDocPattern(): string {
    const match = workflow.match(/^\s*DOC_PATTERN:\s*'(.+)'$/m);
    expect(match, 'ci.yml no longer defines DOC_PATTERN in the merge-group detect step').not.toBeNull();
    return match![1];
  }

  /** The ERE fragment a given doc glob must contribute to the shell predicate. */
  function ereFragmentForGlob(glob: string): string {
    if (glob === '**/*.md') return '\\.md$';
    return `^${glob.replace(/\/\*\*$/, '').replaceAll('.', '\\.')}/`;
  }

  it('the workflow is actually triggered on merge_group', () => {
    // Without the trigger the predicate below is dead code — and, worse, every
    // queued PR stalls waiting on a required check that never reports at all.
    expect(workflow).toMatch(/^ {2}merge_group:$/m);
  });

  it('covers every base doc pattern', () => {
    const pattern = mergeGroupDocPattern();
    for (const glob of DOC_EXCLUDED_GLOBS) {
      expect(pattern, `${glob} is not represented`).toContain(ereFragmentForGlob(glob));
    }
  });

  it('covers every allowlisted doc-sourced artifact', () => {
    const pattern = mergeGroupDocPattern();
    for (const artifact of DOC_TO_CODE_ALLOWLIST) {
      expect(pattern, `${artifact} is not represented`).toContain(`^${artifact.replaceAll('.', '\\.')}$`);
    }
  });

  describe('behaviour — the pattern is executed, not merely inspected', () => {
    const isDoc = (file: string) => new RegExp(mergeGroupDocPattern()).test(file);

    const DOC_FIXTURES = [
      'Docs/impediments.md',
      'Docs/canon/process.md',
      'Design/briefing.md',
      '.planning/ROADMAP.md',
      'README.md',
      ...DOC_TO_CODE_ALLOWLIST,
    ];

    const CODE_FIXTURES = [
      'src/engine/graph.ts',
      'scripts/interface-contracts.ts',
      '.github/workflows/ci.yml',
      'package.json',
      'src/data/unified-action-templates.ts',
      // Adjacent to an allowlisted artifact but not it. The exclusions are exact
      // paths, never globs — the point is to exclude two named artifacts, not to
      // carve a hole in src/ — so this must stay code.
      'src/data/other.generated.json',
    ];

    it('sweeps a non-empty population on both sides', () => {
      // Without this both it.each blocks below pass vacuously if a list empties.
      expect(DOC_FIXTURES.length).toBeGreaterThan(4);
      expect(CODE_FIXTURES.length).toBeGreaterThan(4);
    });

    it.each(DOC_FIXTURES)('classifies %s as documentation', (file) => {
      expect(isDoc(file)).toBe(true);
    });

    it.each(CODE_FIXTURES)('classifies %s as code', (file) => {
      expect(isDoc(file)).toBe(false);
    });

    it('answers identically to isDocPath outside the allowlist', () => {
      // The allowlist is where the two deliberately differ: isDocPath asks "is
      // this a documentation path" (an artifact in src/ is not), while the CI
      // predicate asks "does this keep a PR on the docs track" (it does). Every
      // other path must get the same answer from both.
      for (const file of [...DOC_FIXTURES, ...CODE_FIXTURES]) {
        if ((DOC_TO_CODE_ALLOWLIST as readonly string[]).includes(file)) continue;
        expect(isDoc(file), file).toBe(isDocPath(file));
      }
    });
  });
});

describe('every registered generated artifact declares its sources', () => {
  it('covers each STATIC_GENERATED_PATHS entry', () => {
    // Read the registry from its own module rather than duplicating it, so a new
    // artifact registered there without a sources row fails here.
    const freshness = fs.readFileSync(path.join(REPO_ROOT, 'scripts', 'check-generated-freshness.ts'), 'utf8');
    const block = freshness.slice(
      freshness.indexOf('const STATIC_GENERATED_PATHS'),
      freshness.indexOf('];', freshness.indexOf('const STATIC_GENERATED_PATHS')),
    );
    const registered = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    expect(registered.length).toBeGreaterThan(0);
    for (const relPath of registered) {
      expect(STATIC_ARTIFACT_SOURCES[relPath], `${relPath} has no declared sources`).toBeDefined();
    }
  });
});
