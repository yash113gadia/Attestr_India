import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Shield, FileText, Clock, Hash, Lock, ExternalLink, ChevronDown, Ban, ArrowRightLeft, Users, Smartphone, Eye, Loader2, Download } from 'lucide-react';
import { getMyMedia, getChain, getCustodyTimeline, revokeAttestation, transferCustody } from '../lib/api';
import { downloadCustodyReport } from '../lib/pdf';
import { useAuth } from '../components/AuthProvider';
import { signInWithGoogle } from '../lib/firebase';

const fade = { hidden: { opacity: 0, y: 10 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }) };

export default function ExplorerPage() {
  const user = useAuth();
  const [media, setMedia] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!user?.uid) return;
    setLoading(true); setError(null);
    try {
      const [m, c] = await Promise.all([getMyMedia(user.uid), getChain()]);
      setMedia(m);
      setChainInfo(c);
    } catch { setError('Server unreachable.'); }
    setLoading(false);
  }

  useEffect(() => { if (user?.uid) load(); }, [user]);

  // Auth gate
  if (user === undefined) return null;
  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-12 md:mt-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-rule rounded-sm bg-surface p-8 md:p-12 text-center">
          <Shield className="w-8 h-8 text-ink-faint mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[14px] text-ink mb-1">Sign in to view your ledger</p>
          <p className="text-[12px] text-ink-tertiary mb-6">The Explorer shows files registered under your account.</p>
          <button onClick={signInWithGoogle} className="bg-accent text-white text-[13px] font-medium px-6 py-2.5 rounded-sm hover:brightness-110 transition">
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial="hidden" animate="show" className="flex items-start justify-between mb-6 md:mb-8">
        <motion.div variants={fade} custom={0}>
          <h1 className="font-serif text-[28px] md:text-[32px] text-ink leading-none tracking-tight">My Ledger</h1>
          <p className="text-[13px] text-ink-tertiary mt-2">Personal records anchored to the Ethereum blockchain.</p>
        </motion.div>
        <motion.button variants={fade} custom={1} onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-ink-faint border border-rule rounded-sm hover:text-ink-secondary transition">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </motion.button>
      </motion.div>

      {/* Stats */}
      {media && chainInfo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 md:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mb-4">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule rounded-sm overflow-hidden border border-rule">
              <div className="bg-surface px-4 md:px-5 py-3 md:py-4">
                <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-1">YOUR RECORDS</p>
                <p className="text-[22px] md:text-[26px] font-serif text-ink">{media.registered ?? media.count}</p>
              </div>
              {(media.received > 0) && (
              <div className="bg-surface px-4 md:px-5 py-3 md:py-4">
                <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-1">RECEIVED</p>
                <p className="text-[22px] md:text-[26px] font-serif text-accent">{media.received}</p>
              </div>
              )}
              <div className="bg-surface px-4 md:px-5 py-3 md:py-4">
                <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-1">TOTAL ANCHORED</p>
                <p className="text-[22px] md:text-[26px] font-serif text-ink">{chainInfo.length - 1}</p>
              </div>
              <div className="bg-surface px-4 md:px-5 py-3 md:py-4">
                <p className="text-[10px] font-mono text-ink-faint tracking-widest mb-1">LEDGER INTEGRITY</p>
                <p className={`text-[22px] md:text-[26px] font-serif ${chainInfo.valid ? 'text-verified' : 'text-danger'}`}>{chainInfo.valid ? 'Valid' : 'Broken'}</p>
              </div>
            </div>

            {/* Notary Reputation Profile */}
            <div className="border border-rule rounded-sm bg-surface-raised p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-verified animate-pulse" />
                  <span className="text-[10px] font-mono text-verified tracking-widest uppercase font-bold">Active Profile</span>
                </div>
                <p className="text-[15px] font-serif text-ink mb-1 truncate">{user.displayName}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-mono bg-verified/10 text-verified px-1.5 py-0.5 rounded-xs">IDENTITY VERIFIED</span>
                  <span className="text-[9px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded-xs">ESTABLISHED 2026</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-rule-light flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono text-ink-faint tracking-widest uppercase">Integrity Score</p>
                  <p className="text-[16px] font-mono text-ink font-bold">985 <span className="text-[10px] text-verified">/ 1000</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono text-ink-faint tracking-widest uppercase">Standing</p>
                  <p className="text-[11px] font-mono text-verified">EXCELLENT</p>
                </div>
              </div>
            </div>
          </div>

          {chainInfo.onChain && (
            <div className="mt-3 border border-accent/15 bg-accent-glow rounded-sm px-4 md:px-5 py-3 flex items-center gap-4 md:gap-6 text-[11px] font-mono flex-wrap">
              <span><span className="text-ink-faint">network </span><span className="text-accent">Sepolia</span></span>
              <span className="hidden sm:inline"><span className="text-ink-faint">contract </span><span className="text-ink-secondary">{chainInfo.onChain.contractAddress?.substring(0, 22)}...</span></span>
              <span><span className="text-ink-faint">on-chain records </span><span className="text-ink">{chainInfo.onChain.totalRegistered}</span></span>
              <span className="sm:ml-auto"><span className="text-ink-faint">balance </span><span className="text-ink">{Number(chainInfo.onChain.walletBalance).toFixed(4)} ETH</span></span>
            </div>
          )}
        </motion.div>
      )}

      {loading && <p className="text-center text-ink-faint text-[13px] py-16 font-mono">loading...</p>}
      {error && <div className="border border-danger/20 bg-danger-glow rounded-sm px-4 py-3 text-[12px] text-danger mb-6">{error}</div>}

      {/* Media list */}
      {media && media.count === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-rule rounded-sm bg-surface p-8 md:p-12 text-center">
          <FileText className="w-8 h-8 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[13px] text-ink-secondary mb-1">No records yet</p>
          <p className="text-[12px] text-ink-faint">Go to the Register page to add your first record.</p>
        </motion.div>
      )}

      {media && media.blocks.length > 0 && (
        <div className="space-y-2">
          {media.blocks.map((block, i) => (
            <BlockRow key={block.hash} block={block} index={i} userId={user?.uid} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Expandable Block Row ──
function BlockRow({ block, index, userId, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [custody, setCustody] = useState(null);
  const [loadingCustody, setLoadingCustody] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  async function loadCustody() {
    if (custody) return;
    setLoadingCustody(true);
    try {
      const data = await getCustodyTimeline(block.data.sha256);
      setCustody(data);
    } catch {}
    setLoadingCustody(false);
  }

  async function handleExpand() {
    setExpanded(!expanded);
    if (!expanded) loadCustody();
  }

  async function handleRevoke() {
    setActionLoading('revoke');
    try {
      const r = await revokeAttestation({ sha256: block.data.sha256, reason: revokeReason || 'Revoked by registrant' });
      setActionMsg({ type: 'success', text: r.message });
      setCustody(null); loadCustody();
    } catch (e) { setActionMsg({ type: 'error', text: e.message }); }
    setActionLoading(null);
  }

  async function handleTransfer() {
    if (!transferEmail) return;
    setActionLoading('transfer');
    try {
      const r = await transferCustody({ sha256: block.data.sha256, toEmail: transferEmail, note: transferNote });
      setActionMsg({ type: 'success', text: r.message });
      setTransferEmail(''); setTransferNote('');
      setCustody(null); loadCustody();
    } catch (e) { setActionMsg({ type: 'error', text: e.message }); }
    setActionLoading(null);
  }

  const isRevoked = custody?.isRevoked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`border rounded-sm overflow-hidden ${isRevoked ? 'border-danger/30 bg-danger/5' : 'border-rule bg-surface'}`}
    >
      {/* Main row */}
      <button onClick={handleExpand} className="w-full px-4 md:px-5 py-3 flex items-center gap-3 md:gap-4 hover:bg-surface-raised transition-colors text-left">
        <FileText className="w-4 h-4 text-ink-faint shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-ink truncate">{block.data.filename}</p>
          <p className="text-[10px] text-ink-faint font-mono">{block.data.mimeType} · {block.data.fileSize > 1048576 ? (block.data.fileSize / 1048576).toFixed(1) + ' MB' : (block.data.fileSize / 1024).toFixed(1) + ' KB'}</p>
        </div>
        <span className="text-[11px] text-ink-tertiary font-mono hidden sm:inline">#{block.index}</span>
        <span className="text-[11px] text-ink-tertiary hidden sm:inline">{new Date(block.timestamp).toLocaleDateString()}</span>
        {block.data?.userId !== userId && <span className="text-[9px] font-mono bg-caution/15 text-caution px-1.5 py-0.5 rounded-full">RECEIVED</span>}
        {isRevoked && <span className="text-[9px] font-mono bg-danger/15 text-danger px-1.5 py-0.5 rounded-full">REVOKED</span>}
        {custody?.coSigners?.length > 0 && <span className="text-[9px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{custody.coSigners.length} CO-SIGNER{custody.coSigners.length > 1 ? 'S' : ''}</span>}
        <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-rule-light px-4 md:px-5 py-4 space-y-4">
              {loadingCustody && <p className="text-[11px] text-ink-faint font-mono flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading chain of custody...</p>}

              {/* Hash info */}
              <div className="font-mono text-[10px] space-y-1 bg-void/50 rounded-sm p-3">
                <div className="flex"><span className="text-ink-faint w-16">SHA-256</span><span className="text-ink truncate">{block.data.sha256}</span></div>
                <div className="flex"><span className="text-ink-faint w-16">Block</span><span className="text-ink">#{block.index} · {block.hash?.substring(0, 20)}...</span></div>
                <div className="flex"><span className="text-ink-faint w-16">Time</span><span className="text-ink">{new Date(block.timestamp).toLocaleString()}</span></div>
                {block.data.attestationNote && (
                  <div className="flex"><span className="text-ink-faint w-16">Note</span><span className="text-ink italic">"{block.data.attestationNote}"</span></div>
                )}
              </div>

              {/* Device info */}
              {block.data.deviceInfo && (
                <div className="flex items-center gap-2 text-[10px] text-ink-tertiary font-mono">
                  <Smartphone className="w-3 h-3 text-ink-faint" strokeWidth={1.5} />
                  <span>{block.data.deviceInfo.platform} · {block.data.deviceInfo.timezone} · {block.data.deviceInfo.screenRes}</span>
                </div>
              )}

              {/* Chain of Custody Timeline */}
              {custody?.events?.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-2">Chain of Custody</p>
                  <div className="relative pl-4 border-l border-rule-light space-y-2">
                    {custody.events.map((evt, i) => (
                      <div key={i} className="relative">
                        <span className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-surface ${
                          evt.type === 'registered' ? 'bg-verified' :
                          evt.type === 'co-attested' ? 'bg-accent' :
                          evt.type === 'custody-transferred' ? 'bg-caution' :
                          evt.type === 'revoked' ? 'bg-danger' : 'bg-ink-faint'
                        }`} />
                        <div className="text-[11px]">
                          <span className="text-ink font-medium">
                            {evt.type === 'registered' && `Registered by ${evt.by}`}
                            {evt.type === 'co-attested' && `Co-signed by ${evt.by}`}
                            {evt.type === 'custody-transferred' && `Custody transferred to ${evt.toName}`}
                            {evt.type === 'revoked' && `Revoked by ${evt.by}`}
                          </span>
                          {evt.note && <span className="text-ink-faint"> — "{evt.note}"</span>}
                          {evt.reason && <span className="text-danger/70"> — {evt.reason}</span>}
                          <p className="text-[9px] text-ink-faint font-mono">{new Date(evt.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Co-signers */}
              {custody?.coSigners?.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-2">Co-Signatures</p>
                  <div className="flex flex-wrap gap-2">
                    {custody.coSigners.map((cs, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-accent/5 border border-accent/15 rounded-full px-2.5 py-1">
                        {cs.photo ? <img src={cs.photo} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" /> : <Users className="w-3 h-3 text-accent" />}
                        <span className="text-[10px] text-ink font-medium">{cs.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification stats */}
              {custody?.verifications?.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-ink-tertiary">
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Verified {custody.verifications.length} time{custody.verifications.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Action Buttons */}
              {!isRevoked && (
                <div className="pt-3 border-t border-rule-light space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Actions</p>
                    <button
                      onClick={() => custody && downloadCustodyReport({ block, registrant: custody.registrant || { name: block.data?.userName }, attestationNote: block.data?.attestationNote, custodyTimeline: custody.events, coSigners: custody.coSigners, isRevoked: custody.isRevoked, currentCustodian: custody.currentCustodian, verificationCount: custody.verifications?.length, recentVerifications: custody.verifications })}
                      disabled={!custody}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-medium rounded-sm hover:bg-accent/20 transition disabled:opacity-40"
                    >
                      <Download className="w-3 h-3" /> PDF Report
                    </button>
                  </div>

                  {/* Transfer Custody */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-void border border-rule rounded-sm px-3 py-2">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-caution shrink-0" strokeWidth={1.5} />
                      <input
                        type="email"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        placeholder="Transfer to email..."
                        className="flex-1 bg-transparent text-[11px] text-ink font-mono outline-none placeholder:text-ink-faint"
                      />
                    </div>
                    <button onClick={handleTransfer} disabled={!transferEmail || actionLoading === 'transfer'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-caution/10 border border-caution/20 text-caution text-[11px] font-medium rounded-sm hover:bg-caution/20 transition disabled:opacity-40">
                      {actionLoading === 'transfer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                      Transfer
                    </button>
                  </div>

                  {/* Revoke */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-void border border-rule rounded-sm px-3 py-2">
                      <Ban className="w-3.5 h-3.5 text-danger shrink-0" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        placeholder="Revocation reason (optional)..."
                        className="flex-1 bg-transparent text-[11px] text-ink font-mono outline-none placeholder:text-ink-faint"
                      />
                    </div>
                    <button onClick={handleRevoke} disabled={actionLoading === 'revoke'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-danger/10 border border-danger/20 text-danger text-[11px] font-medium rounded-sm hover:bg-danger/20 transition disabled:opacity-40">
                      {actionLoading === 'revoke' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                      Revoke
                    </button>
                  </div>
                </div>
              )}

              {/* Action feedback */}
              {actionMsg && (
                <div className={`text-[11px] rounded-sm px-3 py-2 ${actionMsg.type === 'success' ? 'bg-verified/10 text-verified border border-verified/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                  {actionMsg.text}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
