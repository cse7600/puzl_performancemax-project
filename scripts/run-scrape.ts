/**
 * Standalone Naver Ad Scraper Script
 *
 * Usage (sub-agents / CLI):
 *   npx tsx scripts/run-scrape.ts "검색어"
 *   npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프" --save
 *   npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프" --save --output result.json
 *
 * Options:
 *   --save          Save results to Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
 *   --output <file> Also write results to a local JSON file
 *   --platform pc|mobile|both  (default: both)
 *   --no-redirect   Skip redirect resolution (faster, keeps tracking URLs)
 *
 * Output JSON structure:
 *   {
 *     query: string,
 *     monitoredAt: string (ISO 8601),
 *     pc: { count: number, ads: Ad[] },
 *     mobile: { count: number, ads: Ad[] }
 *   }
 *
 * Ad structure:
 *   {
 *     rank: number,
 *     advertiser: string,
 *     displayDomain: string,
 *     title: string,
 *     description: string,
 *     landingUrl: string,
 *     subLinks: [{ text: string, landingUrl: string }],
 *     images: [{ src: string, alt: string, landingUrl: string }]
 *   }
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local first, fallback to .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { scrapeNaverAds, detectRankChanges } from '../lib/scraper';
import { saveSnapshot, savePrevRankChanges, getPreviousSnapshot } from '../lib/supabase';

// ── CLI arg parsing ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/run-scrape.ts <query> [options]

Options:
  --save              Save results to Supabase
  --output <file>     Write results to local JSON file
  --platform <value>  pc | mobile | both (default: both)
  --no-redirect       Skip redirect resolution (faster)
  -h, --help          Show this help

Example:
  npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프"
  npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프" --save --output ./result.json
`);
  process.exit(0);
}

// First non-flag argument is the query
const query = args.find((a) => !a.startsWith('--')) || '두쫀쿠 카다이프';
const shouldSave = args.includes('--save');
const outputIdx = args.indexOf('--output');
const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
const platformArg = (() => {
  const idx = args.indexOf('--platform');
  return idx !== -1 ? args[idx + 1] : 'both';
})();
const skipRedirect = args.includes('--no-redirect');

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n[Naver Ad Scraper] Query: "${query}"`);
  console.log(`Platform: ${platformArg} | Save to Supabase: ${shouldSave} | Skip redirect: ${skipRedirect}`);
  console.log('─'.repeat(60));

  if (skipRedirect) {
    // Temporarily override env to signal scraper (not implemented in scraper itself,
    // but useful placeholder if scraper is extended)
    process.env.SKIP_REDIRECT = '1';
  }

  const result = await scrapeNaverAds(query);

  // ── Print summary ────────────────────────────────────────────────────────────
  console.log(`\nMonitored at: ${result.monitoredAt}`);

  if (platformArg !== 'mobile') {
    console.log(`\n[PC] ${result.pc.count} ads`);
    result.pc.ads.forEach((ad) => {
      console.log(`  #${ad.rank} ${ad.advertiser} (${ad.displayDomain})`);
      console.log(`     ${ad.title}`);
      console.log(`     ${ad.landingUrl}`);
    });
  }

  if (platformArg !== 'pc') {
    console.log(`\n[Mobile] ${result.mobile.count} ads`);
    result.mobile.ads.forEach((ad) => {
      console.log(`  #${ad.rank} ${ad.advertiser} (${ad.displayDomain})`);
      console.log(`     ${ad.title}`);
      console.log(`     ${ad.landingUrl}`);
    });
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────────
  if (shouldSave) {
    console.log('\n[Supabase] Saving snapshots...');
    try {
      for (const platform of ['pc', 'mobile'] as const) {
        if (platformArg !== 'both' && platformArg !== platform) continue;

        const ads = platform === 'pc' ? result.pc.ads : result.mobile.ads;
        const snapshotId = await saveSnapshot(query, platform, ads, result.monitoredAt);

        if (snapshotId) {
          console.log(`  [${platform.toUpperCase()}] Snapshot saved: ${snapshotId}`);

          const prevSnapshot = await getPreviousSnapshot(query, platform, result.monitoredAt);
          if (prevSnapshot) {
            const changes = detectRankChanges(prevSnapshot.ads, ads);
            const meaningful = changes.filter((c) => c.change_type !== 'same');
            await savePrevRankChanges(snapshotId, query, platform, changes, result.monitoredAt);
            console.log(`  [${platform.toUpperCase()}] ${meaningful.length} rank changes detected`);
          }
        }
      }
      console.log('[Supabase] Done.');
    } catch (err) {
      console.error('[Supabase] Error:', err);
    }
  }

  // ── Write to file ────────────────────────────────────────────────────────────
  if (outputFile) {
    const outPath = path.resolve(outputFile);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\n[Output] Written to: ${outPath}`);
  }

  console.log('\nDone.\n');
  return result;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
