# CRITICAL MASS // Chain Jam Vol. 1 Submission

> **A Provably Fair Nuclear Reactor Chain Reaction Casino Game built on Chain Casino SDK (Base L2)**

[![RTP: 96.00%](https://img.shields.io/badge/Theoretical%20RTP-96.00%25-brightgreen)](scripts/verify-rtp.mjs)
[![Integer drift: -1 wei](https://img.shields.io/badge/Integer%20drift--1%20wei-blue)](scripts/verify-rtp.mjs)
[![Chain SDK](https://img.shields.io/badge/Chain%20Casino%20SDK-ICasinoGameV2-orange)](contracts/CriticalMass.sol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Introduction & Concept

**CRITICAL MASS** is an original on-chain casino game inspired by nuclear reactor physics and percolation theory. 

Unlike traditional casino games or clone mechanics (forbidden by Chain Jam rules), CRITICAL MASS introduces a **Toroidal Bond Percolation Cascade**:
1. A **3×3 Torus Reactor Matrix** contains 9 fuel chambers interconnected by **18 bidirectional energy conduits**.
2. The player selects a **Target Injection Chamber (Rod 1–9)** and enters a wager.
3. The platform's decentralized VRF generates a 256-bit seed. The contract evaluates which conduits conduct fission using **unbiased Rejection Sampling** (`byte < 51/256`, $p \approx 19.92\%$).
4. The neutron pulse triggers an automated chain reaction spreading along open conduits.
5. **Payout is determined by the total number of breached chambers ($K \in [1, 9]$)**, culminating in a **49.25x Critical Meltdown Jackpot** when all 9 chambers breach!

---

## 2. Certified Mathematical Proof & Paytable

CRITICAL MASS is built upon an **exact combinatorial state enumeration** across all $2^{18} = 262,144$ possible network states on a 3×3 torus. Due to toroidal topological symmetry, every starting chamber has the exact same probability distribution.

### Paytable & Exact Probabilities

| Breached Chambers | Exact Theoretical % | Multiplier | EV Contribution |
| :---: | :---: | :---: | :---: |
| **1 Chamber** | 41.1202% | **0.00x** | 0.0000% |
| **2 Chambers** | 21.0122% | **0.00x** | 0.0000% |
| **3 Chambers** | 13.4980% | **0.40x** | 5.3992% |
| **4 Chambers** | 8.7560% | **0.80x** | 7.0048% |
| **5 Chambers** | 6.2973% | **1.50x** | 9.4459% |
| **6 Chambers** | 4.4165% | **2.80x** | 12.3662% |
| **7 Chambers** | 2.7811% | **5.50x** | 15.2960% |
| **8 Chambers** | 1.5528% | **12.00x** | 18.6336% |
| **9 Chambers (MELTDOWN)** | 0.5655% | **49.2504x** | 27.8511% |

$$\mathbf{Total\ Theoretical\ RTP} = \sum_{k=1}^9 P(k) \times Multiplier(k) = \mathbf{96.000000\%}$$

* **Integer drift from 0.96 WAD**: **-1 wei** due to integer division truncation (the displayed RTP rounds to 96.000000%).
* **Monte Carlo Verification**: `scripts/verify-rtp.mjs` simulates 1,000,000 rounds and checks that the measured distribution remains within statistical tolerance; the measured RTP varies naturally from run to run.

---

## 3. Technical Architecture

```
critical-mass/
├── contracts/
│   ├── ICasinoGameV2.sol         # Canonical interface from Chain SDK
│   └── CriticalMass.sol          # Production Solidity contract (instant game, gas ~38k)
├── scripts/
│   ├── verify-rtp.mjs            # Combinatorial 262k enumeration & 1M Monte Carlo proof
│   ├── test_contract_logic.mjs   # Verified equivalence between Solidity BFS and JS
│   └── test_wager_validation.mjs # Rejects invalid, oversized, and unfunded wagers
├── public/
│   ├── game.manifest.json        # Canonical game manifest for Chain host
│   └── favicon.svg               # Vector nuclear hazard badge
├── src/
│   ├── audio/
│   │   └── GeigerAudio.ts        # Pure procedural Web Audio API (Geiger clicks & sirens)
│   ├── bridge/
│   │   ├── types.ts              # Chain Casino SDK type definitions
│   │   └── guest.ts              # Penpal iframe bridge connector
│   ├── components/
│   │   ├── ControlPanel.tsx      # Wager presets, sound toggle, trigger controls
│   │   ├── ReactorCanvas.tsx     # HTML5 2D Canvas with CRT scanlines & light conduits
│   │   ├── PayoutLadder.tsx      # Dynamic multiplier ladder with active tier glow
│   │   └── StandaloneBanner.tsx  # Host connection indicator & Standalone demo badge
│   ├── engine/
│   │   ├── types.ts              # Game engine types
│   │   └── reactorSimulation.ts  # Client-side BFS & on-chain state decoder
│   ├── App.tsx                   # Main orchestrator
│   └── index.css                 # 1980s Phosphor terminal styling
└── index.html                    # Embeds required Jam widget script tag
```

Local Chain Casino SDK simulator evidence is recorded in [docs/LOCAL_SIMULATOR_E2E.md](docs/LOCAL_SIMULATOR_E2E.md).

---

## 4. Key Highlights for Chain Jam Vol. 1 Judges

1. **NOVELTY**: Completely novel game loop. It is not Blackjack, Roulette, Crash, Plinko, Limbo, Dice, or Mines.
2. **SIMPLICITY**: One decision (pick your chamber + wager) and one click to trigger. No manual needed.
3. **FUN (10-Hour Replayability)**: Near-miss tension when 7 or 8 chambers breach, accompanied by authentic procedural Geiger counter clicks, building up to an explosive 49.25x Meltdown Jackpot.
4. **VISUAL & SOUND**: Zero AI slop. 100% hand-crafted Canvas 2D CRT phosphor aesthetic and synthetic Web Audio API sound synthesis.
5. **STANDALONE DEMO READY**: When opened directly in any browser (outside the Chain iframe), it immediately boots in Standalone Demo Mode with 1,000.00 USDC mock liquidity.
6. **JAM WIDGET INCLUDED**: Fully verified with `<script async src="https://jam.chain.wtf/widget.js"></script>`.

---

## 5. Running the Project Locally

### Prerequisites
* Node.js v18+ (tested on v24.14.1)

### Run Mathematical Verification
```bash
node scripts/verify-rtp.mjs
```

### Run Logic Equivalence Test
```bash
node scripts/test_contract_logic.mjs
```

### Start Frontend Dev Server
```bash
npm install
npm run dev
```
Open **http://localhost:3300** in your browser.

---

## 6. Submission Details for jam.chain.wtf

* **Game Title**: Critical Mass
* **Declared RTP**: 96.00%
* **Pitch**:
> Critical Mass is an original on-chain nuclear cascade casino game built on the Chain Casino SDK. Players target an injection chamber on a 3×3 toroidal reactor core and trigger a neutron pulse. 18 energy conduits undergo unbiased VRF rejection sampling to determine fission pathways. With an exact 262,144-state combinatorial proof, an integer-rounding drift of only -1 wei from the 96.00% RTP target, and an escalating procedural Geiger audio engine, players chase an exhilarating 49.25x Critical Meltdown Jackpot. Built with hand-crafted CRT phosphor aesthetics, no AI slop, and instant standalone demo playability.
