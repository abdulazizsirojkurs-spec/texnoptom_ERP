'use client';

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

const COMPONENT_CATEGORIES = [
  'Ona plata', 'Pratsessor', 'Kuller', 'Video karta', 'Keys',
  'Blok pitaniya', 'Operativ xotira', 'SSD', 'Monitor',
  'Klaviatura', 'Sichqoncha', 'Kovrik', 'Naushnik',
  "Qo'shimcha 1", "Qo'shimcha 2", "Qo'shimcha 3"
];

const SALES_CHANNELS = [
  'Naqd borganda',
  'kelib ob ketti',
  'Uzum Nasiya',
  'Anor Nasiya',
  'Paylater',
  'Open Card',
  'Perechesleniya',
  'Yarim nasiya yarim naqt'
];

const REQUIRES_CONTRACT = [
  'Uzum Nasiya',
  'Anor Nasiya',
  'Paylater',
  'Open Card',
  'Perechesleniya',
  'Yarim nasiya yarim naqt'
];

export default function SalesPage() {
  const { user } = useAuth();
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [salesChannel, setSalesChannel] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  
  // Products Data
  const [products, setProducts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, { product_id: string, product_name: string, quantity: number }>>({});
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)');
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  const totalUzs = (Number(priceUsd) || 0) * (Number(exchangeRate) || 0);
  const sellerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sotuvchi';

  const handleItemSelect = (category: string, productId: string) => {
    if (!productId) {
      const newItems = { ...selectedItems };
      delete newItems[category];
      setSelectedItems(newItems);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedItems(prev => ({
        ...prev,
        [category]: { product_id: product.id, product_name: product.name, quantity: prev[category]?.quantity || 1 }
      }));
    }
  };

  const handleQuantityChange = (category: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(prev => ({
      ...prev,
      [category]: { ...prev[category], quantity }
    }));
  };

  const generatePDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Check_${customerName || 'Mijoz'}.pdf`);
    } catch (error) {
      console.error('PDF yaratishda xato:', error);
      alert("PDF yaratishda xatolik yuz berdi.");
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Validation
    if (!customerName || !phone || !address || !salesChannel || !priceUsd || !exchangeRate) {
      setErrorMsg("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }
    if (REQUIRES_CONTRACT.includes(salesChannel) && !contractNumber) {
      setErrorMsg(`${salesChannel} uchun shartnoma raqamini kiritish majburiy!`);
      return;
    }
    const itemsList = Object.entries(selectedItems).map(([cat, item]) => ({ category: cat, ...item }));
    if (itemsList.length === 0) {
      setErrorMsg("Kamida 1 ta tovar tanlanishi kerak!");
      return;
    }

    setLoading(true);
    try {
      // Baza uchun oddiy order_code yaratamiz
      const { count } = await supabase.from('sales_orders').select('*', { count: 'exact', head: true });
      const nextNum = (count || 0) + 1;
      const orderCode = `TOG-${String(nextNum).padStart(4, '0')}`;

      // Insert Order
      const { data: order, error: orderError } = await supabase.from('sales_orders').insert({
        order_code: orderCode,
        client_name: customerName,
        client_phone: phone,
        client_address: address,
        total_usd_price: Number(priceUsd),
        exchange_rate: Number(exchangeRate),
        total_uzs_price: totalUzs,
        sales_channel: salesChannel,
        contract_number: contractNumber || null,
        seller_id: user?.id,
        seller_name: sellerName
      }).select().single();

      if (orderError) throw orderError;

      // Insert Items
      const orderItemsToInsert = itemsList.map(item => ({
        order_id: order.id,
        category_name: item.category,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase.from('sales_order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      setSuccessMsg(`Buyurtma muvaffaqiyatli saqlandi! (${orderCode})`);
      // Reset after success if needed, or keep for PDF download
    } catch (err: any) {
      setErrorMsg("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Sotuv bo'limi (Yangi Buyurtma)</h1>
      
      {errorMsg && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{errorMsg}</div>}
      {successMsg && <div style={{ padding: '12px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{successMsg}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Form Section */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--primary)' }}>Buyurtma Ma'lumotlari</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Mijoz Ismi *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={inputStyle} placeholder="Masalan: Sardor" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Telefon Raqami *</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+998 90 123 45 67" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Manzil *</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} placeholder="Toshkent sh." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Kanal Prodaj *</label>
                <select value={salesChannel} onChange={e => setSalesChannel(e.target.value)} style={inputStyle}>
                  <option value="">Tanlang...</option>
                  {SALES_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
              {REQUIRES_CONTRACT.includes(salesChannel) && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Shartnoma Raqami *</label>
                  <input type="text" value={contractNumber} onChange={e => setContractNumber(e.target.value)} style={inputStyle} placeholder="Shartnoma raqamini kiriting" />
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Komplekt qismlari (Tovarlar)</h3>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {COMPONENT_CATEGORIES.map(category => {
                // Filter products that belong to this category (case insensitive match or approx match)
                const categoryProducts = products.filter(p => p.categories?.name?.toLowerCase() === category.toLowerCase() || p.categories?.name?.includes(category));
                const isSelected = !!selectedItems[category];
                
                return (
                  <div key={category} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '120px', fontSize: '0.85rem', fontWeight: 500, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {category}
                    </div>
                    <select 
                      value={selectedItems[category]?.product_id || ''} 
                      onChange={e => handleItemSelect(category, e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: '8px' }}
                    >
                      <option value="">Tanlang...</option>
                      {/* Agar bazada kategoriyaga oid tovar yo'q bo'lsa barcha tovarlarni ham variant qilib chiqaramiz */}
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {isSelected && (
                      <input 
                        type="number" 
                        min="1" 
                        value={selectedItems[category].quantity} 
                        onChange={e => handleQuantityChange(category, parseInt(e.target.value) || 1)}
                        style={{ ...inputStyle, width: '60px', padding: '8px', textAlign: 'center' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--success)' }}>$ Umumiy Narx *</label>
                <input type="number" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} style={inputStyle} placeholder="490.00" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#ca8a04' }}>Kurs (so'm/$) *</label>
                <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} style={inputStyle} placeholder="12600" />
              </div>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '1rem' }}
            >
              {loading ? 'Saqlanmoqda...' : 'Buyurtmani Saqlash'}
            </button>
          </div>
        </div>

        {/* Receipt Preview Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={generatePDF} className="btn" style={{ background: '#334155', color: 'white', alignSelf: 'flex-end' }}>
            PDF qilib olish (Chek)
          </button>
          
          <div className="card" ref={receiptRef} style={{ padding: '0', overflow: 'hidden', border: '1px solid #94a3b8' }}>
            {/* Chek Header */}
            <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '16px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>TEXNO OPTOM GAMING — TOVAR CHEKI</h2>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                <div>
                  <p><strong>Mijoz:</strong> {customerName}</p>
                  <p><strong>Tel:</strong> {phone}</p>
                  <p><strong>Manzil:</strong> {address}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Sana:</strong> {new Date().toLocaleDateString('uz-UZ')}</p>
                  <p><strong>Sotuvchi:</strong> {sellerName}</p>
                  <p><strong>To'lov:</strong> <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{salesChannel}</span></p>
                </div>
              </div>
              
              {/* Tovar ro'yxati */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dc2626', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #b91c1c' }}>Kategoriya</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #b91c1c' }}>Tovar nomi</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #b91c1c', width: '60px' }}>Dona</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedItems).map(([cat, item], idx) => (
                    <tr key={cat}>
                      <td style={{ padding: '6px 8px', border: '1px solid var(--border)', fontWeight: 500 }}>{cat}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid var(--border)', color: 'var(--primary)' }}>{item.product_name}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid var(--border)', textAlign: 'center' }}>{item.quantity}</td>
                    </tr>
                  ))}
                  {Object.keys(selectedItems).length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Tovarlar tanlanmagan</td></tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', backgroundColor: '#e2e8f0', padding: '12px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>$ Narx:</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>${priceUsd || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Kurs (so'm/$):</span>
                  <span style={{ backgroundColor: '#fef08a', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{exchangeRate || '0'}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', color: '#facc15', padding: '16px', marginTop: '16px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', color: 'white', marginBottom: '4px' }}>JAMI TO'LOV:</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalUzs.toLocaleString('uz-UZ')} so'm</div>
              </div>
              
              {contractNumber && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#ef4444' }}>
                  <i>Shartnoma: {contractNumber} ({salesChannel})</i>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s'
};
