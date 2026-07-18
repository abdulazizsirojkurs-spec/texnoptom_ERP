# Texno Optom — Narxlar ro'yxati (PRAYS-LIST)

> Bu fayl konfiguratorning **yagona haqiqat manbai**. Skill faqat shu yerdagi
> komponentlar va narxlarni ishlatadi. Narx o'zgarsa — shu faylni tahrirlang,
> bot avtomatik yangi narxni oladi. Kodga tegish shart emas.

## Global sozlamalar

- **Valyuta:** USD (dollar). Barcha narxlar va mijozga chiqadigan xabar dollarda.
- **MARJA (foyda):** 90  ← har bir yig'ilmaga TEKIS $90 qo'shiladi. Jadvaldagi narxlar
  TANNARX. Mijozga ko'rsatiladigan narx = komponentlar tannarxi yig'indisi + 90.
  Marja mijozga KO'RSATILMAYDI (yashirin) — faqat yakuniy narx ko'rinadi.
  Foyda o'zgarsa shu raqamni yangila. Skidka avtomatik yo'q — operator o'zi belgilaydi.
- **Byudjet ma'nosi:** mijoz aytgan byudjet = mijoz TO'LAYDIGAN yakuniy narx
  (marja ichida). Ya'ni komponentlar tannarxi ≈ (byudjet − $90). Uch variantning
  YAKUNIY narxi byudjet atrofida bo'lsin: biri ~$20–40 past, biri byudjetga teng,
  biri ~$40–60 yuqori. Byudjetdan uzoq (masalan +$200) chiqib ketma.
- **KURS (1 USD = ... so'm):** 12600  ← mijoz so'mda gapirsa shu kurs bilan byudjetni tushun.
  Xabarda so'm KO'RSATILMAYDI — faqat dollar. Kurs o'zgarsa shu raqamni yangila.
- **NASIYA_12OY (12 oylik ustama koeffitsienti):** 1.46  ← Uzum nasiya 12 oy (46%). 04_NASIYA.md formulasi shu yerdan oladi.
- **NASIYA_6OY (6 oylik ustama koeffitsienti):** 1.32  ← Uzum nasiya 6 oy (32%). 04_NASIYA.md formulasi shu yerdan oladi.
- **Windows + drayverlar:** HAR BIR yig'ilmaga BEPUL kiritilgan (narxga kirgan). Alohida qator qilma, lekin xabarda eslat.
- **Yig'ish/ishchi haqi:** narxlarga kirgan deb hisobla (alohida qo'shma).


## Protsessorlar (CPU)

| Nomi | Narx $ | Platforma | Socket | TDP (W) |
|---|---|---|---|---|
| Intel Core i5-4460 | 17 | Intel | LGA1150 | 84 |
| Intel Core i7-4770 | 45 | Intel | LGA1150 | 84 |
| Intel Core i3-10100F | 49 | Intel | LGA1200 | 65 |
| AMD Ryzen 5 5500 | 90 | AMD | AM4 | 65 |
| Intel Core i3-12100F | 97 | Intel | LGA1700 | 65 |
| Intel Core i3-14100F | 106 | Intel | LGA1700 | 65 |
| AMD Ryzen 5 7500F | 110 | AMD | AM5 | 65 |
| Intel Core i5-12400F | 126 | Intel | LGA1700 | 65 |
| AMD Ryzen 5 5600 | 129 | AMD | AM4 | 65 |
| Intel Core Ultra 5-225F | 132 | Intel | LGA1851 | 65 |
| AMD Ryzen 5 5600X | 135 | AMD | AM4 | 105 |
| Intel Core i5-13400F | 137 | Intel | LGA1700 | 65 |
| Intel Core i5-14400F | 140 | Intel | LGA1700 | 65 |
| AMD Ryzen 7 5700X | 145 | AMD | AM4 | 105 |
| AMD Ryzen 5 7600X | 165 | AMD | AM5 | 105 |
| AMD Ryzen 5 9600X | 168 | AMD | AM5 | 105 |
| Intel Core Ultra 5-245KF | 172 | Intel | LGA1851 | 65 |
| AMD Ryzen 7 9700X | 225 | AMD | AM5 | 65 |
| AMD Ryzen 7 7700X | 233 | AMD | AM5 | 105 |
| Intel Core i5-14600KF | 236 | Intel | LGA1700 | 125 |
| Intel Core i5-14600K | 237 | Intel | LGA1700 | 125 |
| Intel Core Ultra 7-265KF | 260 | Intel | LGA1851 | 65 |
| Intel Core i7-14700F | 272 | Intel | LGA1700 | 65 |
| Intel Core i7-13700F | 283 | Intel | LGA1700 | 65 |
| AMD Ryzen 7 7800X3D | 290 | AMD | AM5 | 120 |
| Intel Core i7-14700KF | 317 | Intel | LGA1700 | 125 |
| AMD Ryzen 9 9900X | 360 | AMD | AM5 | 170 |
| AMD Ryzen 7 9800X3D | 395 | AMD | AM5 | 120 |
| Intel Core i9-14900KF | 430 | Intel | LGA1700 | 125 |
| AMD Ryzen 9 9950X3D | 630 | AMD | AM5 | 170 |

## Motherboardlar

_Socket CPU bilan, DDR turi RAM bilan MOS bo'lishi shart._

| Nomi | Narx $ | Socket | DDR | Forma |
|---|---|---|---|---|
| OEM H81 DDR3 | 22 | LGA1150 | DDR3 | mATX |
| H510 DDR4 | 45 | LGA1200 | DDR4 | mATX |
| Gigabyte H610M K DDR4 | 56 | LGA1700 | DDR4 | mATX |
| MSI B450M-A PRO MAX II DDR4 | 65 | AM4 | DDR4 | mATX |
| MSI PRO B760M-E DDR4 | 73 | LGA1700 | DDR4 | mATX |
| MSI PRO B840M-B DDR5 | 95 | LGA1851 | DDR5 | mATX |
| MSI PRO B760M-P DDR5 | 98 | LGA1700 | DDR5 | mATX |
| MSI PRO B650M-P DDR5 | 110 | AM5 | DDR5 | mATX |
| Gigabyte B850M FORCE DDR5 | 150 | AM5 | DDR5 | mATX |
| Gigabyte B860M GAMING WIFI6 DDR5 | 175 | LGA1851 | DDR5 | mATX |
| Gigabyte Z790D DDR5 | 180 | LGA1700 | DDR5 | ATX |
| MSI MAG B850 TOMAHAWK MAX WIFI DDR5 | 265 | AM5 | DDR5 | ATX |

## Operativ xotira (RAM)

_DDR turi motherboard bilan mos bo'lishi shart._

| Nomi | Narx $ | DDR | Hajm (GB) |
|---|---|---|---|
| Kingston DDR3 8GB 1600MHz | 18 | DDR3 | 8 |
| Kingston DDR4 8GB 3200MHz | 48 | DDR4 | 8 |
| Kingston DDR5 8GB 5600MHz | 85 | DDR5 | 8 |
| Kingston DDR4 16GB 3200MHz | 88 | DDR4 | 16 |
| Kingston DDR4 16GB (8x2) 3200MHz RGB | 138 | DDR4 | 16 |
| Kingston DDR5 16GB 5600MHz | 160 | DDR5 | 16 |
| Kingston DDR4 32GB 3600MHz RGB | 190 | DDR4 | 32 |
| Teamgroup DDR5 32GB (16x2) 5600MHz RGB | 368 | DDR5 | 32 |

## Videokartalar (GPU)

_length = uzunligi (mm), korpus maxGpu dan oshmasin. TDP blok pitaniya hisobida kerak._

| Nomi | Narx $ | TDP (W) | Uzunlik (mm) |
|---|---|---|---|
| Axle GT730 4GB DDR3 | 45 | 30 | 170 |
| Axle RX550 4GB GDDR5 | 74 | 50 | 170 |
| Peladin RX580 8GB | 112 | 185 | 240 |
| Peladin GTX1650 4GB | 140 | 75 | 220 |
| Peladin GTX1660 Super 6GB | 160 | 125 | 230 |
| Peladin RTX3050 8GB | 185 | 130 | 230 |
| Peladin RTX2060 Super 8GB | 220 | 175 | 240 |
| MSI RTX3050 VENTUS 2X 8GB | 220 | 130 | 230 |
| Sapphire RX7600 8GB PULSE | 265 | 165 | 270 |
| Peladin RTX5050 8GB | 290 | 130 | 240 |
| Peladin RTX3060 12GB | 305 | 170 | 250 |
| Gigabyte RTX5050 WINDFORCE OC 8GB | 315 | 90 | 200 |
| Peladin RTX5060 8GB | 345 | 145 | 250 |
| Peladin RTX3070 8GB | 350 | 220 | 285 |
| MSI RTX5060 SHADOW 2X 8GB | 350 | 145 | 250 |
| Zotac RTX5060 TWIN EDGE 8GB | 350 | 145 | 250 |
| ASUS RTX5060 DUAL OC 8GB | 370 | 150 | 240 |
| Gigabyte RX9060XT GAMING OC 8GB | 380 | 150 | 230 |
| Inno3D RTX5060Ti TWIN X2 8GB | 410 | 180 | 285 |
| MSI RTX5060Ti VENTUS 2X OC 8GB | 450 | 180 | 285 |
| Sapphire RX7700XT 12GB PULSE | 480 | 245 | 285 |
| Gigabyte RX9060XT GAMING OC 16GB | 490 | 160 | 280 |
| Inno3D RTX5060Ti 16GB TWIN X2 | 550 | 180 | 285 |
| MSI RTX5070 SHADOW 2X OC 12GB | 630 | 250 | 300 |
| ASUS RTX5070 DUAL OC 12GB | 700 | 250 | 300 |
| MSI RTX5070Ti VENTUS 3X OC 16GB | 1000 | 300 | 305 |
| Palit RTX5080 GAMINGPRO 16GB | 1250 | 360 | 320 |

## SSD / Xotira

| Nomi | Narx $ | Hajm (GB) |
|---|---|---|
| SSD 128Gb SATA | 26 | 128 |
| SSD 256Gb SATA | 36 | 256 |
| SSD NVMe 256Gb | 45 | 256 |
| SSD 512Gb SATA | 55 | 512 |
| SSD NVMe 512Gb | 58 | 512 |
| Lexar 500GB NVMe LNM610 | 70 | 500 |
| SSD NVMe 1Tb | 110 | 1000 |
| SSD 1Tb SATA | 120 | 1000 |
| Lexar 1TB NVMe NM610 | 124 | 1000 |
| Kingston 1TB NVMe NV3 | 133 | 1000 |
| Lexar 2TB NVMe LNM610 | 200 | 2000 |
| Samsung 1TB NVMe 990 PRO | 210 | 1000 |
| Samsung 2TB NVMe 990 EVO Plus | 270 | 2000 |

## Blok pitaniya (PSU)

_Quvvat (CPU TDP + GPU TDP) dan yetarlicha zapas bilan yuqori bo'lsin. Bu yerda tejamang._

| Nomi | Narx $ | Quvvat (W) |
|---|---|---|
| Xpower 550w 80+ | 25 | 550 |
| Grin KP 600W 80+ | 30 | 600 |
| Deepcool PF650 650W 80+ | 39 | 650 |
| Deepcool PF750 750W 80+ | 44 | 750 |
| Thermalright TR-TB650S | 50 | 500 |
| Deepcool PK650D 650W Bronze | 52 | 650 |
| Thermalright TR-TB750S | 55 | 500 |
| Thermalright TR-KG650 | 60 | 500 |
| Thermalright TR-TB850S | 65 | 500 |
| Thermalright TR-KG750 | 70 | 500 |
| Thermalright TR-KG750W | 75 | 750 |
| Deepcool PN750D 750W Gold | 76 | 750 |
| Deepcool PQ850G 850W Gold | 88 | 850 |
| Deepcool PN1000D 1000W Gold | 100 | 1000 |

## Kulerlar

_Hamma kuler barcha socketni qo'llaydi (AM4/AM5/LGA1150/1200/1700/1851). Kuchli CPU (TDP≥125W yoki X3D) uchun oddiy eng arzon stok emas, munosib kuler._

| Nomi | Narx $ |
|---|---|
| Jungle C20 Pro | 5 |
| Grin C40 Pro | 7 |
| Deepcool AK400 | 22 |
| Thermalright Assasin X 120 R Digital ARGB BK | 22 |
| Thermalright Assasin X 120 R Digital ARGB WH | 22 |
| Deepcool AG620 G2 | 32 |
| Thermalright Peerless Assasin 120 SE ARGB BK | 40 |
| Thermalright Peerless Assasin 120 SE ARGB WH | 40 |
| Thermalright Frozen Infinity 360 ARGB BK (oem) | 55 |
| Thermalright Aqua Elite 360 ARGB v3 BK (oem) | 55 |
| Thermalright Peerless Assasin 120 VISION ARGB BK | 55 |
| Thermalright Burst Assasin 120 Vision BK | 55 |
| Thermalright Burst Assasin 120 Vision WH | 55 |
| Deepcool LE360 V2 (suvli) | 58 |
| Thermalright Aqua Elite 360 ARGB v3 WH (oem) | 60 |
| Thermalright Phantom Spirit 120 EVO BK | 60 |
| Thermalright Frozen Notte 360 ARGB BK | 65 |
| Thermalright Frozen Notte 360 ARGB WH | 65 |
| Thermalright Phantom Spirit 120 DIGITAL EVO BK | 65 |
| Thermalright Peerless Assasin 120 DIGITAL ARGB BK | 65 |
| Thermalright Frozen Prism 360 ARGB BK | 70 |
| Thermalright Frozen Prism 360 ARGB WH | 70 |
| Thermalright Peerless Assasin 120 DIGITAL ARGB WH | 70 |
| Thermalright Frozen Horizon 360 DIGITAL ARGB BK | 75 |
| Thermalright Frozen Horizon 360 DIGITAL ARGB WH | 75 |
| Thermalright Peerless Assasin 140 DIGITAL BK | 75 |
| Thermalright Frozen Warframe 360 ARGB BK (oem) | 80 |
| Thermalright Peerless Assasin 140 DIGITAL WH | 80 |
| Thermalright Frozen Warframe 360 ARGB WH (oem) | 85 |
| Thermalright Frozen Warframe 360 RB ARGB BK | 95 |
| Thermalright Frozen Warframe 360 BW ARGB WH | 95 |

## Korpuslar

_maxGpu = eng uzun videokarta (mm). Hammasi ATX/mATX/ITX ni qo'llaydi._

| Nomi | Narx $ | maxGpu (mm) |
|---|---|---|
| Xtech X08 Aquarium | 27 | 380 |
| MYPRO MG13TG Black | 28 | 380 |
| Xtech Fan4 Case | 28 | 380 |
| MYPRO Nova Lite White | 30 | 380 |
| MYPRO Aura Pro White | 36 | 380 |
| MYPRO Aura Pro Black | 36 | 380 |
| Gigabyte C102G/C103G M-ATX | 40 | 380 |
| MSI MAG FORGE M100R | 43 | 380 |
| Xtech X09 Aquarium | 49 | 380 |
| Gigabyte GB-C201 Panoramic | 58 | 380 |
| MSI MAG PANO M100R PZ | 70 | 380 |
| Montech SKY TWO | 86 | 380 |

## Monitorlar (mijoz so'rasa)

| Nomi | Narx $ | O'lcham | Hz |
|---|---|---|---|
| Ziffler 24" 144Hz Black | 65 | 24" | 144 |
| Ziffler 24" 144Hz White | 65 | 24" | 144 |
| Ziffler 27" 120Hz IPS | 83 | 27" | 120 |
| MSI PRO MP272L Flat 100Hz 27" | 103 | 27" | 100 |
| Everel Monitor 27" 200Hz | 110 | 27" | 200 |
| MSI 27" G274F Flat FHD 180Hz | 129 | 27" | 180 |
| MSI 27" MD271 Series FHD 75Hz | 139 | 27" | 75 |
| Ziffler 27" 300Hz RGB Gaming | 140 | 27" | 300 |
| Lenovo Legion 25" 320Hz | 145 | 25" | 320 |
| MSI MAG 25" 300Hz | 145 | 25" | 300 |
| MSI MAG 27" QF 20e 2K Flat 200Hz | 170 | 27" | 200 |
| AOC 27" 300Hz Curved | 180 | 27" | 300 |
| MSI MAG 276QE27 Flat 275Hz 2K QHD | 199 | 27" | 275 |
| HKC G25H5 FHD Fast IPS 400Hz | 240 | 25" | 400 |
| Redmi G34WQ 2026 (C34WQDA-RG) Curved | 253 | 34" | 165 |
| AOC 25" FullHD Fast IPS 420Hz | 270 | 25" | 420 |

## Periferiya (klaviatura / sichqoncha / quloqchin)

_HOZIRCHA BO'SH — narxlaringizni shu yerga qo'shing. To'ldirilmaguncha skill bularni
taklif qilmaydi, faqat "alohida so'rasangiz narx aytamiz" deb eslatadi._

| Nomi | Narx $ | Turi |
|---|---|---|
| (misol) Klaviatura mexanik RGB | 25 | klaviatura |
| (misol) Gaming sichqoncha | 15 | sichqoncha |
| (misol) Quloqchin | 20 | quloqchin |
