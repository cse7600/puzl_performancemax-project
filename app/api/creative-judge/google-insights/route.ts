/**
 * POST /api/creative-judge/google-insights
 * Body: { customerId: string, datePreset: 'LAST_7_DAYS' | 'LAST_14_DAYS' | 'LAST_30_DAYS' }
 *
 * Returns ad-level performance data for the given Google Ads customer,
 * formatted for the creative auto-judge tool's internal data structure.
 */

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v17';

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN ?? '',
      client_id: process.env.GOOGLE_ADS_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? '',
    }),
  });
  if (!res.ok) throw new Error(`OAuth token error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

type DatePreset = 'LAST_7_DAYS' | 'LAST_14_DAYS' | 'LAST_30_DAYS';

const ALLOWED_PRESETS = new Set<DatePreset>(['LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS']);

interface RequestBody {
  customerId: string;
  datePreset?: DatePreset;
}

interface GoogleAdsRow {
  adGroupAd?: {
    ad?: { id?: string; name?: string };
  };
  campaign?: { name?: string };
  adGroup?: { name?: string };
  metrics?: {
    impressions?: string;
    costMicros?: string;
    clicks?: string;
    ctr?: string;
    averageCpc?: string;
    conversions?: string;
  };
  segments?: { date?: string };
}

export async function POST(req: NextRequest) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!devToken || !clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: 'Google Ads 환경변수가 설정되지 않았습니다.' },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { customerId, datePreset = 'LAST_14_DAYS' } = body;

  if (!customerId || !/^\d+$/.test(customerId)) {
    return NextResponse.json({ error: 'customerId가 올바르지 않습니다.' }, { status: 400 });
  }

  if (!ALLOWED_PRESETS.has(datePreset)) {
    return NextResponse.json({ error: '허용되지 않는 datePreset 값입니다.' }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();

    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.cost_micros,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        segments.date
      FROM ad_group_ad
      WHERE segments.date DURING ${datePreset}
        AND ad_group_ad.status != 'REMOVED'
        AND metrics.impressions > 0
      ORDER BY segments.date ASC
      LIMIT 10000
    `.trim();

    let allResults: GoogleAdsRow[] = [];
    let nextPageToken: string | null = null;
    let pageCount = 0;

    do {
      pageCount++;
      const reqBody: Record<string, unknown> = { query, pageSize: 10000 };
      if (nextPageToken) reqBody.pageToken = nextPageToken;

      const res = await fetch(
        `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': devToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reqBody),
        },
      );

      const data = await res.json() as {
        results?: GoogleAdsRow[];
        nextPageToken?: string;
        error?: { message: string };
      };

      if (!res.ok || data.error) {
        return NextResponse.json(
          { error: data.error?.message ?? `Google Ads API 오류: ${res.status}` },
          { status: res.status },
        );
      }

      allResults = allResults.concat(data.results ?? []);
      nextPageToken = data.nextPageToken ?? null;
    } while (nextPageToken && pageCount < 20);

    // Transform to creative-judge internal format
    const rows = allResults.map((r) => ({
      date: r.segments?.date ?? '',
      creative_id: r.adGroupAd?.ad?.id ?? '',
      creative_name: r.adGroupAd?.ad?.name ?? '(이름 없음)',
      campaign_name: r.campaign?.name ?? '',
      adset_name: r.adGroup?.name ?? '',
      spend: Math.round((parseInt(r.metrics?.costMicros ?? '0', 10) / 1_000_000)),
      impressions: parseInt(r.metrics?.impressions ?? '0', 10),
      clicks: parseInt(r.metrics?.clicks ?? '0', 10),
      ctr: parseFloat((parseFloat(r.metrics?.ctr ?? '0') * 100).toFixed(3)),
      cpc: Math.round(parseInt(r.metrics?.averageCpc ?? '0', 10) / 1_000_000),
      frequency: 0, // Google Ads does not have an equivalent frequency metric
      conversions: Math.round(parseFloat(r.metrics?.conversions ?? '0')),
    }));

    return NextResponse.json({ rows, total: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
