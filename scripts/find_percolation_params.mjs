// scripts/find_percolation_params.mjs
import crypto from 'crypto';

// 4x4 Torus: 16 cells, 32 edges
// Edges:
// 0..15: horizontal edge from cell (x, y) to ((x+1)%4, y)
// 16..31: vertical edge from cell (x, y) to (x, (y+1)%4)

function getNeighbors(cell, edgesOpen) {
  const x = cell % 4;
  const y = Math.floor(cell / 4);
  const nbrs = [];

  // Horizontal right: edge index = y * 4 + x
  const rightEdge = y * 4 + x;
  if (edgesOpen[rightEdge]) {
    nbrs.push(y * 4 + ((x + 1) % 4));
  }
  // Horizontal left: edge from ((x+3)%4, y)
  const leftEdge = y * 4 + ((x + 3) % 4);
  if (edgesOpen[leftEdge]) {
    nbrs.push(y * 4 + ((x + 3) % 4));
  }
  // Vertical down: edge index = 16 + y * 4 + x
  const downEdge = 16 + y * 4 + x;
  if (edgesOpen[downEdge]) {
    nbrs.push(((y + 1) % 4) * 4 + x);
  }
  // Vertical up: edge from (x, (y+3)%4)
  const upEdge = 16 + ((y + 3) % 4) * 4 + x;
  if (edgesOpen[upEdge]) {
    nbrs.push(((y + 3) % 4) * 4 + x);
  }

  return nbrs;
}

function simulateRun(threshold, startCell = 0) {
  const buf = crypto.randomBytes(32);
  const edgesOpen = new Array(32);
  for (let i = 0; i < 32; i++) {
    edgesOpen[i] = buf[i] < threshold;
  }

  // BFS / Flood fill from startCell
  const visited = new Uint8Array(16);
  const queue = [startCell];
  visited[startCell] = 1;
  let count = 0;

  while (queue.length > 0) {
    const cur = queue.shift();
    count++;
    const nbrs = getNeighbors(cur, edgesOpen);
    for (const nb of nbrs) {
      if (!visited[nb]) {
        visited[nb] = 1;
        queue.push(nb);
      }
    }
  }

  return count;
}

function testThreshold(threshold, rounds = 200000) {
  const counts = new Array(17).fill(0);
  for (let r = 0; r < rounds; r++) {
    const c = simulateRun(threshold);
    counts[c]++;
  }

  console.log(`\n--- Threshold: ${threshold} / 256 (${(threshold / 256 * 100).toFixed(2)}%) ---`);
  for (let k = 1; k <= 16; k++) {
    const prob = counts[k] / rounds;
    console.log(`Cells ${k.toString().padStart(2)}: ${(prob * 100).toFixed(3)}% (${counts[k]})`);
  }
}

for (const t of [80, 85, 90, 95, 100]) {
  testThreshold(t, 100000);
}
