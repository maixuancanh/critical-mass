// scripts/solve_exact_wad.mjs
// Exact integer arithmetic using BigInt
const T = 51n; // Threshold out of 256 (51/256 = 19.921875%)
const N = 256n;
const COMPL = N - T; // 205n

const edges = [];
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < 3; x++) {
    const u = y * 3 + x;
    edges.push([u, y * 3 + ((x + 1) % 3)]);
    edges.push([u, ((y + 1) % 3) * 3 + x]);
  }
}

function getClusterSize(startCell, activeEdgeMask) {
  const adj = Array.from({ length: 9 }, () => []);
  for (let e = 0; e < 18; e++) {
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

console.log("Computing exact integer weight sum per cluster size...");
const weights = new Array(10).fill(0n);
const TOTAL_DENOM = 256n ** 18n;

for (let mask = 0; mask < (1 << 18); mask++) {
  let openCount = 0;
  for (let e = 0; e < 18; e++) {
    if ((mask & (1 << e)) !== 0) openCount++;
  }
  const weight = (T ** BigInt(openCount)) * (COMPL ** BigInt(18 - openCount));
  const sz = getClusterSize(0, mask);
  weights[sz] += weight;
}

let totalW = 0n;
for (let k = 1; k <= 9; k++) {
  totalW += weights[k];
  const pct = Number(weights[k] * 1000000n / TOTAL_DENOM) / 10000;
  console.log(`Size ${k}: weight = ${weights[k].toString()}, prob = ${pct.toFixed(4)}%`);
}
console.log(`Total Weight == TOTAL_DENOM: ${totalW === TOTAL_DENOM}`);

// Now, let's pick clean multipliers in WAD (1e18):
// Target: E[Payout] / Wager = 0.96 * 1e18 = 960_000_000_000_000_000n
const TARGET_RTP_WAD = 960000000000000000n;
const ONE_WAD = 1000000000000000000n;

// Loss on Size 1 and 2 (total ~62% loss rate):
// Multiplier for size 1: 0
// Multiplier for size 2: 0
// Multiplier for size 3: 0.80x (800_000_000_000_000_000n)
// Multiplier for size 4: 1.50x (1_500_000_000_000_000_000n)
// Multiplier for size 5: 2.60x (2_600_000_000_000_000_000n)
// Multiplier for size 6: 4.50x (4_500_000_000_000_000_000n)
// Multiplier for size 7: 8.50x (8_500_000_000_000_000_000n)
// Multiplier for size 8: 18.00x (18_000_000_000_000_000_000n)
// Multiplier for size 9: Solved exactly to hit 0.96 WAD

const M = new Array(10).fill(0n);
M[1] = 0n;
M[2] = 0n;
M[3] = 800000000000000000n;   // 0.80x
M[4] = 1500000000000000000n;  // 1.50x
M[5] = 2600000000000000000n;  // 2.60x
M[6] = 4500000000000000000n;  // 4.50x
M[7] = 8500000000000000000n;  // 8.50x
M[8] = 1800000000000000000n; // 18.00x

let numeratorSumExcept9 = 0n;
for (let k = 1; k <= 8; k++) {
  numeratorSumExcept9 += weights[k] * M[k];
}

const targetNumerator = TARGET_RTP_WAD * TOTAL_DENOM;
const neededNumeratorFor9 = targetNumerator - numeratorSumExcept9;

M[9] = neededNumeratorFor9 / weights[9];
const remainder = neededNumeratorFor9 % weights[9];

console.log("\nExact Multipliers in WAD:");
for (let k = 1; k <= 9; k++) {
  const multFloat = Number(M[k]) / 1e18;
  console.log(`M[${k}] = ${M[k].toString()} (${multFloat.toFixed(4)}x)`);
}
console.log(`Remainder wei: ${remainder.toString()}`);

// Check achieved RTP
let totalEV = 0n;
for (let k = 1; k <= 9; k++) {
  totalEV += weights[k] * M[k];
}
const achievedRTP_WAD = totalEV / TOTAL_DENOM;
console.log(`Achieved RTP WAD: ${achievedRTP_WAD.toString()}`);
console.log(`Difference from 0.96 WAD: ${(achievedRTP_WAD - TARGET_RTP_WAD).toString()} wei`);
