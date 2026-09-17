// scripts/exact_enumeration.mjs
// Let's test exact enumeration for a 3x3 Reactor Core (9 Chambers)
// Cells: 0..8 (3x3 grid)
// Edges between adjacent chambers:
// Horizontal: (0,1), (1,2), (3,4), (4,5), (6,7), (7,8) -> 6 edges
// Vertical:   (0,3), (1,4), (2,5), (3,6), (4,7), (5,8) -> 6 edges
// Total planar edges = 12 edges! 2^12 = 4,096 states!
// If torus: wrap-around adds 3 horizontal + 3 vertical = 18 edges! 2^18 = 262,144 states!

console.log("Enumerating 3x3 Torus (18 edges, 262,144 states)...");

const edges = [];
// 3x3 Torus edges:
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < 3; x++) {
    const u = y * 3 + x;
    const right = y * 3 + ((x + 1) % 3);
    const down = ((y + 1) % 3) * 3 + x;
    edges.push([u, right]);
    edges.push([u, down]);
  }
}

console.log(`Total edges: ${edges.length}`); // 18 edges

function getClusterSize(startCell, activeEdgeMask) {
  const adj = Array.from({ length: 9 }, () => []);
  for (let e = 0; e < edges.length; e++) {
    if ((activeEdgeMask & (1 << e)) !== 0) {
      const [u, v] = edges[e];
      adj[u].push(v);
      adj[v].push(u);
    }
  }

  const visited = new Uint8Array(9);
  const queue = [startCell];
  visited[startCell] = 1;
  let size = 0;

  while (queue.length > 0) {
    const u = queue.shift();
    size++;
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = 1;
        queue.push(v);
      }
    }
  }
  return size;
}

// Compute exact distribution for edge probability p = 1/3, 3/8, or threshold T/256
const p = 0.35; // bond probability
const totalStates = 1 << 18; // 262,144
const exactProbs = new Array(10).fill(0);

const startCell = 0; // By symmetry on torus, startCell doesn't matter!

for (let mask = 0; mask < totalStates; mask++) {
  let openEdges = 0;
  for (let e = 0; e < 18; e++) {
    if ((mask & (1 << e)) !== 0) openEdges++;
  }
  const probWeight = Math.pow(p, openEdges) * Math.pow(1 - p, 18 - openEdges);
  const size = getClusterSize(startCell, mask);
  exactProbs[size] += probWeight;
}

console.log("\nExact Distribution of Fission Core Cluster Size (p = 0.35):");
for (let k = 1; k <= 9; k++) {
  console.log(`Size ${k}: ${(exactProbs[k] * 100).toFixed(6)}%`);
}

// Check sum
const sum = exactProbs.reduce((a, b) => a + b, 0);
console.log(`Total probability sum: ${sum.toFixed(10)}`);
