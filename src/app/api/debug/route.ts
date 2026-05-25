import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  const { data, error } = await supabase.from('categories').select('*');
  
  // Try inserting a dummy one to see if insert works
  const { data: insData, error: insError } = await supabase.from('categories').insert({ name: 'TEST_' + Date.now() }).select();

  return NextResponse.json({ 
    fetchData: data, 
    fetchError: error,
    insertData: insData,
    insertError: insError
  });
}
