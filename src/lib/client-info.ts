import { headers } from 'next/headers';
import { userAgent } from 'next/server';

export async function getClientInfo() {
  const headerList = await headers();
  const ua = userAgent({ headers: headerList });
  
  // Capturar IP (pode variar dependendo do ambiente/proxy)
  const forwardedFor = headerList.get('x-forwarded-for');
  const realIp = headerList.get('x-real-ip');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : realIp || 'unknown';

  return {
    ip,
    userAgent: ua.ua,
    browser: `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''}`.trim(),
    os: `${ua.os.name || 'Unknown'} ${ua.os.version || ''}`.trim(),
  };
}
