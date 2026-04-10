# Attestr — Decentralized Media Authenticator

<p align="center">
  <strong>Immutable proof of existence, chain of custody & forensic analysis on Ethereum</strong>
</p>

<p align="center">
  <a href="https://attestrindia-production.up.railway.app">🌐 Live Website</a> · 
  <a href="https://github.com/yash113gadia/Attestr_India/releases/tag/v1.0.0">📱 Download Android APK</a> · 
  <a href="https://sepolia.etherscan.io/address/0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac">🔗 Smart Contract on Etherscan</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?logo=ethereum" />
  <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express" />
  <img src="https://img.shields.io/badge/Firebase-Auth+Firestore-FFCA28?logo=firebase" />
  <img src="https://img.shields.io/badge/Ethers.js-6-7B3FE4" />
</p>

**Built for Innovate Bharat Hackathon 2026 · Team Ctrl+Alt+Diablo · CSBC114 · Panel 6**

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [What is Attestr?](#what-is-attestr)
- [Architecture](#architecture)
- [Platform Overview](#platform-overview)
- [Features (30+ shipped)](#features-30-shipped)
- [Security Model](#security-model)
- [Smart Contract](#smart-contract)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Team](#team--ctrlaltdiablo)

---

## Problem Statement

In the age of AI-generated deepfakes and trivially editable media, there is no reliable way to prove:
1. **When** a photo/video was originally created
2. **Whether** it has been tampered with since creation
3. **Who** captured it and on what device

Journalists, legal professionals, insurance investigators, and citizens need a trustless system to establish media authenticity — without relying on any single authority.

## What is Attestr?

Attestr is a **digital notary platform** that creates permanent, tamper-proof records of media files on the Ethereum blockchain. By anchoring cryptographic fingerprints (SHA-256 + perceptual dHash) on-chain, Attestr establishes an immutable **"Proof of Existence"** at a specific point in time.

Beyond registration, Attestr provides a complete **chain of custody**: co-attestation (multi-party witness signing), custody transfers, revocation with audit trails, and device attestation — all timestamped and traceable on the blockchain.

Attestr spans **five surfaces** — web platform, Android app, Chrome extension, desktop agent, and public REST API — forming a complete ecosystem where media can be sealed and verified from any device, anywhere.

> **Zero-knowledge privacy**: Media files **never leave your device**. Only mathematical fingerprints (hashes) cross the network. Your images are never uploaded to any server.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SURFACES                          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐  ┌───────────┐   │
│  │  Web App    │  │  Android App │  │ Chrome │  │  Desktop  │   │
│  │  React 19   │  │  React Native│  │  Ext.  │  │  Agent    │   │
│  │  Vite 8     │  │  Expo SDK 52 │  │  MV3   │  │  Node.js  │   │
│  │  Tailwind 4 │  │  7-layer sec │  │        │  │  Watcher  │   │
│  └──────┬──────┘  └──────┬───────┘  └───┬────┘  └─────┬─────┘   │
│         │                │              │             │         │
│    Only hashes      Signed envelope   Hash only    Hash only    │
│         │                │              │              │        │
│         └────────────────┴──────────────┴──────────────┘        │
│                              ↓                                  │
├─────────────────────────────────────────────────────────────────┤
│                     SERVER (Express 5)                          │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │ Register │ │ Verify   │ │ Custody  │ │ Firebase Auth     │   │
│  │ endpoint │ │ endpoint │ │ Events   │ │ + Firestore Keys  │   │
│  └────┬─────┘ └────┬─────┘ └──────────┘ └───────────────────┘   │
│       └─────┬──────┘                                            │
│             ↓ ethers.js 6                                       │
├─────────────────────────────────────────────────────────────────┤
│                    ETHEREUM SEPOLIA                             │
│                                                                 │
│  MediaRegistry.sol @ 0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ register(sha256, dHash, filename, size, mime)            │   │
│  │ verify(sha256) → (exists, record)                        │   │
│  │ fuzzyMatch(dHash, threshold) → matches[]                 │   │
│  │ getRecord(index) · totalRegistered() · allHashes[]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Immutable · Public · Verifiable · Gas-optimized                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Zero-Knowledge Registration

```
User selects file
  → SHA-256 computed in Web Worker (file never leaves device)
  → Perceptual dHash computed via canvas downsampling
  → EXIF metadata extracted locally
  → {sha256, dHash, filename, size, mime} sent to server
  → Server calls MediaRegistry.register() on Sepolia
  → Etherscan TX receipt returned to user
  → File stays on user's device — never uploaded
```

---

## Platform Overview

### 1. Web Platform (`src/`)
Full-featured React 19 SPA with responsive desktop + mobile layouts. Upload or capture media directly in-browser, get instant blockchain verification, explore the public ledger, and generate PDF custody reports.

**Live at**: [attestrindia-production.up.railway.app](https://attestrindia-production.up.railway.app)

### 2. Android App (separate repo: `attestr-mobile/`)
Native Android app built with React Native 0.76 + Expo SDK 52. Field capture with instant camera, background processing queue, 7-layer security pipeline, Google Sign-In for persistent data, GPS/sensor attestation baked into every registration.

**Download**: [APK on GitHub Releases](https://github.com/yash113gadia/Attestr_India/releases/tag/v1.0.0)

### 3. Chrome Extension (`extension/`)
Right-click any image on the web → "Verify with Attestr" → instant blockchain lookup. Manifest V3 with service worker architecture.

### 4. Desktop Agent (`desktop-agent/`)
Node.js folder watcher that auto-registers new media files as they're saved. Drop it into any directory and every new image/video gets sealed on the blockchain automatically.

### 5. Public REST API (`api/`)
Self-serve API key management via the dashboard. Third-party apps can register and verify media programmatically with simple HTTP calls.

---

## Features (30+ shipped)

### Blockchain & Cryptography
| Feature                  | Description                                                  |
|--------------------------|--------------------------------------------------------------|
| SHA-256 hashing          | Client-side via Web Workers — file never uploaded            |
| Perceptual dHash         | 256-bit difference hash for fuzzy/near-duplicate matching    |
| On-chain registration    | Immutable record on Ethereum Sepolia with TX receipt         |
| Instant verification     | Exact match (SHA-256) + fuzzy match (dHash Hamming distance) |
| Pre-reg duplicate check  | Warns before registration if hash already exists             |
| Etherscan proof          | Direct link to blockchain transaction for every registration |

### Forensic Analysis
| Feature | Description |
|---------|-------------|
| Error Level Analysis (ELA) | Adjustable sensitivity 1x–30x, reveals spliced/edited regions |
| EXIF metadata extraction | Camera model, GPS, timestamps, software — with anomaly flagging |
| AI deepfake detection | HuggingFace ViT + ResNet ensemble with 7 heuristic signals |
| Side-by-side comparison | Visual diff between original and re-compressed versions |

### Chain of Custody
| Feature | Description |
|---------|-------------|
| Full audit trail | Every action (register, attest, transfer, revoke) timestamped |
| Co-attestation | Multi-party witness signing — anyone can countersign a registration |
| Custody transfer | Formal ownership transfer between authenticated users |
| Revocation | Soft-revoke with reason, preserved in audit log |
| Device attestation | Platform, timezone, screen resolution logged per action |
| QR verification badges | Scannable QR code linking to on-chain proof |
| PDF custody reports | Full timeline export with all attestations and transfers |

### Mobile App (Android)
| Feature | Description |
|---------|-------------|
| Instant camera capture | Zero shutter lag, optimized for field use |
| Background queue | Camera never blocks — photos queued and processed asynchronously |
| 7-layer security | SHA-256 → HMAC → Nonce → Device Integrity → GPS/Sensors → Signed Envelope → Blockchain |
| Auto-retry | Exponential backoff (3s → 6s → 12s) with connectivity pre-check |
| Google Sign-In | Persistent data across reinstalls — captures synced to account |
| GPS + sensor attestation | Latitude, longitude, altitude, accelerometer, gyroscope baked in |
| Gallery integration | Saves sealed copy to phone gallery + local encrypted storage |
| Queue management | Live progress indicators per queued item |

### Platform & Integrations
| Feature | Description |
|---------|-------------|
| Google OAuth | Firebase Auth across web + mobile |
| Public REST API | API key management, interactive docs, "Try it" sandbox |
| Chrome extension | Right-click any image → verify against blockchain |
| Desktop agent | Watched folder auto-registers new files on save |
| Batch registration | Multiple files with per-file progress tracking |
| Responsive UI | Full desktop + mobile-optimized layouts |
| Blockchain explorer | Browse all registered media with search and filters |

---

## Security Model

### Web Platform
- **Client-side hashing**: SHA-256 + dHash computed in Web Workers — raw media never leaves the browser
- **Firebase Auth**: Google OAuth with JWT token verification on every API call
- **API key isolation**: Firestore-backed per-user key management with rate limiting

### Mobile App — 7-Layer Security Pipeline
```
Layer 1: Client SHA-256     → Cryptographic fingerprint of raw capture
Layer 2: HMAC-SHA256        → Message authentication with app secret
Layer 3: Server Nonce       → One-time token prevents replay attacks
Layer 4: Device Integrity   → Platform, OS, device model verification
Layer 5: GPS + Sensors      → Latitude/longitude/altitude + accelerometer + gyroscope
Layer 6: Signed Envelope    → All layers combined into tamper-evident JSON payload
Layer 7: Blockchain Seal    → Immutable on-chain record with Ethereum TX proof
```

### Smart Contract
- **Immutability**: Once registered, a record cannot be modified or deleted
- **Public verifiability**: Anyone can verify any hash against the contract — no account required
- **Duplicate prevention**: `require(records[hash].timestamp == 0)` enforces uniqueness

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Three.js/R3F, Framer Motion | SPA with 3D blockchain visualization |
| **Mobile** | React Native 0.76, Expo SDK 52, expo-camera, expo-crypto, expo-location | Native Android app with hardware access |
| **Backend** | Express 5, Node.js 18+, Firebase Admin SDK | API server, blockchain bridge, auth |
| **Blockchain** | Solidity 0.8.24, Ethers.js 6, Sepolia testnet | Immutable on-chain records |
| **Auth** | Firebase Auth (Google OAuth), Google Sign-In (Android) | Cross-platform authentication |
| **Storage** | Firestore (API keys, user data), expo-file-system (mobile) | Persistent data layer |
| **Crypto** | SubtleCrypto SHA-256, Canvas dHash, HMAC-SHA256, jsPDF, QR | Client-side hashing & reports |
| **AI/Forensics** | HuggingFace Inference (ViT, ResNet), Canvas ELA, EXIF.js | Deepfake detection & metadata analysis |
| **Extensions** | Chrome Extension (Manifest V3), Desktop Agent (Node.js) | Browser & OS-level integrations |
| **Deployment** | Railway (server), Vercel-ready, GitHub Releases (APK) | Production infrastructure |

---

## Project Structure

```
attestr/
├── server.js                  # Express 5 API server (main backend)
├── index.html                 # React app entry point
├── package.json               # Dependencies & scripts
├── vite.config.js             # Frontend build configuration
├── vercel.json                # Vercel deployment config
├── railway.json               # Railway deployment config
├── Procfile                   # Process file for Railway
│
├── contracts/
│   └── MediaRegistry.sol      # Solidity smart contract (deployed on Sepolia)
│
├── artifacts/
│   ├── MediaRegistry.json     # Compiled ABI (used by ethers.js)
│   └── deployment.json        # Contract address & deployment info
│
├── server/
│   └── blockchain.js          # Ethers.js contract interactions
│
├── api/                       # Serverless API routes (Vercel-compatible)
│   ├── _shared.js             # Contract ABI, CORS, ethers utilities
│   ├── register.js            # POST /api/register
│   ├── verify.js              # POST /api/verify
│   ├── activity.js            # GET /api/activity
│   ├── chain.js               # GET /api/chain
│   ├── status.js              # GET /api/status
│   ├── ai-detect.js           # POST /api/ai-detect
│   ├── my-media/[userId].js   # GET /api/my-media/:userId
│   ├── register-url/index.js  # POST /api/register-url
│   └── v1/
│       ├── register.js        # POST /api/v1/register (public API)
│       └── verify.js          # POST /api/v1/verify (public API)
│
├── src/                       # React frontend
│   ├── main.jsx               # App entry + router
│   ├── App.jsx                # Root component with routes
│   ├── index.css              # Global styles (Tailwind)
│   ├── components/            # 28 reusable UI components
│   │   ├── AuthProvider.jsx   # Firebase auth context
│   │   ├── CameraCapture.jsx  # Browser camera integration
│   │   ├── BlockchainOrb.jsx  # Three.js 3D visualization
│   │   ├── ELAViewer.jsx      # Error Level Analysis viewer
│   │   ├── ExifPanel.jsx      # EXIF metadata display
│   │   ├── UploadZone.jsx     # Drag-and-drop file upload
│   │   ├── QRScanner.jsx      # QR code reader
│   │   └── ...
│   ├── pages/                 # 7 pages + 5 mobile variants
│   │   ├── LandingPage.jsx    # Homepage with feature overview
│   │   ├── RegisterPage.jsx   # Media registration flow
│   │   ├── VerifyPage.jsx     # Verification + forensics
│   │   ├── ExplorerPage.jsx   # Blockchain explorer
│   │   ├── ActivityPage.jsx   # Public activity feed
│   │   ├── DemoPage.jsx       # Interactive demo
│   │   ├── ApiDocsPage.jsx    # API documentation + sandbox
│   │   └── mobile/            # Mobile-optimized page variants
│   ├── lib/                   # Core libraries
│   │   ├── api.js             # HTTP client with auth
│   │   ├── firebase.js        # Firebase config & auth
│   │   ├── hash.js            # SHA-256 + dHash computation
│   │   ├── ela.js             # Error Level Analysis engine
│   │   ├── exif.js            # EXIF parser
│   │   ├── perceptual.js      # Perceptual hashing
│   │   ├── certificate.js     # Verification badge generator
│   │   ├── pdf.js             # PDF custody report builder
│   │   ├── qrcode.js          # QR code generation
│   │   └── badge.js           # Visual badge rendering
│   ├── hooks/                 # Custom React hooks
│   └── workers/
│       └── hashWorker.js      # Off-thread SHA-256/dHash Web Worker
│
├── extension/                 # Chrome Extension (Manifest V3)
│   ├── manifest.json          # Extension manifest
│   ├── background.js          # Service worker
│   ├── content.js             # Content script (page injection)
│   ├── popup.html/js/css      # Extension popup UI
│   └── icons/                 # Extension icons
│
├── desktop-agent/             # Desktop folder watcher
│   ├── agent.js               # Node.js auto-registration agent
│   └── README.md              # Setup instructions
│
└── public/                    # Static assets
    ├── favicon.svg
    ├── logo.svg
    ├── icons.svg              # SVG sprite sheet
    └── downloads/             # Distributable agent & extension
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A Sepolia testnet wallet with test ETH ([Sepolia Faucet](https://sepoliafaucet.com/))
- Firebase project with Auth + Firestore enabled

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Client
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Firebase Admin (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_json

# Ethereum
PRIVATE_KEY=your_sepolia_wallet_private_key
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Optional — AI deepfake detection
HF_TOKEN=your_huggingface_api_token
```

### Run Locally

```bash
# Install dependencies
npm install

# Start frontend (Vite dev server → localhost:5173)
npm run dev

# Start backend (Express API → localhost:3001)
npm run server
```

### Build for Production

```bash
# Build frontend
npx vite build          # → dist/

# Start production server (serves API + static frontend)
node server.js
```

### Deploy

```bash
# Railway (recommended — handles both frontend + backend)
railway up

# Vercel (serverless API functions only)
vercel deploy
```

### Mobile App

The Android app lives in a separate directory (`attestr-mobile/`) and requires:
- Android SDK + JDK 17
- Expo SDK 52

```bash
cd attestr-mobile
npm install

# Development
npx expo start

# Build release APK
cd android && ./gradlew assembleRelease
# APK → android/app/build/outputs/apk/release/app-release.apk

# Install on connected device
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. Right-click any image → "Verify with Attestr"

### Desktop Agent

```bash
node desktop-agent/agent.js /path/to/watch
# Any new image/video saved to the folder is auto-registered on the blockchain
```

---

## Team — Ctrl+Alt+Diablo

| Member | Role |
|--------|------|
| **Yash Gadia** | Full-stack development, blockchain integration, mobile app |
| **Sweta Kumari** | Research, forensic analysis pipeline, AI detection |
| **Priyanshi Shrotriya** | UI/UX design, mobile experience, presentations |
| **Shreyansh Khemka** | Smart contract development, testing, QA |

---

## Links

| Resource | URL |
|----------|-----|
| Live Website | [attestrindia-production.up.railway.app](https://attestrindia-production.up.railway.app) |
| Android APK | [GitHub Releases v1.0.0](https://github.com/yash113gadia/Attestr_India/releases/tag/v1.0.0) |
| Smart Contract | [Etherscan (Sepolia)](https://sepolia.etherscan.io/address/0x37FCD33D5FF07cfa3A75D27B4ec4cF09e458dfac) |
| API Docs | [/api-docs on live site](https://attestrindia-production.up.railway.app/api-docs) |

---

<p align="center">
  <strong>Innovate Bharat Hackathon 2026 · Sharda University · CSBC114 · Panel 6</strong><br/>
  <em>Proving integrity in the age of deepfakes.</em>
</p>
