# Attestr

**Decentralized media authenticator** — immutable proof of existence, chain of custody, and forensic analysis on Ethereum.

Built for **Innovate Bharat Hackathon 2026** by Team **Ctrl+Alt+Diablo** (CSBC114).

![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?logo=ethereum) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Node](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs) ![Firebase](https://img.shields.io/badge/Firebase-Auth+Firestore-FFCA28?logo=firebase)

## What is Attestr?

Attestr is a digital notary platform that creates permanent, tamper-proof records of media files on the Ethereum blockchain. By anchoring cryptographic fingerprints (SHA-256 + perceptual dHash) on-chain, Attestr establishes an immutable "Proof of Existence" at a specific point in time.

Beyond registration, Attestr provides a complete **chain of custody**: co-attestation (multi-party witness signing), custody transfers, revocation with audit trails, and device attestation — all timestamped and traceable.

**Zero-knowledge privacy**: media files never leave your device. Only mathematical fingerprints cross the network.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│  React 19 + Vite 8 + Tailwind 4 + Three.js              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Upload / │ │ SHA-256  │ │ dHash    │ │ ELA / EXIF │  │
│  │ Camera   │ │ Worker   │ │ Worker   │ │ Forensics  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────────┘  │
│       └────────────┴────────────┘                       │
│           hash + metadata only ↓                        │
├─────────────────────────────────────────────────────────┤
│                   SERVER (Express 5)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Register │ │ Verify   │ │ Custody  │ │ API Keys   │  │
│  │ /api/*   │ │ /api/*   │ │ Events   │ │ Firestore  │  │
│  └────┬─────┘ └────┬─────┘ └──────────┘ └────────────┘  │
│       └────────────┘                                    │
│        ↓ ethers.js 6                                    │
├─────────────────────────────────────────────────────────┤
│              ETHEREUM SEPOLIA                           │
│  MediaRegistry.sol @ 0x37FCD33D5FF07cfa3A75D27B4ec4cF09 │
│  Immutable · Public · Verifiable                        │
└─────────────────────────────────────────────────────────┘
```

## Features (22 shipped)

### Core & Forensics
- Client-side SHA-256 + 256-bit perceptual hashing (Web Workers)
- Ethereum registration with Etherscan receipts
- Instant verification — exact + fuzzy matching
- Pre-registration duplicate detection
- Error Level Analysis (adjustable 1x—30x)
- EXIF metadata extraction + anomaly flagging
- AI deepfake detection (HuggingFace ViT + 7 heuristic signals)

### Chain of Custody
- Full audit trail — every action timestamped in event log
- Co-attestation — multi-party witness signing
- Custody transfer between authenticated users
- Revocation with reason and audit log
- Device attestation (platform, timezone, screen resolution)
- QR-based instant verification badges
- Batch file registration with per-file progress tracking

### Platform & Integrations
- Google OAuth via Firebase Auth
- PDF custody reports with full timeline export
- Self-serve API key management (Firestore-backed)
- Public REST API v1 with interactive docs & "Try it" sandbox
- Chrome extension — right-click any image to verify
- Desktop agent — watched folder auto-registration
- Responsive desktop + mobile UIs
- Toast notification system with contextual feedback

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Three.js / R3F, Framer Motion |
| Backend | Express 5, Node.js, Firebase Admin SDK |
| Blockchain | Solidity 0.8.24, Hardhat 3, Ethers.js 6, Sepolia testnet |
| Auth & Storage | Firebase Auth (Google OAuth), Firestore (API keys) |
| Cryptography | SubtleCrypto (SHA-256), Canvas dHash, jsPDF, QR code generation |
| AI / Forensics | HuggingFace Inference (ViT, ResNet), Canvas ELA, EXIF.js |
| Extensions | Chrome Extension (Manifest V3), Desktop Agent (Node.js watcher) |

## Getting Started

### Prerequisites

- Node.js >= 18
- A Sepolia testnet wallet with test ETH ([faucet](https://sepoliafaucet.com/))
- Firebase project with Auth + Firestore enabled

### Environment Variables

Create a `.env` file:

```env
# Firebase (client)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id

# Firebase Admin (server) — base64-encoded service account JSON
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_json

# Ethereum
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=your_rpc_url

# Optional
HUGGINGFACE_API_KEY=your_hf_key
```

### Run Locally

```bash
npm install

# Start both frontend + backend
npm run dev        # Vite dev server → localhost:5173
npm run server     # Express server  → localhost:3001
```

### Build for Production

```bash
npx vite build     # outputs to dist/
node server.js     # serves API + static files
```

## API Reference

### Internal Endpoints (authenticated via Firebase token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register media (hash + metadata) |
| POST | `/api/verify` | Verify media against blockchain |
| GET | `/api/chain` | Get blockchain ledger stats |
| GET | `/api/activity` | Public activity feed |
| GET | `/api/my-media/:userId` | User's registered media |
| GET | `/api/block/:sha256` | Get specific block details |
| POST | `/api/register-url` | Register by URL (server-side fetch) |
| POST | `/api/co-attest` | Co-sign an attestation |
| POST | `/api/transfer-custody` | Transfer media custody |
| POST | `/api/revoke` | Revoke an attestation |
| GET | `/api/custody/:sha256` | Get custody timeline |
| POST | `/api/ai-detect` | AI deepfake detection |
| GET | `/api/status` | Server + contract status |

### Public API v1 (API key via `x-api-key` header)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/verify` | None | Verify any image (base64 or URL) |
| POST | `/api/v1/register` | API Key | Register media via API |
| GET | `/api/health` | None | Health check + uptime |

### API Key Management (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/keys/generate` | Generate new API key (max 5) |
| GET | `/api/keys` | List user's API keys |
| DELETE | `/api/keys/:id` | Revoke an API key |

## Smart Contract

**MediaRegistry.sol** — deployed on Ethereum Sepolia at `0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac`.

Stores SHA-256 and perceptual hashes. Handles registration and verification with immutable on-chain records.

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

[View on Etherscan →](https://sepolia.etherscan.io/address/0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac)

## Team — Ctrl+Alt+Diablo

| Member | Role |
|--------|------|
| Yash Gadia | Full-stack development, blockchain integration |
| Sweta Kumari | Research, forensic analysis pipeline |
| Priyanshi Shrotriya | UI/UX design, mobile experience |
| Shreyansh Khemka | Smart contract, testing |

Built at **Innovate Bharat Hackathon 2026** · Sharda University · CSBC114 · Panel 6

---

*Proving integrity in the age of deepfakes.*
