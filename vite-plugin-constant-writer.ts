/**
 * Vite Plugin: Constant Writer
 *
 * Exposes a POST endpoint at /__config-writer that accepts an array of
 * constant changes and writes them back to their source TypeScript files.
 *
 * Each change specifies { sourceFile, exportName, newValue }. The plugin
 * does a targeted regex replacement of `export const NAME = <oldValue>`
 * with the new value. Vite's HMR picks up the file change automatically.
 *
 * Only active in dev mode — production builds do not include this plugin.
 */

import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

interface ConstantChange {
  sourceFile: string;   // e.g. "src/data/game-config.ts"
  exportName: string;   // e.g. "DEFAULT_DOOM_TICKS"
  newValue: string;     // e.g. "300000"
}

export function constantWriter(): Plugin {
  let projectRoot = '';

  return {
    name: 'vite-plugin-constant-writer',
    configResolved(config) {
      projectRoot = config.root;
    },
    configureServer(server) {
      server.middlewares.use('/__config-writer', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { changes } = JSON.parse(body) as { changes: ConstantChange[] };

            if (!Array.isArray(changes) || changes.length === 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'No changes provided' }));
              return;
            }

            // Group changes by source file for batch processing
            const byFile = new Map<string, ConstantChange[]>();
            for (const change of changes) {
              const list = byFile.get(change.sourceFile) ?? [];
              list.push(change);
              byFile.set(change.sourceFile, list);
            }

            const results: string[] = [];

            for (const [relPath, fileChanges] of byFile) {
              const absPath = path.resolve(projectRoot, relPath);

              if (!fs.existsSync(absPath)) {
                results.push(`SKIP: ${relPath} — file not found`);
                continue;
              }

              let content = fs.readFileSync(absPath, 'utf-8');

              for (const change of fileChanges) {
                // Match: export const NAME = <value>;
                // Handles numbers, booleans, strings, negative numbers
                const pattern = new RegExp(
                  `(export\\s+const\\s+${escapeRegex(change.exportName)}\\s*=\\s*)([^;]+)(;)`,
                );
                const match = pattern.exec(content);
                if (!match) {
                  results.push(`SKIP: ${change.exportName} in ${relPath} — pattern not found`);
                  continue;
                }

                // Format the new value appropriately
                const formatted = formatValue(change.newValue, match[2].trim());
                content = content.replace(pattern, `$1${formatted}$3`);
                results.push(`OK: ${change.exportName} = ${formatted} in ${relPath}`);
              }

              fs.writeFileSync(absPath, content, 'utf-8');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, results }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
        });
      });
    },
  };
}

/** Format the new value to match the original style */
function formatValue(newValue: string, originalValue: string): string {
  // Boolean
  if (newValue === 'true' || newValue === 'false') return newValue;

  // String (if original was quoted)
  if (originalValue.startsWith("'") || originalValue.startsWith('"')) {
    return `'${newValue}'`;
  }

  // Number — preserve as-is (the user typed it)
  const num = Number(newValue);
  if (!isNaN(num)) return newValue;

  // Fallback: treat as-is
  return newValue;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
