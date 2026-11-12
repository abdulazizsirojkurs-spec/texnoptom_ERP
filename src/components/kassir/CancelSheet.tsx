'use client';
import { useState } from 'react';

// Yozuvni bekor qilish — sabab majburiy (kamida 3 belgi). Pastdan chiqadigan oyna.
export default function CancelSheet({
  summary, busy, error, onConfirm, onClose,
}: {
  summary: string; busy: boolean; error: string;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length >= 3;

  return (
    <div className="ks-sheet-backdrop" onClick={busy ? undefined : onClose}>
      <div className="ks-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ks-sheet-title">Yozuvni bekor qilish</div>
        <div className="ks-sheet-sum">{summary}</div>
        <label className="ks-label">Sababi (majburiy)</label>
        <input
          className="ks-input"
          autoFocus
          maxLength={200}
          placeholder="Masalan: summani xato kiritdim"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="ks-hint">Bekor qilish haqida admin&apos;ga xabar boradi.</div>
        {error && <div className="ks-error">{error}</div>}
        <div className="ks-sheet-actions">
          <button className="ks-btn ks-btn-ghost" onClick={onClose} disabled={busy}>Yo&apos;q</button>
          <button className="ks-btn ks-btn-danger" onClick={() => onConfirm(reason.trim())} disabled={!ok || busy}>
            {busy ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
          </button>
        </div>
      </div>
    </div>
  );
}
