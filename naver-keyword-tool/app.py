"""
Flask web server for Keyword Search Volume Tool
네이버 / 구글 키워드 검색량을 로컬 브라우저에서 조회하는 웹 인터페이스
"""

import io
from flask import Flask, render_template, request, send_file
from dotenv import load_dotenv
import keyword_tool as naver
import google_keyword_tool as google

load_dotenv()

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
    platform = request.form.get('platform', 'naver')
    keywords_input = request.form.get('keywords', '').strip()
    show_detail = int(request.form.get('show_detail', 1))

    df = None
    error = None

    if request.method == 'POST' and keywords_input:
        raw = [k.strip() for k in keywords_input.replace('\n', ',').split(',')]
        keywords = [k for k in raw if k]

        try:
            if platform == 'naver':
                df = naver.get_keyword_stats(keywords, show_detail=show_detail)
            else:
                df = google.get_keyword_stats(keywords)

            if df is not None and df.empty:
                error = '조회 결과가 없습니다.'
        except ValueError as e:
            error = str(e)
        except Exception as e:
            error = f'API 오류: {str(e)}'
    elif request.method == 'POST':
        error = '키워드를 입력해주세요.'

    table_html = None
    row_count = 0
    if df is not None and not df.empty:
        table_html = df.to_html(index=False, classes='result-table', border=1)
        row_count = len(df)

    return render_template(
        'index.html',
        platform=platform,
        table_html=table_html,
        error=error,
        keywords_input=keywords_input,
        show_detail=show_detail,
        row_count=row_count,
    )


@app.route('/download', methods=['POST'])
def download():
    platform = request.form.get('platform', 'naver')
    keywords_input = request.form.get('keywords', '').strip()
    show_detail = int(request.form.get('show_detail', 1))

    raw = [k.strip() for k in keywords_input.replace('\n', ',').split(',')]
    keywords = [k for k in raw if k]

    if platform == 'naver':
        df = naver.get_keyword_stats(keywords, show_detail=show_detail)
        filename = 'naver_keyword_stats.csv'
    else:
        df = google.get_keyword_stats(keywords)
        filename = 'google_keyword_stats.csv'

    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding='utf-8-sig')
    buf.seek(0)

    return send_file(buf, mimetype='text/csv', as_attachment=True, download_name=filename)


if __name__ == '__main__':
    print('=' * 50)
    print('키워드 검색량 조회 도구 (네이버 + 구글)')
    print('브라우저에서 http://localhost:8080 접속')
    print('종료: Ctrl+C')
    print('=' * 50)
    app.run(debug=False, port=8080)
