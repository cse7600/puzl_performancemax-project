import { createClient } from '@supabase/supabase-js';
import { Ad, AdSnapshot, RankChange, MonitorKeyword, KeywordSearchVolume } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveSnapshot(
  query: string,
  platform: 'pc' | 'mobile',
  ads: Ad[],
  monitoredAt: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ad_monitor_snapshots')
    .insert({
      query,
      platform,
      monitored_at: monitoredAt,
      ads,
      ad_count: ads.length,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save snapshot:', error);
    return null;
  }
  return data.id;
}

export async function savePrevRankChanges(
  snapshotId: string,
  query: string,
  platform: 'pc' | 'mobile',
  changes: RankChange[],
  detectedAt: string
) {
  if (changes.length === 0) return;
  const rows = changes.map((c) => ({
    query,
    platform,
    advertiser: c.advertiser,
    prev_rank: c.prev_rank,
    curr_rank: c.curr_rank,
    change_type: c.change_type,
    snapshot_id: snapshotId,
    detected_at: detectedAt,
  }));
  const { error } = await supabase.from('ad_monitor_rank_changes').insert(rows);
  if (error) console.error('Failed to save rank changes:', error);
}

export async function getLatestSnapshots(query: string): Promise<{
  pc: AdSnapshot | null;
  mobile: AdSnapshot | null;
}> {
  const [pcRes, mobileRes] = await Promise.all([
    supabase
      .from('ad_monitor_snapshots')
      .select('*')
      .eq('query', query)
      .eq('platform', 'pc')
      .order('monitored_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('ad_monitor_snapshots')
      .select('*')
      .eq('query', query)
      .eq('platform', 'mobile')
      .order('monitored_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    pc: pcRes.data ?? null,
    mobile: mobileRes.data ?? null,
  };
}

export async function getSnapshotHistory(
  query: string,
  platform: 'pc' | 'mobile',
  limit = 20
): Promise<AdSnapshot[]> {
  const { data } = await supabase
    .from('ad_monitor_snapshots')
    .select('*')
    .eq('query', query)
    .eq('platform', platform)
    .order('monitored_at', { ascending: false })
    .limit(limit);

  return (data as AdSnapshot[]) ?? [];
}

export async function getPreviousSnapshot(
  query: string,
  platform: 'pc' | 'mobile',
  beforeTime: string
): Promise<AdSnapshot | null> {
  const { data } = await supabase
    .from('ad_monitor_snapshots')
    .select('*')
    .eq('query', query)
    .eq('platform', platform)
    .lt('monitored_at', beforeTime)
    .order('monitored_at', { ascending: false })
    .limit(1)
    .single();

  return data ?? null;
}

// ── Keyword management ──────────────────────────────────────────────────────

export async function getKeywords(): Promise<MonitorKeyword[]> {
  const { data } = await supabase
    .from('monitor_keywords')
    .select('*')
    .order('created_at', { ascending: true });
  return (data as MonitorKeyword[]) ?? [];
}

export async function addKeyword(
  keyword: string,
  interval_hours: MonitorKeyword['interval_hours']
): Promise<MonitorKeyword | null> {
  const { data, error } = await supabase
    .from('monitor_keywords')
    .insert({ keyword, interval_hours })
    .select()
    .single();
  if (error) {
    console.error('Failed to add keyword:', error);
    return null;
  }
  return data as MonitorKeyword;
}

export async function updateKeyword(
  id: string,
  updates: Partial<Pick<MonitorKeyword, 'enabled' | 'interval_hours'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('monitor_keywords')
    .update(updates)
    .eq('id', id);
  if (error) { console.error('Failed to update keyword:', error); return false; }
  return true;
}

export async function deleteKeyword(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('monitor_keywords')
    .delete()
    .eq('id', id);
  if (error) { console.error('Failed to delete keyword:', error); return false; }
  return true;
}

export async function updateKeywordLastRun(id: string, lastRunAt: string): Promise<void> {
  await supabase
    .from('monitor_keywords')
    .update({ last_run_at: lastRunAt })
    .eq('id', id);
}

export async function getDueKeywords(): Promise<MonitorKeyword[]> {
  const { data } = await supabase
    .from('monitor_keywords')
    .select('*')
    .eq('enabled', true)
    .or(
      'last_run_at.is.null,' +
      `last_run_at.lte.${new Date(Date.now() - 60 * 60 * 1000).toISOString()}`
    )
    .order('last_run_at', { ascending: true, nullsFirst: true });

  if (!data) return [];

  const now = Date.now();
  return (data as MonitorKeyword[]).filter((kw) => {
    if (!kw.last_run_at) return true;
    const elapsed = (now - new Date(kw.last_run_at).getTime()) / (1000 * 60 * 60);
    return elapsed >= kw.interval_hours;
  });
}

// ── Keyword search volumes ──────────────────────────────────────────────────

export async function upsertKeywordSearchVolume(
  data: Omit<KeywordSearchVolume, 'id' | 'fetched_at'>
): Promise<void> {
  const { error } = await supabase
    .from('keyword_search_volumes')
    .upsert(
      { ...data, fetched_at: new Date().toISOString() },
      { onConflict: 'keyword' }
    );
  if (error) console.error('Failed to upsert keyword search volume:', error);
}

export async function getLatestKeywordVolume(
  keyword: string
): Promise<KeywordSearchVolume | null> {
  const { data } = await supabase
    .from('keyword_search_volumes')
    .select('*')
    .eq('keyword', keyword)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();
  return (data as KeywordSearchVolume) ?? null;
}

export async function getMultipleKeywordVolumes(
  keywords: string[]
): Promise<Map<string, KeywordSearchVolume>> {
  if (keywords.length === 0) return new Map();
  const { data } = await supabase
    .from('keyword_search_volumes')
    .select('*')
    .in('keyword', keywords);
  const map = new Map<string, KeywordSearchVolume>();
  for (const row of (data as KeywordSearchVolume[]) ?? []) {
    map.set(row.keyword, row);
  }
  return map;
}
