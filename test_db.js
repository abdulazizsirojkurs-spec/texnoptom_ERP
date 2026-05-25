import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrrsmfueajlvktqvhsge.supabase.co';
const supabaseAnonKey = 'sb_publishable_cZ66lnvqlE4sUkWV5ZkYQw_ErYbGJez';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('categories').select('*');
  console.log("Categories:", data);
  console.log("Error:", error);
}

test();
