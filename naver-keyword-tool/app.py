"""
Flask web server - 네이버 + 구글 키워드 검색량 통합 조회
"""

import io
import pandas as pd
from flask import Flask, render_template, request, send_file
from dotenv import load_dotenv
import keyword_tool as naver
import google_keyword_tool as google_tool

load_dotenv()

app = Flask(__name__)

# 네이버 결과에서 구글 조회할 최대 키워드 수 (너무 많으면 느림)
GOOGLE_LOOKUP_LIMIT = 100


def _merge_results(naver_df: pd.DataFrame, google_map: dict) -> pd.DataFrame:
    """네이버 결과 기준으로 구글 검색량 병합"""
    def fill_google(row):
        g = google_map.get(row['키워드'], {})
        row['구글 월간검색수'] = g.get('구글 월간검색수', 0)
        row['구글 경쟁도'] = g.get('구글 경쟁도', '-')
        return row

    df = naver_df.apply(fill_google, axis=1)

    # 컬럼 순서 정리
    cols = ['키워드', 'PC 월간검색수', '모바일 월간검색수', '총 월간검색수',
            '구글 월간검색수', '경쟁정도', '구글 경쟁도']
    existing = [c for c in cols if c in df.columns]
    rest = [c for c in df.columns if c not in cols]
    return df[existing + rest]


@app.route('/', methods=['GET', 'POST'])
def index():
    keywords_input = request.form.get('keywords', '').strip()
    error = None
    df = None

    if request.method == 'POST':
        if not keywords_input:
            error = '키워드를 입력해주세요.'
        else:
            raw = [k.strip() for k in keywords_input.replace('\n', ',').split(',')]
            keywords = [k for k in raw if k]

            try:
                # 1. 네이버 조회
                naver_df = naver.get_keyword_stats(keywords, show_detail=1)

                if naver_df.empty:
                    error = '네이버 조회 결과가 없습니다.'
                else:
                    # 2. 네이버 결과 키워드 목록으로 구글 검색량 조회 (상위 N개)
                    lookup_keywords = naver_df['키워드'].tolist()[:GOOGLE_LOOKUP_LIMIT]
                    google_map = google_tool.get_volume_for_keywords(lookup_keywords)

                    # 3. 병합
                    df = _merge_results(naver_df, google_map)

            except Exception as e:
                error = f'오류: {str(e)}'

    table_html = None
    row_count = 0
    if df is not None and not df.empty:
        table_html = df.to_html(index=False, classes='result-table', border=0)
        row_count = len(df)

    return render_template(
        'index.html',
        table_html=table_html,
        error=error,
        keywords_input=keywords_input,
        row_count=row_count,
    )


@app.route('/download', methods=['POST'])
def download():
    keywords_input = request.form.get('keywords', '').strip()
    raw = [k.strip() for k in keywords_input.replace('\n', ',').split(',')]
    keywords = [k for k in raw if k]

    naver_df = naver.get_keyword_stats(keywords, show_detail=1)
    lookup_keywords = naver_df['키워드'].tolist()[:GOOGLE_LOOKUP_LIMIT]
    google_map = google_tool.get_volume_for_keywords(lookup_keywords)
    df = _merge_results(naver_df, google_map)

    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding='utf-8-sig')
    buf.seek(0)
    return send_file(buf, mimetype='text/csv', as_attachment=True, download_name='keyword_stats.csv')


if __name__ == '__main__':
    print('=' * 50)
    print('키워드 검색량 조회 (네이버 + 구글 통합)')
    print('http://localhost:8080')
    print('종료: Ctrl+C')
    print('=' * 50)
    app.run(debug=False, port=8080)
