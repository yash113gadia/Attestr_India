import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Shield, FileText, Image, Film, File, Clock, ChevronDown, Ban, ArrowRightLeft, Users, Smartphone, Eye, Loader2 } from 'lucide-react';
import { getMyMedia, getChain, getCustodyTimeline, revokeAttestation, transferCustody } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';
import { signInWithGoogle } from '../../lib/firebase';

function MimeIcon({ type }) {
  const c = "w-5 h-5 text-ink-faint";
  if (type?.startsWith('image/')) return <Image className={c} strokeWidth={1.5} />;
  if (type?.startsWith('video/')) return <Film className={c} strokeWidth={1.5} />;
  return <File className={c} strokeWidth={1.5} />;
}

export default function MobileExplorer() {
  const user = useAuth();
  const [media, setMedia] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!user?.uid) return; setLoading(true); setError(null);
    try {
      const [m, c] = await Promise.all([getMyMedia(user.uid), getChain()]);
      setMedia(m); setChainInfo(c);
    } catch { setError('Server unreachable.'); }
    setLoading(false);
  }

  useEffect(() => { if (user?.uid) load(); }, [user]);

  if (user === undefined) return null;

  if (!user) {
    return (
      <div className="pt-8">
        <div className="border border-rule rounded-sm bg-surface overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-ink-faint" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] text-ink font-medium mb-1">Sign in</p>
            <p className="text-[12px] text-ink-tertiary mb-5">View files registered under your account.</p>
          </div>
          <div className="px-4 pb-4">
            <button onClick={signInWithGoogle}
              className="w-full bg-accent text-white text-[14px] font-medium py-3.5 rounded-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[26px] text-ink leading-tight tracking-tight">My Media</h1>
          <p className="text-[11px] text-ink-faint font-mono mt-1">{user.displayName}</p>
        </div>
        <button onClick={load} disabled={loading} className="w-9 h-9 flex items-center justify-center rounded-sm border border-rule active:bg-surface-raised transition">
          <RefreshCw className={`w-4 h-4 text-ink-faint ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      {media && chainInfo && (
        <div className="grid grid-cols-3 gap-px bg-rule rounded-sm overflow-hidden mb-5">
          <div className="bg-surface px-3 py-3 text-center">
            <p className="text-[20px] font-serif text-ink">{media.count}</p>
            <p className="text-[9px] font-mono text-ink-faint mt-0.5">YOUR FILES</p>
          </div>
          <div className="bg-surface px-3 py-3 text-center">
            <p className="text-[20px] font-serif text-ink">{chainInfo.length - 1}</p>
            <p className="text-[9px] font-mono text-ink-faint mt-0.5">ON CHAIN</p>
          </div>
          <div className="bg-surface px-3 py-3 text-center">
            <p className={`text-[20px] font-serif ${chainInfo.valid ? 'text-verified' : 'text-danger'}`}>
              {chainInfo.valid ? '✓' : '!'}
            </p>
            <p className="text-[9px] font-mono text-ink-faint mt-0.5">INTEGRITY</p>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-ink-faint text-[13px] py-12 font-mono">loading...</p>}
      {error && <div className="border border-danger/20 bg-danger-glow rounded-sm px-3 py-2.5 text-[12px] text-danger mb-3">{error}</div>}

      {media && media.count === 0 && !loading && (
        <div className="border border-rule rounded-sm bg-surface p-8 text-center">
          <FileText className="w-8 h-8 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[14px] text-ink mb-1">No files yet</p>
          <p className="text-[12px] text-ink-faint">Register your first media to see it here.</p>
        </div>
      )}

      {/* File cards */}
      {media && media.blocks.length > 0 && (
        <div className="space-y-2">
          {media.blocks.map((block, i) => (
            <MobileBlockRow key={block.hash} block={block} index={i} userId={user?.uid} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mobile Expandable Block Row ──
function MobileBlockRow({ block, index, userId }) {
  const [expanded, setExpanded] = useState(false);
  const [custody, setCustody] = useState(null);
  const [loadingCustody, setLoadingCustody] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  async function loadCustody() {
    if (custody) return;
    setLoadingCustody(true);
    try { setCustody(await getCustodyTimeline(block.data.sha256)); } catch {}
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
      setActionMsg({ type: 'success', text: r.message }); setCustody(null); loadCustody();
    } catch (e) { setActionMsg({ type: 'error', text: e.message }); }
    setActionLoading(null);
  }

  async function handleTransfer() {
    if (!transferEmail) return;
    setActionLoading('transfer');
    try {
      const r = await transferCustody({ sha256: block.data.sha256, toEmail: transferEmail });
      setActionMsg({ type: 'success', text: r.message }); setTransferEmail(''); setCustody(null); loadCustody();
    } catch (e) { setActionMsg({ type: 'error', text: e.message }); }
    setActionLoading(null);
  }

  const isRevoked = custody?.isRevoked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`border rounded-sm overflow-hidden ${isRevoked ? 'border-danger/30 bg-danger/5' : 'border-rule bg-surface'}`}
    >
      <button onClick={handleExpand} className="w-full p-3.5 flex items-center gap-3 active:bg-surface-raised transition text-left">
        <div className="w-11 h-11 rounded-sm bg-void border border-rule-light flex items-center justify-center shrink-0">
          <MimeIcon type={block.data.mimeType} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-ink font-medium truncate">{block.data.filename}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono text-ink-faint">{block.data.mimeType?.split('/')[1]}</span>
            <span className="text-[8px] text-ink-faint">·</span>
            <span className="text-[10px] font-mono text-ink-faint">
              {block.data.fileSize > 1048576 ? (block.data.fileSize / 1048576).toFixed(1) + 'MB' : (block.data.fileSize / 1024).toFixed(0) + 'KB'}
            </span>
            <span className="text-[8px] text-ink-faint">·</span>
            <span className="text-[10px] text-ink-faint">{new Date(block.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        {isRevoked && <span className="text-[8px] font-mono bg-danger/15 text-danger px-1.5 py-0.5 rounded-full">REVOKED</span>}
        <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-rule-light px-3.5 py-3.5 space-y-3">
              {loadingCustody && <p className="text-[10px] text-ink-faint font-mono flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</p>}

              {/* Hash */}
              <div className="font-mono text-[9px] bg-void/50 rounded-sm p-2.5 space-y-0.5 break-all">
                <p className="text-ink-faint">SHA-256</p>
                <p className="text-ink">{block.data.sha256}</p>
                {block.data.attestationNote && <p className="text-ink italic mt-1">"{block.data.attestationNote}"</p>}
              </div>

              {/* Device */}
              {block.data.deviceInfo && (
                <div className="flex items-center gap-1.5 text-[9px] text-ink-tertiary font-mono">
                  <Smartphone className="w-3 h-3" strokeWidth={1.5} />
                  <span>{block.data.deviceInfo.platform} · {block.data.deviceInfo.timezone}</span>
                </div>
              )}

              {/* Custody timeline */}
              {custody?.events?.length > 0 && (
                <div className="space-y-1.5 pl-3 border-l border-rule-light">
                  {custody.events.map((evt, i) => (
                    <div key={i} className="relative text-[10px]">
                      <span className={`absolute -left-[11px] w-2 h-2 rounded-full ${
                        evt.type === 'registered' ? 'bg-verified' : evt.type === 'co-attested' ? 'bg-accent' :
                        evt.type === 'custody-transferred' ? 'bg-caution' : 'bg-danger'
                      }`} />
                      <span className="text-ink">{evt.type.replace('-', ' ')} by {evt.by || evt.toName}</span>
                      <p className="text-[8px] text-ink-faint font-mono">{new Date(evt.timestamp).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Co-signers */}
              {custody?.coSigners?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {custody.coSigners.map((cs, i) => (
                    <span key={i} className="flex items-center gap-1 bg-accent/5 border border-accent/15 rounded-full px-2 py-0.5 text-[9px] text-ink">
                      <Users className="w-2.5 h-2.5 text-accent" /> {cs.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Verifications */}
              {custody?.verifications?.length > 0 && (
                <p className="text-[10px] text-ink-tertiary flex items-center gap-1.5"><Eye className="w-3 h-3" /> Verified {custody.verifications.length}×</p>
              )}

              {/* Actions */}
              {!isRevoked && (
                <div className="pt-2 border-t border-rule-light space-y-2">
                  <div className="flex gap-2">
                    <input type="email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)}
                      placeholder="Transfer to email..." className="flex-1 bg-void border border-rule rounded-sm px-2.5 py-2 text-[11px] text-ink font-mono" />
                    <button onClick={handleTransfer} disabled={!transferEmail || actionLoading === 'transfer'}
                      className="px-3 py-2 bg-caution/10 border border-caution/20 text-caution text-[10px] font-medium rounded-sm disabled:opacity-40">
                      {actionLoading === 'transfer' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Transfer'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                      placeholder="Revoke reason..." className="flex-1 bg-void border border-rule rounded-sm px-2.5 py-2 text-[11px] text-ink font-mono" />
                    <button onClick={handleRevoke} disabled={actionLoading === 'revoke'}
                      className="px-3 py-2 bg-danger/10 border border-danger/20 text-danger text-[10px] font-medium rounded-sm disabled:opacity-40">
                      {actionLoading === 'revoke' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revoke'}
                    </button>
                  </div>
                </div>
              )}

              {actionMsg && (
                <div className={`text-[10px] rounded-sm px-2.5 py-2 ${actionMsg.type === 'success' ? 'bg-verified/10 text-verified border border-verified/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
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
