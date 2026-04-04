import fs from 'fs';
import path from 'path';
import { validateWorldModel } from './validate-world-model';

const OWNED_FOLDERS = [
  'Cosmology',
  'Traits',
  'Domains',
  'Actions',
  'Magic',
  'Actors',
  'Cultures',
  'Terrain',
  'Locations',
  'World Objects',
  'Relationships',
];

const CATEGORY_FOLDER_MAP: Record<string, string | ((props: any) => string)> = {
  'foundation-sphere': 'Cosmology',
  'creation-sphere': 'Cosmology',
  'magic-tradition': (props: any) => {
    const school = props.school || 'General';
    return `Magic/${school}`;
  },
  terrain: 'Terrain',
  reach: 'Domains',
  'action-template': (props: any) => {
    const reach = props.reach || '';
    if (!reach) return 'Actions/Misc';
    const reachName = reach.replace('reach.', '').split('.')[0];
    const capitalized =
      reachName.charAt(0).toUpperCase() + reachName.slice(1);
    return `Actions/${capitalized}`;
  },
  'trait-innate': 'Traits/Innate',
  'trait-mastery': 'Traits/Mastery',
  'trait-reputation': 'Traits/Reputation',
  'trait-scar': 'Traits/Scar',
  'trait-condition': 'Traits/Condition',
  'trait-destiny': 'Traits/Destiny',
  'actor-type': 'Actors',
  culture: 'Cultures',
  'region-type': 'Locations/Regions',
  'location-type': 'Locations/Locations',
  'sublocation-type': 'Locations/Sub-locations',
  'artifact-class': 'World Objects/Artifacts',
  'enchantment-class': 'World Objects/Enchantments',
  'resource-type': 'World Objects/Resources',
  'relationship-type': 'Relationships',
};

export function getCategoryFolder(
  category: string,
  properties: Record<string, any> = {}
): string {
  const mapping = CATEGORY_FOLDER_MAP[category];
  if (typeof mapping === 'function') {
    return mapping(properties);
  }
  return mapping || 'Misc';
}

function formatYamlValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    // Quote strings with special chars
    if (/[:\[\]{}#&*!|>'"@`]/.test(value)) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    // Simple inline array for short lists
    if (value.every((v) => typeof v === 'string' && v.length < 30)) {
      return `[${value.map((v) => `"${v}"`).join(', ')}]`;
    }
    // Multi-line array
    return '\n  ' + value.map((v) => `- ${formatYamlValue(v)}`).join('\n  ');
  }
  if (typeof value === 'object') {
    // Stringify complex objects
    return `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
  }
  return String(value);
}

function generateYamlFrontmatter(
  node: any,
  properties: Record<string, any> = {}
): string {
  const frontmatter: Record<string, any> = {
    tags: [node.category, 'generated'],
    aliases: [node.name],
    id: node.id,
    category: node.category,
    status: 'complete',
    'last-generated': new Date().toISOString().split('T')[0],
  };

  // Flatten properties into frontmatter
  for (const [key, value] of Object.entries(properties)) {
    frontmatter[key] = value;
  }

  const lines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    const formattedValue = formatYamlValue(value);
    if (formattedValue.includes('\n')) {
      lines.push(`${key}:${formattedValue}`);
    } else {
      lines.push(`${key}: ${formattedValue}`);
    }
  }
  lines.push('---');

  return lines.join('\n');
}

function formatProperties(properties: Record<string, any>): string {
  if (!properties || Object.keys(properties).length === 0) {
    return '';
  }

  const lines = ['## Properties'];
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'object') {
      lines.push(`- **${key}**: ${JSON.stringify(value)}`);
    } else if (Array.isArray(value)) {
      lines.push(`- **${key}**: ${value.join(', ')}`);
    } else {
      lines.push(`- **${key}**: ${value}`);
    }
  }

  return lines.join('\n');
}

interface Node {
  id: string;
  name: string;
  category: string;
  description: string;
  properties?: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export function generateNoteContent(
  node: Node,
  edges: Edge[],
  nodeMap: Map<string, Node>,
  relTypeMap: Map<string, Node> = new Map()
): string {
  const outgoing = edges.filter((e) => e.source === node.id);
  const incoming = edges.filter((e) => e.target === node.id);

  const frontmatter = generateYamlFrontmatter(node, node.properties || {});
  const lines = [frontmatter, '', `# ${node.name}`, ''];

  if (node.description) {
    lines.push(`> ${node.description}`, '');
  }

  const properties = formatProperties(node.properties || {});
  if (properties) {
    lines.push(properties, '');
  }

  if (outgoing.length > 0) {
    lines.push('## Outgoing Connections');
    for (const edge of outgoing) {
      const target = nodeMap.get(edge.target);
      const relType = relTypeMap.get(edge.type);
      const relName = relType?.name || edge.type;
      const targetName = target?.name || edge.target;
      lines.push(
        `- **${relName}** → [[${targetName}]] (w: ${edge.weight})`
      );
    }
    lines.push('');
  }

  if (incoming.length > 0) {
    lines.push('## Incoming Connections');
    for (const edge of incoming) {
      const source = nodeMap.get(edge.source);
      const relType = relTypeMap.get(edge.type);
      const relName = relType?.name || edge.type;
      const sourceName = source?.name || edge.source;
      lines.push(
        `- **${relName}** ← [[${sourceName}]] (w: ${edge.weight})`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

interface WorldModel {
  meta: {
    version: string;
    generated: string;
    nodeCount: number;
    edgeCount: number;
    categories: string[];
  };
  nodes: Node[];
  edges: Edge[];
}

interface GenerateVaultOptions {
  dryRun?: boolean;
  validate?: boolean;
  vaultRoot?: string;
}

export async function generateVault(options: GenerateVaultOptions = {}) {
  const {
    dryRun = false,
    validate = true,
    vaultRoot = process.cwd(),
  } = options;

  // Load model
  const modelPath = path.join(vaultRoot, 'src/data/world-model.json');
  const modelData: WorldModel = JSON.parse(
    fs.readFileSync(modelPath, 'utf-8')
  );

  // Validate
  if (validate) {
    const result = validateWorldModel(modelData);
    if (result.errors.length > 0) {
      console.error('Validation failed:');
      result.errors.forEach((e) => console.error(`  ❌ ${e}`));
      process.exit(1);
    }
    if (result.warnings.length > 0) {
      console.warn('Warnings:');
      result.warnings.forEach((w) => console.warn(`  ⚠️ ${w}`));
    }
  }

  // Build maps
  const nodeMap = new Map<string, Node>();
  const relTypeMap = new Map<string, Node>();
  const nodesByCategory: Record<string, Node[]> = {};

  for (const node of modelData.nodes) {
    nodeMap.set(node.id, node);
    if (node.category === 'relationship-type') {
      relTypeMap.set(node.id, node);
    }
    if (!nodesByCategory[node.category]) {
      nodesByCategory[node.category] = [];
    }
    nodesByCategory[node.category].push(node);
  }

  // Collect generated files
  const generatedFiles: Array<{ path: string; content: string }> = [];

  // Generate notes for each node
  let noteCount = 0;
  for (const node of modelData.nodes) {
    const folder = getCategoryFolder(node.category, node.properties);
    const filename = `${node.id}.md`;
    const notePath = path.join(vaultRoot, folder, filename);
    const content = generateNoteContent(
      node,
      modelData.edges,
      nodeMap,
      relTypeMap
    );

    generatedFiles.push({ path: notePath, content });
    noteCount++;
  }

  // Index.md is now LLM-maintained (not auto-generated).
  // Use scripts/rebuild-index.ts for one-time rebuilds.

  // Summary
  console.log(`\n📋 Vault Generation Plan`);
  console.log(`Validating and generating ${noteCount} notes (Index.md is LLM-maintained)`);
  console.log(`Total files to write: ${generatedFiles.length}`);

  if (dryRun) {
    console.log('\n(--dry-run: no files written)');
    generatedFiles.forEach(({ path: p }) => console.log(`  📄 ${p}`));
    return;
  }

  // Clear owned folders
  console.log('\nCleaning owned folders...');
  for (const folder of OWNED_FOLDERS) {
    const folderPath = path.join(vaultRoot, folder);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Write files
  console.log('Writing files...');
  for (const { path: filePath, content } of generatedFiles) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  console.log(`✅ Vault generated: ${generatedFiles.length} files written`);
}

// CLI mode
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('generate-vault.ts')
) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const validate = !args.includes('--no-validate');

  generateVault({
    dryRun,
    validate,
    vaultRoot: process.cwd(),
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
