import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { RawInspirationSource } from './types';

const MARKDOWN_EXTENSION = '.md';
const URL_PROTOCOL_PATTERN = /^https?:\/\//i;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const MULTISPACE_PATTERN = /[ \t]+/g;
const MANY_BLANK_LINES_PATTERN = /\n{3,}/g;

function isUrl(value: string): boolean {
  return URL_PROTOCOL_PATTERN.test(value);
}

function collapseWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(MULTISPACE_PATTERN, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(MANY_BLANK_LINES_PATTERN, '\n\n')
    .trim();
}

function htmlEntityDecode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractTitleFromHtml(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1] ? htmlEntityDecode(match[1]).trim() : '';
  return title || undefined;
}

function htmlToPlainMarkdown(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  const withLineHints = withoutScripts
    .replace(/<\/(h1|h2|h3|h4|h5|h6|p|section|article|div|li|ul|ol|br)>/gi, '\n')
    .replace(/<(h1)[^>]*>/gi, '# ')
    .replace(/<(h2)[^>]*>/gi, '## ')
    .replace(/<(h3)[^>]*>/gi, '### ')
    .replace(/<(h4|h5|h6)[^>]*>/gi, '#### ')
    .replace(/<li[^>]*>/gi, '- ');

  return collapseWhitespace(htmlEntityDecode(withLineHints.replace(HTML_TAG_PATTERN, '')));
}

async function loadFromUrl(url: string): Promise<RawInspirationSource[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'threadbare-ingest/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed URL fetch (${response.status} ${response.statusText}): ${url}`);
  }

  const html = await response.text();
  return [{
    body: htmlToPlainMarkdown(html),
    sourceType: 'url',
    sourceUrl: url,
    suggestedTitle: extractTitleFromHtml(html),
  }];
}

async function listMarkdownFilesRecursive(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFilesRecursive(fullPath));
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === MARKDOWN_EXTENSION) {
      files.push(fullPath);
    }
  }

  return files;
}

async function loadMarkdownFile(
  filePath: string,
  sourceType: 'file' | 'directory-entry',
): Promise<RawInspirationSource> {
  const body = await fs.readFile(filePath, 'utf8');
  return {
    body,
    sourcePath: filePath,
    sourceType,
  };
}

async function loadFromFilesystem(inputPath: string): Promise<RawInspirationSource[]> {
  const resolvedPath = path.resolve(inputPath);
  const stat = await fs.stat(resolvedPath);

  if (stat.isDirectory()) {
    const markdownFiles = (await listMarkdownFilesRecursive(resolvedPath)).sort((a, b) => a.localeCompare(b));
    const records = await Promise.all(
      markdownFiles.map((filePath) => loadMarkdownFile(filePath, 'directory-entry')),
    );
    return records;
  }

  if (stat.isFile()) {
    if (path.extname(resolvedPath).toLowerCase() !== MARKDOWN_EXTENSION) {
      throw new Error(`Expected a markdown file (.md): ${resolvedPath}`);
    }
    return [await loadMarkdownFile(resolvedPath, 'file')];
  }

  throw new Error(`Unsupported source path: ${resolvedPath}`);
}

export async function loadRawInspirationSources(source: string): Promise<RawInspirationSource[]> {
  if (isUrl(source)) {
    return loadFromUrl(source);
  }

  return loadFromFilesystem(source);
}

