const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  console.log("Creating Admin user...");
  const adminRes = await supabase.auth.signUp({
    email: 'admin@texno.uz',
    password: 'adminpassword123',
  });
  if (adminRes.error) console.error("Admin error:", adminRes.error.message);
  else console.log("Admin created successfully!");

  console.log("Creating Skladchi user...");
  const skladRes = await supabase.auth.signUp({
    email: 'skladchi@texno.uz',
    password: 'skladchipassword123',
  });
  if (skladRes.error) console.error("Skladchi error:", skladRes.error.message);
  else console.log("Skladchi created successfully!");
}

createUsers();
