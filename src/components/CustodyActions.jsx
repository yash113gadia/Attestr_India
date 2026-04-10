import { useState } from 'react';
import { Users, ArrowRightLeft, Ban, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { coAttest, transferCustody, revokeAttestation, getCustodyTimeline } from '../lib/api';
import { downloadCustodyReport } from '../lib/pdf';
import { useAuth } from './AuthProvider';
import { signInWithGoogle } from '../lib/firebase';

export default function CustodyActions({ sha256, block, onUpdate }) {
  const user = useAuth();
  const [transferEmail, setTransferEmail] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [coAttestNote, setCoAttestNote] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [loading, setLoading] = useState(null);
  const [msg, setMsg] = useState(null);

  async function handleCoAttest() {
    setLoading('co-attest'); setMsg(null);
    try {
      const r = await coAttest({ sha256, note: coAttestNote || undefined });
      setMsg({ type: 'success', text: r.message });
      setCoAttestNote('');
      onUpdate?.();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(null);
  }

  async function handleTransfer() {
    if (!transferEmail) return;
    setLoading('transfer'); setMsg(null);
    try {
      const r = await transferCustody({ sha256, toEmail: transferEmail, note: transferNote || undefined });
      setMsg({ type: 'success', text: r.message });
      setTransferEmail(''); setTransferNote('');
      onUpdate?.();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(null);
  }

  async function handleRevoke() {
    setLoading('revoke'); setMsg(null);
    try {
      const r = await revokeAttestation({ sha256, reason: revokeReason || 'Revoked by registrant' });
      setMsg({ type: 'success', text: r.message });
      onUpdate?.();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(null);
  }

  async function handleDownloadReport() {
    setLoading('pdf'); setMsg(null);
    try {
      const custody = await getCustodyTimeline(sha256);
      downloadCustodyReport({
        block,
        registrant: custody.registrant || { name: block?.data?.userName },
        attestationNote: block?.data?.attestationNote,
        custodyTimeline: custody.events,
        coSigners: custody.coSigners,
        isRevoked: custody.isRevoked,
        currentCustodian: custody.currentCustodian,
        verificationCount: custody.verifications?.length,
        recentVerifications: custody.verifications,
      });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(null);
  }

  if (!user) {
    return (
      <div className="border border-rule rounded-sm bg-surface p-4">
        <p className="text-[11px] text-ink-faint text-center mb-2">Sign in to manage chain of custody</p>
        <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-2 py-2 bg-accent text-white text-[12px] font-medium rounded-sm hover:bg-accent/90 transition">
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="border border-rule rounded-sm bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-rule-light">
        <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Chain of Custody Actions</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Status message */}
        {msg && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-sm text-[11px] ${msg.type === 'success' ? 'bg-verified/10 border border-verified/20 text-verified' : 'bg-danger/10 border border-danger/20 text-danger'}`}>
            {msg.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {msg.text}
          </div>
        )}

        {/* Co-Attest */}
        <div>
          <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-1.5">Co-Signature</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-void border border-rule rounded-sm px-3 py-2">
              <Users className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
              <input type="text" value={coAttestNote} onChange={e => setCoAttestNote(e.target.value)}
                placeholder="Note (optional)…" className="flex-1 bg-transparent text-[11px] text-ink font-mono outline-none placeholder:text-ink-faint" />
            </div>
            <button onClick={handleCoAttest} disabled={loading === 'co-attest'}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium rounded-sm hover:bg-accent/20 transition disabled:opacity-40">
              {loading === 'co-attest' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
              Co-Sign
            </button>
          </div>
        </div>

        {/* Transfer Custody */}
        <div>
          <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-1.5">Transfer Custody</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-void border border-rule rounded-sm px-3 py-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-caution shrink-0" strokeWidth={1.5} />
              <input type="email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)}
                placeholder="Recipient email…" className="flex-1 bg-transparent text-[11px] text-ink font-mono outline-none placeholder:text-ink-faint" />
            </div>
            <button onClick={handleTransfer} disabled={!transferEmail || loading === 'transfer'}
              className="flex items-center gap-1.5 px-3 py-2 bg-caution/10 border border-caution/20 text-caution text-[11px] font-medium rounded-sm hover:bg-caution/20 transition disabled:opacity-40">
              {loading === 'transfer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
              Transfer
            </button>
          </div>
        </div>

        {/* Revoke */}
        <div>
          <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-1.5">Revoke Proof</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-void border border-rule rounded-sm px-3 py-2">
              <Ban className="w-3.5 h-3.5 text-danger shrink-0" strokeWidth={1.5} />
              <input type="text" value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                placeholder="Reason (optional)…" className="flex-1 bg-transparent text-[11px] text-ink font-mono outline-none placeholder:text-ink-faint" />
            </div>
            <button onClick={handleRevoke} disabled={loading === 'revoke'}
              className="flex items-center gap-1.5 px-3 py-2 bg-danger/10 border border-danger/20 text-danger text-[11px] font-medium rounded-sm hover:bg-danger/20 transition disabled:opacity-40">
              {loading === 'revoke' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
              Revoke
            </button>
          </div>
        </div>

        {/* PDF Report */}
        <button onClick={handleDownloadReport} disabled={loading === 'pdf'}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-raised border border-rule text-ink-secondary text-[11px] font-medium rounded-sm hover:bg-void transition disabled:opacity-40">
          {loading === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Download Custody Report (PDF)
        </button>
      </div>
    </div>
  );
}
