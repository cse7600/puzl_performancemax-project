/**
 * Google Ads Keyword Idea REST API client
 * Uses REST (fetch) instead of gRPC to avoid grpc-js DNS resolution issues in CI environments.
 */

const COMPETITION_MAP: Record<string, string> = {
  UNSPECIFIED: '-',
  UNKNOWN: '-',
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
};

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

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
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
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    const normToOriginal = new Map(keywords.map((kw) => [normalize(kw), kw]));

    const batches: string[][] = [];
    for (let i = 0; i < keywords.length; i += MAX_PER_REQUEST) {
      batches.push(keywords.slice(i, i + MAX_PER_REQUEST));
    }

    for (const batch of batches) {
      try {
        const res = await fetch(
          `https://googleads.googleapis.com/v17/customers/${customerId}/keywordPlanIdeas:generateKeywordIdeas`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              language: LANGUAGE_KO,
              geoTargetConstants: [GEO_KR],
              keywordPlanNetwork: 'GOOGLE_SEARCH',
              keywordSeed: { keywords: batch },
              includeAdultKeywords: false,
              pageSize: 1000,
            }),
          },
        );

        if (!res.ok) {
          console.error('[Google Keyword API] REST error:', res.status, await res.text());
          continue;
        }

        const data = await res.json() as {
          results?: Array<{
            text: string;
            keywordIdeaMetrics?: { avgMonthlySearches?: string; competition?: string };
          }>;
        };

        for (const idea of data.results ?? []) {
          const norm = normalize(idea.text ?? '');
          const original = normToOriginal.get(norm);
          if (original) {
            result.set(original, {
              keyword: original,
              googleVolume: Number(idea.keywordIdeaMetrics?.avgMonthlySearches ?? 0),
              googleCompetition: COMPETITION_MAP[idea.keywordIdeaMetrics?.competition ?? 'UNSPECIFIED'] ?? '-',
            });
          }
        }
      } catch (err) {
        console.error('[Google Keyword API] Batch failed:', err);
      }

      if (batches.length > 1) await new Promise((r) => setTimeout(r, 300));
    }
  } catch (err) {
    console.error('[Google Keyword API] Init failed:', err);
  }

  return result;
}
