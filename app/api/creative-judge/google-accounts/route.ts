/**
 * GET /api/creative-judge/google-accounts
 * Returns a list of Google Ads accounts accessible via the configured OAuth2 credentials.
 * Credentials are read from environment variables — never exposed to the browser.
 */

import { NextResponse } from 'next/server';

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

export async function GET() {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!devToken || !clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: 'Google Ads 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.' },
      { status: 500 },
    );
  }

  try {
    const accessToken = await getAccessToken();

    // List all accessible customer IDs
    const listRes = await fetch(`${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': devToken,
      },
    });

    const listData = await listRes.json() as { resourceNames?: string[]; error?: { message: string } };

    if (!listRes.ok || listData.error) {
      return NextResponse.json(
        { error: listData.error?.message ?? `Google Ads API 오류: ${listRes.status}` },
        { status: listRes.status },
      );
    }

    const customerIds = (listData.resourceNames ?? []).map((r) => r.replace('customers/', ''));

    if (customerIds.length === 0) {
      return NextResponse.json({ accounts: [] });
    }

    // Fetch customer details in parallel (name, currency, timezone)
    const detailResults = await Promise.allSettled(
      customerIds.map((id) =>
        fetch(`${GOOGLE_ADS_BASE}/customers/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': devToken,
          },
        }).then((r) => r.json()),
      ),
    );

    const accounts = customerIds.map((id, i) => {
      const detail = detailResults[i].status === 'fulfilled' ? detailResults[i].value : null;
      return {
        id,
        name: detail?.descriptiveName ?? `계정 ${id}`,
        currencyCode: detail?.currencyCode ?? '',
        timeZone: detail?.timeZone ?? '',
        manager: detail?.manager ?? false,
      };
    });

    return NextResponse.json({ accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
