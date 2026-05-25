'use client';
import { useState, useEffect } from 'react';
import { PackagePlus, FileText, TrendingUp, Trash2, History, DollarSign, Users, AlertTriangle, AlertCircle } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState('katalog');
  
  // Real Role from AuthContext
  const { role: userRole, signOut } = useAuth();

  // Valyuta kursi (Exchange Rate)
  const [exchangeRate, setExchangeRate] = useState(12050);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState('12050');

  useEffect(() => {
    const savedRate = localStorage.getItem('exchangeRate');
    if (savedRate) {
      setExchangeRate(Number(savedRate));
      setTempRate(savedRate);
    }
  }, []);

  const handleSaveRate = () => {
    const r = Number(tempRate);
    if (r > 0) {
      setExchangeRate(r);
      localStorage.setItem('exchangeRate', r.toString());
      setIsEditingRate(false);
    }
  };

  // Katalog form states
  const [categories, setCategories] = useState<any[]>([]);
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Tovar Edit/Delete states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCat, setEditProdCat] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // Kirim (Nakladnoy) states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [kirimQty, setKirimQty] = useState('');
  const [kirimPriceUsd, setKirimPriceUsd] = useState('');
  const [receiptItems, setReceiptItems] = useState<any[]>([]);
  const [kirimSearchTerm, setKirimSearchTerm] = useState('');
  const [showKirimDropdown, setShowKirimDropdown] = useState(false);
  const [kirimLoading, setKirimLoading] = useState(false);
  const [kirimSuccess, setKirimSuccess] = useState('');

  // Hamkorlar states
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [tempDays, setTempDays] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [supplierLoading, setSupplierLoading] = useState(false);

  const handleDeleteReceipt = async (receiptId: string, totalAmount: number, supplierId: string, items: any[]) => {
    if (!confirm("Rostdan ham bu hujjatni o'chirmoqchimisiz? Ombor qoldig'i orqaga qaytariladi!")) return;
    try {
      const { data: sup } = await supabase.from('suppliers').select('balance').eq('id', supplierId).single();
      if (sup) {
        await supabase.from('suppliers').update({ balance: Number(sup.balance) - totalAmount }).eq('id', supplierId);
      }
      for (const item of items) {
        const { data: bal } = await supabase.from('inventory_balances').select('quantity').eq('product_id', item.product_id).single();
        if (bal) {
          await supabase.from('inventory_balances').update({ quantity: bal.quantity - item.quantity }).eq('product_id', item.product_id);
        }
      }
      await supabase.from('inventory_transactions').delete().eq('reference_id', receiptId);
      await supabase.from('receipt_docs').delete().eq('id', receiptId);
      
      alert("Muvaffaqiyatli o'chirildi!");
      fetchData();
    } catch (err: any) { alert("Xatolik: " + err.message); }
  };

  const handleEditReceipt = async (doc: any) => {
    if (!confirm("Tahrirlash uchun eski hujjat bazadan o'chirilib, ma'lumotlari 'Yangi Kirim' oynasiga ko'chiriladi. Rozimisiz?")) return;
    try {
      const { data: sup } = await supabase.from('suppliers').select('balance').eq('id', doc.supplier_id).single();
      if (sup) {
        await supabase.from('suppliers').update({ balance: Number(sup.balance) - doc.total_amount }).eq('id', doc.supplier_id);
      }
      for (const item of doc.receipt_items) {
        const { data: bal } = await supabase.from('inventory_balances').select('quantity').eq('product_id', item.product_id).single();
        if (bal) {
          await supabase.from('inventory_balances').update({ quantity: bal.quantity - item.quantity }).eq('product_id', item.product_id);
        }
      }
      await supabase.from('inventory_transactions').delete().eq('reference_id', doc.id);
      await supabase.from('receipt_docs').delete().eq('id', doc.id);

      setSelectedSupplier(doc.supplier_id);
      setReceiptItems(doc.receipt_items.map((i: any) => ({
        product_id: i.product_id,
        product_name: i.products?.name,
        quantity: i.quantity,
        incoming_price: i.incoming_price,
        total: i.quantity * i.incoming_price
      })));
      setActiveTab('kirim');
      fetchData();
      alert("Tahrirlashga tayyor! O'zgartirishlarni kiritgach pastdagi 'Tasdiqlash' tugmasini bosib yangidan saqlang.");
    } catch(err: any) { alert("Xatolik: " + err.message); }
  };

  // --- Spisaniya Logic ---states
  const [spisProduct, setSpisProduct] = useState('');
  const [spisQty, setSpisQty] = useState('');
  const [spisReason, setSpisReason] = useState('Brak');
  const [spisLoading, setSpisLoading] = useState(false);
  const [spisSuccess, setSpisSuccess] = useState('');
  const [spisSearchTerm, setSpisSearchTerm] = useState('');
  const [showSpisDropdown, setShowSpisDropdown] = useState(false);

  // Tarix (History) states
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);

  // Qoldiq (Balances) states
  const [balances, setBalances] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [fetchError, setFetchError] = useState('');

  const fetchData = async () => {
    try {
      if (['katalog', 'kirim', 'hamkorlar', 'spisaniya', 'qoldiq'].includes(activeTab)) {
        const { data: catData, error: catErr } = await supabase.from('categories').select('*');
        if (catErr) setFetchError('Kategoriya xatosi: ' + catErr.message);
        else if (catData) setCategories(catData);
        
        const { data: supData } = await supabase.from('suppliers').select('*').order('name');
        if (supData) setSuppliers(supData);

        const { data: prodData } = await supabase.from('products').select(`*, categories(name)`);
        if (prodData) setProducts(prodData);
      }

      if (activeTab === 'tarix') {
        const { data } = await supabase
          .from('receipt_docs')
          .select('*, suppliers(name), receipt_items(*, products(name))')
          .order('document_date', { ascending: false });
        if (data) setHistoryDocs(data);
      }

      if (activeTab === 'qoldiq') {
        const { data } = await supabase.from('inventory_balances').select('*, products(name, image_url, categories(name))');
        const { data: txs } = await supabase.from('inventory_transactions').select('*');

        if (data) {
          const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const dEnd = new Date(endDate); dEnd.setHours(23, 59, 59, 999);
          const dStart = new Date(startDate);

          let enrichedBalances = data.map((b: any) => {
            const pTxs = txs?.filter((t: any) => t.product_id === b.product_id) || [];
            
            // 30 day sales for dynamic minStock
            const thirtyDaySales = pTxs.filter((t: any) => t.transaction_type !== 'kirim' && new Date(t.created_at) >= thirtyDaysAgo)
                                      .reduce((sum: number, t: any) => sum + Math.abs(t.quantity_change), 0);
            const minStock = Math.ceil((thirtyDaySales / 30) * 2) || 0;

            // Date Range analytics (Kirim/Chiqim)
            const rangeTxs = pTxs.filter((t: any) => {
               const d = new Date(t.created_at);
               return d >= dStart && d <= dEnd;
            });

            let kQty = 0, kVal = 0, cQty = 0, cVal = 0;
            rangeTxs.forEach((t: any) => {
               if (t.transaction_type === 'kirim') {
                  kQty += t.quantity_change;
                  kVal += t.quantity_change * t.price;
               } else {
                  cQty += Math.abs(t.quantity_change);
                  cVal += Math.abs(t.quantity_change) * t.price;
               }
            });

            const count = pTxs.length;
            let xyz = 'Z';
            if (count >= 3) xyz = 'X';
            else if (count >= 2) xyz = 'Y';
            
            return { 
              ...b, 
              totalValue: b.quantity * b.average_price, 
              xyzClass: xyz, 
              minStock,
              kirimQty: kQty, kirimValue: kVal,
              chiqimQty: cQty, chiqimValue: cVal
            };
          });

          enrichedBalances.sort((a, b) => b.totalValue - a.totalValue);
          const grandTotal = enrichedBalances.reduce((sum, b) => sum + b.totalValue, 0);
          let runningSum = 0;
          
          enrichedBalances = enrichedBalances.map((b) => {
            runningSum += b.totalValue;
            const cumulative = grandTotal > 0 ? runningSum / grandTotal : 0;
            let abc = 'C';
            if (cumulative <= 0.8) abc = 'A';
            else if (cumulative <= 0.95) abc = 'B';
            return { ...b, abcClass: abc };
          });

          setBalances(enrichedBalances);
        }
      }
    } catch (err: any) {
      setFetchError('Ulanish xatosi: ' + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, startDate, endDate]);

  const saveSupplierTerm = async (id: string) => {
    try {
      const { error } = await supabase.from('suppliers').update({ payment_term_days: Number(tempDays) }).eq('id', id);
      if (error) throw error;
      setEditingSupplier(null); fetchData();
    } catch (err: any) { alert("Xato: " + err.message); }
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName) { alert("Hamkor nomini kiriting!"); return; }
    setSupplierLoading(true);
    try {
      const { error } = await supabase.from('suppliers').insert([{ name: newSupplierName, phone: newSupplierPhone }]);
      if (error) throw error;
      setNewSupplierName(''); setNewSupplierPhone('');
      fetchData();
    } catch (err: any) { alert("Xato: " + err.message); } finally { setSupplierLoading(false); }
  };

  const handleAddProduct = async () => {
    if (!productName || !categoryId || !imageFile) { alert("Nomini, Kategoriyani va Rasmni kiritish MAJBURIY!"); return; }
    setLoading(true); setSuccessMsg('');
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      const { error } = await supabase.from('products').insert([{ name: productName, category_id: categoryId, image_url: imageUrl }]);
      if (error) throw error;
      
      setSuccessMsg("Tovar bazaga muvaffaqiyatli qo'shildi!");
      setProductName(''); setCategoryId(''); setImageFile(null);
      fetchData();
    } catch (err: any) { alert("Xato: " + err.message); } finally { setLoading(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Rostdan ham ushbu tovarni o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert("O'chirishda xato: " + err.message); }
  };

  const handleUpdateProduct = async (id: string, oldImageUrl: string) => {
    if (!editProdName || !editProdCat) { alert("Nom va kategoriyani kiriting!"); return; }
    setLoading(true);
    try {
      let newImageUrl = oldImageUrl;
      if (editImageFile) {
        const fileExt = editImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, editImageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        newImageUrl = publicUrlData.publicUrl;
      }
      
      const { error } = await supabase.from('products').update({ name: editProdName, category_id: editProdCat, image_url: newImageUrl }).eq('id', id);
      if (error) throw error;
      
      setEditingProductId(null); setEditImageFile(null);
      fetchData();
    } catch (err: any) { alert("Yangilashda xato: " + err.message); } finally { setLoading(false); }
  };

  const handleAddItemToReceipt = () => {
    if (!selectedProduct || !kirimQty || !kirimPriceUsd) return;
    const prod = products.find(p => p.id === selectedProduct);
    setReceiptItems([...receiptItems, {
      product_id: selectedProduct, product_name: prod.name, category_name: prod.categories?.name,
      quantity: Number(kirimQty), incoming_price: Number(kirimPriceUsd), total: Number(kirimQty) * Number(kirimPriceUsd)
    }]);
    setSelectedProduct(''); setKirimQty(''); setKirimPriceUsd(''); setKirimSearchTerm('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...receiptItems]; newItems.splice(index, 1); setReceiptItems(newItems);
  };

  const handleSubmitReceipt = async () => {
    if (!selectedSupplier) { alert("Xato: Postavshik (Hamkor) tanlash majburiy!"); return; }
    if (receiptItems.length === 0) { alert("Xato: Hech qanday tovar qo'shilmagan!"); return; }
    setKirimLoading(true); setKirimSuccess('');
    try {
      const totalAmountUsd = receiptItems.reduce((sum, item) => sum + item.total, 0);
      const { data: supTerm } = await supabase.from('suppliers').select('payment_term_days').eq('id', selectedSupplier).single();
      const termDays = supTerm?.payment_term_days || 0;
      let dueDate = null;
      if (termDays > 0) {
        const date = new Date(); date.setDate(date.getDate() + termDays); dueDate = date.toISOString();
      }

      const { data: receipt, error: receiptError } = await supabase.from('receipt_docs')
        .insert([{ supplier_id: selectedSupplier, total_amount: totalAmountUsd, due_date: dueDate }]).select().single();
      if (receiptError) throw receiptError;
      
      for (const item of receiptItems) {
        const { error: itemsError } = await supabase.from('receipt_items').insert([{
          receipt_id: receipt.id, product_id: item.product_id, quantity: item.quantity, remaining_quantity: item.quantity, incoming_price: item.incoming_price
        }]);
        if (itemsError) throw itemsError;
        
        const { data: bal } = await supabase.from('inventory_balances').select('*').eq('product_id', item.product_id).single();
        if (bal) {
          const newQty = bal.quantity + item.quantity;
          const newAvgPrice = ((bal.quantity * bal.average_price) + (item.quantity * item.incoming_price)) / newQty;
          await supabase.from('inventory_balances').update({ quantity: newQty, average_price: newAvgPrice, updated_at: new Date() }).eq('product_id', item.product_id);
        } else {
          await supabase.from('inventory_balances').insert([{ product_id: item.product_id, quantity: item.quantity, average_price: item.incoming_price }]);
        }
        
        await supabase.from('inventory_transactions').insert([{
          product_id: item.product_id, transaction_type: 'kirim', quantity_change: item.quantity, price: item.incoming_price, reference_id: receipt.id
        }]);
      }
      
      const { data: sup } = await supabase.from('suppliers').select('balance').eq('id', selectedSupplier).single();
      if (sup) {
        await supabase.from('suppliers').update({ balance: Number(sup.balance) + totalAmountUsd }).eq('id', selectedSupplier);
      }
      setKirimSuccess("Kirim hujjati saqlandi!"); setReceiptItems([]); setSelectedSupplier('');
    } catch (error: any) { alert("Xatolik: " + error.message); } 
    finally { setKirimLoading(false); }
  };

  const handleSpisaniyaSubmit = async () => {
    if (!spisProduct || !spisQty || Number(spisQty) <= 0) return;
    setSpisLoading(true); setSpisSuccess('');
    try {
      const { data: bal } = await supabase.from('inventory_balances').select('quantity').eq('product_id', spisProduct).single();
      if (!bal || bal.quantity < Number(spisQty)) { alert(`Yetersiz qoldiq! Mavjud: ${bal?.quantity || 0} ta`); setSpisLoading(false); return; }

      const { data: batches } = await supabase.from('receipt_items').select('*').eq('product_id', spisProduct).gt('remaining_quantity', 0).order('created_at', { ascending: true });
      let qtyToDeduct = Number(spisQty);
      let totalCost = 0;
      
      if (!batches || batches.length === 0) { alert("Tovar partiyalari topilmadi!"); setSpisLoading(false); return; }

      for (let batch of batches) {
        if (qtyToDeduct <= 0) break;
        const deduct = Math.min(batch.remaining_quantity, qtyToDeduct);
        qtyToDeduct -= deduct;
        totalCost += deduct * batch.incoming_price;
        await supabase.from('receipt_items').update({ remaining_quantity: batch.remaining_quantity - deduct }).eq('id', batch.id);
      }
      
      if (qtyToDeduct > 0) { alert("Xato: FIFO qoldiq yetarli emas!"); setSpisLoading(false); return; }
      
      const { data: wo } = await supabase.from('write_offs').insert([{ reason: spisReason, total_value: totalCost }]).select().single();
      await supabase.from('write_off_items').insert([{ write_off_id: wo?.id, product_id: spisProduct, quantity: Number(spisQty), cost_value: totalCost }]);
      await supabase.from('inventory_balances').update({ quantity: bal.quantity - Number(spisQty), updated_at: new Date() }).eq('product_id', spisProduct);
      await supabase.from('inventory_transactions').insert([{ product_id: spisProduct, transaction_type: 'spisaniya', quantity_change: -Number(spisQty), price: totalCost / Number(spisQty), reference_id: wo?.id }]);
      
      setSpisSuccess(`Tovarlar Hisobdan chiqarildi! Zarar: $${totalCost.toLocaleString()}`);
      setSpisProduct(''); setSpisQty('');
    } catch (err: any) { alert("Xato: " + err.message); } finally { setSpisLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Ombor (Warehouse) Bo'limi</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* REAL AUTH DISPLAY */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Foydalanuvchi:</span>
            <span style={{ fontWeight: 'bold', color: userRole === 'admin' ? '#dc2626' : '#2563eb' }}>
              {userRole === 'admin' ? '👨‍💼 Admin (To\'liq)' : '👷 Skladchi'}
            </span>
            <button onClick={signOut} style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Chiqish</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <DollarSign size={18} color="#16a34a" style={{ marginRight: '8px' }} />
          <span style={{ fontWeight: 'bold', marginRight: '12px' }}>Hozirgi Kurs:</span>
          {isEditingRate ? (
             <div style={{ display: 'flex', gap: '8px' }}>
               <input type="number" value={tempRate} onChange={e => setTempRate(e.target.value)} style={{ width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
               <button onClick={handleSaveRate} style={{ padding: '4px 12px', background: 'var(--primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Saqlash</button>
             </div>
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <span>1$ = <b>{exchangeRate.toLocaleString()} UZS</b></span>
               <button onClick={() => setIsEditingRate(true)} style={{ padding: '2px 8px', fontSize: '0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>O'zgartirish</button>
             </div>
           )}
         </div>
        </div>
      </div>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {['katalog', 'kirim', 'spisaniya', 'tarix', 'qoldiq', 'hamkorlar']
          .filter(tab => !(userRole === 'skladchi' && tab === 'spisaniya'))
          .map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : ''}`} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? 'var(--primary)' : 'var(--surface)', color: activeTab === tab ? 'white' : 'var(--text-primary)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
             {tab === 'katalog' && <PackagePlus size={18} style={{ marginRight: '8px' }}/>}
             {tab === 'kirim' && <FileText size={18} style={{ marginRight: '8px' }}/>}
             {tab === 'spisaniya' && <AlertTriangle size={18} style={{ marginRight: '8px' }}/>}
             {tab === 'tarix' && <History size={18} style={{ marginRight: '8px' }}/>}
             {tab === 'qoldiq' && <TrendingUp size={18} style={{ marginRight: '8px' }}/>}
             {tab === 'hamkorlar' && <Users size={18} style={{ marginRight: '8px' }}/>}
             {tab === 'katalog' ? 'Tovar Baza (Katalog)' : tab === 'kirim' ? 'Kirim (Nakladnoy)' : tab === 'spisaniya' ? 'Hisobdan Chiqarish (Spisaniya)' : tab === 'qoldiq' ? "Ombor Qoldig'i (Analitika)" : tab}
          </button>
        ))}
      </div>

      {fetchError && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold' }}>XATOLIK: {fetchError}</div>}

      {/* KATALOG TAB */}
      {activeTab === 'katalog' && (
         <div className="card">
           <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Yangi Tovar Yaratish</h2>
           {successMsg && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '20px' }}>{successMsg}</div>}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
             <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', width: '100%' }}>
               <option value="">Kategoriya tanlang...</option>
               {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
             </select>
             <input type="text" placeholder="Tovar nomi" value={productName} onChange={e=>setProductName(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', width: '100%' }}/>
             <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} style={{ padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', width: '100%', fontSize: '0.9rem' }} title="Tovar rasmi" />
             <button onClick={handleAddProduct} disabled={loading} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>{loading ? "Saqlanmoqda..." : "Qo'shish"}</button>
           </div>

           <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Jami Tovarlar Ro'yxati</h2>
           <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ borderBottom: '2px solid var(--border)' }}>
                 <th style={{ padding: '12px 0', width: '50px' }}>Rasm</th>
                 <th style={{ padding: '12px 0' }}>Kategoriya</th>
                 <th style={{ padding: '12px 0' }}>Tovar Nomi</th>
                 {userRole === 'admin' && <th style={{ padding: '12px 0', textAlign: 'right' }}>Harakatlar</th>}
               </tr>
             </thead>
             <tbody>
               {products.map((prod) => (
                 <tr key={prod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                   <td style={{ padding: '12px 0' }}>
                     {prod.image_url ? (
                       <img src={prod.image_url} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                     ) : (
                       <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>Rasm yo'q</div>
                     )}
                   </td>
                   
                   {editingProductId === prod.id ? (
                     <td style={{ padding: '12px 0' }} colSpan={2}>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <select value={editProdCat} onChange={e => setEditProdCat(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                           {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                         </select>
                         <input type="text" value={editProdName} onChange={e => setEditProdName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', flex: 1 }} />
                         <input type="file" accept="image/*" onChange={e => setEditImageFile(e.target.files?.[0] || null)} style={{ width: '150px' }} />
                       </div>
                     </td>
                   ) : (
                     <>
                       <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{prod.categories?.name}</td>
                       <td style={{ padding: '12px 0' }}>{prod.name}</td>
                     </>
                   )}
                   
                   {userRole === 'admin' && (
                     <td style={{ padding: '12px 0', textAlign: 'right' }}>
                       {editingProductId === prod.id ? (
                         <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                           <button onClick={() => handleUpdateProduct(prod.id, prod.image_url)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Saqlash</button>
                           <button onClick={() => setEditingProductId(null)} className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#e2e8f0' }}>Bekor</button>
                         </div>
                       ) : (
                         <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                           <button onClick={() => { setEditingProductId(prod.id); setEditProdName(prod.name); setEditProdCat(prod.category_id); }} className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#e2e8f0' }}>O'zgar</button>
                           <button onClick={() => handleDeleteProduct(prod.id)} className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#fee2e2', color: '#991b1b' }}>O'chir</button>
                         </div>
                       )}
                     </td>
                   )}
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      )}

      {/* KIRIM TAB */}
      {activeTab === 'kirim' && (
         <div className="card">
           <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Yangi Kirim Hujjati</h2>
           {kirimSuccess && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '20px' }}>{kirimSuccess}</div>}
           <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
             <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', flex: 1 }}>
               <option value="">Postavshik...</option>
               {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
             </select>
             
             <div style={{ position: 'relative', flex: 2 }}>
               <input 
                 type="text" 
                 placeholder="Tovar qidirish..." 
                 value={kirimSearchTerm} 
                 onFocus={() => setShowKirimDropdown(true)}
                 onBlur={() => setTimeout(() => setShowKirimDropdown(false), 200)}
                 onChange={(e) => setKirimSearchTerm(e.target.value)}
                 style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', width: '100%' }}
               />
               {showKirimDropdown && (
                 <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid var(--border)', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                   {products.filter(p => p.name.toLowerCase().includes(kirimSearchTerm.toLowerCase())).map(prod => (
                     <div 
                       key={prod.id} 
                       onClick={() => { setSelectedProduct(prod.id); setKirimSearchTerm(prod.name); setShowKirimDropdown(false); }}
                       style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                     >
                       {prod.name}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             <input type="number" placeholder="Soni" value={kirimQty} onChange={e=>setKirimQty(e.target.value)} style={{ width: '80px', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}/>
             <input type="number" placeholder="Narx ($)" value={kirimPriceUsd} onChange={e=>setKirimPriceUsd(e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}/>
             <button onClick={handleAddItemToReceipt} className="btn">Qo'shish</button>
           </div>
           
           <table style={{ width: '100%', textAlign: 'left', marginBottom: '16px' }}>
             <thead><tr><th>Tovar</th><th>Soni</th><th>Narx ($)</th><th>Jami</th><th></th></tr></thead>
             <tbody>
               {receiptItems.map((it, idx) => (
                 <tr key={idx}><td>{it.product_name}</td><td>{it.quantity}</td><td>${it.incoming_price}</td><td>${it.total}</td><td><Trash2 size={16} onClick={()=>handleRemoveItem(idx)} cursor="pointer"/></td></tr>
               ))}
             </tbody>
           </table>
           <button className="btn btn-primary" onClick={handleSubmitReceipt} disabled={kirimLoading || receiptItems.length === 0}>{kirimLoading ? "Saqlanmoqda..." : "Tasdiqlash"}</button>
         </div>
      )}

      {/* SPISANIYA TAB */}
      {activeTab === 'spisaniya' && (
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Tovarlarni Hisobdan Chiqarish (Spisaniya)</h2>
          {spisSuccess && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '20px' }}>{spisSuccess}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Tovarni tanlang (Qidiruv)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Tovar nomini yozing..." 
                  value={spisSearchTerm} 
                  onFocus={() => setShowSpisDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSpisDropdown(false), 200)}
                  onChange={(e) => setSpisSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
                {showSpisDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid var(--border)', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    {products.filter(p => p.name.toLowerCase().includes(spisSearchTerm.toLowerCase())).map(prod => (
                      <div 
                        key={prod.id} 
                        onClick={() => { setSpisProduct(prod.id); setSpisSearchTerm(prod.name); setShowSpisDropdown(false); }}
                        style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      >
                        {prod.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Miqdor</label>
              <input type="number" value={spisQty} onChange={(e) => setSpisQty(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Sabab (Asos)</label>
              <select value={spisReason} onChange={(e) => setSpisReason(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <option value="Brak / Shikastlangan">Brak / Shikastlangan</option>
                <option value="Yo'qolgan / O'g'irlangan">Yo'qolgan / O'g'irlangan</option>
                <option value="Muddati o'tgan">Muddati o'tgan</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSpisaniyaSubmit} disabled={spisLoading} style={{ backgroundColor: '#dc2626' }}>
            {spisLoading ? "Chiqarilmoqda..." : "Hisobdan Chiqarish (Zarar)"}
          </button>
        </div>
      )}

      {/* QOLDIQ TAB (WITH ANALYTICS) */}
      {activeTab === 'qoldiq' && (
        <div className="card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0, marginBottom: '8px' }}>Ombor Qoldig'i va Analitika</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Har bir tovar bo'yicha kirim, chiqim va joriy qoldiq tahlili</p>
            </div>
            
            {/* DATE FILTERS IN QOLDIQ TAB */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Boshlanish Sana</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Tugash Sana</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 8px' }}>Tovar Nomi</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Sinf</th>
                <th style={{ padding: '12px 8px', borderLeft: '1px solid #e2e8f0', color: '#16a34a' }}>Tanlangan davrda Kirim</th>
                <th style={{ padding: '12px 8px', borderLeft: '1px solid #e2e8f0', color: '#dc2626' }}>Tanlangan davrda Chiqim</th>
                <th style={{ padding: '12px 8px', borderLeft: '1px solid #e2e8f0', backgroundColor: '#eff6ff' }}>Hozirgi Qoldiq</th>
                <th style={{ padding: '12px 8px', backgroundColor: '#eff6ff' }}>Jami Pul ($)</th>
                <th style={{ padding: '12px 8px' }}>Min. Zaxira</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(bal => {
                const isLowStock = bal.quantity < bal.minStock;
                return (
                  <tr key={bal.product_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isLowStock && <AlertCircle size={16} color="#dc2626" />}
                        {bal.products?.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}><span style={{ padding: '2px 6px', backgroundColor: '#e2e8f0', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{bal.abcClass}{bal.xyzClass}</span></td>
                    
                    {/* Kirim Analytics */}
                    <td style={{ padding: '12px 8px', borderLeft: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold', color: '#16a34a' }}>{bal.kirimQty} ta</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>${bal.kirimValue.toLocaleString()}</div>
                    </td>
                    
                    {/* Chiqim Analytics */}
                    <td style={{ padding: '12px 8px', borderLeft: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold', color: '#dc2626' }}>{bal.chiqimQty} ta</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>${bal.chiqimValue.toLocaleString()}</div>
                    </td>
                    
                    {/* Current Balance */}
                    <td style={{ padding: '12px 8px', borderLeft: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {bal.quantity} ta
                    </td>
                    <td style={{ padding: '12px 8px', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#0f172a' }}>
                      ${bal.totalValue.toLocaleString()}
                    </td>

                    <td style={{ padding: '12px 8px', color: isLowStock ? '#dc2626' : 'var(--text-secondary)' }}>
                      {bal.minStock} ta
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <td colSpan={2} style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 'bold' }}>JAMI (Tanlangan Davr):</td>
                <td style={{ padding: '16px 8px', fontWeight: 'bold', color: '#16a34a', borderLeft: '1px solid #e2e8f0' }}>
                  {balances.reduce((s, b) => s + b.kirimQty, 0)} ta <br/>
                  <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>${balances.reduce((s, b) => s + b.kirimValue, 0).toLocaleString()}</span>
                </td>
                <td style={{ padding: '16px 8px', fontWeight: 'bold', color: '#dc2626', borderLeft: '1px solid #e2e8f0' }}>
                  {balances.reduce((s, b) => s + b.chiqimQty, 0)} ta <br/>
                  <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>${balances.reduce((s, b) => s + b.chiqimValue, 0).toLocaleString()}</span>
                </td>
                <td style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '1.2rem', borderLeft: '1px solid #e2e8f0' }}>
                  {balances.reduce((s, b) => s + b.quantity, 0)} ta
                </td>
                <td colSpan={2} style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  ${balances.reduce((s, b) => s + b.totalValue, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TARIX TAB */}
      {activeTab === 'tarix' && (
        <div className="card" style={{ backgroundColor: '#f8fafc', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a' }}>Kirim Hujjatlari (Nakladnoylar)</h2>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Jami {historyDocs.length} ta hujjat</div>
          </div>
          
          {historyDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Hozircha hech qanday kirim hujjati yo'q.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {historyDocs.map((doc: any) => (
                <div key={doc.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                  
                  {/* Document Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          KIRIM
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                          Nakladnoy № <span style={{ fontFamily: 'monospace', color: '#475569' }}>{doc.id.split('-')[0].toUpperCase()}</span>
                        </h3>
                      </div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {new Date(doc.document_date).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>Hamkor (Postavshik)</p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>{doc.suppliers?.name || 'Noma\'lum'}</p>
                      </div>
                      {userRole === 'admin' && (
                        <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid #cbd5e1', paddingLeft: '20px' }}>
                          <button onClick={() => handleEditReceipt(doc)} className="btn" style={{ padding: '8px', backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#3b82f6', borderRadius: '8px' }} title="Tahrirlash (O'zgartirish)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button onClick={() => handleDeleteReceipt(doc.id, doc.total_amount, doc.supplier_id, doc.receipt_items)} className="btn" style={{ padding: '8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px' }} title="O'chirish">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Document Body (Table) */}
                  <div style={{ padding: '20px 24px' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px 12px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>Tovar Nomi</th>
                          <th style={{ padding: '10px 12px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soni</th>
                          <th style={{ padding: '10px 12px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Narxi</th>
                          <th style={{ padding: '10px 12px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.receipt_items?.map((item: any, idx: number) => (
                          <tr key={item.id} style={{ borderBottom: idx !== doc.receipt_items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500' }}>{item.products?.name}</td>
                            <td style={{ padding: '12px', color: '#475569' }}>
                              <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{item.quantity} ta</span>
                            </td>
                            <td style={{ padding: '12px', color: '#475569' }}>${item.incoming_price?.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                              ${(item.quantity * item.incoming_price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Document Footer */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#64748b', fontSize: '1rem' }}>Jami Summa:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#16a34a' }}>
                      ${doc.total_amount?.toLocaleString()}
                    </span>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HAMKORLAR TAB */}
      {activeTab === 'hamkorlar' && (
        <div className="card">
           <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Yangi Hamkor Yaratish</h2>
           <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
             <input type="text" placeholder="Hamkor (Postavshik) nomi" value={newSupplierName} onChange={e=>setNewSupplierName(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', flex: 2 }}/>
             <input type="text" placeholder="Telefon raqami (ixtiyoriy)" value={newSupplierPhone} onChange={e=>setNewSupplierPhone(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', flex: 1 }}/>
             <button onClick={handleAddSupplier} disabled={supplierLoading} className="btn btn-primary">{supplierLoading ? 'Saqlanmoqda...' : 'Qo\'shish'}</button>
           </div>

           <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Hamkorlar bilan ishlash muddati</h2>
           <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ borderBottom: '2px solid var(--border)' }}>
                 <th style={{ padding: '12px 0' }}>Postavshik</th>
                 <th style={{ padding: '12px 0' }}>Joriy Balans</th>
                 <th style={{ padding: '12px 0' }}>To'lov Muddati</th>
                 {userRole === 'admin' && <th style={{ padding: '12px 0' }}>Harakat</th>}
               </tr>
             </thead>
             <tbody>
               {suppliers.map(sup => (
                 <tr key={sup.id} style={{ borderBottom: '1px solid var(--border)' }}>
                   <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{sup.name}</td>
                   <td style={{ padding: '12px 0', color: sup.balance > 0 ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>${Number(sup.balance).toLocaleString()}</td>
                   <td style={{ padding: '12px 0' }}>
                     {editingSupplier === sup.id ? (
                       <input type="number" value={tempDays} onChange={(e) => setTempDays(e.target.value)} style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                     ) : (
                       <span style={{ fontWeight: 'bold' }}>{sup.payment_term_days || 0} kun</span>
                     )}
                   </td>
                   {userRole === 'admin' && (
                     <td style={{ padding: '12px 0' }}>
                       {editingSupplier === sup.id ? (
                         <button className="btn btn-primary" onClick={() => saveSupplierTerm(sup.id)} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Saqlash</button>
                       ) : (
                         <button className="btn" onClick={() => { setEditingSupplier(sup.id); setTempDays(String(sup.payment_term_days || 0)); }} style={{ padding: '6px 12px', fontSize: '0.9rem', backgroundColor: '#e2e8f0' }}>O'zgartirish</button>
                       )}
                     </td>
                   )}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
