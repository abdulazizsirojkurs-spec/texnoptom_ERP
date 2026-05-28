const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  console.log("Sotuvchi Farzona yaratilmoqda...");
  const farzonaRes = await supabase.auth.signUp({
    email: 'farzona@texno.uz',
    password: 'farzonapassword123',
    options: {
      data: {
        full_name: 'Farzona',
        role: 'sotuvchi'
      }
    }
  });
  if (farzonaRes.error) console.error("Xato:", farzonaRes.error.message);
  else console.log("Farzona mofaqiyatli yaratildi!");

  console.log("Sotuvchi Begoyim yaratilmoqda...");
  const begoyimRes = await supabase.auth.signUp({
    email: 'begoyim@texno.uz',
    password: 'begoyimpassword123',
    options: {
      data: {
        full_name: 'Begoyim',
        role: 'sotuvchi'
      }
    }
  });
  if (begoyimRes.error) console.error("Xato:", begoyimRes.error.message);
  else console.log("Begoyim mofaqiyatli yaratildi!");
}

createUsers();
