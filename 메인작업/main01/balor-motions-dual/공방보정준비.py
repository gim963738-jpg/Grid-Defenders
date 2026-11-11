from pathlib import Path
import hashlib
import importlib.util
import json

R = Path('C:/Users/user/Desktop/Grid Defenders')
S = R / '작업관리'
H = R / '메인작업/main01/balor-motions-dual/workshop-correction-v001'
W = Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트')
B = Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_balor/motions_dual_main01-20261111-9b2c9cfe_v001')
Q = Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output/character-effect-workshop_final_main01-20261111-3a680e78_v003')
H.mkdir(exist_ok=True)
if (H / '연결.json').exists():
    raise SystemExit('이미 준비된 작업이 있습니다. 중복 등록하지 않습니다.')

def read(p):
    return json.loads(Path(p).read_text(encoding='utf-8-sig'))

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def write(p, d):
    Path(p).write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')

spec = importlib.util.spec_from_file_location('board', S / '도구/작업대장.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
b = m.Board(S)
manifest = read(B / 'asset-manifest.json')
inputs = []
for a in manifest['assets']:
    if a['actor'] == 'balor' and a['id'].startswith(('02-', '03-', '04-')):
        p = B / a['file']
        assert sha(p) == a['sha256']
        inputs.append({**a, 'path': str(p)})
assert len(inputs) == 6 and sum(len(a['frames']) for a in inputs) == 72
write(H / '입력원본.json', inputs)

products = []
for a in read(Q / 'target-hashes-after.json'):
    assert sha(a['path']) == a['after'] == a['expected']
    products.append({'path': a['path'], 'sha256': a['after']})
write(H / '공방입력버전.json', products)

proof = '''# 발로르 공방 보정 — 사용자 피드백과 실제 진행 승인

사용자 피드백:
> 궤적이 부족하면 여백을 늘리거나 이미지를 줄이면되는거아냐?
> 이것도
> 이거는 내가 조금씩 조절할수있을것같은데

사용자 추가 요청:
> 더 좋은방법있으면 제안해봐

main01이 직전에 제시한 제안:
제가 먼저 보정한 초안을 준비하고, 사용자는 재생하면서 미세 조정한다.
원본·보정본을 같은 프레임으로 나란히 비교한다. 몸과 발 기준으로 정렬하되
웅크림·점프를 유지하고 무기를 포함한 전체 높이로 체격을 맞추지 않는다.
동작 전체의 충분한 표시 여백과 일정한 배율을 유지하고 원본과 보정값을 분리한다.
추가 기능으로 프레임별 검끝 위치를 선으로 연결하는 검끝 궤적 표시를 제안했다.
우선 대기·횡베기·종베기 3개 동작으로 확인하며 진행 후 절차 확인·하달한다고 안내했다.

그 제안 다음 사용자의 실제 실행 지시:
> 발로르 작업 진행해봐

이번 확정 범위: 기존 발로르 내장·2.6의 대기/횡베기/종베기 3동작씩 6시트를
기존 공방에 연결하고 보정 초안, 원본/보정 동시 비교와 수동 검끝 궤적 표시를 제공한다.
새 이미지 생성이나2.6 호출 승인이 아니다. 원본의 failed 품질 판정은 보존하되
직접 보정 가능한 초안을 제공하며 최종 미적 합격·속도·내장/2.6 선택은 사용자가 한다.
추가 동작 제작·원화 수정·실게임 발로르 적용·Git 저장은 이번 범위에 없다.
'''
(H / '사용자확인.md').write_text(proof, encoding='utf-8')

task = b.new('main01', 'effects', '발로르 3동작 공방 보정 초안·원본 비교·검끝 궤적', proof)
tid = task['id']
F = b.folder(tid)
out = W / 'output' / ('balor-workshop-correction_' + tid.lower() + '_v001')
prompt = f'''# {tid} / 차수1 / effects — 발로르 기존 시트 공방 보정
main01 run_47ce1a81d7b1. 원시트 제작 MAIN01-20261111-9B2C9CFE는 품질 failed 반환으로 보존합니다.
원공방 MAIN01-20261111-47B7186F는 v003 최종 독립 QA MAIN01-20261111-3A680E78 기술 PASS입니다.
현재 승인 근거 {H / '사용자확인.md'}의 실제 “발로르 작업 진행해봐”에 따라 앞선 제안을 구현합니다.
같은 승인을 다시 묻지 말고 새 read-pack 본문 → 문서별 적용/현재 SHA ACK → start 후 착수하세요.

담당과 입력:
- 편집 담당은 effects 한 곳입니다. 기존 {W / '게임'}의 캐릭터 합성 공방과 필요한 새 리소스/메타만 수정합니다.
- {H / '공방입력버전.json'}과 최종 QA report.md의 현재 v003 고정본을 대조하고 시작 사본/변경 전 SHA를 보존합니다.
- 원본 {B}, report.md/검수.md/asset-manifest.json을 읽고 실제 6시트를 열어 봅니다.
- {H / '입력원본.json'}은 내장·image26 × 02대기35/03횡베기35/04종베기35의 6시트/72프레임입니다.
  기록된 frameRects를 사용하며 틀린 격자 추정으로 옆 그림을 포함하지 않습니다. 원래 root/bodyHeight는 추정값이라는 한계를 보존합니다.
- 원본 PNG는 읽기 전용, 필요 시 자기 public/actor-corrections/balor-v001/에 바이트 복사하고 SHA를 확인합니다.
  public JS를 source import하지 않습니다. 메타 JSON/PNG를 안전하게 읽는 기존 입력 경로를 사용합니다.

만들 결과:
1. 기존 공방에서 “발로르 보정 초안”을 불러오면 내장/2.6의 세 동작을 쉽게 선택하고 직접 편집할 수 있어야 합니다.
   에셋 포함 JSON도 제공해 별도 새 브라우저에서 독립 복구할 수 있게 합니다. 옛 금발 데모와 사용자 작업은 유지합니다.
2. 6개 동작에 실제 1차 보정값을 준비합니다. 기준 전투태세의 몸통/머리 비례·발 접지를 보고 위치/등비 배율의
   명백한 생성 흔들림만 보정합니다. 웅크림·체중이동·발 디딤·팔/무기 궤적은 의도된 포즈로 보존합니다.
   매 프레임 alpha 전체 bbox 높이에 맞춰 크기를 정규화하거나 검 길이로 몸키를 재지 않습니다.
   기준값, 프레임별 offset/scale, 판단 근거를 데이터와 표로 남기고 사용자가 고치거나 원래대로 돌릴 수 있게 합니다.
   변화가 필요 없는 프레임은 근거와 함께 그대로 둘 수 있으나 원본을 그대로 복사한 것을 보정 완성이라고 하지 않습니다.
3. 원본/보정본을 나란히 같은 동작·프레임·시간·관찰 배율로 동기 비교합니다. 왼쪽 원본은 손대지 않은 입력을,
   오른쪽은 현재 편집 보정값을 보여줍니다. 앞뒤 겹침/기준 프레임과 현재 드래그/숫자/키보드 편집은 계속 동작해야 합니다.
4. 동작 중 가장 넓은 포즈까지 표시할 수 있게 공통 보기 영역/여백을 확보합니다. 프레임마다 자동 줌을 바꾸지 않습니다.
   본체 기준 72 CSSpx·표시3번·등비 크기 원칙은 유지합니다. 별도 관찰용 축소/확대는 양쪽 비교에 같게 적용합니다.
   표시 클립과 원본 셀 경계에서 이미 사라진 부분을 구분해 기록합니다. 원본 잘림은 표기하고 사용 가능한 나머지 초안은 제공합니다.
   새 여백을 만들며 옆 셀의 검을 가져오거나 없는 검끝을 코드/AI로 다시 그리거나 픽셀을 지워 숨기지 않습니다.
5. 수동 “검끝” 부착점을 프레임별로 확인·입력하고 선으로 연결하는 궤적 표시를 추가합니다.
   현재 프레임과 순서를 식별하며 원본/보정 좌표의 차이를 같은 변환에서 확인할 수 있어야 합니다.
   점은 사용자가 찍거나 고칠 수 있고, 보정 offset/scale/root 및 관찰 확대·DPR을 정확히 따릅니다.
   검끝이 원본에서 안 보이는 프레임은 미지정으로 표시하고 불명확한 곳을 자동 추적 성공으로 표시하지 않습니다.
   미지정 구간을 건너뛰어 실제 없는 궤적을 잇지 않습니다. 기존 points/export/load/undo 계약을 유지합니다.

사용자 평가 기준:
현재는 미술 전부를 AI가 다시 합격시켜 내는 단계가 아닙니다. 보정 가능한 초안을 공방에서 직접 보고 맞추는 것이 목적입니다.
횡베기 인상/잘린 무기 등 원본 한계는 관찰과 함께 남기되 원작업 전체를 또 중단하는 이유로 삼지 않습니다.
재생 속도는 입력 원래 값을 유지하고 사용자가 선택합니다. 이미지 미적 합격이나 모든 결함 해결을 선언하지 않습니다.

검증/범위:
- 원본6PNG 직접 SHA 보존, 6동작/72프레임의 올바른 매핑·원본 vs 보정 한쪽만 수정되는 독립성·동기 시각·초기화/undo/redo를 검사합니다.
- 비영점 offset/scale와 점을 손계산한 좌표로 검증하고 궤적 갭/선택 프레임·확대/DPR2·72CSS/명암/공방 필드에서 확인합니다.
- 에셋 포함 문서 실제 내보내기→새 독립 문맥 파일 입력 복구, 실패 입력 문서/이력 보존을 확인합니다.
- 과거 QA01 효과 소수 시간 경계, QA02 points/keys 레코드 거부, QA03 정확0.3초 loop index0/첫 프레임 픽셀 회귀를 유지합니다.
  관련 모델/check/build와 실제 브라우저 검사를 하되 이미 통과한 전체 수백 검사를 의미 없이 반복하지 않습니다.
- 현재 공통 모바일 조작/48px·320/390에서 새 비교/궤적 조작에 접근할 수 있게 합니다. 기존 화면을 작게 축소해 맞추지 않습니다.
- 자기 기존5182를 재사용하고 별도 headless 새 문맥만 검사합니다. 사용자 창/탭/프로필·저장소·다른 서버는 조작하지 않습니다.

생성 API, 내장 이미지 생성, GPT Image2.6, 영상, 새로운 파츠/리깅/무기 재도색, 의존성 설치, Git 커밋/푸시는 모두0입니다.
발로르 다른10동작/거인, root5173 실게임·진행 저장·전장 간격 작업, 타팀/캐릭터 원본·공유 규정은 수정하지 않습니다.
사용자 작품/기존 공방 v003·최종 QA 증거를 보존하고 필요한 정확한 코드/메타/새 복사본만 변경합니다.
새 결과 {out}에 5종 기록, 전후 SHA/변경 목록/patch, 편집 가능한 초안 JSON,
프레임 보정표·검끝 점/한계, 원본 대비 명암/72CSS/필드 화면과 실제 검증/미검증을 취합합니다.
완료 후 공식 새 Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 실제 outcome·원작업/차수·보고 경로를 반환합니다.
독립 테스터 재검증은 main01이 별도로 연결합니다. 작업 중 근거가 다른 곳에 있으면 스스로 탐색하되 새 승인을 반복하지 않습니다.
'''
pre = '''main01 작업 방법·규정A·팀장/단일메인 운영·파일담당·진행/2.6/저장 규칙과 effects 규정/방법을 본문으로 확인했다.
도메인/조직의 effects가 공방 코드·메타 책임이며, 캐릭터팀의 생성 원본은 읽기 전용이다.
발로르 기존6시트72프레임의 실제 SHA가 manifest와 일치하고 공방 독립 QA v003의18기록 현재 SHA도 일치한다.
effects 작업 잠금 충돌은 prepare에서 확인하고 마지막 정상 반환 ctx_622d9292f7e8의 같은 main01 담당에게 이어 보낸다.
사용자가 보정안을 듣고 실제 진행을 지시했으므로 새 생성/유료 호출 없이 확인된 범위의 공방 구현·초안을 맡긴다.
원본 실패 판정과 사용자 미적 합격을 보존하며 사용자가 직접 고칠 수 있는 결과를 완료 기준으로 한다.
'''
(F / '요청확인.md').write_text(proof, encoding='utf-8')
(F / '전문프롬프트.md').write_text(prompt, encoding='utf-8')
docs = {
 '1_대화기록.md': proof,
 '2_사전확인.md': pre,
 '3_작업일지.md': '실제 진행 승인 기록, 원본6시트/공방 현재 SHA 대조 후 effects 전문 지시를 준비했다. prepare와 실제 발송은 구분한다.',
 '4_정의문서.md': '발로르 대기/횡베기/종베기 기존 A/B6시트. 원본 보존+보정 초안+동기 비교+수동 검끝 궤적. 기본72CSS/표시3, 최종 판단/속도는 사용자.',
 '5_버전관리.md': '원작업 failed와 공방v003 QA PASS 보존. 이번 후속은 새 이미지 생성0/원본 변경0/실게임 반영0/Git0. 작업번호·전후SHA·공식 영수증·후속 독립QA로 연결.'
}
for name, body in docs.items():
    content = '# ' + tid + ' / 차수1\n\n' + body + '\n'
    (F / name).write_text(content, encoding='utf-8')
    (H / name).write_text(content, encoding='utf-8')
extras = [H/'사용자확인.md', H/'입력원본.json', H/'공방입력버전.json',
          B/'report.md', B/'검수.md', B/'asset-manifest.json', Q/'report.md',
          W/'게임/src/effect-workshop/ACTOR-README.md', S/'단일메인운영규정.md',
          S/'기준/characters/SD_72CSSpx_표시기준.md', R/'문서/00_개발규칙/스킬구현규약.md',
          R/'문서/00_개발규칙/모바일UI규격.md', S/'이미지2.6사용규칙.md', S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid, 'main01', [str(p) for p in extras])
b.confirm(tid, 'main01', '발로르 작업 진행해봐', H/'사용자확인.md')
plan = b.prepare(tid, 'main01')
c = {'task': tid, 'iteration': 1, 'parentArtTask': 'MAIN01-20261111-9B2C9CFE',
     'parentWorkshopTask': 'MAIN01-20261111-47B7186F', 'folder': str(F), 'output': str(out),
     'plan': plan, 'state': 'prepared_not_sent', 'targetDispatch': 'ctx_622d9292f7e8',
     'imageGenerationAllowed': False, 'rootGameIntegrationAllowed': False, 'userAccepted': False}
write(H/'연결.json', c)
print(json.dumps({'task': tid, 'state': c['state'], 'prompt': plan['prompt'],
                  'sheets': len(inputs), 'frames': 72}, ensure_ascii=False))
