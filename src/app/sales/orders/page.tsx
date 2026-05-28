'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Clock, Package } from 'lucide-react';

export default function SalesOrdersPage() {
  const { role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, sales_order_items(*)')
      .order('created_at', { ascending: false });
    
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
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Buyurtma qabul qilindi':
        return <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Qabul qilindi</span>;
      case 'Buyurtma topshirildi':
        return <span style={{ backgroundColor: '#bfdbfe', color: '#1e3a8a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Package size={14}/> Topshirildi</span>;
      case 'Buyurtma yopildi':
        return <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> Yopildi</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Buyurtmalar Ro'yxati</h1>
        <button onClick={fetchOrders} className="btn" style={{ border: '1px solid var(--border)' }}>Yangilash</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px' }}>Kod</th>
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
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{order.order_code}</td>
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
                      {new Date(order.order_date).toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(order.status)}
                    </td>
                    {role === 'admin' && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem', outline: 'none' }}
                        >
                          <option value="Buyurtma qabul qilindi">Sariq (Qabul qilindi)</option>
                          <option value="Buyurtma topshirildi">Ko'k (Topshirildi)</option>
                          <option value="Buyurtma yopildi">Yashil (Yopildi)</option>
                        </select>
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
