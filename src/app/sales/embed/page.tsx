'use client';
import { Suspense } from 'react';
import { SalesContent } from '../page';

// Krayin CRM'ning "Avans/Buyurtma qabul qilindi" bosqich-modalida iframe
// sifatida ochiladigan tor rejim. Xuddi shu buyurtma yaratish formasi
// (`../page.tsx`dagi SalesContent) qayta ishlatiladi — logika ikki joyda
// yozilmasin va kelajakda forma o'zgarsa ikkalasi ham avtomatik yangilansin.
export default function SalesEmbedPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Yuklanmoqda...</div>}>
      <SalesContent />
    </Suspense>
  );
}
