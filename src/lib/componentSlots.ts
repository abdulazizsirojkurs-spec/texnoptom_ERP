// Buyurtma "komplekt qismlari" — qat'iy slot ro'yxati. Har bir slot faqat
// o'z kategoriyasidagi tovarni ko'rsatadi (categoryName === null bo'lsa —
// filtrsiz, "Boshqa tovarlar" uchun). `categoryName` qiymatlari Supabase'dagi
// `categories.name` ustuniga ANIQ (fuzzy emas) mos kelishi kerak — bu yerda
// 2026-08-17'da jonli bazadan tekshirilgan haqiqiy nomlar ishlatilgan.
//
// Uchala joy ham (buyurtma yaratish, admin tahrirlash, skladchi tahrirlash)
// shu YAGONA ro'yxatni ishlatadi — kategoriya nomi kelajakda o'zgarsa, faqat
// shu faylni yangilash kifoya.
export type ComponentSlot = {
  key: string;
  label: string;
  categoryName: string | null;
  group: string;
};

// Guruhlar — faqat vizual bo'lish uchun (moslikka ta'sir qilmaydi), 18 ta
// bir xil qatorni tushunarli bo'laklarga ajratadi.
export const SLOT_GROUPS = {
  ASOSIY: "Tizim blok qismlari",
  XOTIRA: "Xotira",
  PERIFERIYA: 'Monitor va periferiya',
  QOSHIMCHA: "Qo'shimcha",
} as const;

export const COMPONENT_SLOTS: ComponentSlot[] = [
  { key: 'ona_plata', label: 'Ona plata', categoryName: 'Ona plata', group: SLOT_GROUPS.ASOSIY },
  { key: 'protsessor', label: 'Protsessor', categoryName: 'Protsessor', group: SLOT_GROUPS.ASOSIY },
  { key: 'kuller', label: 'Kuller', categoryName: 'Kuller', group: SLOT_GROUPS.ASOSIY },
  { key: 'video_karta', label: 'Video Karta', categoryName: 'Video karta', group: SLOT_GROUPS.ASOSIY },
  { key: 'keys', label: 'Keys (korpus)', categoryName: 'Keys', group: SLOT_GROUPS.ASOSIY },
  { key: 'blok_pitaniya', label: 'Blok pitaniya', categoryName: 'Blok pitaniya', group: SLOT_GROUPS.ASOSIY },
  { key: 'operativ_xotira', label: 'Operativ xotira', categoryName: 'Operativ xotira', group: SLOT_GROUPS.XOTIRA },
  { key: 'ssd_hdd_1', label: 'SSD & HDD #1', categoryName: 'SSD & HDD', group: SLOT_GROUPS.XOTIRA },
  { key: 'ssd_hdd_2', label: 'SSD & HDD #2', categoryName: 'SSD & HDD', group: SLOT_GROUPS.XOTIRA },
  { key: 'monitor', label: 'Monitor', categoryName: 'Monitor', group: SLOT_GROUPS.PERIFERIYA },
  { key: 'klaviatura', label: 'Klaviatura', categoryName: 'Klavitura', group: SLOT_GROUPS.PERIFERIYA },
  { key: 'sichqoncha', label: 'Sichqoncha', categoryName: 'Sichqoncha', group: SLOT_GROUPS.PERIFERIYA },
  { key: 'naushnik', label: 'Naushnik', categoryName: 'Naushnik', group: SLOT_GROUPS.PERIFERIYA },
  { key: 'kovrik', label: 'Kovrik', categoryName: 'Kovrik', group: SLOT_GROUPS.PERIFERIYA },
  { key: 'aksessuar_1', label: 'Aksessuarlar #1', categoryName: 'Aksessuarlar', group: SLOT_GROUPS.QOSHIMCHA },
  { key: 'aksessuar_2', label: 'Aksessuarlar #2', categoryName: 'Aksessuarlar', group: SLOT_GROUPS.QOSHIMCHA },
  { key: 'boshqa_1', label: 'Boshqa tovarlar #1', categoryName: null, group: SLOT_GROUPS.QOSHIMCHA },
  { key: 'boshqa_2', label: 'Boshqa tovarlar #2', categoryName: null, group: SLOT_GROUPS.QOSHIMCHA },
];

// Slotlarni guruhlarga bo'lib qaytaradi — UI'da bo'lim sarlavhalari chizish
// uchun (masalan "Tizim blok qismlari", "Xotira", ...).
export function groupedSlots(): { group: string; slots: ComponentSlot[] }[] {
  const groups: { group: string; slots: ComponentSlot[] }[] = [];
  for (const slot of COMPONENT_SLOTS) {
    const last = groups[groups.length - 1];
    if (last && last.group === slot.group) last.slots.push(slot);
    else groups.push({ group: slot.group, slots: [slot] });
  }
  return groups;
}

// Nomlangan (categoryName != null) slotlarning kategoriya nomlari to'plami —
// tahrirlash oynalarida "bu yozuv kanonik 16 kategoriyaning biriga kiradimi"
// tekshirish uchun (kirmasa, "Boshqa tovarlar"ga yoki ortiqcha qatorga tushadi).
export const NAMED_SLOT_CATEGORIES = new Set(
  COMPONENT_SLOTS.map(s => s.categoryName).filter((c): c is string => c !== null)
);

export type ExistingOrderItem = {
  id: string;
  category_name: string;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
};

export type SlotAssignment = ExistingOrderItem & { slotKey: string };

// Mavjud buyurtma tovarlarini (sales_order_items) kanonik slotlarga taqsimlaydi.
// Uchala tahrirlash joyi ham (sales/page.tsx edit rejimi, admin oynasi, skladchi
// sahifasi) shu bitta funksiyani ishlatadi — natija hech qachon farq qilmasin.
//
// Qoida: har bir nomlangan slot o'z categoryName'iga mos item'larni navbat
// bilan oladi (masalan 2 ta "SSD & HDD" itemi bo'lsa — biri ssd_hdd_1'ga,
// ikkinchisi ssd_hdd_2'ga). Kanonik 16 kategoriyaning birortasiga mos
// kelmagan (yoki mos kelib, lekin barcha shu turdagi slotlar band bo'lgan)
// item'lar avval "Boshqa tovarlar" slotlariga, ular ham to'lsa —
// `overflow` massiviga tushadi (bu holda UI qo'shimcha, dinamik qator
// chizishi kerak — hech narsa yo'qolib qolmasligi uchun).
export function mapItemsToSlots(items: ExistingOrderItem[]): {
  bySlotKey: Record<string, SlotAssignment>;
  overflow: ExistingOrderItem[];
} {
  const bySlotKey: Record<string, SlotAssignment> = {};
  const overflow: ExistingOrderItem[] = [];

  // slotKey -> shu categoryName'ga tegishli bo'sh slotlar navbati
  const slotsByCategory = new Map<string, string[]>();
  const boshqaSlotKeys: string[] = [];
  for (const slot of COMPONENT_SLOTS) {
    if (slot.categoryName === null) {
      boshqaSlotKeys.push(slot.key);
    } else {
      const arr = slotsByCategory.get(slot.categoryName) || [];
      arr.push(slot.key);
      slotsByCategory.set(slot.categoryName, arr);
    }
  }

  for (const item of items) {
    const queue = slotsByCategory.get(item.category_name);
    const freeSlotKey = queue?.find(k => !bySlotKey[k]);
    if (freeSlotKey) {
      bySlotKey[freeSlotKey] = { ...item, slotKey: freeSlotKey };
      continue;
    }
    const freeBoshqaKey = boshqaSlotKeys.find(k => !bySlotKey[k]);
    if (freeBoshqaKey) {
      bySlotKey[freeBoshqaKey] = { ...item, slotKey: freeBoshqaKey };
      continue;
    }
    overflow.push(item);
  }

  return { bySlotKey, overflow };
}
