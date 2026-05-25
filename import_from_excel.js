const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');

const SUPABASE_URL = 'https://zrrsmfueajlvktqvhsge.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cZ66lnvqlE4sUkWV5ZkYQw_ErYbGJez';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = '/Users/macbookpro/Desktop/Xisob kitob APP/Finance Oxiri fixed.xlsx';

async function importData() {
  console.log("Fayl o'qilmoqda...");
  try {
    const wb = xlsx.readFile(FILE_PATH);
    const sheetName = 'Tovarlar bazasi';
    const sheet = wb.Sheets[sheetName];
    
    if (!sheet) {
      console.log(`XATOLIK: Excel ichida "${sheetName}" nomli list topilmadi.`);
      return;
    }

    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`Jami ${data.length} ta qator topildi. Bazaga yozish boshlandi...`);

    let categoryMap = {}; // { 'Kategoriya nomi': 'uuid' }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Ustun nomlarini qidirish (katta-kichik harfga qaramasdan)
      let catName = '';
      let prodName = '';
      
      for (const key in row) {
        const k = key.toLowerCase();
        if (k.includes('kategoriya') || k.includes('turi')) catName = row[key];
        if (k.includes('tovar') || k.includes('nomi') || k.includes('mahsulot')) prodName = row[key];
      }

      if (!catName || !prodName) {
        // Agar aniq ustun topilmasa, shunchaki 1- va 2- ustunlarni olamiz
        const keys = Object.keys(row);
        if (keys.length >= 2) {
          catName = row[keys[0]];
          prodName = row[keys[1]];
        }
      }

      if (!catName || !prodName) continue;

      // 1. Kategoriyani bazaga qo'shish yoki borini olish
      let catId = categoryMap[catName];
      if (!catId) {
        // Avval bazadan qidiramiz
        let { data: existCat } = await supabase.from('categories').select('id').eq('name', catName).single();
        if (existCat) {
          catId = existCat.id;
        } else {
          // Yangi kategoriya yaratamiz
          const { data: newCat, error: errCat } = await supabase.from('categories').insert([{ name: catName }]).select().single();
          if (errCat) {
             console.log("Kategoriya yaratishda xato:", errCat.message);
             continue;
          }
          catId = newCat.id;
        }
        categoryMap[catName] = catId;
      }

      // 2. Tovarni bazaga qo'shish
      const { error: errProd } = await supabase.from('products').insert([{ 
        name: prodName, 
        category_id: catId 
      }]);
      
      if (errProd) {
        console.log(`Tovarni yaratishda xato (${prodName}):`, errProd.message);
      }
    }

    console.log("✅ BARCHA TOVAR VA KATEGORIYALAR BAZAGA MUVAFFAQIYATLI KIRITILDI!");

  } catch (err) {
    console.error("Xatolik ro'y berdi:", err.message);
  }
}

importData();
