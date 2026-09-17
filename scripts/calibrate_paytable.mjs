// scripts/calibrate_paytable.mjs
import crypto from 'crypto';

function getNeighbors(cell, edgesOpen) {
  const x = cell % 4;
  const y = Math.floor(cell / 4);
  const nbrs = [];

  const rightEdge = y * 4 + x;
  if (edgesOpen[rightEdge]) nbrs.push(y * 4 + ((x + 1) % 4));

  const leftEdge = y * 4 + ((x + 3) % 4);
  if (edgesOpen[leftEdge]) nbrs.push(y * 4 + ((x + 3) % 4));

  const downEdge = 16 + y * 4 + x;
  if (edgesOpen[downEdge]) nbrs.push(((y + 1) % 4) * 4 + x);

  const upEdge = 16 + ((y + 3) % 4) * 4 + x;
  if (edgesOpen[upEdge]) nbrs.push(((y + 3) % 4) * 4 + x);

  return nbrs;
}

function simulateRun(threshold, startCell = 0) {
  const buf = crypto.randomBytes(32);
  const edgesOpen = new Array(32);
  for (let i = 0; i < 32; i++) {
    edgesOpen[i] = buf[i] < threshold;
  }

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

const THRESHOLD = 78;
const TOTAL_ROUNDS = 1000000;
const counts = new Array(17).fill(0);

console.log(`Running calibration for THRESHOLD = ${THRESHOLD} (${TOTAL_ROUNDS.toLocaleString()} rounds)...`);
for (let r = 0; r < TOTAL_ROUNDS; r++) {
  const c = simulateRun(THRESHOLD, 0);
  counts[c]++;
}

const probs = counts.map(c => c / TOTAL_ROUNDS);

const multipliers = new Array(17).fill(0);
// 1..4 cells: Incomplete fission (Loss, total ~54% of rounds)
multipliers[1] = 0;
multipliers[2] = 0;
multipliers[3] = 0;
multipliers[4] = 0;

// Gradual escalation
multipliers[5]  = 0.40;  // 6.26% -> EV 0.025
multipliers[6]  = 0.70;  // 5.67% -> EV 0.040
multipliers[7]  = 1.10;  // 5.17% -> EV 0.057
multipliers[8]  = 1.60;  // 4.88% -> EV 0.078
multipliers[9]  = 2.30;  // 4.49% -> EV 0.103
multipliers[10] = 3.20;  // 4.26% -> EV 0.136
multipliers[11] = 4.50;  // 3.97% -> EV 0.179
multipliers[12] = 6.00;  // 3.61% -> EV 0.217
multipliers[13] = 9.00;  // 3.11% -> EV 0.280 (Wait, let's see sum)

let sum = 0;
for (let k = 1; k <= 13; k++) {
  sum += probs[k] * multipliers[k];
}

console.log(`Sum 1..13: ${(sum * 100).toFixed(2)}%`);
// Let's refine multipliers so total is 96.00%
