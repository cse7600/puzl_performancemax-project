# F-03 네이버 광고주 순위 모니터 PRD

**기능명:** 네이버 광고주 순위 모니터 (Naver Search Ad Rank Monitor)
**버전:** 1.0 (소급 문서화)
**작성일:** 2026-02-27
**상태:** 구현 완료 (운영 중)

---

## 1. 기능 개요

### 문제 정의
퍼포먼스 마케터는 자신이 운영하는 키워드에서 **경쟁 광고주가 몇 위에 있는지** 매일 확인해야 한다.
- 경쟁사가 새로 진입했는지
- 내가 1위였는데 밀렸는지
- 어떤 광고 문구를 쓰고 있는지

이걸 매일 수동으로 네이버에서 검색해서 확인하면 키워드 10개에 20~30분 소요. 자동화 시 5초 이내.

### 솔루션
키워드를 등록해두면 GitHub Actions가 주기적으로 네이버 검색광고 결과를 수집하고, Supabase에 저장한다. 대시보드에서 현재 순위와 직전 수집 대비 변동(신규 진입/이탈/상승/하강)을 한눈에 본다.

---

## 2. 핵심 기능

### 2.1 키워드 관리 (사이드바)
| 기능 | 설명 |
|------|------|
| 키워드 추가 | 키워드 + 수집 주기(1h/6h/12h/24h) 설정 |
| 키워드 활성/비활성 | 토글로 수집 일시 중지 |
| 키워드 삭제 | 이력 포함 삭제 |
| 키워드 선택 | 사이드바에서 키워드 클릭 → 해당 키워드 결과 즉시 로드 |

### 2.2 광고주 순위 현황 테이블
| 컬럼 | 설명 |
|------|------|
| 순위 | 현재 광고 노출 순위 |
| 광고주 | 광고주명 (URL 도메인) |
| 제목 | 광고 헤드라인 |
| 변동 | 직전 수집 대비 순위 변동 (NEW / 제거 / ▲ N위 / ▼ N위 / ━) |
| 서브링크 | 사이트링크 확장소재 수 |
| 이미지 | 이미지 확장소재 수 |

### 2.3 순위 변동 배지
| 배지 | 의미 | 색상 |
|------|------|------|
| NEW | 이번 수집에 새로 진입한 광고주 | 초록 |
| 제거 | 직전 수집 대비 사라진 광고주 (현재는 표시 안 됨) | 빨강 |
| ▲ N위 | N순위 상승 | 파랑 |
| ▼ N위 | N순위 하강 | 주황 |
| ━ | 순위 변동 없음 | 회색 |

### 2.4 PC / Mobile 탭 분리
- 동일 키워드에 대해 PC / 모바일 결과를 별도로 수집·표시
- 탭 전환 시 각 플랫폼 광고 수 표시

### 2.5 키워드 검색량 요약 카드
- 광고 순위 화면 상단에 해당 키워드의 네이버 PC/모바일/합계 + 구글 검색량 표시
- Supabase에 캐시된 최신 데이터 사용 (F-02 키워드 툴과 공유)

### 2.6 수동 수집 트리거
- "▶ 지금 수집" 버튼 → GitHub Actions workflow dispatch API 호출
- 약 2~3분 후 결과 자동 새로고침 (타이머 기반)

---

## 3. 기술 아키텍처

### 3.1 수집 방식
| 항목 | 선택 | 이유 |
|------|------|------|
| 실행 환경 | GitHub Actions | Vercel 서버리스 60초 타임아웃 우회, Playwright 실행 가능 |
| 수집 도구 | Playwright Chromium (`@sparticuz/chromium-min`) | JavaScript 렌더링 후 광고 DOM 파싱 |
| 수집 대상 URL | `https://search.naver.com/search.naver?query={keyword}&where=ad` | 네이버 검색광고 전용 엔드포인트 |
| 프록시 | `WEBSHARE_PROXY_URL` (선택적) | 네이버 차단 우회용. 미설정 시 직접 수집 |

### 3.2 데이터 플로우
```
[GitHub Actions Cron / 수동 트리거]
      ↓
  Playwright로 네이버 광고 페이지 수집
      ↓
  Ad 데이터 파싱 (광고주, 제목, 순위, 서브링크, 이미지)
      ↓
  직전 스냅샷과 비교 → 변동 계산 (RankChange)
      ↓
  Supabase에 저장
  ├── ad_monitor_snapshots (전체 결과)
  └── ad_monitor_rank_changes (변동 이력)
      ↓
  Next.js 대시보드에서 API 조회 → 화면 표시
```

### 3.3 API 엔드포인트
| 엔드포인트 | 메서드 | 역할 |
|-----------|--------|------|
| `/api/scrape` | POST | GitHub Actions workflow 트리거 |
| `/api/snapshots?type=latest` | GET | 최신 PC/Mobile 스냅샷 조회 |
| `/api/snapshots?type=changes` | GET | 순위 변동 이력 조회 |
| `/api/keywords` | GET/POST | 키워드 목록 조회 및 추가 |
| `/api/keywords/[id]` | PATCH/DELETE | 키워드 수정/삭제 |

### 3.4 Supabase 테이블 구조
| 테이블 | 주요 컬럼 | 설명 |
|--------|----------|------|
| `monitor_keywords` | keyword, interval_hours, enabled, last_run_at | 모니터링 키워드 목록 |
| `ad_monitor_snapshots` | query, platform, ads(JSON), ad_count, monitored_at | 광고 순위 전체 결과 |
| `ad_monitor_rank_changes` | query, platform, advertiser, prev_rank, curr_rank, change_type, detected_at | 순위 변동 이력 |

---

## 4. 수집 데이터 스펙

### 4.1 Ad 오브젝트 (per 광고)
```ts
interface Ad {
  rank: number;           // 노출 순위 (1부터)
  advertiser: string;     // 광고주명 (URL 기반)
  title: string;          // 광고 헤드라인
  description: string;    // 광고 본문 설명
  url: string;            // 표시 URL
  siteUrl: string;        // 실제 랜딩 URL
  subLinks: SubLink[];    // 사이트링크 확장소재
  images: Image[];        // 이미지 확장소재
}
```

---

## 5. 운영 현황

### 5.1 배포 상태
- **Vercel:** 프론트엔드 + API 라우트 배포 (동적 렌더링)
- **GitHub Actions:** 스케줄 수집 (`naver-ad-monitor.yml`)
- **Supabase:** `eqdnirtgmevhobmycxzn` 프로젝트 (KR 리전 추정)

### 5.2 환경변수 현황
| 변수 | 상태 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 설정됨 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 설정됨 | 읽기 전용 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 설정됨 (2026-02-27) | 서버 쓰기용 관리자 키 |
| `GITHUB_PAT` | ✅ 설정됨 | GitHub Actions 트리거용 Personal Access Token |
| `WEBSHARE_PROXY_URL` | ❓ 미확인 | 프록시 차단 우회 (선택적) |
| `CRON_SECRET` | ✅ 설정됨 | GitHub Actions 인증 시크릿 |

---

## 6. 알려진 이슈 및 개선 포인트

| 이슈 | 심각도 | 설명 |
|------|--------|------|
| 네이버 봇 차단 | 중간 | IP 차단 시 수집 실패. `WEBSHARE_PROXY_URL` 설정으로 완화 가능 |
| 광고 없는 키워드 | 낮음 | 광고 없는 키워드 수집 시 빈 스냅샷 저장 (정상 동작) |
| 실시간성 부재 | 낮음 | GitHub Actions 최소 1분 대기, 수동 수집도 2~3분 소요 |
| 이탈 광고주 미표시 | 낮음 | "제거" 배지는 정의되어 있으나 현재 UI에서 표시 안 됨 (변동 이력에서 추적 가능) |

---

## 7. 향후 개선 방향

### Phase 1 잔여 작업
- [ ] "제거" 광고주 UI 표시 (현재 코드에 있으나 렌더링 미구현)
- [ ] 순위 변동 알림 (이메일 또는 슬랙)
- [ ] 수집 이력 히스토리 뷰 (날짜별 순위 추이 차트)

### Phase 2
- [ ] Google 검색광고 순위 모니터 추가
- [ ] 내 광고 위/아래 경쟁사 자동 태깅
- [ ] 경쟁사 광고 소재 변경 감지

---

## 8. 빌드 이력

| 날짜 | 빌드 유형 | 변경 내용 요약 | 결과 |
|------|----------|----------------|------|
| 2026-02-27 (추정) | production | 최초 구현 완료 — GitHub Actions 기반 Playwright 수집, Supabase 저장, Next.js 대시보드 | 성공 |
| 2026-02-27 | production | Vercel 빌드 오류 수정 (Supabase lazy init, Service Role Key 추가) | 성공 |
