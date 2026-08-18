/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Krayin CRM'ning "Avans/Buyurtma qabul qilindi" bosqich-modalida
        // iframe sifatida ochilishi uchun ruxsat — faqat shu tor yo'lga,
        // qolgan ERP sahifalari hech qanday saytga freym qilib ochilmaydi.
        source: '/sales/embed',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://texnocrm.duckdns.org",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
