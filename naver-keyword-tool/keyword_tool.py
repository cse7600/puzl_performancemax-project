"""
Naver Search Ad Keyword Tool
네이버 검색광고 API를 통해 키워드 월간 검색량 및 연관 키워드 데이터를 조회합니다.

사전 준비:
  1. https://searchad.naver.com 접속 → 광고시스템 → 도구 → API 사용관리
  2. API 신청 후 .env 파일에 아래 3가지 값 저장
     NAVER_AD_API_KEY     ← 액세스 라이선스
     NAVER_AD_CUSTOMER_ID ← 고객 ID
     NAVER_AD_SECRET_KEY  ← 비밀키
"""

import os
import hmac
import hashlib
import base64
import time
import requests
import pandas as pd
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()

BASE_URL = 'https://api.naver.com'
KEYWORD_TOOL_URI = '/keywordstool'
MAX_KEYWORDS_PER_REQUEST = 5


def _to_int(value) -> int:
    """'< 10' 같은 문자열 포함 검색량 값을 정수로 변환"""
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str) and value.startswith('<'):
        return 5  # '< 10' → 5 (하한값 추정)
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0


def _generate_signature(timestamp: str, method: str, uri: str, secret_key: str) -> str:
    """HMAC-SHA256 서명 생성. 메시지 형식: {timestamp}.{method}.{uri}"""
    message = f'{timestamp}.{method}.{uri}'
    raw = hmac.new(secret_key.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(raw).decode()


def _build_headers(api_key: str, customer_id: str, secret_key: str) -> dict:
    """인증 헤더 생성"""
    timestamp = str(int(time.time() * 1000))
    signature = _generate_signature(timestamp, 'GET', KEYWORD_TOOL_URI, secret_key)
    return {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Timestamp': timestamp,
        'X-API-KEY': api_key,
        'X-Customer': customer_id,
        'X-Signature': signature,
    }


def _fetch_batch(
    keywords: list[str],
    show_detail: int,
    api_key: str,
    customer_id: str,
    secret_key: str,
) -> list[dict]:
    """키워드 최대 5개 단위로 API 호출 (내부 함수)"""
    # 네이버 API는 키워드 내 공백 미지원 → 자동 제거
    cleaned = [kw.replace(' ', '') for kw in keywords]

    # 콤마는 URL 인코딩하지 않아야 네이버 API가 정상 처리함
    kw_encoded = quote(','.join(cleaned), safe=',')
    url = f'{BASE_URL}{KEYWORD_TOOL_URI}?hintKeywords={kw_encoded}&showDetail={show_detail}'

    headers = _build_headers(api_key, customer_id, secret_key)
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    return response.json().get('keywordList', [])


def get_keyword_stats(
    keywords: list[str],
    show_detail: int = 1,
    api_key: str = None,
    customer_id: str = None,
    secret_key: str = None,
) -> pd.DataFrame:
    """
    키워드 월간 검색량 및 연관 키워드 조회

    Args:
        keywords   : 조회할 키워드 리스트 (5개 초과 시 자동 배치 처리)
        show_detail: 1=상세정보 포함, 0=키워드+월간검색수만
        api_key    : 액세스 라이선스 (미입력 시 환경변수 사용)
        customer_id: 고객 ID (미입력 시 환경변수 사용)
        secret_key : 비밀키 (미입력 시 환경변수 사용)

    Returns:
        pd.DataFrame: 키워드별 검색량 데이터 (총 월간검색수 내림차순)
    """
    api_key = api_key or os.getenv('NAVER_AD_API_KEY')
    customer_id = customer_id or os.getenv('NAVER_AD_CUSTOMER_ID')
    secret_key = secret_key or os.getenv('NAVER_AD_SECRET_KEY')

    if not all([api_key, customer_id, secret_key]):
        raise ValueError(
            'API 인증 정보가 없습니다. .env 파일에 NAVER_AD_API_KEY, '
            'NAVER_AD_CUSTOMER_ID, NAVER_AD_SECRET_KEY를 설정하세요.'
        )

    # 5개 단위로 배치 분할
    batches = [
        keywords[i:i + MAX_KEYWORDS_PER_REQUEST]
        for i in range(0, len(keywords), MAX_KEYWORDS_PER_REQUEST)
    ]

    all_items = []
    for batch in batches:
        items = _fetch_batch(batch, show_detail, api_key, customer_id, secret_key)
        all_items.extend(items)
        if len(batches) > 1:
            time.sleep(0.3)  # 배치 간 API 과호출 방지

    if not all_items:
        print('조회 결과가 없습니다.')
        return pd.DataFrame()

    rows = []
    for item in all_items:
        pc = _to_int(item.get('monthlyPcQcCnt', 0))
        mobile = _to_int(item.get('monthlyMobileQcCnt', 0))
        row = {
            '키워드': item.get('relKeyword', ''),
            'PC 월간검색수': pc,
            '모바일 월간검색수': mobile,
        }
        if show_detail == 1:
            row.update({
                'PC 월평균클릭수': item.get('monthlyAvePcClkCnt', 0),
                '모바일 월평균클릭수': item.get('monthlyAveMobileClkCnt', 0),
                'PC 월평균클릭률(%)': item.get('monthlyAvePcCtr', 0),
                '모바일 월평균클릭률(%)': item.get('monthlyAveMobileCtr', 0),
                '경쟁정도': item.get('compIdx', ''),
                '월평균노출광고수': item.get('plAvgDepth', 0),
            })
        row['총 월간검색수'] = pc + mobile
        rows.append(row)

    df = pd.DataFrame(rows)
    df = df.sort_values('총 월간검색수', ascending=False).reset_index(drop=True)

    return df


def save_to_csv(df: pd.DataFrame, filename: str = None) -> str:
    """결과를 CSV 파일로 저장"""
    if filename is None:
        filename = f'keyword_stats_{time.strftime("%Y%m%d_%H%M%S")}.csv'
    df.to_csv(filename, index=False, encoding='utf-8-sig')
    print(f'저장 완료: {filename}')
    return filename


# ─────────────────────────────────────────────
# 실행 예시
# ─────────────────────────────────────────────
if __name__ == '__main__':
    # 조회할 키워드 (5개 초과 시 자동 배치 처리, 공백 포함 가능 → 자동 제거)
    target_keywords = ['퍼포먼스마케팅', '검색광고', '네이버광고']

    print(f'조회 키워드: {target_keywords}')
    print('-' * 60)

    df = get_keyword_stats(target_keywords, show_detail=1)

    if not df.empty:
        print(df.to_string(index=False))
        print('-' * 60)
        save_to_csv(df)
