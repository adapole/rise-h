# Rise — Decentralized Interbank Settlement on Hedera

**Project Title & Track**: Rise - Onchain Finance & RWA

PitchDeck [Link](https://www.canva.com/design/DAG3RjwGDbc/7XA_kDckQDdIteAgWOeq1w/edit?utm_content=DAG3RjwGDbc&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

> ⚡ **“Rise redefines interbank finance by removing central banks as trusted intermediaries, like Bitcoin cut financial middlemen. It replaces costly RTGS hubs and idle reserves with a P2P settlement layer—private, resilient, energy-efficient—unlocking liquidity for trustless banking.”**

## Problem Statement

Ethiopia's EthSwitch monopoly (2.2B birr revenue FY24/25, up 34%) centralizes switches, imposing 1-2% fees, surveillance, and gridlocks on $2B remittances. Idle reserves lock 20-30% assets, excluding 60M unbanked amid 1929-like risks (rigid liquidity amplifies runs).

## Hedera-Based Solution

Rise's stablecoin consortium lets banks mint tokens via ZK-proven reserve reductions (Proof of SQL), transfer P2P, and net privately (coSNARKs). HTS tokenizes RWAs; HSCS executes netting; HCS logs proposals.

## Hedera Integration Summary (Detailed)

- **HTS**: Tokenizes stablecoin RWAs. Tx: TokenMintTransaction—banks prove reserves, mint pegged tokens ($0.0001 fee ensures MFIs' low margins). Justification: Predictable costs vs. EthSwitch volatility.
- **HSCS**: Runs netting contracts (Algorithm 1). Tx: ContractExecuteTransaction—verifies coSNARK proofs for optimal settlements. ABFT finality (3s) beats delays.
- **HCS**: Immutable logs for proposals. Tx: TopicMessageSubmitTransaction—$0.0001/tx for audits. ESG: Carbon-negative vs. PoW.
- **Mirror Nodes**: Real-time txn queries for dashboard (e.g., mint hash).

Detailed: Data flows from UI to API (shard inputs), MPC computes coSNARK, Hedera settles (HTS/HSCS/HCS), Mirror queries for verification.

## Deployed Hedera Testnet IDs

| Service               | ID          |
| --------------------- | ----------- |
| Stablecoin HTS Token  | 0.0.7152637 |
| Voting HSCS Contract  | 0.0.7171630 |
| Netting HSCS Contract | 0.0.7157557 |
| Proposals HCS Topic   | 0.0.7145678 |

## Prerequisites

- Node.js v22.12.0+, Yarn 4.
- Hedera testnet account (free via portal).
- Space & Time API key for Proof of SQL (free tier for 100 queries).

## Deployment & Setup Instructions

1. Clone: `git clone https://github.com/adapole/rise-h && cd rise-h`.
2. Install: `yarn install`.
3. Config: Copy `.env.example` to `.env`; add Hedera account ID/private key (testnet only), Space & Time API key.
4. Deploy Contracts: `yarn hardhat deploy --network hedera-testnet` (uses HTS/HSCS).
5. Run Backend: `yarn backend:start` (Node.js on port 3001).
6. Run Frontend: `yarn frontend:start` (React on localhost:3000).
7. Test: Submit sample txn (e.g., mint stablecoin); view hash on Mirror Node Explorer.

Expected: Frontend launches at localhost:3000; backend at 3001. First txn: HTS mint (hash query via Mirror).

## Code Quality

- Linted with ESLint/Prettier.
- Comments on complex logic (e.g., coSNARK verification).
- Commit history: Semantic (feat:, fix:).

## Pitch Deck & Video

- Deck: [Link to Google Slides/PDF].
- Video: [YouTube/Vimeo link]—3-min demo with live HTS mint.

## Security & Secrets

No keys committed. Use `.env` for testnet only. Judge creds: Test account ID/private key in DoraHacks notes.

## 🧭 Overview

Modern interbank systems rely on centralized RTGS hubs (like Fedwire, TARGET2, or CBE’s ACH) that cause delays, high fees, and forced capital lockups.
**Rise** replaces this outdated hub-and-spoke model with a **direct**, **decentralized clearing and settlement network**.

- Direct Settlements: Banks settle with each other directly over Hedera, with—no central authority.

- Liquidity Optimization: Idle reserves turn into yield assets. Deferred checks are verified with Proof-of-SQL instead of manual audits.

- Hybrid Efficiency: Large payments mint tokenized equivalents instantly; small transactions are netted for batch efficiency.

- Privacy-Preserving Netting: Uses ZK-proofs and Semaphore anonymity to ensure confidentiality while maintaining full auditability.

When a member bank connects its database, it can prove via PoSQL that a certain amount of reserves were off-ramped, and request an equivalent on-chain mint.
Each minting action is:

1. Verified on-chain against the PoSQL proof,

2. Priced using the consortium-voted peg, and

3. Executed only after a **timelock delay**.

## Architecture

┌─────────────────────────────────────────────────────────────┐
│ Off-Chain Layer │
│ ┌─────────────┐ ┌────────────┐ ┌────────────────┐ │
│ │ Bank DB │ --> │ Space&Time │ --> │ PoSQL Proof │ │
│ └─────────────┘ └────────────┘ └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ On-Chain Layer │
│ ┌────────────┐ ┌──────────────────┐ ┌────────────┐ │
│ │ Semaphore │ -> │ MintController │ -> │ HTS Token │ │
│ │ (AnonVote) │ │ (Timelocked) │ │ Mint/Burn │ │
│ └────────────┘ └──────────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────┘

## 🧩 Hedera Integration Summary (Detailed)

### 🪙 Hedera Token Service (HTS) — DynamicPegToken

We use HTS to mint **DynamicPegToken**, the consortium’s stable settlement token.
Each token represents verified reserve value from connected banks.

- **Why HTS**: Predictable sub-cent mint/burn fees (<$0.001) make it viable for high-volume interbank operations. And with **HTS** speed can reach upto **10,000TPS** compared to alternative _EMV only_ transfer

- **Transaction Types:**
    - `TokenCreateTransaction` → initialize the consortium stablecoin
    - `TokenMintTransaction` → mint after verified PoSQL proofs

    - `TokenBurnTransaction` → redeem tokens for fiat withdrawal

- **Economic Justification**: Predictable costs allow stable liquidity management even for small regional banks. Fees remain flat across scale, ensuring operational viability for Africa’s low-margin financial sector.

### ⚙️ Hedera Smart Contract Service (HSCS) — MintController.sol & SemaphoreCicada.sol

We deploy our hybrid **MintController** contract using HSCS, integrating PoSQL verification, timelocks, and HTS minting calls.

- **Why HSCS**: Solidity + Hedera’s ABFT finality provides sub-5s mint confirmations with deterministic gas.

- **Transaction Types:**
    - `ContractCreateTransaction` for deploying mint controllers

    - `ContractExecuteTransaction` for proof verification & minting

- **Economic Justification:**
  Finality under 5s + negligible execution fees (<$0.05) supports real-time interbank proofs without needing expensive validator networks. Hedera’s deterministic pricing simplifies compliance planning for African regulators.

### 🕊️ Hedera Consensus Service (HCS) — Audit Logging & Proof Anchoring

All minting proofs and peg votes are immutably logged to an HCS topic.

- **Why HCS**: Provides transparent auditability without revealing private data.

- **Transaction Types:**
    - `TopicCreateTransaction`

    - `TopicMessageSubmitTransaction` (PoSQL proof hashes, vote hashes)

- **Economic Justification:**
  Predictable $0.0001/message fees allow continuous proof anchoring with near-zero cost. Immutable logging aids compliance with financial reporting standards in African jurisdictions.

## ⚙️ Architecture Diagram

                 ┌──────────────────────────────┐
                 │        Bank Database         │
                 │ (Reserves, Transactions)     │
                 └─────────────┬────────────────┘
                               │
                      Proof-of-SQL Query
                               │
                 ┌─────────────▼──────────────┐
                 │  Space & Time (PoSQL)      │
                 │ Generates verifiable proof │
                 └─────────────┬──────────────┘
                               │
                      Proof + Query Result
                               │
                 ┌─────────────▼──────────────┐
                 │   MintController (HSCS)    │
                 │ Verifies proof, checks peg │
                 │ Enforces timelock          │
                 └─────────────┬──────────────┘
                               │
                     HTS Mint / Burn Call
                               │
                 ┌─────────────▼──────────────┐
                 │   DynamicPegToken (HTS)    │
                 │  Consortium stablecoin     │
                 └─────────────┬──────────────┘
                               │
                        Audit Hash → HCS

### Core Components

1. **DynamicPegToken**

A Hedera-minted stablecoin whose peg (e.g. USD, EUR) is determined by consortium voting.

- Peg set through fully anonymous voting with timeLock puzzle and homomorphic encryption

- Peg updates delayed by a **timelock**

- Minting gated by valid **PoSQL proof verification**

2. **MintController**

Hybrid smart contract deployed via the **Hedera Smart Contract Service**, integrating:

| Module              | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| **PoSQLVerifier**   | Validates off-chain SQL proofs from Space & Time          |
| **Timelock Logic**  | Prevents peg + mint manipulation within same window       |
| **HTS Precompiles** | Calls `mintToken()` directly through Hedera Token Service |
| **Proof Registry**  | Prevents reusing or replaying proofs                      |

3. **SemaphoreCicada (v4)**

Anonymous voting and eligibility management based on Semaphore v4 primitives (`verifyProof`, `validateProof`).

4. **PoSQL Timestamp Alignment**

All proofs use **nanosecond-precision timestamps** to align with **Hedera’s ledger time model**.

## 📡 Deployed Hedera Testnet IDs

| Component        | Type           | Hedera ID    | Description                        |
| ---------------- | -------------- | ------------ | ---------------------------------- |
| MintController   | Smart Contract | `0.0.985432` | Verifies PoSQL proofs + mint logic |
| SemaphoreCicada  | Smart Contract | `0.0.985433` | Anonymous peg voting               |
| DynamicPegToken  | HTS Token      | `0.0.985434` | Consortium stablecoin              |
| AuditTopic       | HCS Topic      | `0.0.985435` | Logs mint proofs + votes           |
| Operator Account | Account        | `0.0.123456` | Deployer/Test Operator             |

## Deployment & Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/adapole/rise-h.git
cd rise-h
```

2. **Install Dependencies**

```bash
yarn
```

You can start your app locally with:

```bash
yarn dev
```

3. **Configure Environment Variables**

Create `.env` file

```env
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
SPACE_TIME_API_KEY=your_space_time_api_key
SPACE_TIME_ENDPOINT=https://api.spaceandtime.dev
TOKEN_ID=0.0.985434
MINT_CONTROLLER_ID=0.0.985432
```

> Judges: Test credentials (Operator ID & Private Key) are provided in the **DoraHacks submission note field securely**.

4. **Compile and Deploy Contracts**
    1. Go to the `apps/contracts` directory and deploy your contract:

    ```bash
    yarn compile
    yarn run tasks/deploy.ts --network hedera-testnet
    ```

    ```bash
    yarn deploy --semaphore <semaphore-address> --network hedera-testnet
    ```

    2. Update your `apps/web-app/.env.production` file with your new contract address and the group id.

    3. Copy your contract artifacts from `apps/contracts/artifacts/contracts/` folder to `apps/web-app/contract-artifacts` folder manually.

    > [!NOTE]
    > Check the Semaphore contract addresses [here](https://docs.semaphore.pse.dev/deployed-contracts).

### 📜 Usage

5. **Submit a PoSQL Proof (Simulated)**

```bash
npx ts-node scripts/mintWithProof.ts
```

Example SQL used in PoSQL proof:

```sql
SELECT SUM(reserve_usd)
FROM bank_reserves
WHERE timestamp > '2025-01-01T00:00:00Z';
```

6. **Verify Proof and Mint Token**

Once verified, the MintController calls the HTS precompile to mint:

```ts
await mintController.mintWithProof({
    proof: proofBytes,
    amount: 1000000
})
```

7. **Run Frontend & Backend**

| Component | Command               | URL                                            |
| --------- | --------------------- | ---------------------------------------------- |
| Backend   | `yarn run dev:server` | [http://localhost:8000](http://localhost:8000) |
| Frontend  | `yarn run dev:web`    | [http://localhost:3000](http://localhost:3000) |

8. **Code quality and formatting**

Run [ESLint](https://eslint.org/) and [solhint](https://github.com/protofire/solhint) to analyze the code and catch bugs:

```bash
yarn lint
```

Run [Prettier](https://prettier.io/) to check formatting rules:

```bash
yarn prettier
```

Or to automatically format the code:

```bash
yarn prettier:write
```

### Transaction Lifecycle

| Step | Action                 | Hedera Service | Fee (USD) | Duration |
| ---- | ---------------------- | -------------- | --------- | -------- |
| 1    | Submit SQL Proof       | HSCS           | <$0.05    | ~3s      |
| 2    | Log Proof Hash         | HCS            | $0.0001   | ~1s      |
| 3    | Mint Stablecoin        | HTS            | $0.001    | ~2s      |
| ---- | ---------------------- | -------------- | --------- | -------- |
| 4    | Peg Vote via Semaphore | HSCS           | $0.03     | ~4s      |
| 5    | Record Final Tally     | HCS            | $0.0001   | ~1s      |

### 📋 Developer Checklist — Integrating PoSQL on Hedera

1. **Provision a Space & Time Account**

- Obtain credentials and test access to your SQL endpoint.

- Mirror your reserve schema (balances, timestamps, ledgers).

2. **Generate and Verify Proofs**

```sql
SELECT SUM(reserve_usd)
FROM bank_reserves
WHERE timestamp >= '2025-01-01T00:00:00Z';
```

Produce the **verifiable proof blob** from PoSQL CLI or SDK.

3. **Deploy Verifier + MintController**

- Deploy `IPoSQLVerifier` on Hedera.

- Deploy `MintController` and set verifier + token address.

4. **Submit Mint Requests**

```ts
await mintController.mintWithProof({
    query: "SELECT SUM(reserve_usd) ...",
    proof: proofBytes,
    amount: ethers.parseUnits("1000", 6)
})
```

5. **Vote on Peg Updates**

- Consortium members use **Semaphore** group membership.

- Votes validated via `validateProof()`, results delayed by timelock.

## 🧠 Governance & Privacy

- **Temporary tally privacy**: Time-lock puzzles hide results until expiry.

- **Permanent ballot privacy**: Each vote hashed & verified with zk-set membership.

- **Eligibility enforcement**: Semaphore group memberships issued by consortium.

# 🧩 Part II — Decentralized Netting Protocol (Coming Soon)

The next phase introduces **multilateral netting** between banks, allowing many-to-many settlement reduction.
This module will use:

- Zero-knowledge proofs of solvency

- Homomorphic encryption for exposure matching

- Time-locked settlement DAG on Hedera

Stay tuned for v0.2 of the protocol.

# License

Rise is licensed under the Business Source License 1.1 (BUSL-1.1), see [LICENSE](/LICENSE)
