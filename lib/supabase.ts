import { createClient } from '@supabase/supabase-js';
import { Ad, AdSnapshot, RankChange } from './types';

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
