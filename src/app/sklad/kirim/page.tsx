'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Search, Check, Plus, Trash2 } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';

export default function SkladKirimPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [kirimSana, setKirimSana] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedProduct, setSelectedProduct] = useState('');
  const [kirimQty, setKirimQty] = useState('');
  const [kirimPriceUsd, setKirimPriceUsd] = useState('');
  const [receiptItems, setReceiptItems] = useState<any[]>([]);
  const [kirimSearchTerm, setKirimSearchTerm] = useState('');
  const [showKirimDropdown, setShowKirimDropdown] = useState(false);
  const [kirimLoading, setKirimLoading] = useState(false);
  const [kirimSuccess, setKirimSuccess] = useState('');

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data }) => { if (data) setSuppliers(data); });
    supabase.from('products').select('*, categories(name)').then(({ data }) => { if (data) setProducts(data); });
    supabase.from('inventory_balances').select('product_id, quantity').then(({ data }) => {
      if (data) {
        const m: Record<string, number> = {};
        data.forEach((b: any) => { m[b.product_id] = Number(b.quantity) || 0; });
        setStockMap(m);
      }
    });
  }, []);

  const handleAddItemToReceipt = () => {
    if (!selectedProduct || !kirimQty || !kirimPriceUsd) return;
    const prod = products.find(p => p.id === selectedProduct);
    setReceiptItems([...receiptItems, {
      product_id: selectedProduct, product_name: prod.name, category_name: prod.categories?.name,
      quantity: Number(kirimQty), incoming_price: Number(kirimPriceUsd), total: Number(kirimQty) * Number(kirimPriceUsd),
    }]);
    setSelectedProduct(''); setKirimQty(''); setKirimPriceUsd(''); setKirimSearchTerm('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...receiptItems]; newItems.splice(index, 1); setReceiptItems(newItems);
  };

  const handleSubmitReceipt = async () => {
    if (!selectedSupplier) { alert('Xato: Postavshik (Hamkor) tanlash majburiy!'); return; }
    if (receiptItems.length === 0) { alert("Xato: Hech qanday tovar qo'shilmagan!"); return; }
    setKirimLoading(true); setKirimSuccess('');
    try {
      const receiptDate = new Date(kirimSana + 'T12:00:00');
      const { error } = await supabase.rpc('create_receipt_doc', {
        p_supplier_id: selectedSupplier,
        p_document_date: receiptDate.toISOString(),
        p_items: receiptItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          incoming_price: item.incoming_price,
        })),
      });
      if (error) throw error;

      setKirimSuccess('Kirim hujjati saqlandi!'); setReceiptItems([]); setSelectedSupplier('');
      setKirimSana(new Date().toISOString().slice(0, 10));
    } catch (error: any) { alert('Xatolik: ' + error.message); }
    finally { setKirimLoading(false); }
  };

  return (
    <div className="sklad-page">
      <SkladHeader title="Tovar kirim" backHref="/sklad" actionHref="/sklad/kirim/tarix" />
      <div className="sklad-body">
        <div className="card">
          <h2 style={{ marginBottom: 4, fontSize: '1.2rem' }}>Yangi Kirim Hujjati</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 0, marginBottom: 16 }}>
            Postavshik va tovarlarni tanlab ro'yxat tuzing, so'ng "Tasdiqlash"ni bosing.
          </p>
          {kirimSuccess && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16 }}>{kirimSuccess}</div>}

          <div className="kirim-entry">
            <div>
              <label className="field-label">Postavshik (Hamkor)</label>
              <select className="input-field input-lg" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                <option value="">Tanlang...</option>
                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Kirim sanasi</label>
              <input
                type="date"
                className="input-field input-lg"
                value={kirimSana}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setKirimSana(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label className="field-label">Tovar</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="var(--gray-400)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="input-field input-lg"
                  placeholder="Tovar nomini yozib qidiring..."
                  value={kirimSearchTerm}
                  autoComplete="off"
                  onFocus={() => setShowKirimDropdown(true)}
                  onBlur={() => setTimeout(() => setShowKirimDropdown(false), 200)}
                  onChange={(e) => { setKirimSearchTerm(e.target.value); setSelectedProduct(''); }}
                  style={{ paddingLeft: 40, borderColor: selectedProduct ? 'var(--success-500)' : undefined }}
                />
                {selectedProduct && (
                  <Check size={18} color="var(--success-500)" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </div>
              {showKirimDropdown && (
                <div className="kirim-search-menu">
                  {(() => {
                    const list = products.filter(p => p.name.toLowerCase().includes(kirimSearchTerm.toLowerCase())).slice(0, 80);
                    return (
                      <>
                        {list.length === 0 ? (
                          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Topilmadi. Bu tovar katalogda yo'q bo'lsa, CEO/admin bilan bog'laning — u yangi tovar qo'shib beradi.
                          </div>
                        ) : list.map(prod => {
                          const stock = stockMap[prod.id] ?? 0;
                          return (
                            <div
                              key={prod.id}
                              className="kirim-search-item"
                              onMouseDown={() => { setSelectedProduct(prod.id); setKirimSearchTerm(prod.name); setShowKirimDropdown(false); }}
                            >
                              <span className="name">{prod.name}</span>
                              <span className={`stock ${stock <= 0 ? 'zero' : ''}`}>omborda: {stock}</span>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="kirim-two-col">
              <div>
                <label className="field-label">Soni</label>
                <input type="number" inputMode="numeric" className="input-field input-lg" placeholder="0"
                  value={kirimQty} onChange={e => setKirimQty(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Narx ($/dona)</label>
                <input type="number" inputMode="decimal" className="input-field input-lg" placeholder="0"
                  value={kirimPriceUsd} onChange={e => setKirimPriceUsd(e.target.value)} />
              </div>
            </div>

            <button
              onClick={handleAddItemToReceipt}
              className="btn btn-primary kirim-add-btn"
              disabled={!selectedProduct || !kirimQty || !kirimPriceUsd}
            >
              <Plus size={18} /> Ro'yxatga qo'shish
              {selectedProduct && kirimQty && kirimPriceUsd
                ? ` — $${(Number(kirimQty) * Number(kirimPriceUsd)).toLocaleString()}`
                : ''}
            </button>
          </div>

          {receiptItems.length === 0 ? (
            <div className="kirim-empty">Hali tovar qo'shilmagan</div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              {receiptItems.map((it, idx) => (
                <div key={idx} className="kirim-item-row">
                  <div className="kirim-item-info">
                    <div className="kirim-item-name">{it.product_name}</div>
                    <div className="kirim-item-sub">{it.quantity} dona × ${Number(it.incoming_price).toLocaleString()}</div>
                  </div>
                  <div className="kirim-item-total">${Number(it.total).toLocaleString()}</div>
                  <button className="kirim-item-del" onClick={() => handleRemoveItem(idx)} title="O'chirish">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {receiptItems.length > 0 && (
            <div className="kirim-footer">
              <div className="kirim-total-line">
                <span style={{ color: 'var(--text-secondary)' }}>Nakladnoy bo'yicha jami</span>
                <span className="amount">${receiptItems.reduce((sum, it) => sum + it.total, 0).toLocaleString()}</span>
              </div>
              <button className="btn btn-primary kirim-confirm-btn" onClick={handleSubmitReceipt} disabled={kirimLoading}>
                {kirimLoading ? 'Saqlanmoqda...' : `✓ Tasdiqlash (${receiptItems.length} ta tovar)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
