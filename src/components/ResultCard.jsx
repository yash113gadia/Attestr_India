import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck, Loader2, FileDown, Eye, User, QrCode, FileText, Users, ArrowRightLeft, Ban, Smartphone, Clock, Download } from 'lucide-react';
import { generateNotarySeal } from '../lib/badge';
import { generateCertificate } from '../lib/certificate';
import { generateQRCodeDataURL } from '../lib/qrcode';
import { downloadCustodyReport } from '../lib/pdf';

const cfg = {
  verified:   { label: 'VERIFIED',      dot: 'bg-verified', bg: 'bg-verified-glow', text: 'text-verified' },
  similar:    { label: 'SIMILAR MATCH', dot: 'bg-caution',  bg: 'bg-caution-glow',  text: 'text-caution' },
  unverified: { label: 'NOT FOUND',    dot: 'bg-danger',   bg: 'bg-danger-glow',   text: 'text-danger' },
  registered: { label: 'REGISTERED',   dot: 'bg-verified', bg: 'bg-verified-glow', text: 'text-verified' },
};

const QR_BASE = typeof window !== 'undefined' ? window.location.origin : '';

export default function ResultCard({ status, message, block, similarity, onChain, file, registrant, verificationCount, recentVerifications, attestationNote, custodyTimeline, coSigners, isRevoked, currentCustodian }) {
  const [generating, setGenerating] = useState(false);
  const c = cfg[status] || cfg.unverified;

  const isImage = file?.type?.startsWith('image/');
  const canDownload = (status === 'verified' || status === 'registered' || status === 'similar');

  // Resolve registrant display info
  const regName = registrant?.name || block?.data?.userName || null;
  const regPhoto = registrant?.photo || block?.data?.userPhoto || null;
  const hasRegistrant = regName && regName !== 'Unknown' && regName !== 'Anonymous';

  async function handleDownload() {
    setGenerating(true);
    try {
      const meta = {
        sha256: onChain?.sha256 || block?.data?.sha256 || file?._sha256,
        timestamp: onChain?.timestamp || (block?.timestamp ? new Date(block.timestamp).getTime() / 1000 : null),
        filename: onChain?.filename || block?.data?.filename || file?.name,
        fileSize: file?.size,
        mimeType: file?.type,
        transactionHash: onChain?.transactionHash,
        blockNumber: onChain?.blockNumber,
        registeredBy: regName || onChain?.registeredBy || block?.data?.userName,
      };

      let result;
      if (isImage) {
        result = await generateNotarySeal(file, meta);
      } else {
        result = await generateCertificate(meta);
      }

      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(result.url);
    } catch (err) {
      console.error('Download generation failed:', err);
    }
    setGenerating(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-rule rounded-sm overflow-hidden">
      <div className={`${c.bg} px-5 py-3 flex items-center gap-3`}>
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-[11px] font-mono font-semibold tracking-wider ${c.text}`}>{c.label}</span>
        {similarity != null && similarity !== 100 && <span className="text-[11px] font-mono text-ink-tertiary ml-auto">{similarity}%</span>}
        {onChain?.transactionHash && <span className="text-[10px] font-mono text-accent bg-accent-glow px-2 py-0.5 rounded-sm ml-auto">SEPOLIA</span>}
      </div>
      <div className="bg-surface px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <p className="text-[13px] text-ink-secondary leading-relaxed flex-1">{message}</p>

          {canDownload && (
            <div className="shrink-0 flex items-center gap-2">
              <button 
                onClick={handleDownload}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-verified/10 border border-verified/20 text-verified text-[11px] font-medium rounded-sm hover:bg-verified/20 transition disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : isImage ? <ShieldCheck className="w-3 h-3" /> : <FileDown className="w-3 h-3" />}
                {generating ? 'Generating...' : isImage ? 'Seal' : 'Certificate'}
              </button>
              <button 
                onClick={() => downloadCustodyReport({ status, message, block, similarity, onChain, file, registrant, verificationCount, recentVerifications, attestationNote, custodyTimeline, coSigners, isRevoked, currentCustodian })}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium rounded-sm hover:bg-accent/20 transition"
              >
                <Download className="w-3 h-3" /> PDF Report
              </button>
            </div>
          )}
        </div>

        {/* ── Registrant Identity Card ── */}
        {(hasRegistrant || regPhoto) && (status === 'verified' || status === 'similar') && (
          <div className="mt-4 pt-3 border-t border-rule">
            <div className="flex items-center gap-3 bg-surface-raised border border-rule rounded-sm p-3">
              {regPhoto ? (
                <img src={regPhoto} alt="" className="w-9 h-9 rounded-full object-cover border border-rule" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent" strokeWidth={1.5} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink font-medium truncate">{regName}</p>
                <p className="text-[10px] text-ink-faint font-mono">Registered this file on the blockchain</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-mono text-verified bg-verified/10 px-2 py-0.5 rounded-full uppercase">Verified Identity</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Verification Audit Trail ── */}
        {verificationCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-tertiary">
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Verified <span className="text-ink font-medium">{verificationCount}</span> time{verificationCount !== 1 ? 's' : ''}</span>
            {recentVerifications?.length > 0 && (
              <span className="text-ink-faint ml-1">
                — last by {recentVerifications[0].verifiedByName || 'Anonymous'}
              </span>
            )}
          </div>
        )}

        {onChain?.transactionHash && (
          <div className="mt-5 pt-4 border-t border-rule bg-accent/5 -mx-5 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-kesari tracking-widest uppercase font-bold text-shadow-sm">Bharat Digital Proof Seal</span>
              <span className="text-[9px] font-mono text-verified bg-verified/10 px-2 py-0.5 rounded-full">SOVEREIGN VERIFIED</span>
            </div>

            <div className="bg-surface-raised border border-kesari/20 rounded-sm p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                {regPhoto ? (
                  <img src={regPhoto} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-verified" />
                )}
                <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Signatory Identity</span>
              </div>
              <p className="text-[14px] font-serif text-ink truncate">{hasRegistrant ? regName : onChain.registeredBy}</p>
              {hasRegistrant && onChain.registeredBy && (
                <p className="text-[10px] font-mono text-ink-faint mt-0.5 truncate">Wallet: {onChain.registeredBy}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono text-verified bg-verified/10 px-1.5 py-0.5 rounded-xs uppercase">{hasRegistrant ? 'Google Verified' : 'Wallet Verified'}</span>
                <span className="text-[9px] font-mono text-ink-faint italic">via Bharat Ledger</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between border-b border-rule-light pb-1.5">
                <span className="text-ink-faint">Transaction</span>
                <span className="text-ink truncate ml-4 max-w-[180px]">{onChain.transactionHash}</span>
              </div>
              <div className="flex justify-between border-b border-rule-light pb-1.5">
                <span className="text-ink-faint">Block Height</span>
                <span className="text-ink">#{onChain.blockNumber}</span>
              </div>
              {onChain.gasUsed && (
                <div className="flex justify-between border-b border-rule-light pb-1.5">
                  <span className="text-ink-faint">Network Fee (Gas)</span>
                  <span className="text-ink">{Number(onChain.gasUsed).toLocaleString()} units</span>
                </div>
              )}
              {onChain.timestamp && (
                <div className="flex justify-between border-b border-rule-light pb-1.5">
                  <span className="text-ink-faint">Sealed On</span>
                  <span className="text-ink">{new Date(onChain.timestamp * 1000).toLocaleString()}</span>
                </div>
              )}
            </div>
            <a href={onChain.etherscanUrl} target="_blank" rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-accent text-white py-2 rounded-sm text-[12px] font-medium hover:bg-accent/90 transition shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" /> View on Etherscan
            </a>
          </div>
        )}

        {block && !onChain?.transactionHash && (
          <div className="mt-4 pt-3 border-t border-rule-light font-mono text-[11px] space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Local Ledger Proof</span>
            </div>
            
            <div className="bg-surface-raised border border-rule-light rounded-sm p-2.5 mb-2 flex items-center gap-2.5">
              {regPhoto ? (
                <img src={regPhoto} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : null}
              <div>
                <span className="text-[9px] font-mono text-ink-faint tracking-widest uppercase block mb-0.5">Registrant</span>
                <p className="text-[12px] text-ink truncate">{regName || 'Anonymous Account'}</p>
              </div>
            </div>

            <div className="flex"><span className="text-ink-faint w-12">block</span><span className="text-ink">#{block.index}</span></div>
            <div className="flex"><span className="text-ink-faint w-12">hash</span><span className="text-ink truncate">{block.hash}</span></div>
            <div className="flex"><span className="text-ink-faint w-12">time</span><span className="text-ink">{new Date(block.timestamp).toLocaleString()}</span></div>
          </div>
        )}

        {/* ── Revocation Warning ── */}
        {isRevoked && (
          <div className="mt-4 bg-danger/10 border border-danger/20 rounded-sm p-3 flex items-center gap-3">
            <Ban className="w-5 h-5 text-danger shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-[12px] text-danger font-medium">Proof Revoked</p>
              <p className="text-[10px] text-danger/70">The original registrant has revoked their proof for this file.</p>
            </div>
          </div>
        )}

        {/* ── Attestation Note ── */}
        {attestationNote && (
          <div className="mt-4 pt-3 border-t border-rule">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-ink-faint" strokeWidth={1.5} />
              <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Proof Note</span>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed bg-surface-raised border border-rule-light rounded-sm p-3 italic">
              "{attestationNote}"
            </p>
          </div>
        )}

        {/* ── Co-Signers ── */}
        {coSigners?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-rule">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Co-Signatures ({coSigners.length})</span>
            </div>
            <div className="space-y-1.5">
              {coSigners.map((cs, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface-raised border border-rule-light rounded-sm p-2">
                  {cs.photo ? (
                    <img src={cs.photo} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center">
                      <User className="w-3 h-3 text-accent" strokeWidth={1.5} />
                    </div>
                  )}
                  <span className="text-[11px] text-ink font-medium">{cs.name}</span>
                  <span className="text-[9px] text-ink-faint font-mono ml-auto">{new Date(cs.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Current Custodian ── */}
        {currentCustodian && currentCustodian.name !== registrant?.name && (status === 'verified' || status === 'similar') && (
          <div className="mt-3 flex items-center gap-2 text-[11px] bg-accent/5 border border-accent/15 rounded-sm p-2.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span className="text-ink-secondary">Current custodian: <span className="text-ink font-medium">{currentCustodian.name}</span></span>
          </div>
        )}

        {/* ── Chain of Custody Timeline ── */}
        {custodyTimeline?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-rule">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-ink-faint" strokeWidth={1.5} />
              <span className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">Chain of Custody</span>
            </div>
            <div className="relative pl-4 border-l border-rule-light space-y-3">
              {custodyTimeline.slice(-8).reverse().map((evt, i) => (
                <div key={i} className="relative">
                  <span className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-void ${
                    evt.type === 'registered' ? 'bg-verified' :
                    evt.type === 'co-attested' ? 'bg-accent' :
                    evt.type === 'custody-transferred' ? 'bg-caution' :
                    evt.type === 'revoked' ? 'bg-danger' : 'bg-ink-faint'
                  }`} />
                  <div className="text-[11px]">
                    <span className="text-ink font-medium">
                      {evt.type === 'registered' && `Registered by ${evt.by}`}
                      {evt.type === 'co-attested' && `Co-signed by ${evt.by}`}
                      {evt.type === 'custody-transferred' && `Custody → ${evt.toName}`}
                      {evt.type === 'revoked' && `Revoked by ${evt.by}`}
                    </span>
                    {evt.note && <span className="text-ink-faint"> — "{evt.note}"</span>}
                    {evt.reason && <span className="text-danger/70"> — {evt.reason}</span>}
                    <p className="text-[9px] text-ink-faint font-mono mt-0.5">{new Date(evt.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Device Attestation ── */}
        {block?.data?.deviceInfo && (
          <div className="mt-3 pt-3 border-t border-rule-light">
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone className="w-3 h-3 text-ink-faint" strokeWidth={1.5} />
              <span className="text-[9px] font-mono text-ink-faint tracking-widest uppercase">Device Info</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono text-ink-tertiary">
              <span>{block.data.deviceInfo.platform}</span>
              <span>{block.data.deviceInfo.timezone}</span>
              <span>{block.data.deviceInfo.screenRes}</span>
            </div>
          </div>
        )}

        {/* ── QR Verification Badge ── */}
        {(status === 'verified' || status === 'registered') && (block?.data?.sha256 || onChain) && (
          <div className="mt-4 pt-3 border-t border-rule flex items-center gap-4">
            <img 
              src={generateQRCodeDataURL(`${QR_BASE}/verify?sha256=${block?.data?.sha256 || ''}`)} 
              alt="QR Code" 
              className="w-16 h-16 rounded-sm border border-rule bg-white p-1"
            />
            <div>
              <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase mb-1">Quick Verify QR</p>
              <p className="text-[11px] text-ink-secondary leading-relaxed">Scan to verify this file's authenticity from any device.</p>
              <p className="text-[9px] text-ink-faint font-mono mt-1 truncate max-w-[200px]">{QR_BASE}/verify?sha256=...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
