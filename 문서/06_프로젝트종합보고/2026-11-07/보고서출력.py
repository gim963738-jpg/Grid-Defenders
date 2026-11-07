"""표준 라이브러리만으로 보고서 Markdown을 읽기·인쇄용 HTML로 만든다.

지원 범위는 이 보고서에서 쓰는 제목/문단/목록/표/코드/링크/강조다.
외부 리소스나 게임 의존성을 설치하지 않는다. HTML에서 인쇄하면 PDF로 저장할 수 있다.
"""
from pathlib import Path
import html
import re

HERE=Path(__file__).resolve().parent

def inline(s):
    s=html.escape(s)
    tokens=[]
    def keep(x):
        tokens.append(x)
        return '\x00'+str(len(tokens)-1)+'\x00'
    s=re.sub(r'`([^`]+)`',lambda m:keep('<code>'+m[1]+'</code>'),s)
    s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:keep('<a href="'+m[2]+'">'+m[1]+'</a>'),s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
    s=re.sub(r'\x00(\d+)\x00',lambda m:tokens[int(m[1])],s)
    return s

def render(text):
    out=[];lines=text.splitlines();i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line: i+=1;continue
        if line.startswith('```'):
            code=[];i+=1
            while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
            out.append('<pre><code>'+html.escape('\n'.join(code))+'</code></pre>');i+=1;continue
        if re.match(r'^#{1,6} ',line):
            n=len(line.split(' ')[0]);out.append(f'<h{n}>'+inline(line[n+1:])+f'</h{n}>');i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].lstrip().startswith('|'):
                cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?',c) for c in cells):rows.append(cells)
                i+=1
            out.append('<div class="table-wrap"><table><thead><tr>'+''.join('<th>'+inline(x)+'</th>' for x in rows[0])+'</tr></thead><tbody>')
            for row in rows[1:]:out.append('<tr>'+''.join('<td>'+inline(x)+'</td>' for x in row)+'</tr>')
            out.append('</tbody></table></div>');continue
        if re.match(r'^(- |\d+\. )',line):
            ordered=line[0].isdigit();tag='ol' if ordered else 'ul';out.append('<'+tag+'>')
            while i<len(lines) and re.match(r'^(- |\d+\. )',lines[i].strip()):
                out.append('<li>'+inline(re.sub(r'^(- |\d+\. )','',lines[i].strip()))+'</li>');i+=1
            out.append('</'+tag+'>');continue
        if line=='---':out.append('<hr>');i+=1;continue
        para=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|- |\d+\. )',lines[i].strip()):para.append(lines[i].strip());i+=1
        out.append('<p>'+inline(' '.join(para))+'</p>')
    return '\n'.join(out)

CSS='''
*{box-sizing:border-box}html{background:#e8edf0;color:#172b35;font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif}body{margin:0;font-size:15px;line-height:1.8}main{max-width:1080px;margin:28px auto;background:#fff;padding:58px 62px;box-shadow:0 12px 42px #23384818}h1{font-size:32px;line-height:1.35;margin:0 0 18px;color:#123d42;border-top:7px solid #c6aa69;padding-top:20px}h2{font-size:23px;line-height:1.5;margin:44px 0 16px;color:#175459;border-bottom:2px solid #d8e6e5;padding-bottom:8px}h3{font-size:18px;margin:28px 0 10px;color:#284c55}p{margin:12px 0}strong{font-weight:700;color:#163e43}a{color:#135f78;text-decoration:none;overflow-wrap:anywhere}a:hover{text-decoration:underline}table{width:100%;border-collapse:collapse;font-size:12px;line-height:1.65;margin:14px 0 22px}thead{background:#184b50;color:white}th{font-weight:600;text-align:left;padding:10px}td{vertical-align:top;padding:10px;border-bottom:1px solid #d7e1e3;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#f2f6f6}th:first-child,td:first-child{min-width:100px}pre{background:#edf3f4;border-left:3px solid #76969a;padding:18px;font-size:12px;line-height:1.65;white-space:pre-wrap}code{font-family:Consolas,"Malgun Gothic",monospace;font-size:.9em}li{margin:5px 0}nav.toolbar{position:sticky;top:0;display:flex;gap:16px;background:#12383e;color:white;padding:10px 24px;z-index:5;font-size:13px}nav a{color:#fff}nav button{margin-left:auto;border:1px solid #a7babb;border-radius:4px;background:transparent;color:white;padding:4px 14px;cursor:pointer}.foot{color:#658087;font-size:11px;border-top:1px solid #b8cacc;padding-top:12px;margin-top:36px}.slide{break-after:page;padding:12px 0 28px}.slides main{max-width:1180px}.slides h2{margin-top:14px}.slides li{font-size:18px;margin:16px 0}.slides .slide p{font-size:15px}.slides .slide:last-child{break-after:auto}
@page{size:A4;margin:16mm 14mm 16mm} @media print{html{background:white}body{font-size:9.5pt;line-height:1.65}main{margin:0;padding:0;max-width:none;box-shadow:none}nav.toolbar{display:none}h1{font-size:24pt}h2{font-size:17pt;break-after:avoid;margin-top:24pt}h3{font-size:12pt;break-after:avoid}p,li{orphans:3;widows:3}table{font-size:8pt;line-height:1.55;page-break-inside:auto}thead{display:table-header-group;print-color-adjust:exact}tr{break-inside:avoid}td,th{padding:6pt 5pt}td:first-child,th:first-child{min-width:0}pre{font-size:8pt;break-inside:avoid}a{color:inherit}body{print-color-adjust:exact}.foot{font-size:8pt}.slides{font-size:13pt}.slides main{max-width:none}.slides h1{font-size:24pt}.slides h2{font-size:23pt}.slides li{font-size:15pt;line-height:1.8;margin:13pt 0}.slides .slide p{font-size:12pt}.slides .slide{padding:0;break-inside:avoid}.slides .slide h2{margin-top:0}}
'''

for name in ['프로젝트종합보고서','발표핵심요약','작업영역통합현황','정리최적화변경내역','검증결과']:
    path=HERE/(name+'.md')
    if not path.exists():continue
    body=render(path.read_text(encoding='utf-8-sig'))
    slides=name=='발표핵심요약'
    extra=''
    if slides:
        pieces=re.split(r'(?=<h2>)',body)
        intro=pieces.pop(0)
        # 첫 슬라이드에 문서 제목·기준일을 함께 배치한다.
        body=''.join('<section class="slide">'+(intro if i==0 else '')+p+'</section>' for i,p in enumerate(pieces))
        extra='@page{size:A4 landscape;margin:13mm 17mm}.slides h1{font-size:18pt;border-top-width:4px;padding-top:8px;margin-bottom:8px}.slides .slide:first-child>p{font-size:10pt}@media print{.slides li{font-size:12.5pt;line-height:1.55;margin:10pt 0}.slides .slide p{font-size:10.5pt;line-height:1.55;margin:8pt 0}.slides h2{font-size:21pt;margin-bottom:10pt}.slides .foot{display:none}.slides .slide hr{margin:8pt 0}.slides .slide{break-inside:avoid}}'
    page='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Grid Defenders · '+name+'</title><style>'+CSS+extra+'</style><body class="'+('slides' if slides else 'report')+'"><nav class="toolbar"><span>GRID DEFENDERS · 2026.11.07</span><a href="프로젝트종합보고서.html">종합 보고서</a><a href="발표핵심요약.html">발표 요약</a><button onclick="window.print()">인쇄 / PDF</button></nav><main>'+body+'<p class="foot">Grid Defenders · 자료 기준 2026-11-07 · 사실·제안·미확인 구분 및 검증 범위는 본문 참조</p></main></body></html>'
    (HERE/(name+'.html')).write_text(page,encoding='utf-8')
    print(name+'.html')
