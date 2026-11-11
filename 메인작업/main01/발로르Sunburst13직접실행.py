"""Main01 client for the existing local image-studio HTTP API. No image SDK or image processing."""
from pathlib import Path
from datetime import datetime
import base64,hashlib,html,json,shutil,sys,time,urllib.request,zipfile

R=Path('C:/Users/user/Desktop/Grid Defenders');H=R/'메인작업/main01/balor-sunburst13-direct-v001'
SFILE=H/'작업.json';S=json.loads(SFILE.read_text(encoding='utf-8-sig'));O=Path(S['output'])
CHAR=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
PUB=R/'게임/public/dev-previews/balor-sunburst13-main01-v001'
BASE='http://127.0.0.1:8788'
VIEW='http://localhost:5173/dev-previews/balor-sunburst13-main01-v001/index.html'

def stamp():return datetime.now().astimezone().isoformat()
def sha(b):return hashlib.sha256(b).hexdigest()
def get(route):
    with urllib.request.urlopen(BASE+route,timeout=15) as response:return json.load(response)
def save():
    S['completed']=sum(j['status']=='succeeded' for j in S['jobs'])
    S['failed']=sum(j['status']=='failed' for j in S['jobs'])
    S['updatedAt']=stamp()
    SFILE.write_text(json.dumps(S,ensure_ascii=False,indent=2),encoding='utf-8')
    (O/'manifest.json').write_text(json.dumps(S,ensure_ascii=False,indent=2),encoding='utf-8')
def publish():
    PUB.mkdir(parents=True,exist_ok=True);cards=[]
    for j in S['jobs']:
        title=f"{j['number']:02} · {j['label']} · {j['camera']}°"
        if j['status']=='succeeded':
            original=Path(j['outputFile']);target=PUB/original.name
            if not target.exists():shutil.copyfile(original,target)
            else:assert target.read_bytes()==original.read_bytes()
            ptarget=PUB/Path(j['promptFile']).name
            shutil.copyfile(j['promptFile'],ptarget)
            content=f'<a href="{original.name}" target="_blank"><img loading="lazy" src="{original.name}" alt="{html.escape(title)} 원본 시트"></a><p><a href="{original.name}" download>원본 PNG 받기</a> · <a href="{ptarget.name}" target="_blank">메인1 작성 프롬프트</a></p>'
        elif j['status']=='failed':content='<p>생성 실패 — 원본 없음</p>'
        else:content='<p>생성 중</p>'
        cards.append(f'<article><h2>{html.escape(title)}</h2>{content}</article>')
    doc='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>발로르 Sunburst13개 생성 원본</title><style>body{margin:24px;background:#171a21;color:#edf1f8;font:16px/1.6 system-ui}h1{font-size:25px}h2{font-size:17px}a{color:#acd4ff}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:16px}article{border:1px solid #4b5262;border-radius:12px;padding:16px;min-width:0}img{display:block;width:100%;height:auto;background:#d2d7df}p{margin:8px 0}</style>'
    doc+=f'<h1>발로르 Sunburst13개 생성 원본</h1><p>메인1 직접 작성 · gpt-image-2.6-sunburst · 검수·선별·보정 없이 원본 전달</p><p>{S["completed"]}/13개 도착</p>'
    if (O/'balor-sunburst13-originals.zip').is_file():
        shutil.copyfile(O/'balor-sunburst13-originals.zip',PUB/'balor-sunburst13-originals.zip');doc+='<p><a href="balor-sunburst13-originals.zip" download>전체 원본·프롬프트 ZIP 받기</a></p>'
    doc+='<main>'+''.join(cards)+'</main></html>'
    (PUB/'index.html').write_text(doc,encoding='utf-8')

status=get('/api/status')
assert status.get('keyConfigured'),'기존 스튜디오의 키 연결 없음. 이미지 요청하지 않음.'
assert any(p.get('model')=='gpt-image-2.6-sunburst' for p in status.get('presets',[]))
if status.get('activeJob') and not any(j['requestId']==status['activeJob']['id'] for j in S['jobs']):
    raise SystemExit('다른 스튜디오 작업 진행 중. 중복/동시 생성하지 않음.')
S['state']='generating';save();publish()
print(json.dumps({'state':'started','task':S['task'],'model':S['model'],'count':13,'viewer':VIEW},ensure_ascii=False),flush=True)

for j in S['jobs']:
    if j['status']=='succeeded':continue
    if j['status']=='failed':raise SystemExit('이전 실패 기록 있음. 자동 재시도하지 않음.')
    if j['status']=='posting_unknown':raise SystemExit('이전 POST 결과 불명. 자동 재요청하지 않음.')
    if j['status']=='prepared':
        references=[O/'references'/name for name in j['referenceNames']]
        if j['precedingSheet']:
            prior=S['jobs'][j['precedingSheet']-1]
            assert prior['status']=='succeeded'
            references.append(Path(prior['outputFile']))
        uploads=[];attached=[]
        for p in references:
            data=p.read_bytes();assert len(data)<=12*1024*1024
            uploads.append({'name':p.name,'data':base64.b64encode(data).decode('ascii')})
            attached.append({'name':p.name,'sha256':sha(data),'bytes':len(data),'source':str(p)})
        prompt=Path(j['promptFile']).read_text(encoding='utf-8')
        if j['precedingSheet']:
            prompt+='\n\nLAST REFERENCE IMAGE: the complete twelve-cell preceding-action sheet. Its BOTTOM-RIGHT cell is the exact final pose to continue from in frame1. Read only that final pose as the start; retain the authoritative character design and current camera described above.'
            Path(j['promptFile']).write_text(prompt,encoding='utf-8')
            j['promptSha256']=sha(prompt.encode())
        j.update(status='posting_unknown',submittedAt=stamp(),attachedReferences=attached)
        save()
        body={'requestId':j['requestId'],'preset':j['preset'],'prompt':prompt,'size':j['size'],'background':'transparent','references':[],'uploads':uploads}
        token=get('/api/status')['csrfToken']
        req=urllib.request.Request(BASE+'/api/generate',data=json.dumps(body).encode('utf-8'),headers={'Content-Type':'application/json','x-studio-token':token},method='POST')
        try:
            with urllib.request.urlopen(req,timeout=45) as response:receipt=json.load(response)
        except Exception as exc:
            j['postError']=str(exc);S['state']='post_outcome_unknown';save();raise
        job=receipt['job'];assert job['id']==j['requestId'] and job['model']=='gpt-image-2.6-sunburst'
        j['status']='running';j['receipt']=job;S['apiPosts']+=1;save()
        print(json.dumps({'number':j['number'],'action':j['label'],'state':'submitted','requestId':j['requestId'],'model':job['model']},ensure_ascii=False),flush=True)
    last_heartbeat=0
    while True:
        job=get('/api/jobs/'+j['requestId'])['job']
        if job['status']=='succeeded':
            source=CHAR/job['outputPath'];data=source.read_bytes()
            target=Path(j['outputFile'])
            if target.exists():assert target.read_bytes()==data
            else:target.write_bytes(data)
            metadata=json.loads((source.parent/'metadata.json').read_text(encoding='utf-8-sig'))
            (H/(j['id']+'-request.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
            j.update(status='succeeded',finishedAt=stamp(),sourceOutput=str(source),sha256=sha(data),bytes=len(data),responseModel=metadata.get('response',{}).get('model'),usage=metadata.get('response',{}).get('usage'),cost=metadata.get('response',{}).get('cost'),apiRequestId=metadata.get('requestId'),artReviewed=False,postprocessed=False)
            save();publish()
            with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write(f'\n{stamp()} / {j["number"]:02} {j["label"]} 원본 수신·검수 없이 복사/게시. API request {j["apiRequestId"]}.\n')
            print(json.dumps({'number':j['number'],'action':j['label'],'state':'original_received','completed':S['completed'],'file':str(target),'viewer':VIEW},ensure_ascii=False),flush=True)
            break
        if job['status']=='failed':
            j.update(status='failed',error=job.get('error'));S['state']='failed_no_retry';save();publish()
            print(json.dumps({'number':j['number'],'state':'failed_no_retry','error':job.get('error'),'completed':S['completed']},ensure_ascii=False),flush=True)
            raise SystemExit(1)
        if time.monotonic()-last_heartbeat>=25:
            print(json.dumps({'number':j['number'],'action':j['label'],'state':'generating','completed':S['completed'],'elapsedSeconds':round((datetime.now().astimezone()-datetime.fromisoformat(j['submittedAt'])).total_seconds())},ensure_ascii=False),flush=True);last_heartbeat=time.monotonic()
        time.sleep(5)

S['state']='all_originals_received';S['completedAt']=stamp();save()
with zipfile.ZipFile(O/'balor-sunburst13-originals.zip','w',compression=zipfile.ZIP_STORED) as z:
    for j in S['jobs']:
        z.write(j['outputFile'],'originals/'+Path(j['outputFile']).name)
        z.write(j['promptFile'],'prompts/'+Path(j['promptFile']).name)
    z.write(O/'manifest.json','manifest.json')
publish()
(H/'결과보고.md').write_text('# 메인1 직접 Sunburst13개 원본 전달\n\n'+S['task']+'\n\n사용자 지정 gpt-image-2.6-sunburst/high로13개 동작을 직접 요청해13개 원본을 받았다. main01이 프롬프트 작성과 로컬 기존 스튜디오 호출을 직접 수행했고 팀장/하위 에이전트 위임0이다. 검수·선별·보정·추가 생성·자동 재시도·모델 대체0. 원본PNG는 응답 저장 바이트 그대로이며 요청/참조SHA/usage를 작업.json과 요청 기록에 남겼다. 응답 비용 미보고는 미상이며 무료/0원 뜻이 아니다.\n\n원본/프롬프트: '+str(O)+'\n보기: '+VIEW+'\n\n사용자 미적 합격·게임 통합·공방 신규 시트 반영은 수행하지 않았다. 기존 원본·실게임·사용자 화면·Git 변경0.\n',encoding='utf-8')
print(json.dumps({'state':S['state'],'completed':13,'apiPosts':S['apiPosts'],'viewer':VIEW,'zip':str(O/'balor-sunburst13-originals.zip')},ensure_ascii=False),flush=True)
