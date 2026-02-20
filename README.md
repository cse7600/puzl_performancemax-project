# 네이버 광고 모니터 (Naver Ad Monitor)

네이버 검색 광고 순위를 PC/Mobile 양쪽에서 실시간으로 수집·저장·시각화하는 모니터링 도구.

## 기능 요약

- 키워드 기반 네이버 검색 광고 수집 (PC + Mobile)
- 광고별 순위, 제목, 설명, 도메인, 랜딩 URL, 서브링크, 이미지 수집
- 광고 추적 URL(ader.naver.com)을 실제 랜딩 URL로 자동 변환
- Supabase에 스냅샷 저장 및 순위 변동 감지
- Next.js 기반 대시보드 웹 UI
- Vercel Cron으로 6시간마다 자동 수집

---

## 스택

| 역할 | 기술 |
|---|---|
| Frontend / API | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Scraper | Playwright |
| Database | Supabase (PostgreSQL + JSONB) |
| Deployment | Vercel |

---

## 디렉토리 구조

```
naver-ad-monitor/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts      # POST: 수동 수집 / GET: Cron 수집
│   │   └── snapshots/route.ts   # 스냅샷 조회 API
│   ├── page.tsx                 # 대시보드 UI
│   └── layout.tsx
├── components/
│   └── AdCard.tsx               # 광고 카드 컴포넌트
├── lib/
│   ├── scraper.ts               # 핵심 스크래핑 로직
│   ├── supabase.ts              # Supabase CRUD 함수
│   └── types.ts                 # TypeScript 인터페이스
├── scripts/
│   └── run-scrape.ts            # CLI 독립 실행 스크립트 (sub-agent 용)
├── .env.local.example           # 환경변수 템플릿
└── vercel.json                  # Cron 설정 (6시간마다)
```

---

## 초기 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 값 채우기:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Supabase > Settings > API
CRON_SECRET=your-random-secret-string
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 실행:

```sql
CREATE TABLE ad_monitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('pc', 'mobile')),
  monitored_at TIMESTAMPTZ NOT NULL,
  ads JSONB NOT NULL DEFAULT '[]',
  ad_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_monitor_rank_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  platform TEXT NOT NULL,
  advertiser TEXT NOT NULL,
  prev_rank INTEGER,
  curr_rank INTEGER,
  change_type TEXT CHECK (change_type IN ('new', 'removed', 'up', 'down', 'same')),
  snapshot_id UUID REFERENCES ad_monitor_snapshots(id),
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON ad_monitor_snapshots (query, platform, monitored_at DESC);
CREATE INDEX ON ad_monitor_rank_changes (query, platform, detected_at DESC);
```

### 4. 로컬 실행

```bash
npm run dev
# http://localhost:3000 접속
```

---

## CLI 스크립트 (Sub-Agent 용)

다른 Claude 에이전트나 자동화 파이프라인에서 직접 스크래핑 결과를 얻을 때 사용.

### 기본 사용법

```bash
# 기본 실행 (결과를 터미널에 출력)
npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프"

# Supabase에 저장
npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프" --save

# 로컬 JSON 파일로 출력
npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프" --output result.json

# PC만 수집 + 저장
npx tsx scripts/run-scrape.ts "두쫀쿠 카다이프" --platform pc --save

# npm 스크립트로 실행
npm run scrape -- "두쫀쿠 카다이프" --save
```

### 옵션

| 옵션 | 설명 |
|---|---|
| `--save` | Supabase에 스냅샷 저장 (SUPABASE_SERVICE_ROLE_KEY 필요) |
| `--output <file>` | JSON 파일로 결과 저장 |
| `--platform pc\|mobile\|both` | 수집 플랫폼 (기본: both) |
| `--no-redirect` | 추적 URL 변환 생략 (빠르지만 ader.naver.com URL 유지) |

### 출력 JSON 구조

```json
{
  "query": "두쫀쿠 카다이프",
  "monitoredAt": "2024-01-01T00:00:00.000Z",
  "pc": {
    "count": 7,
    "ads": [
      {
        "rank": 1,
        "advertiser": "광고주명",
        "displayDomain": "example.com",
        "title": "광고 제목",
        "description": "광고 설명 문구",
        "landingUrl": "https://example.com/landing?utm_...",
        "subLinks": [
          { "text": "서브링크 텍스트", "landingUrl": "https://..." }
        ],
        "images": [
          { "src": "https://searchad-phinf.pstatic.net/...", "alt": "", "landingUrl": "https://..." }
        ]
      }
    ]
  },
  "mobile": { "count": 4, "ads": [...] }
}
```

---

## API 엔드포인트

### POST /api/scrape

수동으로 광고 수집 실행.

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"query": "두쫀쿠 카다이프"}'
```

### GET /api/scrape

Vercel Cron 용 (Authorization 헤더 필요).

### GET /api/snapshots

```bash
# 최신 스냅샷
GET /api/snapshots?type=latest&query=두쫀쿠+카다이프&platform=pc

# 히스토리 (최근 20개)
GET /api/snapshots?type=history&query=두쫀쿠+카다이프&platform=mobile&limit=20

# 순위 변동 내역
GET /api/snapshots?type=changes&query=두쫀쿠+카다이프&platform=pc&limit=50
```

---

## Vercel 배포

1. Vercel에 새 프로젝트 생성 후 이 저장소 연결
2. Environment Variables에 `.env.local` 항목 모두 입력
3. `vercel.json`의 Cron Job은 Pro 플랜 필요 (Free는 수동 실행만)

---

## 기술 메모

- **Naver 광고 DOM**: 클래스명이 난독화되어 있음. `.sc_new.ad_section`으로 광고 섹션 탐색, 없으면 "관련 광고" 텍스트 노드 기반 TreeWalker로 폴백
- **추적 URL 변환**: `ader.naver.com` 리다이렉트 URL을 `waitUntil: 'commit'`으로 최종 URL 획득 (concurrency 4)
- **이미지 CDN**: `searchad-phinf.pstatic.net` (광고 소재) vs `search.pstatic.net` (파비콘) 구분
- **Vercel 환경**: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 환경변수 설정 시 `playwright-core` + `@sparticuz/chromium-min` 사용
