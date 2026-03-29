import { useState, useEffect } from 'react';
import { CheckCircle, Cpu, Hash, Layers, Zap, X, Mail, Copy, Download } from 'lucide-react';
import { sendReceiptEmail, isEmailConfigured } from '../lib/emailReceipt';
import toast from 'react-hot-toast';

const STEPS = [
  { icon: Zap,          label: 'Validating transaction…',  color: '#6366f1' },
  { icon: Cpu,          label: 'Executing smart contract…', color: '#06b6d4' },
  { icon: Hash,         label: 'Generating tx hash…',      color: '#f59e0b' },
  { icon: Layers,       label: 'Mining block…',             color: '#10b981' },
  { icon: CheckCircle,  label: 'Transaction confirmed!',    color: '#10b981' },
];

export default function SmartContractModal({
  open, onClose, result, loading, title, error,
  // Optional: pass these for the email receipt
  txType, amount, recipientName, senderName,
}) {
  const [step, setStep]           = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending]     = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (loading) {
      setStep(0);
      setEmailSent(false);
      const iv = setInterval(() => setStep(s => (s < STEPS.length - 2 ? s + 1 : s)), 600);
      return () => clearInterval(iv);
    }
    if (result) setStep(STEPS.length - 1);
  }, [loading, result]);

  function copyHash() {
    if (!result?.txId) return;
    navigator.clipboard.writeText(result.txId);
    setCopied(true);
    toast.success('TX hash copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmail() {
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    setSending(true);
    const res = await sendReceiptEmail({
      toEmail: u.email,
      toName: u.name,
      txId: result?.txId,
      txType: txType || title || 'Transaction',
      amount: amount || result?.amount,
      blockNumber: result?.blockNumber,
      fromName: senderName || u.name,
      toWalletId: recipientName || 'N/A',
      balanceAfter: result?.updatedBalance ?? result?.studentBalance ?? result?.senderBalance,
    });
    setSending(false);
    if (res.skipped) return toast('Email not configured yet — add EmailJS keys to .env.local', { icon: 'ℹ️' });
    if (res.success) { setEmailSent(true); toast.success('Receipt emailed! 📧'); }
    else toast.error('Email failed: ' + res.error);
  }

  function downloadReceipt() {
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    const lines = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '         CAMPUSCHAIN RECEIPT',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Contract  : ${title || 'Transaction'}`,
      `Type      : ${txType || 'Transfer'}`,
      `Amount    : ${Number(amount || 0).toFixed(2)} CC`,
      `Block     : #${result?.blockNumber || 'N/A'}`,
      `TX Hash   : ${result?.txId || 'N/A'}`,
      `Balance   : ${(result?.updatedBalance ?? result?.studentBalance ?? 0).toFixed(2)} CC`,
      `Recipient : ${recipientName || 'N/A'}`,
      `From      : ${u.name || senderName || 'N/A'}`,
      `Status    : CONFIRMED ✅`,
      `Time      : ${new Date().toLocaleString('en-IN')}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'CampusChain — Blockchain Campus Financial OS',
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `receipt_${result?.txId?.slice(0, 8) || Date.now()}.txt`;
    a.click();
  }

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
      <div className="glass-bright" style={{ borderRadius: 20, padding: 32, width: '90%', maxWidth: 480, position: 'relative' }}>
        {!loading && (
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={18} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{title || 'Processing Transaction'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Permissioned Blockchain v1.0</div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {STEPS.map(({ icon: Icon, label, color }, i) => {
            const done   = i < step || (!loading && result && i <= step);
            const active = i === step && loading;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i > step && loading ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: done || active ? `${color}22` : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${done || active ? color : 'var(--border)'}`, flexShrink: 0, transition: 'all 0.3s' }}>
                  {active ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Icon size={14} color={done ? color : 'var(--text-muted)'} />}
                </div>
                <span style={{ fontSize: '0.88rem', color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: done ? 600 : 400 }}>{label}</span>
                {done && !active && <CheckCircle size={12} color={color} style={{ marginLeft: 'auto' }} />}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', fontSize: '0.88rem', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && !error && (
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 16 }}>
            <div style={{ color: 'var(--success)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} /> Transaction Confirmed on Chain
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.txId && (
                <div>
                  <div className="label">TX Hash</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-bright)', wordBreak: 'break-all', flex: 1 }}>{result.txId}</div>
                    <button onClick={copyHash} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 }}>
                {result.blockNumber && (
                  <div>
                    <div className="label">Block</div>
                    <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 700 }}>#{result.blockNumber}</div>
                  </div>
                )}
                {amount && (
                  <div>
                    <div className="label">Amount</div>
                    <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 700 }}>−{Number(amount).toFixed(2)} CC</div>
                  </div>
                )}
                {(result.updatedBalance ?? result.studentBalance ?? result.senderBalance) !== undefined && (
                  <div>
                    <div className="label">New Balance</div>
                    <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 700 }}>
                      {(result.updatedBalance ?? result.studentBalance ?? result.senderBalance)?.toFixed(2)} CC
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons after success */}
        {result && !error && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              onClick={sendEmail}
              disabled={sending || emailSent}
            >
              {sending ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Sending…</> :
               emailSent ? <><CheckCircle size={12} /> Sent!</> :
               <><Mail size={12} /> Email Receipt</>}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              onClick={downloadReceipt}
            >
              <Download size={12} /> Download
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
