"""
Google Ads Keyword Tool
Google Ads API KeywordPlanIdeaService를 통해 키워드 월간 검색량 및 연관 키워드 데이터를 조회합니다.
"""

import os
import time
import pandas as pd
from google.ads.googleads.client import GoogleAdsClient
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

load_dotenv()

# 경쟁도 숫자값 → 한국어 레이블
COMPETITION_MAP = {
    0: 'UNSPECIFIED',
    1: 'UNKNOWN',
    2: '낮음',
    3: '중간',
    4: '높음',
}

# 한국어 / 한국 지역 상수
LANGUAGE_KO = 'languageConstants/1012'
GEO_KR = 'geoTargetConstants/2410'

MAX_KEYWORDS_PER_REQUEST = 20  # Google API는 최대 20개


def _build_client(
    developer_token: str,
    client_id: str,
    client_secret: str,
    refresh_token: str,
) -> GoogleAdsClient:
    """Google Ads API 클라이언트 생성"""
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri='https://oauth2.googleapis.com/token',
    )
    return GoogleAdsClient(credentials=creds, developer_token=developer_token)


def get_keyword_stats(
    keywords: list[str],
    customer_id: str = None,
    developer_token: str = None,
    client_id: str = None,
    client_secret: str = None,
    refresh_token: str = None,
) -> pd.DataFrame:
    """
    키워드 월간 검색량 및 연관 키워드 조회 (Google Ads API)

    Args:
        keywords      : 조회할 키워드 리스트 (20개 초과 시 자동 배치 처리)
        customer_id   : Google Ads 고객 ID (미입력 시 환경변수 사용)
        developer_token: 개발자 토큰
        client_id     : OAuth 클라이언트 ID
        client_secret : OAuth 클라이언트 보안 비밀번호
        refresh_token : OAuth 리프레시 토큰

    Returns:
        pd.DataFrame: 키워드별 검색량 데이터 (월간검색수 내림차순)
    """
    customer_id     = customer_id     or os.getenv('GOOGLE_ADS_CUSTOMER_ID')
    developer_token = developer_token or os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN')
    client_id       = client_id       or os.getenv('GOOGLE_ADS_CLIENT_ID')
    client_secret   = client_secret   or os.getenv('GOOGLE_ADS_CLIENT_SECRET')
    refresh_token   = refresh_token   or os.getenv('GOOGLE_ADS_REFRESH_TOKEN')

    if not all([customer_id, developer_token, client_id, client_secret, refresh_token]):
        raise ValueError('Google Ads API 인증 정보가 없습니다. .env 파일을 확인하세요.')

    client = _build_client(developer_token, client_id, client_secret, refresh_token)

    # 20개 단위 배치 분할
    batches = [
        keywords[i:i + MAX_KEYWORDS_PER_REQUEST]
        for i in range(0, len(keywords), MAX_KEYWORDS_PER_REQUEST)
    ]

    all_rows = []
    for batch in batches:
        rows = _fetch_batch(client, customer_id, batch)
        all_rows.extend(rows)
        if len(batches) > 1:
            time.sleep(0.5)

    if not all_rows:
        return pd.DataFrame()

    df = pd.DataFrame(all_rows)
    df = df.sort_values('월간검색수', ascending=False).reset_index(drop=True)
    return df


def _fetch_batch(client: GoogleAdsClient, customer_id: str, keywords: list[str]) -> list[dict]:
    """키워드 배치 단위 API 호출"""
    service = client.get_service('KeywordPlanIdeaService')
    request = client.get_type('GenerateKeywordIdeasRequest')

    request.customer_id = customer_id
    request.language = LANGUAGE_KO
    request.geo_target_constants.append(GEO_KR)
    request.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH
    request.keyword_seed.keywords.extend(keywords)

    response = service.generate_keyword_ideas(request=request)

    rows = []
    for result in response:
        m = result.keyword_idea_metrics
        rows.append({
            '키워드': result.text,
            '월간검색수': m.avg_monthly_searches,
            '경쟁도': COMPETITION_MAP.get(m.competition, str(m.competition)),
        })
    return rows


def save_to_csv(df: pd.DataFrame, filename: str = None) -> str:
    """결과를 CSV 파일로 저장"""
    if filename is None:
        filename = f'google_keyword_stats_{time.strftime("%Y%m%d_%H%M%S")}.csv'
    df.to_csv(filename, index=False, encoding='utf-8-sig')
    print(f'저장 완료: {filename}')
    return filename


# ─────────────────────────────────────────────
# 실행 예시
# ─────────────────────────────────────────────
if __name__ == '__main__':
    target_keywords = ['검색광고', '퍼포먼스마케팅', '네이버광고']

    print(f'조회 키워드: {target_keywords}')
    print('-' * 60)

    df = get_keyword_stats(target_keywords)

    if not df.empty:
        print(df.to_string(index=False))
        print('-' * 60)
        save_to_csv(df)
