import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  try {
    // Check if env vars are loaded
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        success: false, 
        error: "XATOLIK: API kalitlar topilmadi. Iltimos, serverni (qora oynani) o'chirib yoqing (Ctrl+C va npm run dev -- -p 3005)."
      });
    }

    const categories = [
      { name: 'Ona plata' }, { name: 'Protsessor' }, { name: 'Kuller' },
      { name: 'Video Karta' }, { name: 'Keys' }, { name: 'Blok pitaniya' },
      { name: 'Operativ xotira' }, { name: 'SSD' }, { name: 'HDD' },
      { name: 'Kovrik' }, { name: 'Klavitura' }, { name: 'Sichqoncha' },
      { name: 'Monitor' }, { name: 'Mikrafon' }, { name: 'Naushnik' },
      { name: 'Qo\'shimcha aksessuarlar' }
    ];

    let lastError = null;
    let catSuccess = 0;
    
    for (const cat of categories) {
      const { error } = await supabase.from('categories').insert(cat);
      if (error) {
        lastError = error;
      } else {
        catSuccess++;
      }
    }

    if (catSuccess === 0 && lastError) {
      return NextResponse.json({ 
        success: false, 
        error: "Xatolik ro'y berdi: " + lastError.message 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Barchasi muvaffaqiyatli o'rnatildi! Endi saytga qaytib yangilang.",
      categoriesAdded: catSuccess
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
