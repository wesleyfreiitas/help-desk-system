import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: ['*'] // Permite que server actions sejam chamadas mesmo quando embedado em outros domínios
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Permite que o site seja embedado em iframes
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;", // Permite que qualquer site o incorpore (ajustar para domínios específicos no futuro se necessário)
          },
        ],
      },
    ];
  },
};

export default nextConfig;
