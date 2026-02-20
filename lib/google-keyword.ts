/**
 * Google Ads Keyword Idea API client
 * Ported from naver-keyword-tool/google_keyword_tool.py
 * Requires: npm install google-ads-api
 */

const COMPETITION_MAP: Record<number, string> = { 0: '-', 1: '-', 2: '낮음', 3: '중간', 4: '높음' };
const LANGUAGE_KO = 'languageConstants/1012';
const GEO_KR = 'geoTargetConstants/2410';
const MAX_PER_REQUEST = 20;

function normalize(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

export interface GoogleKeywordStat {
  keyword: string;
  googleVolume: number;
  googleCompetition: string;
}

export async function getGoogleKeywordStats(
  keywords: string[],
): Promise<Map<string, GoogleKeywordStat>> {
  const result = new Map<string, GoogleKeywordStat>();

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  // Google API is optional — skip silently if not configured
  if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
    return result;
  }

  try {
    // Dynamic import: avoids build errors if google-ads-api is not installed
    const { GoogleAdsApi, enums } = await import('google-ads-api');
    const client = new GoogleAdsApi({ client_id: clientId, client_secret: clientSecret, developer_token: developerToken });
    const customer = client.Customer({ customer_id: customerId, refresh_token: refreshToken });

    const normToOriginal = new Map(keywords.map((kw) => [normalize(kw), kw]));

    const batches: string[][] = [];
    for (let i = 0; i < keywords.length; i += MAX_PER_REQUEST) {
      batches.push(keywords.slice(i, i + MAX_PER_REQUEST));
    }

    for (const batch of batches) {
      try {
        const { results } = await customer.keywordPlanIdeas.generateKeywordIdeas({
          language: LANGUAGE_KO,
          geo_target_constants: [GEO_KR],
          keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
          keyword_seed: { keywords: batch },
        });

        for (const idea of results ?? []) {
          const norm = normalize(idea.text ?? '');
          const original = normToOriginal.get(norm);
          if (original) {
            result.set(original, {
              keyword: original,
              googleVolume: idea.keyword_idea_metrics?.avg_monthly_searches ?? 0,
              googleCompetition: COMPETITION_MAP[idea.keyword_idea_metrics?.competition ?? 0] ?? '-',
            });
          }
        }
      } catch (err) {
        console.error('[Google Keyword API] Batch failed:', err);
      }
      if (batches.length > 1) await new Promise((r) => setTimeout(r, 300));
    }
  } catch (err) {
    console.error('[Google Keyword API] Import or init failed:', err);
  }

  return result;
}
