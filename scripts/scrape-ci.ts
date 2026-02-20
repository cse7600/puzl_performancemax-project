/**
 * GitHub Actions scrape runner
 * Usage: KEYWORD="키워드" npx tsx scripts/scrape-ci.ts
 *   - KEYWORD env set: scrape that keyword only
 *   - KEYWORD empty:  scrape all monitor_keywords from Supabase
 */
import { createClient } from '@supabase/supabase-js';
import { scrapeNaverAds, detectRankChanges } from '../lib/scraper';
import { getNaverKeywordStats } from '../lib/naver-keyword';
import { getGoogleKeywordStats } from '../lib/google-keyword';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function getKeywords(): Promise<string[]> {
  const specific = process.env.KEYWORD?.trim();
  if (specific) return [specific];

  const { data, error } = await supabase
    .from('monitor_keywords')
    .select('keyword')
    .order('last_run_at', { ascending: true, nullsFirst: true });

  if (error) throw new Error(`Failed to fetch keywords: ${error.message}`);
  return (data ?? []).map((k: { keyword: string }) => k.keyword);
}

async function saveSnapshot(
  query: string,
  platform: string,
  ads: unknown[],
  monitoredAt: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ad_monitor_snapshots')
    .insert({ query, platform, ads, monitored_at: monitoredAt, ad_count: ads.length })
    .select('id')
    .single();
  if (error) { console.error('[DB] saveSnapshot:', error.message); return null; }
  return data.id as string;
}

async function getPreviousSnapshot(query: string, platform: string, currentAt: string) {
  const { data } = await supabase
    .from('ad_monitor_snapshots')
    .select('ads, monitored_at')
    .eq('query', query)
    .eq('platform', platform)
    .lt('monitored_at', currentAt)
    .order('monitored_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function saveRankChanges(
  snapshotId: string,
  query: string,
  platform: string,
  changes: ReturnType<typeof detectRankChanges>,
  monitoredAt: string,
) {
  if (!changes.length) return;
  const rows = changes.map((c) => ({
    snapshot_id: snapshotId,
    query,
    platform,
    monitored_at: monitoredAt,
    advertiser: c.advertiser,
    prev_rank: c.prev_rank,
    curr_rank: c.curr_rank,
    change_type: c.change_type,
  }));
  const { error } = await supabase.from('ad_rank_changes').insert(rows);
  if (error) console.error('[DB] saveRankChanges:', error.message);
}

async function saveKeywordVolume(query: string) {
  const [naverStats, googleMap] = await Promise.all([
    getNaverKeywordStats([query]),
    getGoogleKeywordStats([query]),
  ]);

  for (const stat of naverStats) {
    const google = googleMap.get(stat.keyword);
    const { error } = await supabase.from('keyword_search_volumes').upsert(
      {
        keyword: stat.keyword,
        pc_volume: stat.pcVolume,
        mobile_volume: stat.mobileVolume,
        total_volume: stat.totalVolume,
        google_volume: google?.googleVolume ?? null,
        google_competition: google?.googleCompetition ?? null,
        competition: stat.competition,
        avg_depth: stat.avgDepth,
        pc_ctr: stat.pcAvgCtr,
        mobile_ctr: stat.mobileAvgCtr,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'keyword' },
    );
    if (error) console.error('[DB] upsertVolume:', error.message);
  }
}

async function processKeyword(query: string) {
  console.log(`\n▶ Scraping: ${query}`);
  const result = await scrapeNaverAds(query);

  const [pcId, mobileId] = await Promise.all([
    saveSnapshot(query, 'pc', result.pc.ads, result.monitoredAt),
    saveSnapshot(query, 'mobile', result.mobile.ads, result.monitoredAt),
  ]);

  const [prevPc, prevMobile] = await Promise.all([
    getPreviousSnapshot(query, 'pc', result.monitoredAt),
    getPreviousSnapshot(query, 'mobile', result.monitoredAt),
  ]);

  if (pcId && prevPc) {
    const changes = detectRankChanges(prevPc.ads as Parameters<typeof detectRankChanges>[0], result.pc.ads);
    await saveRankChanges(pcId, query, 'pc', changes, result.monitoredAt);
  }
  if (mobileId && prevMobile) {
    const changes = detectRankChanges(prevMobile.ads as Parameters<typeof detectRankChanges>[0], result.mobile.ads);
    await saveRankChanges(mobileId, query, 'mobile', changes, result.monitoredAt);
  }

  // Update last_run_at
  await supabase.from('monitor_keywords').update({ last_run_at: result.monitoredAt }).eq('keyword', query);

  // Keyword search volume (non-blocking error)
  try {
    await saveKeywordVolume(query);
  } catch (err) {
    console.error('[Volume] Failed:', err);
  }

  console.log(`✓ Done: ${query} — PC ${result.pc.count}개, Mobile ${result.mobile.count}개`);
}

async function main() {
  const keywords = await getKeywords();
  if (!keywords.length) {
    console.log('No keywords to process.');
    return;
  }
  console.log(`Keywords: ${keywords.join(', ')}`);

  for (const kw of keywords) {
    try {
      await processKeyword(kw);
    } catch (err) {
      console.error(`[Error] ${kw}:`, err);
    }
  }

  console.log('\n✅ Scrape CI complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
