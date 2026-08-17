'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Trash2, Camera, Plus } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';

type OrderItem = { id: string; product_id: string; product_name: string; quantity: number };
type Order = {
  id: string; order_code: string; client_name: string; status: string; is_shipped: boolean;
  otgruzka_photo_url: string | null;
  sales_order_items: OrderItem[];
};

export default function SkladOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const orderId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('id, order_code, client_name, status, is_shipped, otgruzka_photo_url, sales_order_items(id, product_id, product_name, quantity)')
      .eq('id', orderId)
      .single();
    if (error) { alert('Xatolik: ' + error.message); router.push('/sklad/buyurtmalar'); return; }
    setOrder(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    supabase.from('products').select('*, categories(name)').then(({ data }) => { if (data) setProducts(data); });
    supabase.from('inventory_balances').select('product_id, quantity').then(({ data }) => {
      if (data) {
        const m: Record<string, number> = {};
        data.forEach((b: any) => { m[b.product_id] = Number(b.quantity) || 0; });
        setStockMap(m);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleItemQtyChange = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    const reason = prompt("Nima uchun miqdorni o'zgartiryapsiz? (sabab yozish majburiy)");
    if (!reason || !reason.trim()) return;
    setSavingItemId(itemId);
    try {
      const { error } = await supabase.rpc('sklad_set_item_qty', { p_item_id: itemId, p_qty: qty, p_reason: reason });
      if (error) throw error;
      await fetchOrder();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSavingItemId(null);
    }
  };

  const handleItemDelete = async (itemId: string) => {
    if (!confirm("Bu tovarni buyurtmadan o'chirasizmi?")) return;
    const reason = prompt("Nima uchun bu tovarni o'chiryapsiz? (sabab yozish majburiy)");
    if (!reason || !reason.trim()) return;
    setSavingItemId(itemId);
    try {
      const { error } = await supabase.rpc('sklad_delete_item', { p_item_id: itemId, p_reason: reason });
      if (error) throw error;
      await fetchOrder();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSavingItemId(null);
    }
  };

  const itemCategories = Array.from(new Set(products.map((p: any) => p.categories?.name).filter(Boolean)));
  const filteredNewItemProducts = products.filter((p: any) => p.categories?.name === newItemCategory);

  const handleAddItem = async () => {
    if (!order || !newItemProductId || Number(newItemQty) < 1) return;
    const product = products.find((p: any) => p.id === newItemProductId);
    if (!product) return;

    const stock = stockMap[product.id] ?? 0;
    if (stock <= 0) {
      alert(`"${product.name}" — hozir omborda yo'q bu tovardan.\n\nAvval omborga prixod (kirim) qiling, keyin buyurtmaga biriktira olasiz.`);
      return;
    }
    if (Number(newItemQty) > stock) {
      alert(`"${product.name}" — omborda faqat ${stock} dona bor, siz ${newItemQty} dona qo'shmoqchisiz.`);
      return;
    }

    if (!confirm(`"${product.name}" buyurtmaga qo'shiladi. Bu buyurtmadagidan BOSHQA/QO'SHIMCHA tovar — mijoz bilan kelishdingizmi?`)) return;
    const addReason = prompt('Sabab yozing (masalan: mijoz bilan kelishildi, boshqa model bilan almashtirildi):');
    if (!addReason || !addReason.trim()) return;

    setSavingItemId('new');
    try {
      const { error } = await supabase.rpc('sklad_add_item', {
        p_order_id: order.id,
        p_product_id: product.id,
        p_qty: Number(newItemQty),
        p_category: newItemCategory,
        p_reason: addReason,
      });
      if (error) throw error;
      setNewItemCategory(''); setNewItemProductId(''); setNewItemQty('1');
      await fetchOrder();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSavingItemId(null);
    }
  };

  const handleOtgruzkaClick = () => {
    if (!order) return;
    if (!confirm("Rostdan ham bu buyurtmani otgruzka qilasizmi? Bu tovarlarni ombordan ayirib tashlaydi!")) return;
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // shu inputni qayta ishlatish uchun tozalanadi
    if (!file || !order) return;

    setShipping(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${order.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('otgruzka_proofs').upload(fileName, file);
      if (uploadError) throw new Error("Rasm yuklashda xatolik: " + uploadError.message);
      const { data: publicUrlData } = supabase.storage.from('otgruzka_proofs').getPublicUrl(fileName);
      const photoUrl = publicUrlData.publicUrl;

      // Rasm muvaffaqiyatli yuklangandan KEYINGINA otgruzka chaqiriladi.
      const { error } = await supabase.rpc('otgruzka_order', { p_order_id: order.id, p_photo_url: photoUrl });
      if (error) throw error;

      alert('Muvaffaqiyatli otgruzka qilindi!');
      router.push('/sklad/buyurtmalar');
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setShipping(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="sklad-page">
        <SkladHeader title="Buyurtma" backHref="/sklad/buyurtmalar" />
        <div className="sklad-body"><div className="kirim-empty">Yuklanmoqda...</div></div>
      </div>
    );
  }

  const readOnly = order.is_shipped;

  return (
    <div className="sklad-page">
      <SkladHeader title={order.order_code} backHref="/sklad/buyurtmalar" />
      <div className="sklad-body">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{order.client_name}</h2>
            <span className={`sklad-status-pill ${readOnly ? 'shipped' : 'pending'}`}>
              {readOnly ? '✅ Otgruzka qilingan' : '⏳ Kutilmoqda'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4, marginBottom: 16 }}>
            Tovarlar ro'yxati {readOnly ? '' : '— soni/tovar tarkibini bu yerdan o\'zgartirasiz'}
          </p>

          {order.sales_order_items.length === 0 ? (
            <div className="kirim-empty">Tovar yo'q</div>
          ) : (
            <div style={{ marginBottom: readOnly ? 0 : 8 }}>
              {order.sales_order_items.map(it => (
                <div key={it.id} className="kirim-item-row">
                  <div className="kirim-item-info">
                    <div className="kirim-item-name">{it.product_name}</div>
                  </div>
                  {readOnly ? (
                    <div className="kirim-item-total">{it.quantity} dona</div>
                  ) : (
                    <>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        defaultValue={it.quantity}
                        disabled={savingItemId === it.id}
                        style={{ width: 60, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}
                        onBlur={(e) => {
                          const q = Number(e.target.value);
                          if (q > 0 && q !== it.quantity) handleItemQtyChange(it.id, q);
                          else e.target.value = String(it.quantity);
                        }}
                      />
                      <button className="kirim-item-del" onClick={() => handleItemDelete(it.id)} disabled={savingItemId === it.id} title="O'chirish">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {readOnly && order.otgruzka_photo_url && (
            <div style={{ marginTop: 12 }}>
              <div className="field-label">Otgruzka rasmi</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.otgruzka_photo_url} alt="Otgruzka isboti" style={{ width: '100%', borderRadius: 10, marginTop: 6 }} />
            </div>
          )}

          {!readOnly && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
              <div className="field-label" style={{ marginBottom: 8 }}>+ Tovar qo'shish</div>
              <div className="kirim-two-col" style={{ marginBottom: 10 }}>
                <select className="input-field" value={newItemCategory} onChange={e => { setNewItemCategory(e.target.value); setNewItemProductId(''); }}>
                  <option value="">Kategoriya...</option>
                  {itemCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="input-field" value={newItemProductId} onChange={e => setNewItemProductId(e.target.value)} disabled={!newItemCategory}>
                  <option value="">Tovar...</option>
                  {filteredNewItemProducts.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (omborda: {stockMap[p.id] ?? 0})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number" inputMode="numeric" className="input-field" placeholder="Soni"
                  value={newItemQty} onChange={e => setNewItemQty(e.target.value)} style={{ width: 80 }}
                />
                <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={handleAddItem} disabled={!newItemProductId || savingItemId === 'new'}>
                  <Plus size={16} /> Qo'shish
                </button>
              </div>
            </div>
          )}
        </div>

        {!readOnly && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoSelected} />
            <button
              className="btn btn-primary kirim-confirm-btn"
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleOtgruzkaClick}
              disabled={shipping || order.sales_order_items.length === 0}
            >
              <Camera size={18} /> {shipping ? 'Yuklanmoqda...' : 'Otgruzka (rasmga olib)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
