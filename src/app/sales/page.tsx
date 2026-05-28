'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, Search } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const COMPONENT_CATEGORIES = [
  'Ona plata', 'Pratsessor', 'Kuller', 'Video karta', 'Keys',
  'Blok pitaniya', 'Operativ xotira', 'SSD', 'Monitor',
  'Klaviatura', 'Sichqoncha', 'Kovrik', 'Naushnik',
  "Qo'shimcha 1", "Qo'shimcha 2", "Qo'shimcha 3"
];

const SALES_CHANNELS = [
  'Naqd borganda', 'kelib ob ketti', 'Uzum Nasiya', 'Anor Nasiya', 
  'Paylater', 'Open Card', 'Perechesleniya', 'Yarim nasiya yarim naqt'
];

const REQUIRES_CONTRACT = [
  'Uzum Nasiya', 'Anor Nasiya', 'Paylater', 'Open Card', 
  'Perechesleniya', 'Yarim nasiya yarim naqt'
];

const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find((o: any) => o.value === value)?.label;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', flex: 1 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          backgroundColor: isOpen ? '#fff' : '#f8fafc'
        }}
      >
        <span style={{ color: selectedLabel ? 'inherit' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} color="#64748b" />
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} color="#94a3b8" />
            <input 
              autoFocus
              type="text" 
              placeholder="Qidirish..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div 
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem', color: '#ef4444' }}
            >
              Tanlovni bekor qilish
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.9rem' }}>Topilmadi</div>
            ) : (
              filteredOptions.map((opt: any) => (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid #f8fafc', backgroundColor: value === opt.value ? '#f1f5f9' : 'transparent' }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function SalesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const editOrderId = searchParams.get('edit');
  
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [salesChannel, setSalesChannel] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, { product_id: string, product_name: string, quantity: number }>>({});
  
  const [loading, setLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [nextOrderCode, setNextOrderCode] = useState('001');
  const [isShipped, setIsShipped] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initData() {
      // Tovarlarni olish
      const { data: pData } = await supabase.from('products').select('*, categories(name)');
      if (pData) setProducts(pData);

      if (editOrderId) {
        // Tahrirlash uchun ma'lumotlarni yuklash
        const { data: order } = await supabase.from('sales_orders').select('*').eq('id', editOrderId).single();
        if (order) {
          if (order.is_shipped) {
            alert("Bu buyurtma allaqachon otgruzka qilingan, uni tahrirlash mumkin emas!");
            router.push('/sales/orders');
            return;
          }

          setCustomerName(order.client_name);
          setPhone(order.client_phone);
          setAddress(order.client_address);
          setSalesChannel(order.sales_channel);
          setContractNumber(order.contract_number || '');
          setPriceUsd(order.total_usd_price.toString());
          setExchangeRate(order.exchange_rate.toString());
          setNextOrderCode(order.order_code.replace('TOG-', ''));
          setIsShipped(order.is_shipped);

          const { data: items } = await supabase.from('sales_order_items').select('*').eq('order_id', editOrderId);
          if (items) {
            const loadedItems: any = {};
            items.forEach(item => {
              loadedItems[item.category_name] = {
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity
              };
            });
            setSelectedItems(loadedItems);
          }
        }
      } else {
        // Yangi buyurtma uchun raqam olish
        const { count } = await supabase.from('sales_orders').select('*', { count: 'exact', head: true });
        const nextNum = (count || 0) + 1;
        setNextOrderCode(String(nextNum).padStart(3, '0'));
      }
    }
    initData();
  }, [editOrderId, router]);

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
    setSelectedItems(prev => ({ ...prev, [category]: { ...prev[category], quantity } }));
  };

  const generatePDFBlob = async () => {
    if (!receiptRef.current) return null;
    const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = 120;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] }); 
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf;
  };

  const generatePDF = async () => {
    try {
      const pdf = await generatePDFBlob();
      if (pdf) {
        pdf.save(`Chek_TOG-${nextOrderCode}_${customerName || 'Mijoz'}.pdf`);
      }
    } catch (error) {
      console.error('PDF xato:', error);
      alert("PDF yaratishda xatolik yuz berdi.");
    }
  };

  const sendToTelegram = async () => {
    if (Object.entries(selectedItems).length === 0) {
      alert("Telegramga yuborishdan oldin tovarlarni kiriting!");
      return;
    }
    setTgLoading(true);
    try {
      const pdf = await generatePDFBlob();
      if (!pdf) throw new Error("PDF yaratib bo'lmadi");
      
      const pdfBlob = pdf.output('blob');
      const BOT_TOKEN = '8836661106:AAHONQVRFa1i2rJb_elGJda2uiYuNYHQKqA';
      const CHAT_ID = '-1003835518318';
      
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('document', pdfBlob, `Buyurtma_TOG-${nextOrderCode}_${customerName || 'Mijoz'}.pdf`);
      
      const caption = `🛒 ${editOrderId ? 'Tahrirlangan' : 'Yangi'} Buyurtma: #TOG-${nextOrderCode}\n👤 Mijoz: ${customerName || 'Kiritilmagan'}\n📞 Tel: ${phone || 'Kiritilmagan'}\n💰 Summa: ${totalUzs.toLocaleString('uz-UZ')} so'm\n💳 To'lov turi: ${salesChannel || 'Kiritilmagan'}\n👨‍💻 Sotuvchi: ${sellerName}`;
      formData.append('caption', caption);

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Telegram serveriga yuborishda xatolik");
      alert("Chek muvaffaqiyatli Telegram guruhga yuborildi! 🚀");
    } catch (error) {
      alert("Telegramga yuborib bo'lmadi.");
    } finally {
      setTgLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!customerName || !phone || !address || !salesChannel || !priceUsd || !exchangeRate) {
      setErrorMsg("Iltimos, barcha majburiy maydonlarni to'ldiring!"); return;
    }
    if (REQUIRES_CONTRACT.includes(salesChannel) && !contractNumber) {
      setErrorMsg(`${salesChannel} uchun shartnoma raqami majburiy!`); return;
    }
    const itemsList = Object.entries(selectedItems).map(([cat, item]) => ({ category: cat, ...item }));
    if (itemsList.length === 0) {
      setErrorMsg("Kamida 1 ta tovar tanlanishi kerak!"); return;
    }

    setLoading(true);
    try {
      const orderCode = `TOG-${nextOrderCode}`;
      let currentOrderId = editOrderId;

      if (editOrderId) {
        // TAHRIRLASH (EDIT) holati
        const { error: updateError } = await supabase.from('sales_orders').update({
          client_name: customerName, client_phone: phone, client_address: address,
          total_usd_price: Number(priceUsd), exchange_rate: Number(exchangeRate), total_uzs_price: totalUzs,
          sales_channel: salesChannel, contract_number: contractNumber || null
        }).eq('id', editOrderId);
        
        if (updateError) throw updateError;

        // Eski tovarlarni o'chirib, yangilarini kiritamiz
        await supabase.from('sales_order_items').delete().eq('order_id', editOrderId);
      } else {
        // YANGI BUYURTMA
        const { data: order, error: orderError } = await supabase.from('sales_orders').insert({
          order_code: orderCode, client_name: customerName, client_phone: phone, client_address: address,
          total_usd_price: Number(priceUsd), exchange_rate: Number(exchangeRate), total_uzs_price: totalUzs,
          sales_channel: salesChannel, contract_number: contractNumber || null,
          seller_id: user?.id, seller_name: sellerName
        }).select().single();

        if (orderError) throw orderError;
        currentOrderId = order.id;
      }

      // Tovarlarni kiritish (yangi yoki tahrirlangan buyurtmaga)
      const orderItemsToInsert = itemsList.map(item => ({
        order_id: currentOrderId, category_name: item.category,
        product_id: item.product_id, product_name: item.product_name, quantity: item.quantity
      }));
      const { error: itemsError } = await supabase.from('sales_order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      if (editOrderId) {
        setSuccessMsg(`Buyurtma muvaffaqiyatli tahrirlandi!`);
        setTimeout(() => router.push('/sales/orders'), 1500); // Tahrirlagach ro'yxatga qaytish
      } else {
        setSuccessMsg(`Buyurtma saqlandi! (${orderCode})`);
        setNextOrderCode(String(Number(nextOrderCode) + 1).padStart(3, '0'));
        // Yana bitta yangi kiritish uchun maydonlarni tozalash mumkin
      }
    } catch (err: any) {
      setErrorMsg("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 className="page-title">{editOrderId ? 'Buyurtmani Tahrirlash' : 'Yangi Buyurtma (Sotuv)'}</h1>
        {editOrderId && (
          <button onClick={() => router.push('/sales/orders')} className="btn" style={{ border: '1px solid var(--border)' }}>
            Bekor qilish
          </button>
        )}
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Buyurtma raqami: <strong>TOG-{nextOrderCode}</strong></p>
      
      {errorMsg && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{errorMsg}</div>}
      {successMsg && <div style={{ padding: '12px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{successMsg}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        
        {/* Form Section */}
        <div className="card" style={{ padding: '32px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Mijoz Ismi *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={inputStyle} placeholder="Masalan: Sardor" />
              </div>
              <div>
                <label style={labelStyle}>Telefon Raqami *</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+998 90 123 45 67" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Manzil *</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} placeholder="Toshkent sh." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Kanal Prodaj *</label>
                <select value={salesChannel} onChange={e => setSalesChannel(e.target.value)} style={inputStyle}>
                  <option value="">Tanlang...</option>
                  {SALES_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
              {REQUIRES_CONTRACT.includes(salesChannel) && (
                <div>
                  <label style={labelStyle}>Shartnoma Raqami *</label>
                  <input type="text" value={contractNumber} onChange={e => setContractNumber(e.target.value)} style={inputStyle} placeholder="Nasiya shartnomasi" />
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            
            <h3 style={{ fontSize: '1.1rem', color: '#334155', fontWeight: 600 }}>Komplekt qismlari (Tovarlar)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {COMPONENT_CATEGORIES.map(category => {
                const isAdditional = category.startsWith("Qo'shimcha");

                let categoryProducts = isAdditional 
                  ? products.map(p => ({ label: p.name, value: p.id }))
                  : products.filter(p => {
                      if (!p.categories?.name) return false;
                      const dbCat = p.categories.name.toLowerCase();
                      const uiCat = category.toLowerCase();
                      
                      if (uiCat === 'pratsessor' && dbCat.includes('protsessor')) return true;
                      if (uiCat === 'video karta' && dbCat.includes('videokarta')) return true;
                      if (uiCat === 'monitor' && dbCat.includes('monitor')) return true;
                      if (uiCat === 'kuller' && dbCat.includes('kuler')) return true;
                      if (uiCat === 'ssd' && dbCat.includes('ssd')) return true;
                      
                      if (['klaviatura', 'sichqoncha', 'kovrik', 'naushnik'].includes(uiCat) && dbCat.includes('aksessuar')) return true;
                      
                      return dbCat.includes(uiCat) || uiCat.includes(dbCat);
                    }).map(p => ({ label: p.name, value: p.id }));

                if (categoryProducts.length === 0) {
                  categoryProducts = products.map(p => ({ label: p.name, value: p.id }));
                }

                const isSelected = !!selectedItems[category];
                
                return (
                  <div key={category} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '130px', fontSize: '0.9rem', fontWeight: 500, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {category}
                    </div>
                    
                    <SearchableSelect 
                      options={categoryProducts} 
                      value={selectedItems[category]?.product_id || ''} 
                      onChange={(val: string) => handleItemSelect(category, val)}
                      placeholder={isAdditional ? "Barcha tovarlardan qidirish..." : `${category} qidirish...`}
                    />

                    {isSelected && (
                      <input 
                        type="number" min="1" 
                        value={selectedItems[category].quantity} 
                        onChange={e => handleQuantityChange(category, parseInt(e.target.value) || 1)}
                        style={{ ...inputStyle, width: '70px', textAlign: 'center' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div>
                <label style={{...labelStyle, color: 'var(--success)'}}>$ Umumiy Narx *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8', fontWeight: 'bold' }}>$</span>
                  <input type="number" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} style={{...inputStyle, paddingLeft: '28px'}} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label style={{...labelStyle, color: '#ca8a04'}}>Kurs (so'm/$) *</label>
                <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} style={inputStyle} placeholder="12600" />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', marginTop: '12px' }}>
              {loading ? 'Saqlanmoqda...' : (editOrderId ? 'O\'zgarishlarni Saqlash' : 'Buyurtmani Tasdiqlash va Saqlash')}
            </button>
          </div>
        </div>

        {/* Invoice Preview (Super Compact Blackwood Design style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'sticky', top: '32px' }}>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={generatePDF} className="btn" style={{ background: '#27272a', color: 'white', fontWeight: 'bold', flex: 1, padding: '12px 0' }}>
              Chek (PDF)
            </button>
            <button onClick={sendToTelegram} disabled={tgLoading} className="btn" style={{ background: '#0088cc', color: 'white', fontWeight: 'bold', flex: 1.5, padding: '12px 0' }}>
              {tgLoading ? 'Yuborilmoqda...' : 'Telegramga yuborish'}
            </button>
          </div>
          
          <div ref={receiptRef} style={{ 
            padding: '12px', 
            backgroundColor: '#f4f4f5', 
            color: '#27272a', 
            fontFamily: '"Inter", sans-serif', 
            width: '100%', 
            maxWidth: '340px',
            margin: '0 auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {/* Left Dark Box */}
              <div style={{ backgroundColor: '#27272a', color: '#fff', padding: '8px', flex: 1, borderRadius: '4px' }}>
                <div style={{ fontSize: '0.6rem', color: '#a1a1aa', marginBottom: '1px' }}>Sana:</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '8px' }}>{new Date().toLocaleDateString('uz-UZ')}</div>
                
                <div style={{ fontSize: '0.6rem', color: '#a1a1aa', marginBottom: '1px' }}>Mijoz (To):</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1px', lineHeight: 1.2 }}>{customerName || 'Mijoz ismi'}</div>
                <div style={{ fontSize: '0.65rem', color: '#d4d4d8', lineHeight: 1.2 }}>{phone || '-'}</div>
                <div style={{ fontSize: '0.65rem', color: '#d4d4d8', lineHeight: 1.2 }}>{address || '-'}</div>
              </div>

              {/* Right Info */}
              <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #27272a' }}></div>
                  <span style={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '-0.5px' }}>TEXNO OPTOM</span>
                </div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px', color: '#18181b' }}>BUYURTMA</h1>
                
                <div style={{ backgroundColor: '#fff', padding: '6px', width: '100%', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem' }}>
                  <div>
                    <div style={{ color: '#a1a1aa', marginBottom: '1px' }}>Buyurtma No:</div>
                    <div style={{ fontWeight: 600 }}>#TOG-{nextOrderCode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#a1a1aa', marginBottom: '1px' }}>To'lov:</div>
                    <div style={{ fontWeight: 600 }}>{salesChannel || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ backgroundColor: '#fff', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ display: 'flex', backgroundColor: '#27272a', color: '#fff', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 600 }}>
                <div style={{ flex: 1 }}>Tovar Nomi</div>
                <div style={{ width: '25px', textAlign: 'center' }}>Soni</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {Object.entries(selectedItems).length === 0 ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#a1a1aa', fontSize: '0.7rem' }}>Tovarlar kiritilmagan</div>
                ) : (
                  Object.entries(selectedItems).map(([cat, item]) => (
                    <div key={cat} style={{ display: 'flex', padding: '3px 8px', borderBottom: '1px solid #f4f4f5', alignItems: 'center' }}>
                      <div style={{ flex: 1, paddingRight: '4px' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.65rem', color: '#27272a', lineHeight: 1.1 }}>
                          {item.product_name} <span style={{ color: '#a1a1aa', fontSize: '0.55rem', fontWeight: 400 }}>({cat})</span>
                        </div>
                      </div>
                      <div style={{ width: '25px', textAlign: 'center', fontWeight: 600, fontSize: '0.7rem' }}>{item.quantity}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <div style={{ width: '160px', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ fontWeight: 600 }}>$ Narx</span>
                  <span>${priceUsd || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ fontWeight: 600 }}>Kurs</span>
                  <span>{exchangeRate || '0'} so'm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: '2px', borderTop: '1px solid #d4d4d8' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>Jami To'lov</span>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{totalUzs.toLocaleString('uz-UZ')}</span>
                </div>
                {contractNumber && (
                  <div style={{ color: '#ef4444', fontSize: '0.6rem', marginTop: '4px', textAlign: 'right' }}>
                    Shartnoma: {contractNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.55rem', color: '#71717a', borderTop: '1px solid #d4d4d8', paddingTop: '8px' }}>
              <div style={{ maxWidth: '60%', lineHeight: 1.2 }}>Xarid uchun rahmat. Kafolat va xizmat ko'rsatish bo'yicha murojaat qilishingiz mumkin.</div>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, color: '#27272a' }}>@texnooptom</div>
                <div>Sotuvchi: {sellerName}</div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div>Yuklanmoqda...</div>}>
      <SalesContent />
    </Suspense>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #cbd5e1', backgroundColor: '#fff',
  fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
  color: '#0f172a'
};

const labelStyle = {
  display: 'block', marginBottom: '6px', fontSize: '0.9rem', 
  fontWeight: 600, color: '#475569'
};
