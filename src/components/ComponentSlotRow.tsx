'use client';
import { ComponentSlot } from '@/lib/componentSlots';
import { Minus, Plus, X } from 'lucide-react';

export type SlotOption = { id: string; name: string; stock?: number };

// Bitta "komplekt qismi" qatori — uchala joyda (buyurtma yaratish, admin
// tahrirlash, skladchi tahrirlash) bir xil ko'rinish uchun. Label va
// dropdown ustma-ust (stacked) joylashadi — tovar nomi HECH QACHON
// kesilmaydi (avvalgi "3 ustunli siqiq qator" dizaynidagi asosiy muammo).
export default function ComponentSlotRow({
  slot, value, quantity, options, placeholder, disabled, onProductChange, onQtyChange,
}: {
  slot: ComponentSlot;
  value: string;
  quantity: number;
  options: SlotOption[];
  placeholder: string;
  disabled?: boolean;
  onProductChange: (productId: string) => void;
  onQtyChange?: (qty: number) => void;
}) {
  const filled = !!value;
  const selectedOption = filled ? options.find(o => o.id === value) : undefined;
  // Tanlangan tovar hozir omborda yo'q (masalan otgruzka/vozvrat orqali
  // qoldiq 0'ga tushib qolgan) — skladchi buni darhol ko'rib, olib kelishi
  // kerakligini bilishi uchun qator qizil rangda ajratiladi.
  const outOfStock = filled && selectedOption?.stock !== undefined && selectedOption.stock <= 0;

  return (
    <div className="slot-row" data-filled={filled} data-out-of-stock={outOfStock}>
      <div className="slot-row-top">
        <label className="slot-row-label">
          <span className="slot-dot" />
          {slot.label}
        </label>
        {filled && onQtyChange && (
          <div className="slot-row-qty">
            <button type="button" disabled={disabled} onClick={() => onQtyChange(Math.max(1, quantity - 1))}><Minus size={11} /></button>
            <span>{quantity}</span>
            <button type="button" disabled={disabled} onClick={() => onQtyChange(quantity + 1)}><Plus size={11} /></button>
          </div>
        )}
      </div>
      <div className="slot-row-select-wrap">
        <select
          className="slot-row-select"
          value={value}
          disabled={disabled}
          onChange={e => onProductChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id} disabled={opt.stock !== undefined && opt.stock <= 0 && opt.id !== value}>
              {opt.name}{opt.stock !== undefined ? (opt.stock > 0 ? ` — ${opt.stock} dona` : " — omborda yo'q") : ''}
            </option>
          ))}
        </select>
        {filled && (
          <button
            type="button"
            className="slot-row-clear"
            disabled={disabled}
            onClick={() => onProductChange('')}
            aria-label="Tanlovni bekor qilish"
            title="Tanlovni bekor qilish"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
