'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function SalesPage() {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Check_${customerName || 'Mijoz'}.pdf`);
    } catch (error) {
      console.error('PDF yaratishda xato:', error);
      alert("PDF yaratishda xatolik yuz berdi.");
    }
  };

  const total = (Number(price) || 0) * (Number(quantity) || 0);

  return (
    <div>
      <h1 className="page-title">Sotuv bo'limi (Yangi Buyurtma)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Form Section */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Buyurtma Ma'lumotlari</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Mijoz Ismi</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masalan: Sardor"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Telefon Raqami</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Mahsulot (PC yoki qism)</label>
              <input 
                type="text" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Masalan: Starter CS2 PC"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Soni</label>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Donasi Narxi (so'm)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="5500000"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Preview Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
            Chek Ko'rinishi
            <button onClick={generatePDF} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
              PDF Yuklab Olish
            </button>
          </h2>

          <div 
            ref={receiptRef}
            style={{ 
              border: '1px dashed var(--border)', 
              padding: '24px', 
              borderRadius: '8px', 
              backgroundColor: '#fff',
              flex: 1
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '4px' }}>TEXNO OPTOM GAMING</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sizning CS2 g'alabangiz kafolati!</p>
            </div>

            <div style={{ marginBottom: '24px', fontSize: '0.95rem' }}>
              <p><strong>Sana:</strong> {new Date().toLocaleDateString('uz-UZ')}</p>
              <p><strong>Mijoz:</strong> {customerName || '__________________'}</p>
              <p><strong>Telefon:</strong> {phone || '__________________'}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--text-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Mahsulot</th>
                  <th style={{ padding: '8px 0', textAlign: 'center' }}>Soni</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Summasi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>{productName || '-'}</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{quantity}</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                    {total > 0 ? total.toLocaleString() : '0'} so'm
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Jami To'lov:</span>
              <span>{total > 0 ? total.toLocaleString() : '0'} so'm</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p>Xarid uchun tashakkur!</p>
              <p>Instagram: @texnooptom</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
