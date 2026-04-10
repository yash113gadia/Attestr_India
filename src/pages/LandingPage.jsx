import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Fingerprint, Blocks, Search, ShieldCheck, Camera, Shield } from 'lucide-react';
import Logo from '../components/Logo';
import { lazy, Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
const ShieldScene = lazy(() => import('../components/ShieldScene'));
const BlockchainOrb = lazy(() => import('../components/BlockchainOrb'));
const FingerprintViz = lazy(() => import('../components/FingerprintViz'));
const ChainViz = lazy(() => import('../components/ChainViz'));
const LockViz = lazy(() => import('../components/LockViz'));

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
});

export default function LandingPage() {
  return (
    <div className="bg-void text-ink overflow-hidden relative">
      
      {/* ── BHARAT WATERMARK ── */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-0">
        {/* Watermark removed per user request */}
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-void/80 backdrop-blur-2xl border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="font-serif text-[17px] text-ink tracking-tight">Attestr</span>
            <span className="text-[10px] text-kesari font-medium tracking-wide hidden sm:inline">प्रमाण</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <a href="#how" className="hidden lg:inline text-[13px] text-ink-tertiary hover:text-ink transition">How it Works</a>
            <Link to="/register" className="text-[12px] md:text-[13px] text-ink bg-surface-raised hover:bg-surface-hover border border-rule px-3 md:px-4 py-1.5 rounded-sm transition">
              Launch Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-accent/[0.04] rounded-full blur-[150px]" />

        <div className="relative max-w-[1200px] mx-auto px-4 md:px-8 pt-24 md:pt-28 pb-16 md:pb-20 grid grid-cols-1 md:grid-cols-[1fr_480px] gap-8 items-center">
          {/* Left — Text */}
          <div>
            <motion.div {...fade(0.1)} className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-mono tracking-widest uppercase mb-6 md:mb-8 border border-rule px-3 md:px-4 py-1.5 rounded-full bg-kesari/5 border-kesari/20">
              <span className="w-1.5 h-1.5 rounded-full bg-kesari animate-pulse" />
              <span className="text-kesari font-bold">Bharat's Sovereign Media Notary</span>
            </motion.div>

            <motion.h1 {...fade(0.2)} className="font-serif text-[clamp(36px,6vw,80px)] leading-[0.95] tracking-tight mb-6">
              Satyameva<br />Jayate.
            </motion.h1>

            <motion.p {...fade(0.35)} className="text-[15px] md:text-[17px] text-ink-secondary leading-relaxed max-w-lg mb-8 md:mb-10">
              Attestr is India's first decentralized notary platform. Protect digital truth 
              with immutable cryptographic proofs anchored to the blockchain — for images, documents, videos, code, and beyond. 
              Designed for a secure and <span className="text-kesari font-medium">Aatmanirbhar Bharat</span>.
            </motion.p>

            <motion.div {...fade(0.5)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link to="/register" className="group flex items-center justify-center gap-3 bg-white text-void text-[14px] font-bold px-7 py-3.5 rounded-sm hover:brightness-110 transition-all">
                Start Notarizing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/verify" className="flex items-center justify-center gap-3 text-ink-secondary text-[14px] font-medium px-7 py-3.5 border border-rule rounded-sm hover:border-kesari/40 hover:text-ink transition">
                Verify Proof
              </Link>
            </motion.div>

            <motion.div {...fade(0.65)} className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 md:mt-14 text-[11px] text-ink-tertiary font-mono tracking-wider uppercase">
              <div className="flex items-center gap-2 bg-white/5 border border-rule px-3 py-1 rounded-sm">
                <div className="flex flex-col gap-0.5">
                  <div className="w-3 h-1 bg-[#FF9933]" />
                  <div className="w-3 h-1 bg-white" />
                  <div className="w-3 h-1 bg-[#128807]" />
                </div>
                <span className="ml-1 text-ink-secondary">Made in India</span>
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-faint" />
              <span>Sovereign Ledger</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-faint" />
              <span>Zero-Knowledge</span>
            </motion.div>
          </div>

          {/* Right — 3D Shield */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="relative hidden md:block"
          >
            <ErrorBoundary fallback={<div className="w-[480px] h-[480px]" />}>
              <Suspense fallback={<div className="w-[480px] h-[480px]" />}>
                <ShieldScene height="480px" />
              </Suspense>
            </ErrorBoundary>
            {/* Glow behind 3D */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/[0.06] rounded-full blur-[80px] -z-10" />
          </motion.div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-void to-transparent" />
      </section>

      {/* ── NUMBERS ── */}
      <section className="border-y border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-rule">
          {[
            { n: '5-8M', label: 'global notarizations daily' },
            { n: '90%', label: 'synthetic content by 2026' },
            { n: '<1s', label: 'verification time' },
            { n: '100%', label: 'immutable ledger' },
          ].map((s) => (
            <motion.div key={s.n} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="py-8 md:py-12 px-4 md:px-8">
              <p className="font-serif text-[28px] md:text-[40px] text-ink tracking-tight">{s.n}</p>
              <p className="text-[12px] md:text-[13px] text-ink-tertiary mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-16 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="flex items-start justify-between mb-12 md:mb-20">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-xl">
              <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">How it works</p>
              <h2 className="font-serif text-[32px] md:text-[42px] leading-[1.05] tracking-tight">
                From capture to<br />immutable proof.
              </h2>
            </motion.div>
            <div className="hidden lg:block">
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <FingerprintViz size={160} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-rule">
            {[
              { num: '01', icon: Camera, title: 'Capture', desc: 'Upload any file or capture evidence directly from your browser.' },
              { num: '02', icon: Fingerprint, title: 'Fingerprint', desc: 'SHA-256 and perceptual hash computed client-side. Nothing uploaded.' },
              { num: '03', icon: Blocks, title: 'Notarize', desc: 'Cryptographic proof anchored to Ethereum with immutable settlement.' },
              { num: '04', icon: ShieldCheck, title: 'Verify', desc: 'Check any file against the ledger. Instant integrity result.' },
              { num: '05', icon: Search, title: 'Inspect', desc: 'Forensic analysis for images; byte-level integrity check for all files.' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-void p-6 md:p-8 group"
              >
                <span className="text-[11px] font-mono text-ink-faint">{step.num}</span>
                <step.icon className="w-5 h-5 text-ink-tertiary mt-4 mb-4 group-hover:text-accent transition-colors duration-300" strokeWidth={1.5} />
                <h3 className="text-[15px] font-medium text-ink mb-2">{step.title}</h3>
                <p className="text-[13px] text-ink-tertiary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section id="features" className="py-16 md:py-32 border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="flex items-start justify-between mb-12 md:mb-20">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-xl">
              <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">Capabilities</p>
              <h2 className="font-serif text-[32px] md:text-[42px] leading-[1.05] tracking-tight">
                Built for those who<br />need to prove truth.
              </h2>
            </motion.div>
            <div className="hidden lg:flex items-center gap-4">
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <LockViz size={120} />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <ChainViz size={200} height={120} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-rule">
            {[
              { icon: Lock, title: 'Nothing Leaves Your Device', desc: 'Your content is processed entirely in your browser. Only the cryptographic fingerprint is sent — the original file never reaches our servers.' },
              { icon: Fingerprint, title: 'Dual-Hash Verification', desc: 'SHA-256 for exact matching across all file types. Perceptual dHash for visual content that survives compression and screenshots.' },
              { icon: Blocks, title: 'Ethereum Notary', desc: 'Hashes recorded on Ethereum Sepolia via smart contract. Immutable. Publicly verifiable on Etherscan.' },
              { icon: Search, title: 'Forensic Analysis', desc: 'Image-specific ELA detects compression inconsistencies. All file types get byte-level integrity verification.' },
              { icon: ShieldCheck, title: 'Metadata Forensics', desc: 'Extracts camera data, GPS, timestamps, and editing history from images. Flags anomalies in the digital negative.' },
              { icon: Camera, title: 'Multi-Format Support', desc: 'Register images, videos, audio, PDFs, code, 3D models, archives — any file that needs proof of existence.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-void p-6 md:p-8 group"
              >
                <f.icon className="w-5 h-5 text-ink-faint mb-5 group-hover:text-accent transition-colors duration-300" strokeWidth={1.5} />
                <h3 className="text-[15px] font-medium text-ink mb-2">{f.title}</h3>
                <p className="text-[13px] text-ink-tertiary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE ── */}
      <section className="py-16 md:py-32 border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8 items-start mb-12 md:mb-16">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-xl">
              <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-4">Architecture</p>
              <h2 className="font-serif text-[32px] md:text-[42px] leading-[1.05] tracking-tight">
                Private by design.
              </h2>
              <p className="text-[14px] text-ink-tertiary mt-4 leading-relaxed">
                Raw files never leave your browser. Only mathematical proofs cross the network boundary and settle on Ethereum.
              </p>
            </motion.div>
            <div className="hidden md:block">
              <ErrorBoundary>
                <Suspense fallback={null}>
                  <BlockchainOrb size={200} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-rule rounded-sm bg-surface p-4 md:p-10 font-mono text-[11px] md:text-[12px] space-y-6 overflow-x-auto"
          >
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <span className="text-accent w-16 md:w-24 shrink-0 text-[10px] md:text-[12px]">CLIENT</span>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {['Upload / Camera', 'SHA-256 Worker', 'dHash (Images)', 'ELA / Forensics'].map((b) => (
                  <div key={b} className="border border-rule bg-surface-raised px-2 md:px-4 py-2 md:py-3 text-center text-ink-secondary text-[10px] md:text-[12px]">{b}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-ink-faint">
              <span className="w-16 md:w-24 shrink-0" />
              <div className="flex-1 text-center text-[10px] md:text-[11px] tracking-wider">── hash + metadata only ──</div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-caution w-16 md:w-24 shrink-0 text-[10px] md:text-[12px]">SERVER</span>
              <div className="flex-1 grid grid-cols-3 gap-2 md:gap-3">
                {['POST /register', 'POST /verify', 'GET /chain'].map((b) => (
                  <div key={b} className="border border-rule bg-surface-raised px-2 md:px-4 py-2 md:py-3 text-center text-ink-secondary text-[10px] md:text-[12px]">{b}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-ink-faint">
              <span className="w-16 md:w-24 shrink-0" />
              <div className="flex-1 text-center text-[10px] md:text-[11px] tracking-wider">──</div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-verified w-16 md:w-24 shrink-0 text-[10px] md:text-[12px]">CHAIN</span>
              <div className="flex-1 border border-verified/20 bg-verified-glow px-2 md:px-4 py-2 md:py-3 text-center text-verified text-[10px] md:text-[12px]">
                Ethereum Sepolia · Smart Contract · Immutable · Proof-of-Work
              </div>
            </div>
            <div className="border-t border-rule pt-4 text-ink-tertiary text-[10px] md:text-[11px]">
              Raw files never leave the browser. Only cryptographic hashes cross the network boundary.
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-32 border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-[36px] md:text-[48px] tracking-tight mb-4">Start verifying.</h2>
            <p className="text-[15px] md:text-[16px] text-ink-secondary mb-8 md:mb-10 max-w-md mx-auto">
              No account needed to verify. Register your first file in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link to="/register" className="group flex items-center justify-center gap-3 bg-white text-void text-[14px] font-medium px-7 py-3.5 rounded-sm hover:bg-ink transition">
                Register Any File <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/verify" className="flex items-center justify-center text-ink-secondary text-[14px] font-medium px-7 py-3.5 border border-rule rounded-sm hover:border-ink-faint hover:text-ink transition">
                Verify Any File
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-rule py-8">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size={16} />
            <span className="font-serif text-[14px] text-ink-tertiary">Attestr</span>
            <span className="text-[9px] text-kesari/60 font-medium">प्रमाण</span>
          </div>
          <p className="text-[11px] text-ink-faint font-mono text-center">
            Team Ctrl+Alt+Diablo · CSBC114 · Innovate Bharat 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
