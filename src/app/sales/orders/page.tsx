'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Clock, Package, Edit, Truck, XCircle, RefreshCcw, Search, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SalesOrdersPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, role, startDate, endDate, searchQuery, sellerFilter]);

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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px' }}>Kod / Sotuvchi</th>
                <th style={{ padding: '16px' }}>Mijoz</th>
                <th style={{ padding: '16px' }}>To'lov turi</th>
                <th style={{ padding: '16px' }}>Summa (so'm)</th>
                <th style={{ padding: '16px' }}>Sana</th>
                <th style={{ padding: '16px' }}>Status</th>
                {role === 'admin' && <th style={{ padding: '16px', textAlign: 'right' }}>Amallar</th>}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center' }}>Hozircha buyurtmalar yo'q.</td>
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
                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(order.status, order.is_shipped)}
                    </td>
                    {role === 'admin' && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          
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
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1px solid #cbd5e1', backgroundColor: '#fff',
  fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s',
  color: '#0f172a'
};
