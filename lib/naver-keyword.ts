/**
 * Naver Search Ad Keyword API client
 * Ported from naver-keyword-tool/keyword_tool.py
 */
import crypto from 'crypto';

const BASE_URL = 'https://api.naver.com';
const KEYWORD_TOOL_URI = '/keywordstool';
const MAX_KEYWORDS_PER_REQUEST = 5;

export interface NaverKeywordStat {
  keyword: string;
  pcVolume: number;
  mobileVolume: number;
  totalVolume: number;
  pcAvgClickCount: number;
  mobileAvgClickCount: number;
  pcAvgCtr: number;
  mobileAvgCtr: number;
  competition: string;
  avgDepth: number;
}

function toInt(value: unknown): number {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    if (value.startsWith('<')) return 5; // '< 10' → 5 (하한 추정)
    return parseInt(value, 10) || 0;
  }
  return 0;
}

function generateSignature(timestamp: string, method: string, uri: string, secretKey: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

function buildHeaders(apiKey: string, customerId: string, secretKey: string): Record<string, string> {
  const timestamp = String(Date.now());
  return {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Timestamp': timestamp,
    'X-API-KEY': apiKey,
    'X-Customer': customerId,
    'X-Signature': generateSignature(timestamp, 'GET', KEYWORD_TOOL_URI, secretKey),
  };
}

async function fetchBatch(
  keywords: string[],
  apiKey: string,
  customerId: string,
  secretKey: string,
): Promise<Record<string, unknown>[]> {
  const cleaned = keywords.map((kw) => kw.replace(/\s+/g, ''));
  // Naver API: comma separator must NOT be percent-encoded
  const kwParam = cleaned.join(',');
  const encoded = encodeURIComponent(kwParam).replace(/%2C/gi, ',');
  const url = `${BASE_URL}${KEYWORD_TOOL_URI}?hintKeywords=${encoded}&showDetail=1`;

  const res = await fetch(url, { headers: buildHeaders(apiKey, customerId, secretKey) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver Keyword API error ${res.status}: ${text}`);
  }
  const json = await res.json() as { keywordList?: Record<string, unknown>[] };
  return json.keywordList ?? [];
}

export async function getNaverKeywordStats(keywords: string[]): Promise<NaverKeywordStat[]> {
  const apiKey = process.env.NAVER_AD_API_KEY;
  const customerId = process.env.NAVER_AD_CUSTOMER_ID;
  const secretKey = process.env.NAVER_AD_SECRET_KEY;

  if (!apiKey || !customerId || !secretKey) {
    throw new Error('NAVER_AD_API_KEY, NAVER_AD_CUSTOMER_ID, NAVER_AD_SECRET_KEY 환경변수가 설정되지 않았습니다.');
  }

  const batches: string[][] = [];
  for (let i = 0; i < keywords.length; i += MAX_KEYWORDS_PER_REQUEST) {
    batches.push(keywords.slice(i, i + MAX_KEYWORDS_PER_REQUEST));
  }

  const allItems: Record<string, unknown>[] = [];
  for (const batch of batches) {
    const items = await fetchBatch(batch, apiKey, customerId, secretKey);
    allItems.push(...items);
    if (batches.length > 1) await new Promise((r) => setTimeout(r, 300));
  }

  return allItems.map((item) => {
    const pc = toInt(item['monthlyPcQcCnt']);
    const mobile = toInt(item['monthlyMobileQcCnt']);
    return {
      keyword: String(item['relKeyword'] ?? ''),
      pcVolume: pc,
      mobileVolume: mobile,
      totalVolume: pc + mobile,
      pcAvgClickCount: toInt(item['monthlyAvePcClkCnt']),
      mobileAvgClickCount: toInt(item['monthlyAveMobileClkCnt']),
      pcAvgCtr: Number(item['monthlyAvePcCtr'] ?? 0),
      mobileAvgCtr: Number(item['monthlyAveMobileCtr'] ?? 0),
      competition: String(item['compIdx'] ?? ''),
      avgDepth: toInt(item['plAvgDepth']),
    };
  });
}
