/**
 * Proxy connectivity test.
 * Usage: WEBSHARE_PROXY_URL=http://user:pass@host:port npx ts-node scripts/test-proxy.ts
 */
import { chromium } from 'playwright';

async function main() {
  const proxyUrl = process.env.WEBSHARE_PROXY_URL;
  if (!proxyUrl) {
    console.error('❌ WEBSHARE_PROXY_URL env var is not set.');
    console.error('   Example: WEBSHARE_PROXY_URL=http://user:pass@p.webshare.io:10000 npx ts-node scripts/test-proxy.ts');
    process.exit(1);
  }

  console.log(`🔌 Proxy: ${proxyUrl.replace(/:([^@]+)@/, ':***@')}`);

  // Check real IP without proxy first
  const realIpRes = await fetch('https://api.ipify.org?format=json');
  const { ip: realIp } = await realIpRes.json() as { ip: string };
  console.log(`🌐 Real IP (no proxy): ${realIp}`);

  // Check IP through proxy via Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ proxy: { server: proxyUrl } });
  const page = await context.newPage();

  try {
    await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body') ?? '{}';
    const { ip: proxyIp } = JSON.parse(body) as { ip: string };
    console.log(`🔒 Proxy IP:           ${proxyIp}`);

    if (realIp === proxyIp) {
      console.log('\n⚠️  IPs are the same — proxy may not be working correctly.');
    } else {
      console.log('\n✅ Proxy is working! IP changed successfully.');
    }
  } catch (e) {
    console.error('\n❌ Proxy connection failed:', (e as Error).message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
