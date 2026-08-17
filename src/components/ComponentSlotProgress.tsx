'use client';
import { COMPONENT_SLOTS } from '@/lib/componentSlots';

// "N / 18 ta band tanlangan" — bo'sh qatorlarni bittalab sanash o'rniga
// darhol ko'rinadigan umumiy holat.
export default function ComponentSlotProgress({ filledCount }: { filledCount: number }) {
  const total = COMPONENT_SLOTS.length;
  const pct = Math.round((filledCount / total) * 100);
  return (
    <div className="slot-progress">
      <span><b>{filledCount}</b> / {total} band tanlangan</span>
      <div className="slot-progress-bar"><div className="slot-progress-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
