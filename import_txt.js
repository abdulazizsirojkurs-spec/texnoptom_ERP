const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zrrsmfueajlvktqvhsge.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cZ66lnvqlE4sUkWV5ZkYQw_ErYbGJez';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importData() {
  try {
    const text = fs.readFileSync('../products.txt', 'utf8');
    const lines = text.split('\n');
    let categoryMap = {}; // name -> id
    let count = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('──')) continue;
      
      const parts = line.split('\t');
      // Parts length could be 2 or 3 (some have id, some don't)
      let catName = '';
      let prodName = '';
      
      if (parts.length === 3) {
        catName = parts[1].trim();
        prodName = parts[2].trim();
      } else if (parts.length === 2) {
        catName = parts[0].trim();
        prodName = parts[1].trim();
      } else {
        continue;
      }
      
      if (!catName || !prodName) continue;
      
      // Fix Qo''shimcha aksessuarlar
      if (catName === "Qo''shimcha aksessuarlar") catName = "Aksessuarlar";

      let catId = categoryMap[catName];
      if (!catId) {
        let { data: existCat } = await supabase.from('categories').select('id').eq('name', catName).single();
        if (existCat) {
          catId = existCat.id;
        } else {
          const { data: newCat, error: errCat } = await supabase.from('categories').insert([{ name: catName }]).select().single();
          if (errCat) {
            console.log("Cat error:", errCat.message);
            continue;
          }
          catId = newCat.id;
        }
        categoryMap[catName] = catId;
      }

      const { error: errProd } = await supabase.from('products').insert([{ name: prodName, category_id: catId }]);
      if (errProd) {
        console.log("Prod error:", errProd.message);
      } else {
        count++;
      }
    }
    console.log(`✅ ${count} ta tovar bazaga muvaffaqiyatli qo'shildi!`);
  } catch (err) {
    console.error("Script error:", err);
  }
}

importData();
