const { WorldGraph } = require('./src/engine/graph.ts');

const graph = new WorldGraph();

// Locations
graph.addNode({ id: 'loc-1', type: 'location', name: 'Iron Gate', properties: { locationType: 'hex' } });
graph.addNode({ id: 'loc-2', type: 'location', name: 'Salt Marsh', properties: { locationType: 'hex' } });

// Adjacency
graph.addEdge({ id: 'adj-1-2a', source: 'loc-1', target: 'loc-2', type: 'adjacent', properties: {} });
graph.addEdge({ id: 'adj-1-2b', source: 'loc-2', target: 'loc-1', type: 'adjacent', properties: {} });

// Actor at loc-2
graph.addNode({
  id: 'act-2',
  type: 'actor',
  name: 'Mira',
  properties: { actorType: 'individual', narrativeArchetype: 'seeker' },
});
graph.addEdge({ id: 'loc-act2', source: 'act-2', target: 'loc-2', type: 'located_at', properties: {} });

// Query: from loc-2, what are incoming located_at edges?
const incomingLocated = graph.getIncomingEdges('loc-2', 'located_at');
console.log('Incoming located_at edges to loc-2:', incomingLocated);

// Query: from loc-1, what are outgoing adjacent edges?
const outgoingAdj = graph.getOutgoingEdges('loc-1', 'adjacent');
console.log('Outgoing adjacent from loc-1:', outgoingAdj);
