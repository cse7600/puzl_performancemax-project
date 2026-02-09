# 광고주 로그인 시스템

## 개요
광고주(Advertiser)는 파트너 프로그램을 운영하는 기업 계정입니다. 여러 광고주가 동일한 플랫폼을 사용할 수 있도록 멀티 테넌트 구조로 설계되었습니다.

## 데이터베이스 스키마

### advertisers 테이블
```sql
- id: UUID (PK)
- advertiser_id: TEXT (UNIQUE) - 광고주 고유 식별자 (예: hanwha_vision)
- company_name: TEXT - 회사명
- user_id: TEXT (UNIQUE) - 로그인용 사용자 ID
- password_hash: TEXT - bcrypt로 해시된 비밀번호
- status: TEXT - active | suspended | inactive
- logo_url: TEXT - 로고 이미지 URL
- primary_color: TEXT - 브랜드 색상 (예: #f97316)
- contact_email: TEXT
- contact_phone: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### advertiser_sessions 테이블
```sql
- id: UUID (PK)
- advertiser_id: UUID (FK)
- token: TEXT (UNIQUE) - 세션 토큰
- expires_at: TIMESTAMPTZ - 만료 시간
- created_at: TIMESTAMPTZ
```

## 로그인 프로세스

### 1. 로그인 페이지
경로: `/advertiser/login`

사용자가 입력:
- User ID: 로그인용 사용자 ID (예: admin)
- Password: 비밀번호 (예: password123)

### 2. 인증 API
엔드포인트: `POST /api/auth/advertiser/login`

요청:
```json
{
  "userId": "admin",
  "password": "password123"
}
```

응답 (성공):
```json
{
  "success": true,
  "advertiser": {
    "id": "uuid",
    "advertiserId": "hanwha_vision",
    "companyName": "한화비전",
    "userId": "admin",
    "logoUrl": null,
    "primaryColor": "#f97316"
  }
}
```

HttpOnly 쿠키로 세션 토큰 저장:
- 이름: `advertiser_token`
- 만료: 7일
- HttpOnly: true
- Secure: true (프로덕션)

### 3. 세션 확인
엔드포인트: `GET /api/auth/advertiser/me`

쿠키의 토큰으로 현재 로그인된 광고주 정보 반환

### 4. 로그아웃
엔드포인트: `POST /api/auth/advertiser/logout`

세션 삭제 및 쿠키 제거

## 광고주 대시보드

### 레이아웃
경로: `/advertiser/*`

모든 광고주 페이지는 공통 레이아웃 사용:
- 사이드바 네비게이션
- 상단 헤더
- 인증 체크 (로그인 페이지 제외)

### 페이지 목록

1. **대시보드** (`/advertiser/dashboard`)
   - 전체 통계 요약
   - 최근 활동
   - 빠른 작업 버튼

2. **파트너 관리** (`/advertiser/partners`)
   - 파트너 목록
   - 파트너 승인/거절
   - 티어 관리

3. **고객 관리** (`/advertiser/referrals`)
   - 유입된 고객 DB
   - 계약 상태 추적
   - 유효성 검증

4. **정산 관리** (`/advertiser/settlements`)
   - 정산 내역
   - 정산 처리
   - 정산 통계

5. **캠페인** (`/advertiser/campaigns`)
   - 캠페인 생성
   - 수수료 설정
   - 프로모션 관리

6. **설정** (`/advertiser/settings`)
   - 계정 설정
   - 브랜드 설정
   - 시스템 설정

## 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

bcryptjs 패키지가 자동으로 설치됩니다.

### 2. 데이터베이스 마이그레이션
Supabase SQL Editor에서 실행:
```bash
supabase/migrations/001_create_advertisers.sql
```

### 3. 환경변수
`.env.local` 파일에 Supabase 설정이 있어야 합니다:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 데모 계정

마이그레이션 실행 시 자동으로 생성되는 데모 계정:

```
광고주 ID: hanwha_vision
회사명: 한화비전
User ID: admin
Password: password123
```

## 보안 고려사항

1. **비밀번호 해싱**: bcrypt 사용 (salt rounds: 10)
2. **세션 토큰**: 32바이트 랜덤 hex
3. **HttpOnly 쿠키**: XSS 공격 방지
4. **세션 만료**: 7일 후 자동 만료
5. **계정 상태**: inactive/suspended 계정 로그인 불가

## 다음 단계

현재는 기본 인증 시스템만 구현되었습니다. 추가 구현이 필요한 기능:

- [ ] 파트너 데이터 필터링 (advertiser_id 기준)
- [ ] 대시보드 실제 데이터 연동
- [ ] 파트너 승인/관리 기능
- [ ] 정산 처리 기능
- [ ] 캠페인 관리 기능
- [ ] 비밀번호 변경 기능
- [ ] 2FA (선택)
