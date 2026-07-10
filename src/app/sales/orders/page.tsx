'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Clock, Package, Edit, Truck, XCircle, RefreshCcw, Search, Calendar, User, Wallet, Bike, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CashAccount = { id: string; name: string; currency: string };

export default function SalesOrdersPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<Record<string, { paid_uzs: number; delivery_cost_uzs: number; remaining_uzs: number }>>({});
  const [loading, setLoading] = useState(true);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');

  // Tezkor to'lov/dostavka kiritish oynasi
  const [modalOrder, setModalOrder] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'payment' | 'delivery'>('payment');
  const [modalAmount, setModalAmount] = useState('');
  const [modalCashAccountId, setModalCashAccountId] = useState('');
  const [modalExchangeRate, setModalExchangeRate] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalHistory, setModalHistory] = useState<any[]>([]);
  const [modalHistoryLoading, setModalHistoryLoading] = useState(false);
  const modalAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, role, startDate, endDate, searchQuery, sellerFilter]);

  useEffect(() => {
    supabase.from('cash_accounts').select('id, name, currency').eq('is_active', true).eq('is_virtual', false).order('sort_order')
      .then(({ data }) => { if (data) { setCashAccounts(data); setModalCashAccountId(data[0]?.id || ''); } });
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('sales_orders')
      .select('*, sales_order_items(*)')
      .order('created_at', { ascending: false });

    // Sotuvchilar faqat o'z buyurtmalarini ko'radi
    if (role !== 'admin') {
      query = query.eq('seller_id', user?.id);
    } else if (sellerFilter) {
      // Admin xodim (sotuvchi) ismi bo'yicha izlaydi
      query = query.ilike('seller_name', `%${sellerFilter}%`);
    }

    // Sana bo'yicha filter
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00Z`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59Z`);
    }

    // Mijoz ismi yoki telefoni bo'yicha qidiruv
    if (searchQuery) {
      query = query.or(`client_name.ilike.%${searchQuery}%,client_phone.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (data) setOrders(data);

    // To'lov holatini alohida so'raymiz (view)
    const { data: psData } = await supabase.from('v_order_payment_status').select('*');
    if (psData) {
      const map: Record<string, any> = {};
      psData.forEach((p: any) => { map[p.order_id] = p; });
      setPaymentStatus(map);
    }

    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (role !== 'admin') {
      alert("Faqat admin statusni o'zgartira oladi!");
      return;
    }

    const { error } = await supabase
      .from('sales_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert("Xatolik: " + error.message);
    } else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleOtgruzka = async (orderId: string) => {
    if (role !== 'admin') return;

    if (!confirm("Rostdan ham bu buyurtmani otgruzka qilasizmi? Bu tovarlarni ombordan ayirib tashlaydi!")) return;

    try {
      const { error } = await supabase.rpc('otgruzka_order', { p_order_id: orderId });
      if (error) throw error;

      alert("Muvaffaqiyatli otgruzka qilindi va tovarlar ombordan yechildi!");
      fetchOrders();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleVozvrat = async (orderId: string) => {
    if (role !== 'admin') return;

    if (!confirm("Rostdan ham bu buyurtmani VOZVRAT (Qaytarish) qilasizmi? Tovar miqdorlari omborga qayta qo'shiladi!")) return;

    try {
      const { error } = await supabase.rpc('vozvrat_order', { p_order_id: orderId });
      if (error) throw error;

      alert("Muvaffaqiyatli vozvrat qilindi va tovarlar omborga qaytdi!");
      fetchOrders();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleEdit = (orderId: string) => {
    router.push(`/sales?edit=${orderId}`);
  };

  const accountCodeFor = (mode: 'payment' | 'delivery') => (mode === 'payment' ? '90001' : '13014');

  const fetchModalHistory = async (orderId: string, mode: 'payment' | 'delivery') => {
    setModalHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('id, txn_date, income, expense, income_uzs, expense_uzs, cash_accounts(name, currency), created_at')
        .eq('ref_table', 'sales_orders')
        .eq('ref_id', orderId)
        .eq('account_code', accountCodeFor(mode))
        .order('txn_date', { ascending: false });
      if (error) throw error;
      setModalHistory(data || []);
    } catch (err) {
      console.error(err);
      setModalHistory([]);
    } finally {
      setModalHistoryLoading(false);
    }
  };

  const openModal = (order: any, mode: 'payment' | 'delivery') => {
    setModalOrder(order);
    setModalMode(mode);
    setModalAmount('');
    setModalExchangeRate('');
    fetchModalHistory(order.id, mode);
    setTimeout(() => modalAmountRef.current?.focus(), 50);
  };

  const closeModal = () => { setModalOrder(null); setModalHistory([]); };

  const handleDeleteTxn = async (txnId: string) => {
    if (!confirm("Bu yozuvni o'chirasizmi? Qoldiq summasi qayta hisoblanadi.")) return;
    try {
      const { error } = await supabase.from('cash_transactions').delete().eq('id', txnId);
      if (error) throw error;
      if (modalOrder) fetchModalHistory(modalOrder.id, modalMode);
      fetchOrders();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    }
  };

  const selectedModalAccount = cashAccounts.find(c => c.id === modalCashAccountId);
  const modalNeedsRate = selectedModalAccount?.currency === 'USD';

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOrder || !modalAmount || Number(modalAmount) <= 0) return;
    if (!modalCashAccountId) { alert("Hisobni tanlang!"); return; }
    if (modalNeedsRate && !modalExchangeRate) { alert("USD hisob uchun kurs kiritilishi shart!"); return; }

    setModalSaving(true);
    try {
      const isPayment = modalMode === 'payment';
      const payload = {
        txn_date: new Date().toISOString().slice(0, 10),
        income: isPayment ? Number(modalAmount) : 0,
        expense: isPayment ? 0 : Number(modalAmount),
        cash_account_id: modalCashAccountId,
        account_code: accountCodeFor(modalMode),
        exchange_rate: modalNeedsRate ? Number(modalExchangeRate) : null,
        comment: (isPayment ? "To'lov: " : "Dostavka xarajati: ") + modalOrder.order_code,
        ref_table: 'sales_orders',
        ref_id: modalOrder.id,
      };
      const { error } = await supabase.from('cash_transactions').insert(payload);
      if (error) throw error;

      setModalAmount('');
      setModalExchangeRate('');
      fetchModalHistory(modalOrder.id, modalMode);
      fetchOrders();
      setTimeout(() => modalAmountRef.current?.focus(), 50);
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setModalSaving(false);
    }
  };

  // Buyurtmaning tan narxi (UZS) va marjasini hisoblaydi.
  // Agar biror tovarda unit_cost_usd bo'lmasa (eski buyurtma yoki ombor tan narxi kiritilmagan), null qaytaradi.
  const getMargin = (order: any) => {
    const items = order.sales_order_items || [];
    if (items.length === 0) return null;
    const hasMissingCost = items.some((it: any) => it.unit_cost_usd === null || it.unit_cost_usd === undefined);
    if (hasMissingCost) return null;

    const totalCostUsd = items.reduce((sum: number, it: any) => sum + Number(it.unit_cost_usd) * Number(it.quantity), 0);
    const totalCostUzs = totalCostUsd * Number(order.exchange_rate || 0);
    const margin = Number(order.total_uzs_price || 0) - totalCostUzs;
    return { totalCostUzs, margin };
  };

  const getPaymentBadge = (order: any) => {
    const ps = paymentStatus[order.id];
    const remaining = ps ? Number(ps.remaining_uzs) : Number(order.total_uzs_price);
    const total = Number(order.total_uzs_price);
    if (remaining <= 0) {
      return <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> To'liq to'langan</span>;
    }
    if (remaining < total) {
      return <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Qisman: {remaining.toLocaleString('uz-UZ')} qoldi</span>;
    }
    return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>To'lanmagan: {remaining.toLocaleString('uz-UZ')}</span>;
  };

  const getStatusBadge = (status: string, is_shipped: boolean) => {
    // Agar status aniq bitta o'rnatilgan bo'lsa uni tekshiramiz.
    // Asosiy statuslar: Yangi buyurtma, Otgruzka qilindi, Yopildi, Rad etildi, Vozvrat qilindi

    if (status === 'Vozvrat qilindi') {
      return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RefreshCcw size={14}/> Vozvrat</span>;
    }
    if (status === 'Rad etildi') {
      return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={14}/> Rad etildi</span>;
    }
    if (status === 'Yopildi') {
      return <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> Yopildi</span>;
    }
    if (is_shipped || status === 'Otgruzka qilindi' || status === 'Buyurtma topshirildi') {
      return <span style={{ backgroundColor: '#bfdbfe', color: '#1e3a8a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={14}/> Otgruzka qilindi</span>;
    }

    // Yangi buyurtma yoki qabul qilindi statusi sariq
    return <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Yangi buyurtma</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Buyurtmalar Ro'yxati</h1>
        <button onClick={fetchOrders} className="btn" style={{ border: '1px solid var(--border)' }}>Yangilash</button>
      </div>

      {/* FILTRLAR QATORI */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mijoz ism/raqami</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Sana dan</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Sana gacha</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {role === 'admin' && (
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Sotuvchi (Xodim)</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Xodim ismi..."
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '32px' }}
              />
            </div>
          </div>
        )}

      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1300px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px' }}>Kod / Sotuvchi</th>
                <th style={{ padding: '16px' }}>Mijoz</th>
                <th style={{ padding: '16px' }}>To'lov turi</th>
                <th style={{ padding: '16px' }}>Summa (so'm)</th>
                <th style={{ padding: '16px' }}>Tan narx</th>
                <th style={{ padding: '16px' }}>Marja</th>
                <th style={{ padding: '16px' }}>Sana</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>To'lov holati</th>
                {role === 'admin' && <th style={{ padding: '16px', textAlign: 'right' }}>Amallar</th>}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '24px', textAlign: 'center' }}>Hozircha buyurtmalar yo'q.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>{order.order_code}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>👤 {order.seller_name}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500 }}>{order.client_name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.client_phone}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{order.sales_channel}</span>
                      {order.contract_number && <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Shartnoma: {order.contract_number}</div>}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{Number(order.total_uzs_price).toLocaleString('uz-UZ')}</td>
                    {(() => {
                      const m = getMargin(order);
                      if (!m) {
                        return (
                          <>
                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>—</td>
                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>Noma'lum</td>
                          </>
                        );
                      }
                      const isPositive = m.margin >= 0;
                      return (
                        <>
                          <td style={{ padding: '16px', color: '#64748b' }}>{Math.round(m.totalCostUzs).toLocaleString('uz-UZ')}</td>
                          <td style={{ padding: '16px', fontWeight: 'bold', color: isPositive ? '#15803d' : '#dc2626' }}>
                            {isPositive ? '+' : ''}{Math.round(m.margin).toLocaleString('uz-UZ')}
                          </td>
                        </>
                      );
                    })()}
                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(order.status, order.is_shipped)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getPaymentBadge(order)}
                      {paymentStatus[order.id]?.delivery_cost_uzs > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Dostavka: {Number(paymentStatus[order.id].delivery_cost_uzs).toLocaleString('uz-UZ')} so'm
                        </div>
                      )}
                    </td>
                    {role === 'admin' && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>

                          <button
                            onClick={() => openModal(order, 'payment')}
                            title="To'lov kiritish"
                            className="btn"
                            style={{ background: '#eef2ff', color: '#4338ca', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Wallet size={14} /> To'lov
                          </button>

                          <button
                            onClick={() => openModal(order, 'delivery')}
                            title="Dostavka xarajati kiritish"
                            className="btn"
                            style={{ background: '#fff7ed', color: '#c2410c', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Bike size={14} /> Dostavka
                          </button>

                          {!order.is_shipped && order.status !== 'Vozvrat qilindi' && order.status !== 'Rad etildi' && (
                            <>
                              <button
                                onClick={() => handleEdit(order.id)}
                                title="Tahrirlash"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center' }}
                              >
                                <Edit size={18} />
                              </button>

                              <button
                                onClick={() => handleOtgruzka(order.id)}
                                className="btn"
                                style={{ background: '#10b981', color: 'white', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}
                              >
                                Otgruzka
                              </button>
                            </>
                          )}

                          {order.is_shipped && order.status !== 'Vozvrat qilindi' && (
                            <button
                              onClick={() => handleVozvrat(order.id)}
                              className="btn"
                              style={{ background: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                              Vozvrat
                            </button>
                          )}

                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem', outline: 'none', width: '120px' }}
                          >
                            <option value="Yangi buyurtma">Yangi (Sariq)</option>
                            <option value="Otgruzka qilindi">Otgruzka (Ko'k)</option>
                            <option value="Yopildi">Yopildi (Yashil)</option>
                            <option value="Rad etildi">Rad etildi (Qizil)</option>
                            <option value="Vozvrat qilindi">Vozvrat (Qizil)</option>
                          </select>

                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* TO'LOV / DOSTAVKA KIRITISH OYNASI */}
      {modalOrder && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9990, padding: 12 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>
                {modalMode === 'payment' ? "To'lov kiritish" : 'Dostavka xarajati'} — {modalOrder.order_code}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {modalMode === 'payment' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 0 }}>
                Jami: {Number(modalOrder.total_uzs_price).toLocaleString('uz-UZ')} so'm &nbsp;·&nbsp;
                Qoldiq: {Number(paymentStatus[modalOrder.id]?.remaining_uzs ?? modalOrder.total_uzs_price).toLocaleString('uz-UZ')} so'm
              </p>
            )}

            <form onSubmit={handleModalSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Summa {selectedModalAccount ? `(${selectedModalAccount.currency})` : ''}</label>
                <input
                  ref={modalAmountRef}
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={modalAmount}
                  onChange={e => setModalAmount(e.target.value)}
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Hisob</label>
                <select className="input-field" value={modalCashAccountId} onChange={e => setModalCashAccountId(e.target.value)}>
                  {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {modalNeedsRate && (
                <div style={{ marginBottom: 12 }}>
                  <label className="field-label">Kurs</label>
                  <input type="number" className="input-field" placeholder="12700" value={modalExchangeRate} onChange={e => setModalExchangeRate(e.target.value)} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary">Yopish</button>
                <button type="submit" disabled={modalSaving} className="btn btn-primary">
                  {modalSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>

            {/* TARIX */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {modalMode === 'payment' ? "To'lovlar tarixi" : 'Dostavka xarajatlari tarixi'}
              </div>
              {modalHistoryLoading ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Yuklanmoqda...</div>
              ) : modalHistory.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hali yozuv yo'q.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {modalHistory.map((h: any) => {
                    const amount = modalMode === 'payment' ? h.income : h.expense;
                    const currency = h.cash_accounts?.currency || 'UZS';
                    return (
                      <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{Number(amount).toLocaleString('uz-UZ')} {currency}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            {new Date(h.txn_date).toLocaleDateString('uz-UZ')} · {h.cash_accounts?.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTxn(h.id)}
                          title="O'chirish"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1px solid #cbd5e1', backgroundColor: '#fff',
  fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s',
  color: '#0f172a'
};
