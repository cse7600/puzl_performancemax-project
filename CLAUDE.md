# naver-ad-monitor — 프로젝트 규칙

> 글로벌 규칙(`~/CLAUDE.md`)이 우선 적용됨. 이 파일은 프로젝트 전용 추가 규칙.

## ⛔ CRITICAL: 코드 설명 규칙 (모든 세션 필수 적용)

- 사용자는 코드를 읽지 못하는 비개발자
- **코드만 제출하고 승인 요청 절대 금지**
- 모든 코드 변경 시 반드시 아래 3가지를 비개발자 언어로 먼저 설명할 것:
  1. **무엇을 바꾸는지** — 어떤 파일의 어떤 부분
  2. **왜 바꾸는지** — 문제 또는 목적
  3. **어떤 로직인지** — 쉬운 말로 동작 원리
- 코드 작성/수정 후에도 "이게 하는 일"을 한 줄 요약으로 마무리
- 이 규칙은 어떤 상황에서도 생략 불가

## 프로젝트 개요
- **목적**: 네이버 광고 소재 자동 모니터링 및 판정
- **스택**: Next.js 16 + TypeScript + Tailwind CSS
- **DB**: Supabase
- **스크래핑**: Playwright (로컬/GitHub Actions)
- **배포**: Vercel (서버리스)

## 핵심 파일 위치
| 파일 | 역할 |
|------|------|
| `lib/scraper.ts` | Playwright 기반 네이버 광고 스크래퍼 |
| `lib/naver-keyword.ts` | 네이버 키워드 도구 연동 |
| `lib/google-keyword.ts` | Google Ads API 연동 |
| `lib/supabase.ts` | Supabase 클라이언트 |
| `lib/types.ts` | 공통 타입 정의 |
| `app/api/` | Next.js API Route (서버리스 함수) |
| `app/keyword-tool/` | 키워드 도구 페이지 |
| `scripts/run-scrape.ts` | 로컬/CI 스크래핑 실행 스크립트 |
| `.github/workflows/` | GitHub Actions 자동화 설정 |

## 빌드 & 실행 명령
```
npm run dev      # 개발 서버 (로컬 테스트)
npm run build    # 프로덕션 빌드 (Vercel 배포 전 검증)
npm run scrape   # 스크래퍼 수동 실행
npm run lint     # 코드 스타일 검사
```

## 환경 변수 (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 연결
- `GOOGLE_ADS_*` — Google Ads API 인증
- 변경 시 `.env.local.example`도 반드시 업데이트

## Vercel 서버리스 제약사항 (중요)
- Playwright는 `@sparticuz/chromium-min` 사용 (일반 Chromium 불가)
- API Route 타임아웃: 최대 60초 (스크래핑 주의)
- 파일 시스템 쓰기 불가 → 결과는 Supabase에만 저장
- 환경 변수 변경 시 Vercel 대시보드에서도 업데이트 필요

## 코드 수정 시 주의
- `lib/scraper.ts` 수정 → 반드시 로컬 `npm run scrape`로 동작 확인
- API Route 추가/수정 → `npm run build`로 빌드 오류 없는지 확인
- Supabase 스키마 변경 → 마이그레이션 SQL을 `docs/` 에 기록

## GitHub Actions
- `.github/workflows/` — 정기 스크래핑 자동화
- 워크플로우 수정 후 `git push`하면 즉시 반영
- 실행 결과는 GitHub > Actions 탭에서 확인

## ⛔ 배포(Push) 규칙 (필수)
- **작업 완료 후 즉시 푸시 금지**
- 모든 배포 예정 항목은 `docs/PUSH-HISTORY.md`의 "대기 중" 목록에 기록
- PO가 명시적으로 "푸시해줘" / "배포해줘"라고 요청할 때만 한 번에 푸시
- 푸시 완료 후 해당 항목을 "완료 이력"으로 이동
