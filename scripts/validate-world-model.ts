export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateWorldModel(model: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set<string>();

  // Validate model structure
  if (!model || typeof model !== 'object') {
    errors.push('Model is not a valid object');
    return { errors, warnings };
  }

  if (!model.meta || !Array.isArray(model.nodes) || !Array.isArray(model.edges)) {
    errors.push('Model missing required properties: meta, nodes, or edges');
    return { errors, warnings };
  }

  // 1. Check for duplicate IDs
  for (const node of model.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // 2. Every node must have non-empty name, category, description
  for (const node of model.nodes) {
    if (!node.name || !node.category || !node.description) {
      errors.push(
        `Node ${node.id} missing required field (name/category/description)`
      );
    }
  }

  // 3. Check category values are in the allowed list
  const allowedCategories = new Set(model.meta.categories);
  for (const node of model.nodes) {
    if (!allowedCategories.has(node.category)) {
      errors.push(
        `Node ${node.id} has unknown category: ${node.category}`
      );
    }
  }

  // 4. Edge referential integrity
  for (const edge of model.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge source not found: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge target not found: ${edge.target}`);
    }
  }

  // 5. Edge types must reference existing relationship-type nodes
  const relTypeIds = new Set(
    model.nodes
      .filter((n: any) => n.category === 'relationship-type')
      .map((n: any) => n.id)
  );
  for (const edge of model.edges) {
    if (!relTypeIds.has(edge.type)) {
      errors.push(`Edge type "${edge.type}" not found in relationship types`);
    }
  }

  // 6. Orphan nodes (no edges)
  const connectedIds = new Set<string>();
  for (const edge of model.edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }
  for (const node of model.nodes) {
    if (!connectedIds.has(node.id) && node.category !== 'relationship-type') {
      warnings.push(`Orphan node (no edges): ${node.id}`);
    }
  }

  // 7. Meta count accuracy
  if (model.meta.nodeCount !== model.nodes.length) {
    errors.push(
      `meta.nodeCount (${model.meta.nodeCount}) !== actual (${model.nodes.length})`
    );
  }
  if (model.meta.edgeCount !== model.edges.length) {
    errors.push(
      `meta.edgeCount (${model.meta.edgeCount}) !== actual (${model.edges.length})`
    );
  }

  return { errors, warnings };
}

// CLI mode
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('validate-world-model.ts')
) {
  // Import using dynamic require for JSON
  const fs = await import('fs');
  const path = await import('path');

  const scriptDir = path.dirname(import.meta.url.replace('file://', ''));
  const modelPath = path.join(scriptDir, '../src/data/world-model.json');

  const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
  const result = validateWorldModel(modelData);

  if (result.errors.length > 0) {
    console.error('ERRORS:');
    result.errors.forEach((e) => console.error('  ❌', e));
  }
  if (result.warnings.length > 0) {
    console.warn('WARNINGS:');
    result.warnings.forEach((w) => console.warn('  ⚠️', w));
  }
  if (result.errors.length === 0) {
    console.log(
      `✅ Validation passed! (${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''})`
    );
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}
