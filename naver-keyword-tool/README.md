# 네이버 키워드 검색량 조회 도구

네이버 검색광고 API를 사용해 키워드별 월간 검색량과 연관 키워드 데이터를 조회합니다.

## 사전 준비

1. [네이버 검색광고](https://searchad.naver.com) 접속
2. 광고시스템 → 도구 → API 사용관리 → API 신청
3. **액세스 라이선스**, **고객 ID**, **비밀키** 3가지 확보

## 설치

```bash
cd naver-keyword-tool
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 설정

```bash
cp .env.example .env
# .env 파일 열어서 실제 키 값 입력
```

## 실행

```bash
python keyword_tool.py
```

`keyword_tool.py` 하단의 `target_keywords` 리스트를 원하는 키워드로 변경한 뒤 실행합니다.

## 응답 데이터

| 컬럼 | 설명 |
|------|------|
| 키워드 | 입력 키워드 + 연관 키워드 |
| PC 월간검색수 | PC에서 월간 검색 횟수 |
| 모바일 월간검색수 | 모바일에서 월간 검색 횟수 |
| 총 월간검색수 | PC + 모바일 합산 |
| PC/모바일 월평균클릭수 | 광고 평균 클릭 수 |
| PC/모바일 월평균클릭률(%) | 광고 평균 클릭률 |
| 경쟁정도 | 낮음 / 중간 / 높음 |
| 월평균노출광고수 | 월 평균 광고 노출 개수 |

## 주의사항

- 키워드 내 **공백은 자동 제거** (네이버 API 정책)
- 5개 초과 입력 시 **자동 배치 처리**
- 검색량 10 미만 키워드는 `5`로 처리 (네이버 API가 `'< 10'` 문자열로 반환)
- 결과는 **CSV 파일로 자동 저장** (`keyword_stats_날짜시간.csv`)
