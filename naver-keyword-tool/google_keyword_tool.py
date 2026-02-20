"""
Google Ads Keyword Tool
Google Ads API KeywordPlanIdeaService를 통해 키워드 월간 검색량을 조회합니다.
"""

import os
import time
from dotenv import load_dotenv
from google.ads.googleads.client import GoogleAdsClient
from google.oauth2.credentials import Credentials

load_dotenv()

COMPETITION_MAP = {0: '-', 1: '-', 2: '낮음', 3: '중간', 4: '높음'}
LANGUAGE_KO = 'languageConstants/1012'
GEO_KR = 'geoTargetConstants/2410'
MAX_PER_REQUEST = 20


def _build_client() -> GoogleAdsClient:
    creds = Credentials(
        token=None,
        refresh_token=os.getenv('GOOGLE_ADS_REFRESH_TOKEN'),
        client_id=os.getenv('GOOGLE_ADS_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_ADS_CLIENT_SECRET'),
        token_uri='https://oauth2.googleapis.com/token',
    )
    return GoogleAdsClient(credentials=creds, developer_token=os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN'))


def _normalize(text: str) -> str:
    """공백·대소문자 정규화 후 비교용"""
    return text.replace(' ', '').lower()


def get_volume_for_keywords(keywords: list[str]) -> dict[str, dict]:
    """
    네이버 결과 키워드 목록에 대한 구글 검색량 조회.
    네이버 키워드를 20개 단위로 구글 API에 넣고,
    응답에서 정확히 일치하는 키워드만 매칭해서 반환.

    Returns:
        {키워드: {'월간검색수': int, '경쟁도': str}}
    """
    customer_id = os.getenv('GOOGLE_ADS_CUSTOMER_ID')
    if not customer_id:
        raise ValueError('GOOGLE_ADS_CUSTOMER_ID가 설정되지 않았습니다.')

    client = _build_client()
    service = client.get_service('KeywordPlanIdeaService')

    # 키워드 정규화 맵: normalize(kw) → 원본 kw
    norm_to_original = {_normalize(kw): kw for kw in keywords}

    result_map: dict[str, dict] = {}

    batches = [keywords[i:i + MAX_PER_REQUEST] for i in range(0, len(keywords), MAX_PER_REQUEST)]

    for batch in batches:
        request = client.get_type('GenerateKeywordIdeasRequest')
        request.customer_id = customer_id
        request.language = LANGUAGE_KO
        request.geo_target_constants.append(GEO_KR)
        request.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH
        request.keyword_seed.keywords.extend(batch)

        response = service.generate_keyword_ideas(request=request)

        for idea in response:
            normalized = _normalize(idea.text)
            if normalized in norm_to_original:
                original_kw = norm_to_original[normalized]
                m = idea.keyword_idea_metrics
                result_map[original_kw] = {
                    '구글 월간검색수': m.avg_monthly_searches,
                    '구글 경쟁도': COMPETITION_MAP.get(m.competition, '-'),
                }

        if len(batches) > 1:
            time.sleep(0.3)

    return result_map
