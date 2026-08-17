'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Trash2, Camera } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';
import { groupedSlots, mapItemsToSlots, ComponentSlot, SlotAssignment } from '@/lib/componentSlots';
import ComponentSlotRow from '@/components/ComponentSlotRow';
import ComponentSlotProgress from '@/components/ComponentSlotProgress';

type OrderItem = { id: string; category_name: string; product_id: string; product_name: string; quantity: number };
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

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('id, order_code, client_name, status, is_shipped, otgruzka_photo_url, sales_order_items(id, category_name, product_id, product_name, quantity)')
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

  // `boolean` qaytaradi — bekor qilinsa/rad etilsa `false`, shunda "tovarni
  // almashtirish" oqimi yangisini qo'shishga o'tmaydi.
  const handleItemDelete = async (itemId: string): Promise<boolean> => {
    if (!confirm("Bu tovarni buyurtmadan o'chirasizmi?")) return false;
    const reason = prompt("Nima uchun bu tovarni o'chiryapsiz? (sabab yozish majburiy)");
    if (!reason || !reason.trim()) return false;
    setSavingItemId(itemId);
    try {
      const { error } = await supabase.rpc('sklad_delete_item', { p_item_id: itemId, p_reason: reason });
      if (error) throw error;
      await fetchOrder();
      return true;
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
      return false;
    } finally {
      setSavingItemId(null);
    }
  };

  // Bo'sh slotga tovar qo'shadi (qty=1 bilan boshlanadi — keyin shu slotning
  // o'z qatoridan o'zgartirish mumkin).
  const handleAddItemToSlot = async (categoryForDb: string, productId: string): Promise<boolean> => {
    if (!order) return false;
    const product = products.find((p: any) => p.id === productId);
    if (!product) return false;

    const stock = stockMap[product.id] ?? 0;
    if (stock <= 0) {
      alert(`"${product.name}" — hozir omborda yo'q bu tovardan.\n\nAvval omborga prixod (kirim) qiling, keyin buyurtmaga biriktira olasiz.`);
      return false;
    }

    if (!confirm(`"${product.name}" buyurtmaga qo'shiladi — mijoz bilan kelishdingizmi?`)) return false;
    const addReason = prompt('Sabab yozing (masalan: mijoz bilan kelishildi):');
    if (!addReason || !addReason.trim()) return false;

    setSavingItemId('new');
    try {
      const { error } = await supabase.rpc('sklad_add_item', {
        p_order_id: order.id,
        p_product_id: product.id,
        p_qty: 1,
        p_category: categoryForDb,
        p_reason: addReason,
      });
      if (error) throw error;
      await fetchOrder();
      return true;
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
      return false;
    } finally {
      setSavingItemId(null);
    }
  };

  // Bitta slot dropdown'i o'zgarganda: bo'sh slot -> qo'shish, to'lgan slot
  // bo'shatilsa -> o'chirish, to'lgan slot boshqa tovarga almashtirilsa ->
  // avval eskisi o'chiriladi (o'z tasdig'i bilan), muvaffaqiyatli bo'lsagina
  // yangisi qo'shiladi.
  const handleSlotProductChange = async (slot: ComponentSlot, existing: SlotAssignment | undefined, newProductId: string) => {
    if (!newProductId) {
      if (existing) await handleItemDelete(existing.id);
      return;
    }
    const product = products.find((p: any) => p.id === newProductId);
    if (!product) return;
    const categoryForDb = slot.categoryName ?? product.categories?.name ?? 'Boshqa tovarlar';

    if (existing) {
      if (existing.product_id === newProductId) return;
      const deleted = await handleItemDelete(existing.id);
      if (!deleted) return;
    }
    await handleAddItemToSlot(categoryForDb, newProductId);
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
  const { bySlotKey, overflow } = mapItemsToSlots(order.sales_order_items || []);
  const filledCount = Object.keys(bySlotKey).length + overflow.length;

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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4, marginBottom: 10 }}>
            Komplekt qismlari {readOnly ? '' : '— bo\'sh qatorlar hali tanlanmagan detallarni bildiradi'}
          </p>
          {!readOnly && <ComponentSlotProgress filledCount={filledCount} />}

          {readOnly ? (
            filledCount === 0 ? (
              <div className="kirim-empty">Tovar yo'q</div>
            ) : (
              <div>
                {groupedSlots().map(({ group, slots }) => {
                  const filledInGroup = slots.filter(s => bySlotKey[s.key]);
                  if (filledInGroup.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="slot-group-header">{group}</div>
                      {filledInGroup.map(slot => {
                        const existing = bySlotKey[slot.key];
                        return (
                          <div key={slot.key} className="kirim-item-row">
                            <div className="kirim-item-info">
                              <div className="kirim-item-name">{existing.product_name}</div>
                              <div className="kirim-item-sub">{slot.label}</div>
                            </div>
                            <div className="kirim-item-total">{existing.quantity} dona</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {overflow.length > 0 && (
                  <div>
                    <div className="slot-group-header">Eski tovarlar</div>
                    {overflow.map(it => (
                      <div key={it.id} className="kirim-item-row">
                        <div className="kirim-item-info">
                          <div className="kirim-item-name">{it.product_name}</div>
                          <div className="kirim-item-sub">{it.category_name}</div>
                        </div>
                        <div className="kirim-item-total">{it.quantity} dona</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div>
              {groupedSlots().map(({ group, slots }) => (
                <div key={group}>
                  <div className="slot-group-header">{group}</div>
                  {slots.map(slot => {
                    const existing = bySlotKey[slot.key];
                    const isUnfiltered = slot.categoryName === null;
                    const categoryProducts = isUnfiltered
                      ? products
                      : products.filter((p: any) => p.categories?.name === slot.categoryName);
                    const busy = savingItemId === (existing?.id || 'new');
                    return (
                      <ComponentSlotRow
                        key={slot.key}
                        slot={slot}
                        value={existing?.product_id || ''}
                        quantity={existing?.quantity || 1}
                        disabled={busy}
                        placeholder={isUnfiltered ? 'Tanlanmagan...' : `${slot.label} tanlang...`}
                        options={categoryProducts.map((p: any) => ({ id: p.id, name: p.name, stock: stockMap[p.id] ?? 0 }))}
                        onProductChange={val => handleSlotProductChange(slot, existing, val)}
                        onQtyChange={existing ? (q => handleItemQtyChange(existing.id, q)) : undefined}
                      />
                    );
                  })}
                </div>
              ))}

              {overflow.length > 0 && (
                <div>
                  <div className="slot-group-header">Eski tovarlar (18 slotga sig'magan)</div>
                  {overflow.map(it => (
                    <div key={it.id} className="kirim-item-row">
                      <div className="kirim-item-info">
                        <div className="kirim-item-name">{it.product_name}</div>
                        <div className="kirim-item-sub">{it.category_name}</div>
                      </div>
                      <button className="kirim-item-del" onClick={() => handleItemDelete(it.id)} disabled={savingItemId === it.id} title="O'chirish">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {readOnly && order.otgruzka_photo_url && (
            <div style={{ marginTop: 12 }}>
              <div className="field-label">Otgruzka rasmi</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.otgruzka_photo_url} alt="Otgruzka isboti" style={{ width: '100%', borderRadius: 10, marginTop: 6 }} />
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
              disabled={shipping || filledCount === 0}
            >
              <Camera size={18} /> {shipping ? 'Yuklanmoqda...' : 'Otgruzka (rasmga olib)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
