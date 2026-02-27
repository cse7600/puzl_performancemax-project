# Push History — 배포 대기 & 이력

> **규칙**: 작업 완료 후 바로 푸시하지 않는다.
> 아래 "대기 중" 목록에 항목을 쌓아두고, 준비되면 한 번에 푸시한다.
> 푸시 완료 후 대기 항목을 "완료 이력"으로 이동.

---

## 🟡 대기 중 (미푸시)

| # | 날짜 | 내용 요약 | 관련 파일 |
|---|------|----------|----------|
| 1 | 2026-02-27 | .claude 폴더 생성 (commands 4개, CLAUDE.md) | `.claude/`, `CLAUDE.md` |
| 2 | 2026-02-27 | PUSH-HISTORY.md 워크플로우 개편 | `docs/PUSH-HISTORY.md` |
| 3 | 2026-02-27 | Vercel 빌드 수정: Supabase lazy init + TypeScript as any + snapshots 리팩토링 | `lib/supabase.ts`, `app/api/snapshots/route.ts` |
| 4 | 2026-02-27 | Supabase Service Role Key 설정 (.env.local + Vercel) | `.env.local` (로컬만, gitignore됨) |
| 5 | 2026-02-27 | PRD 업데이트: F-03 소급 작성 + F-01·메인 PRD 갱신 | `docs/01-plan/features/F-03-ad-monitor.prd.md`, `F-01-creative-judge.prd.md`, `PRD-v1.0.md` |
| 6 | 2026-02-27 | Google Ads API 서버 연동: 계정 조회·광고 성과 API Route 신규 추가 | `app/api/creative-judge/google-accounts/route.ts`, `app/api/creative-judge/google-insights/route.ts` |
| 7 | 2026-02-27 | creative-judge.html: Meta 계정 자동 선택 + Google Ads 플랫폼 탭 통합 | `public/creative-judge.html` |
| 8 | 2026-02-27 | 참고자료 폴더 프로젝트 밖으로 이동 (tsconfig 빌드 오류 방지) | `tsconfig.json` |

---

## ✅ 완료 이력

### [2026-02-27] feat: 광고 소재 자동 판정 기능 추가 및 플랫폼 PRD 작성

**브랜치:** `naver-ad-monitor` · **커밋:** `1ca1b6b`

| 구분 | 파일 | 설명 |
|------|------|------|
| 신규 | `public/creative-judge.html` | 광고소재 자동판정 v2.7 (Meta CSV/API 기반) |
| 신규 | `app/creative-judge/page.tsx` | `/creative-judge` 라우트 — iframe 래퍼 |
| 수정 | `components/KeywordManager.tsx` | 사이드바에 🎯 소재 자동 판정 탭 추가 |
| 신규 | `docs/PRD-v1.0.md` | 성과 최적화 플랫폼 메인 PRD |
| 신규 | `docs/01-plan/features/F-01-creative-judge.prd.md` | 소재 자동판정 PRD v1.1 |
| 신규 | `docs/01-plan/features/F-02-keyword-tool.prd.md` | 키워드 인텔리전스 PRD |
| 수정 | `lib/google-keyword.ts` | Google Ads API v17 → v20 |
| 수정 | `lib/scraper.ts` | 프록시 옵션(WEBSHARE_PROXY_URL) 추가 |
| 수정 | `app/keyword-tool/page.tsx` | 검색 키워드 입력 순서 정렬 + 하이라이트 |
| 수정 | `app/globals.css` | 다크모드 비활성화 |
| 수정 | `.gitignore` | .bkit/, .claude/ 제외 추가 |
