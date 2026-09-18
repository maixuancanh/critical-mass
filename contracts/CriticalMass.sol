// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ICasinoGameV2, SessionContext, StepResult, SessionPhase } from "./ICasinoGameV2.sol";

/**
 * @title CriticalMass
 * @notice Nuclear Reactor Chain Reaction Casino Game
 * @dev Implements ICasinoGameV2 for Chain.wtf.
 *      Theoretical RTP: 96.0000% displayed; integer rounding is -1 wei from 0.96 WAD.
 *      Topology: 3x3 Torus Bond Percolation (18 edges).
 *      Randomness: Independent byte rejection threshold (< 51/256).
 */
contract CriticalMass is ICasinoGameV2 {
  // --- Errors ---
  error CriticalMass__InvalidGameData();
  error CriticalMass__NoPlayerAction();
  error CriticalMass__InvalidChamber();

  // --- Constants & Math ---
  uint8 public constant CHAMBER_COUNT = 9;
  uint8 public constant EDGE_COUNT = 18;
  uint8 public constant PERCOLATION_THRESHOLD = 51; // 51/256 = 19.921875%

  // Multipliers in WAD (1e18) matching scripts/verify-rtp.mjs
  uint256 public constant MULTIPLIER_1_WAD = 0;
  uint256 public constant MULTIPLIER_2_WAD = 0;
  uint256 public constant MULTIPLIER_3_WAD = 400_000_000_000_000_000;   // 0.40x
  uint256 public constant MULTIPLIER_4_WAD = 800_000_000_000_000_000;   // 0.80x
  uint256 public constant MULTIPLIER_5_WAD = 1_500_000_000_000_000_000; // 1.50x
  uint256 public constant MULTIPLIER_6_WAD = 2_800_000_000_000_000_000; // 2.80x
  uint256 public constant MULTIPLIER_7_WAD = 5_500_000_000_000_000_000; // 5.50x
  uint256 public constant MULTIPLIER_8_WAD = 12_000_000_000_000_000_000; // 12.00x
  uint256 public constant MULTIPLIER_9_WAD = 49_250_439_152_323_925_485; // 49.2504x (Meltdown)

  uint256 public constant MAX_MULTIPLIER_WAD = MULTIPLIER_9_WAD;
  uint256 public constant TARGET_RTP_WAD = 960_000_000_000_000_000; // 96.00%
  uint256 public constant MELTDOWN_PROBABILITY_WAD = 5_655_000_000_000_000; // 0.5655%

  // --- ICasinoGameV2 Implementation ---

  function quoteCaps(
    uint256 wager,
    bytes calldata /* gameData */
  ) external pure override returns (uint256 maxEscrowStake, uint256 maxReservedProfit) {
    maxEscrowStake = wager;
    uint256 maxPayout = (wager * MAX_MULTIPLIER_WAD) / 1e18;
    maxReservedProfit = maxPayout > wager ? maxPayout - wager : 0;
  }

  function quoteRiskParams(
    uint256 wager,
    bytes calldata /* gameData */
  )
    external
    pure
    override
    returns (
      uint256 maxPayout,
      uint256 probabilityWad,
      uint256 expectedPayout,
      uint256 subJackpotVarianceScaled
    )
  {
    maxPayout = (wager * MAX_MULTIPLIER_WAD) / 1e18;
    probabilityWad = MELTDOWN_PROBABILITY_WAD;
    expectedPayout = (wager * TARGET_RTP_WAD) / 1e18;
    subJackpotVarianceScaled = 0;
  }

  function onSessionStart(
    SessionContext calldata ctx
  ) external pure override returns (StepResult memory stepResult) {
    if (ctx.gameData.length == 0) revert CriticalMass__InvalidGameData();
    uint8 startChamber = abi.decode(ctx.gameData, (uint8));
    if (startChamber >= CHAMBER_COUNT) revert CriticalMass__InvalidChamber();

    uint256 maxPayout = (ctx.wagerBase * MAX_MULTIPLIER_WAD) / 1e18;
    uint256 maxReservedProfit = maxPayout > ctx.wagerBase ? maxPayout - ctx.wagerBase : 0;

    stepResult.newGameState = abi.encode(startChamber);
    stepResult.escrowDelta = 0;
    stepResult.reservedProfitDelta = int256(maxReservedProfit);
    stepResult.nextPhase = SessionPhase.WAITING_RANDOMNESS;
    stepResult.requestRandomnessNow = true;
    stepResult.payout = 0;
  }

  function onPlayerAction(
    SessionContext calldata,
    bytes calldata
  ) external pure override returns (StepResult memory) {
    revert CriticalMass__NoPlayerAction();
  }

  function onRandomness(
    SessionContext calldata ctx,
    bytes32 randomness
  ) external pure override returns (StepResult memory stepResult) {
    uint8 startChamber = abi.decode(ctx.gameState, (uint8));

    // 1. Decode active edges
    uint32 activeEdgeMask = 0;
    for (uint8 e = 0; e < EDGE_COUNT; e++) {
      if (uint8(randomness[e]) < PERCOLATION_THRESHOLD) {
        activeEdgeMask |= (uint32(1) << e);
      }
    }

    // 2. Perform BFS on 3x3 Torus
    (uint8 clusterSize, uint16 visitedMask) = _simulateFissionCascade(startChamber, activeEdgeMask);

    // 3. Look up multiplier and compute payout
    uint256 multiplierWad = getMultiplierWad(clusterSize);
    uint256 payout = (ctx.wagerBase * multiplierWad) / 1e18;

    // 4. Return StepResult
    stepResult.newGameState = abi.encode(
      startChamber,
      clusterSize,
      visitedMask,
      activeEdgeMask,
      multiplierWad,
      payout
    );
    stepResult.escrowDelta = 0;
    stepResult.reservedProfitDelta = 0;
    stepResult.nextPhase = SessionPhase.SETTLED;
    stepResult.requestRandomnessNow = false;
    stepResult.payout = payout;
  }

  function quoteForfeitPayout(
    SessionContext calldata
  ) external pure override returns (uint256) {
    return 0; // Instant game: no mid-session cashout
  }

  // --- Internal Fission Simulation (Stack-Optimized) ---

  function _simulateFissionCascade(
    uint8 startChamber,
    uint32 activeEdgeMask
  ) internal pure returns (uint8 size, uint16 visitedMask) {
    visitedMask = uint16(1) << startChamber;
    uint8[9] memory queue;
    uint8 head = 0;
    uint8 tail = 0;

    queue[tail++] = startChamber;
    size = 0;

    while (head < tail) {
      uint8 cur = queue[head++];
      size++;

      // Neighbor 0: Right (x+1)%3, y | edge = 2*cur
      {
        uint8 n = (cur / 3) * 3 + ((cur % 3 + 1) % 3);
        uint8 e = 2 * cur;
        if ((activeEdgeMask & (uint32(1) << e)) != 0 && (visitedMask & (uint16(1) << n)) == 0) {
          visitedMask |= (uint16(1) << n);
          queue[tail++] = n;
        }
      }

      // Neighbor 1: Down x, (y+1)%3 | edge = 2*cur + 1
      {
        uint8 n = (((cur / 3) + 1) % 3) * 3 + (cur % 3);
        uint8 e = 2 * cur + 1;
        if ((activeEdgeMask & (uint32(1) << e)) != 0 && (visitedMask & (uint16(1) << n)) == 0) {
          visitedMask |= (uint16(1) << n);
          queue[tail++] = n;
        }
      }

      // Neighbor 2: Left (x+2)%3, y | edge = 2*n
      {
        uint8 n = (cur / 3) * 3 + ((cur % 3 + 2) % 3);
        uint8 e = 2 * n;
        if ((activeEdgeMask & (uint32(1) << e)) != 0 && (visitedMask & (uint16(1) << n)) == 0) {
          visitedMask |= (uint16(1) << n);
          queue[tail++] = n;
        }
      }

      // Neighbor 3: Up x, (y+2)%3 | edge = 2*n + 1
      {
        uint8 n = (((cur / 3) + 2) % 3) * 3 + (cur % 3);
        uint8 e = 2 * n + 1;
        if ((activeEdgeMask & (uint32(1) << e)) != 0 && (visitedMask & (uint16(1) << n)) == 0) {
          visitedMask |= (uint16(1) << n);
          queue[tail++] = n;
        }
      }
    }
  }

  function getMultiplierWad(uint8 clusterSize) public pure returns (uint256) {
    if (clusterSize <= 2) return 0;
    if (clusterSize == 3) return MULTIPLIER_3_WAD;
    if (clusterSize == 4) return MULTIPLIER_4_WAD;
    if (clusterSize == 5) return MULTIPLIER_5_WAD;
    if (clusterSize == 6) return MULTIPLIER_6_WAD;
    if (clusterSize == 7) return MULTIPLIER_7_WAD;
    if (clusterSize == 8) return MULTIPLIER_8_WAD;
    if (clusterSize >= 9) return MULTIPLIER_9_WAD;
    return 0;
  }
}
