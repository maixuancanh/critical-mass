# Official Chain Casino SDK local-simulator evidence

This record distinguishes local integration evidence from a public-chain deployment.

## Verified local deployment

- SDK: official Chain Casino SDK v0.2.0 local simulator.
- RPC: `http://127.0.0.1:8545`.
- Chain ID: `31337` (Hardhat local chain).
- Deployed `CriticalMass` address: `0xa513e6e4b8f2a923d98304ec87f64353c4d5c853`.
- Game URL loaded by the production-faithful host harness: `http://127.0.0.1:5173`.
- Host harness: `http://localhost:3300`.

The simulator compiled the source contract, deployed and registered it, then ran the real local VRF flow. The harness uses the Chain SDK host/guest bridge and session lifecycle rather than the standalone mock mode.

## End-to-end result

One browser E2E run opened the host harness, mounted the cross-origin game iframe, submitted a wager, waited for VRF settlement, and observed:

```text
outcomeShown: true
outcome: CONTAINMENT STABLE (NO YIELD)
latestSession.sessionId: 4
latestSession.phaseName: SETTLED
latestSession.isSettled: true
latestSession.payout: 0
```

The connected iframe displayed a real vault balance (`1,000,000.00 USDC` test liquidity) before the wager. This demonstrates the bridge, manifest-compatible capabilities, contract lifecycle, randomness settlement, and game-state decoding together.

## Reproduce

1. Install the official Chain Casino SDK and run its local simulator:

   ```bash
   cd simulator
   npm run local-node
   npm run dev
   ```

2. Copy `contracts/CriticalMass.sol` into the simulator's `contracts/` folder. The watcher compiles and deploys every `ICasinoGameV2` implementation, then exposes its address at `http://localhost:3300/__local-contracts.json`.
3. Serve this project at port 5173 and open the harness with its game address:

   ```text
   http://localhost:3300/?game=http%3A%2F%2F127.0.0.1%3A5173&gameAddress=<deployed-address>
   ```

## Public-chain release gate

This local deployment is not a public-chain receipt. A public launch still requires a target-chain RPC and funded deployer, a stable HTTPS game URL, and Chain platform registration/whitelisting on the production `CasinoGameFacet`. Those platform-side values were not present in this workspace, so no public transaction was fabricated or broadcast.
