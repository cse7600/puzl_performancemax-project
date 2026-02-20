"""
Flask web server for Naver Keyword Search Volume Tool
로컬 브라우저에서 키워드 검색량을 조회하는 웹 인터페이스
"""

import io
import os
from flask import Flask, render_template, request, send_file
from keyword_tool import get_keyword_stats
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
    df = None
    error = None
    keywords_input = ''

    if request.method == 'POST':
        keywords_input = request.form.get('keywords', '').strip()
        show_detail = int(request.form.get('show_detail', 1))

        if not keywords_input:
            error = '키워드를 입력해주세요.'
        else:
            # 줄바꿈 또는 콤마로 구분 허용
            raw = [k.strip() for k in keywords_input.replace('\n', ',').split(',')]
            keywords = [k for k in raw if k]

            try:
                df = get_keyword_stats(keywords, show_detail=show_detail)
                if df.empty:
                    error = '조회 결과가 없습니다.'
            except ValueError as e:
                error = str(e)
            except Exception as e:
                error = f'API 오류: {str(e)}'

    table_html = None
    if df is not None and not df.empty:
        table_html = df.to_html(
            index=False,
            classes='result-table',
            border=1,
        )

    return render_template(
        'index.html',
        table_html=table_html,
        error=error,
        keywords_input=keywords_input,
        row_count=len(df) if df is not None and not df.empty else 0,
    )


@app.route('/download', methods=['POST'])
def download():
    keywords_input = request.form.get('keywords', '').strip()
    show_detail = int(request.form.get('show_detail', 1))

    raw = [k.strip() for k in keywords_input.replace('\n', ',').split(',')]
    keywords = [k for k in raw if k]

    df = get_keyword_stats(keywords, show_detail=show_detail)

    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding='utf-8-sig')
    buf.seek(0)

    return send_file(
        buf,
        mimetype='text/csv',
        as_attachment=True,
        download_name='keyword_stats.csv',
    )


if __name__ == '__main__':
    print('=' * 50)
    print('네이버 키워드 검색량 조회 도구')
    print('브라우저에서 http://localhost:8080 접속')
    print('종료: Ctrl+C')
    print('=' * 50)
    app.run(debug=False, port=8080)
