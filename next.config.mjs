/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Next.js'e projeyi statik derlemesini söyler
  basePath: '/dmx-web-remote', // GitHub reponun tam adı (Baştaki slash önemli)
  assetPrefix: '/dmx-web-remote/', // Sonundaki slash önemli
  images: {
    unoptimized: true, // Statik export için resim optimizasyonunu kapatır
  },
};

export default nextConfig;