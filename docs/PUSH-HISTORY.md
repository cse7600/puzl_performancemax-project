# Git Push 이력

> Vercel 배포와 연동됩니다. 푸시할 때마다 아래에 기록을 추가하세요.

---

## [2026-02-27] feat: 광고 소재 자동 판정 기능 추가 및 플랫폼 PRD 작성

**브랜치:** `naver-ad-monitor`
**커밋:** `1ca1b6b`

### 변경 내용
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

### 배포 후 확인
- [ ] `/creative-judge` 페이지 접근 가능한지 확인
- [ ] 사이드바 탭 3개 정상 표시 확인
- [ ] 기존 `/` 및 `/keyword-tool` 정상 동작 확인

---

<!-- 다음 푸시 시 위 형식으로 섹션 추가 -->
