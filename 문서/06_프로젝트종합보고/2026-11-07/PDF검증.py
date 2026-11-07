"""PDF 출력 후 페이지·텍스트·잘림을 점검한다. QA용 임시 PyMuPDF 설치를 사용한다."""
from pathlib import Path
import os,sys,json
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(Path(os.environ['TEMP'])/'grid-defenders-pdf-qa'))
import pymupdf
rows=[]
for name in ['프로젝트종합보고서','발표핵심요약']:
    doc=pymupdf.open(HERE/(name+'.pdf'))
    pages=[]
    for i,page in enumerate(doc):
        text=page.get_text()
        outside=[]
        for b in page.get_text('dict')['blocks']:
            if b['type']!=0:continue
            for line in b['lines']:
                for span in line['spans']:
                    r=pymupdf.Rect(span['bbox'])
                    if r.x0<0 or r.y0<0 or r.x1>page.rect.width+1 or r.y1>page.rect.height+1:outside.append(span['text'])
        pages.append({'page':i+1,'width':round(page.rect.width,2),'height':round(page.rect.height,2),'textChars':len(text),'outOfPageText':outside,'firstLine':text.splitlines()[0] if text else ''})
    for idx in sorted(set([0,len(doc)//2,len(doc)-1])):
        dest=Path(os.environ['TEMP'])/f'grid-defenders-{name}-{idx+1}.png'
        doc[idx].get_pixmap(matrix=pymupdf.Matrix(1.5,1.5)).save(dest)
    rows.append({'file':name+'.pdf','pages':len(doc),'noEmptyPages':all(p['textChars']>100 for p in pages),'noOutOfPageText':all(not p['outOfPageText'] for p in pages),'localServerLinks':sum('127.0.0.1:5196' in l.get('uri','') for p in doc for l in p.get_links()),'detail':pages})
(HERE/'PDF검증.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(rows,ensure_ascii=False,indent=2))
