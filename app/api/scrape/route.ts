import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GITHUB_REPO = 'cse7600/puzl_performancemax-project';
const WORKFLOW_FILE = 'scrape.yml';
const BRANCH = 'naver-ad-monitor';

/** Trigger GitHub Actions workflow_dispatch */
async function triggerWorkflow(keyword: string): Promise<{ ok: boolean; error?: string }> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) return { ok: false, error: 'GITHUB_PAT not configured' };

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: BRANCH, inputs: { keyword } }),
    },
  );

  if (res.status === 204) return { ok: true };
  const text = await res.text();
  return { ok: false, error: `GitHub API ${res.status}: ${text}` };
}

/** 수동 수집 버튼 → GitHub Actions workflow_dispatch */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query?.trim() || '';

    const result = await triggerWorkflow(query);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, queued: true });
  } catch (err) {
    console.error('[Scrape POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/** Vercel Cron (hourly) → GitHub Actions workflow_dispatch */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await triggerWorkflow('');
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Scrape workflow triggered' });
}
