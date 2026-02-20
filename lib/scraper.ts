import { Ad, RankChange, ScrapeResult } from './types';

const NAVER_SEARCH_URL = 'https://search.naver.com/search.naver';
const BADGE_WORDS = [
  '네이버 로그인', 'Naver Pay', '네이버 아이디', '네이버페이', '서비스 보기',
  '네이버 톡톡', '네이버 예약', '네이버 지도', '플레이스', '전화 연결', '지도보기',
];

async function getBrowser() {
  // Vercel serverless: use @sparticuz/chromium-min + playwright-core
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    const { chromium: playwrightChromium } = await import('playwright-core');
    let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    let args: string[] = [];
    if (!executablePath) {
      const chromiumModule = (await import('@sparticuz/chromium-min')).default;
      args = chromiumModule.args;
      executablePath = await chromiumModule.executablePath(
        process.env.CHROMIUM_PACK_URL ||
          'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      );
    }
    return playwrightChromium.launch({ executablePath, args, headless: true });
  }
  // Local dev: use bundled playwright chromium
  const { chromium } = await import('playwright');
  return chromium.launch({ headless: true });
}

async function followRedirects(
  context: Awaited<ReturnType<typeof getBrowser>> extends infer B
    ? B extends { newContext(): Promise<infer C> }
      ? C
      : never
    : never,
  urlMap: Record<string, string>
): Promise<Record<string, string>> {
  const entries = Object.entries(urlMap).filter(([, v]) => v);
  const results: Record<string, string> = {};
  const CONCURRENCY = 4;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ([key, trackingUrl]) => {
        let p;
        try {
          p = await context.newPage();
          await p.goto(trackingUrl, { waitUntil: 'commit', timeout: 7000 });
          results[key] = p.url();
        } catch {
          results[key] = trackingUrl; // fallback: keep original
        } finally {
          await p?.close();
        }
      })
    );
  }
  return results;
}

async function extractRawAds(page: { evaluate: (fn: () => Ad[]) => Promise<Ad[]> }): Promise<Ad[]> {
  return await (page as any).evaluate(() => {
    const BADGE = [
      '네이버 로그인', 'Naver Pay', '네이버 아이디', '네이버페이', '서비스 보기',
      '네이버 톡톡', '네이버 예약', '네이버 지도', '플레이스', '전화 연결', '지도보기',
    ];

    // Select only top-level PowerLink ad items:
    // - Must have ader.naver.com tracking link (confirms it's a paid ad)
    // - Parent must be lst_type (PowerLink container), NOT lst_link (sub-link container)
    // - Must have enough text content to be a real ad
    const adLis = Array.from(document.querySelectorAll('li')).filter(li => {
      if (!li.querySelector('a[href*="ader.naver.com"]')) return false;
      const parentCls = li.parentElement?.className ?? '';
      if (parentCls.includes('lst_link')) return false;
      return (li as HTMLElement).innerText.trim().length >= 50;
    });

    if (adLis.length === 0) return [];

    const ads: any[] = [];
    let rank = 0;

    adLis.forEach((li: Element) => {
      const fullText = (li as HTMLElement).innerText.trim();
      rank++;

      const adAnchors = Array.from(li.querySelectorAll('a[href*="ader.naver.com"]')) as HTMLAnchorElement[];

      const lines = fullText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      let idx = 0;
      while (idx < lines.length && BADGE.some((b) => lines[idx].includes(b))) idx++;

      const advertiser = lines[idx++] || '';
      const displayDomain = (lines[idx] || '').includes('.') ? lines[idx++] : '';
      const title = lines[idx++] || '';
      let description = '';
      if (idx < lines.length && lines[idx].length > 15) description = lines[idx++];

      const subLinkCandidates = lines.slice(idx).filter(
        (l: string) => l.length < 25 && !BADGE.some((b) => l.includes(b))
      );

      let mainTrackingUrl = '';
      for (const a of adAnchors) {
        const t = (a as HTMLAnchorElement).innerText.trim();
        if (t === title || t === advertiser || t === displayDomain) {
          mainTrackingUrl = a.href;
          break;
        }
      }
      if (!mainTrackingUrl) {
        const fallback = adAnchors.find(
          (a) => (a as HTMLAnchorElement).innerText.trim().length > 2 && !BADGE.some((b) => (a as HTMLAnchorElement).innerText.includes(b))
        );
        if (fallback) mainTrackingUrl = fallback.href;
      }

      const subLinks: any[] = [];
      const seen = new Set([title, advertiser, displayDomain, description]);
      adAnchors.forEach((a) => {
        const t = (a as HTMLAnchorElement).innerText.trim();
        if (!t || seen.has(t)) return;
        if (subLinkCandidates.includes(t) && !BADGE.some((b) => t.includes(b))) {
          seen.add(t);
          subLinks.push({ text: t, trackingUrl: a.href });
        }
      });

      const images: any[] = [];
      li.querySelectorAll('img[src]').forEach((img: Element) => {
        const parentA = img.closest('a[href*="ader.naver.com"]') as HTMLAnchorElement | null;
        images.push({ src: (img as HTMLImageElement).src, alt: (img as HTMLImageElement).alt || '', trackingUrl: parentA?.href || '' });
      });

      ads.push({ rank, advertiser, displayDomain, title, description, mainTrackingUrl, subLinks, images });
    });

    return ads;
  });
}

async function resolveAds(rawAds: any[], context: any): Promise<Ad[]> {
  const urlMap: Record<string, string> = {};
  rawAds.forEach((ad, i) => {
    if (ad.mainTrackingUrl) urlMap[`ad_${i}_main`] = ad.mainTrackingUrl;
    ad.subLinks.forEach((s: any, j: number) => { if (s.trackingUrl) urlMap[`ad_${i}_sub_${j}`] = s.trackingUrl; });
    ad.images.forEach((img: any, j: number) => { if (img.trackingUrl) urlMap[`ad_${i}_img_${j}`] = img.trackingUrl; });
  });

  const resolved = await followRedirects(context, urlMap);

  return rawAds.map((ad, i) => ({
    rank: ad.rank,
    advertiser: ad.advertiser,
    displayDomain: ad.displayDomain,
    title: ad.title,
    description: ad.description,
    landingUrl: resolved[`ad_${i}_main`] || ad.mainTrackingUrl,
    subLinks: ad.subLinks.map((s: any, j: number) => ({
      text: s.text,
      landingUrl: resolved[`ad_${i}_sub_${j}`] || s.trackingUrl,
    })),
    images: ad.images.map((img: any, j: number) => ({
      src: img.src,
      alt: img.alt,
      landingUrl: resolved[`ad_${i}_img_${j}`] || img.trackingUrl,
    })),
  }));
}

export async function scrapeNaverAds(query: string): Promise<ScrapeResult> {
  const monitoredAt = new Date().toISOString();
  const searchUrl = `${NAVER_SEARCH_URL}?where=nexearch&ie=utf8&query=${encodeURIComponent(query)}`;

  const browser = await getBrowser();
  try {
    // PC
    const pcContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pcPage = await pcContext.newPage();
    await pcPage.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await pcPage.waitForTimeout(1500);
    const pcRaw = await extractRawAds(pcPage as any);
    const pcAds = await resolveAds(pcRaw, pcContext);
    await pcContext.close();

    // Mobile
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mobilePage.waitForTimeout(2500);
    const mobileRaw = await extractRawAds(mobilePage as any);
    const mobileAds = await resolveAds(mobileRaw, mobileContext);
    await mobileContext.close();

    return {
      query,
      monitoredAt,
      pc: { count: pcAds.length, ads: pcAds },
      mobile: { count: mobileAds.length, ads: mobileAds },
    };
  } finally {
    await browser.close();
  }
}

export function detectRankChanges(prevAds: Ad[], currAds: Ad[]): RankChange[] {
  const changes: RankChange[] = [];
  const prevMap = new Map(prevAds.map((a) => [a.advertiser, a.rank]));
  const currMap = new Map(currAds.map((a) => [a.advertiser, a.rank]));

  // 현재 광고 분석
  currAds.forEach((ad) => {
    const prev = prevMap.get(ad.advertiser);
    if (prev === undefined) {
      changes.push({ advertiser: ad.advertiser, prev_rank: null, curr_rank: ad.rank, change_type: 'new' });
    } else if (ad.rank < prev) {
      changes.push({ advertiser: ad.advertiser, prev_rank: prev, curr_rank: ad.rank, change_type: 'up' });
    } else if (ad.rank > prev) {
      changes.push({ advertiser: ad.advertiser, prev_rank: prev, curr_rank: ad.rank, change_type: 'down' });
    } else {
      changes.push({ advertiser: ad.advertiser, prev_rank: prev, curr_rank: ad.rank, change_type: 'same' });
    }
  });

  // 사라진 광고
  prevAds.forEach((ad) => {
    if (!currMap.has(ad.advertiser)) {
      changes.push({ advertiser: ad.advertiser, prev_rank: ad.rank, curr_rank: null, change_type: 'removed' });
    }
  });

  return changes;
}
