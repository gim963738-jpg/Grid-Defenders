"""WEB-179 일회성 문서 이관 기록. 기존 역사 파일은 덮어쓰지 않는다."""
from pathlib import Path
import re
import os
import hashlib
import json

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
records = []
for source, target in [
    ('task.md', '문서/03_작업기록/작업목록_WEB001-178.md'),
    ('게임/README.md', '문서/03_작업기록/게임README_WEB001-178.md'),
]:
    src, dst = ROOT/source, ROOT/target
    if dst.exists():
        continue
    raw = src.read_bytes()
    text = raw.decode('utf-8-sig').replace('\r\n', '\n')
    def relocate(m):
        label, ref = m.group(1), m.group(2)
        if re.match(r'\w+://', ref) or ref.startswith('#'):
            return m.group(0)
        path, mark, anchor = ref.partition('#')
        absolute = (src.parent / path).resolve()
        relative = Path(os.path.relpath(absolute, dst.parent)).as_posix()
        return f'[{label}]({relative}{mark}{anchor})'
    adjusted = re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)', relocate, text)
    header = f'# 역사 보관본 — {source}\n\n2026-11-07 WEB-179 정리에서 보존한 WEB-178까지의 기록이다. 본문의 현재·최신·미구현은 각 작성 당시의 상태다. 원문 순서와 설명을 유지하고 Markdown 상대 링크만 보관 위치에 맞췄다. 일반 코드 표기의 경로는 원래 파일 위치 기준이다. 현재 상태는 [현재 구현 현황](../05_프로젝트정의/현재구현현황.md)을 따른다. HWP 원본의 현재 위치는 [자료/기획원본](../../자료/기획원본/게임%20기획서%20통합본%20V2.hwp)이다.\n\n---\n\n'
    dst.write_text(header+adjusted, encoding='utf-8', newline='\n')
    records.append({'source':source,'destination':target,'originalSha256':hashlib.sha256(raw).hexdigest(),'originalBytes':len(raw),'change':'historical text preserved; relative Markdown links rebased; archive header added'})
if records:
    (HERE/'문서이관_출처.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records,ensure_ascii=False,indent=2))
