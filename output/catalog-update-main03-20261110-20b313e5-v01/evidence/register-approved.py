from pathlib import Path
from PIL import Image
import json,hashlib,datetime
R=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2');W=R.parent/'스플래시-아트';S=Path('C:/Users/user/Desktop/Grid Defenders/작업관리');O=Path(__file__).resolve().parents[1]
def rel(p):return Path(__import__('os').path.relpath(p,R)).as_posix()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def meta(p):
 with Image.open(p) as im:
  has='A' in im.getbands();transparent=has and im.getchannel('A').getextrema()[0]==0 and im.getchannel('A').getextrema()[1]>=240
  return {'path':rel(p),'sha256':sha(p),'width':im.width,'height':im.height,'transparentBackground':transparent,'alphaChannel':has,'bytes':p.stat().st_size}
balorApproval=S/'작업/MAIN03-20261109-21F94B82/사용자합격-v002.md';newApproval=S/'작업/MAIN03-20261109-5F7D5052/담당창전달_사용자합격.md'
profiles=[]
for n,features in [('n01','검은 머리·보라 눈·검은 겹옷의 신규 남성'),('n02','옅은 분홍 머리·붉은 눈·분홍 드레스·소품을 지닌 신규 여성')]:
 profiles.append({'id':'splash_'+n,'name':n.upper(),'display_name':n.upper()+' · 신규 '+('남성' if n=='n01' else '여성'),'features':features,'origin_id':'unassigned','affiliation_ids':[],'class_id':'unassigned','profession':None,'weapons':[],'attack_disciplines':[],'placement_status':'unassigned','class_basis':'사용자 미지정; 외형으로 직업추정하지 않음','production_state':'illustration_provisionally_accepted','illustration_concept_approved':True,'approval_quote':'신규남녀 일단 합격','approval_source':rel(newApproval),'style_master_approved':False})
assets=[]
for c in ['balor','n01','n02']:
 folder=W/'output'/('balor-gc9-retry-20261109-v02' if c=='balor' else 'gc9-new-two-six-views-v01')
 names=['front'] if c=='balor' else ['front','right_threequarter','right_profile']
 for view in names:
  p=folder/(('front.png') if c=='balor' else 'images/'+c+'_'+view+'.png');v={'front':'front','right_threequarter':'front_right','right_profile':'right'}[view];label={'front':'정면','right_threequarter':'화면 오른쪽 3/4 약45°','right_profile':'화면 오른쪽 정측면90°'}[view];approval=balorApproval if c=='balor' else newApproval
  links=[{'label':'사용자 일단합격 근거','path':rel(approval)},{'label':'제작 비교·검수','path':rel(folder/'index.html')},{'label':'제작 기준','path':rel(folder/'제작기준.md')},{'label':'검수 결과','path':rel(folder/'검수결과.md')},{'label':'생성 기록','path':rel(folder/'generation-record.json')}]
  if not (folder/'generation-record.json').exists():links[-1]['path']=rel(folder/'generation-records.json')
  ch='balor' if c=='balor' else 'splash_'+c
  x={'collection':'balor' if c=='balor' else 'splashApproved','character':ch,'role':'created','status':'current','view':v,'angle':{'front':0,'front_right':45,'right':90}[v],'version':2 if c=='balor' else 1,'display_order':{'front':0,'front_right':1,'right':2}[v],'artifact_stage':'concept' if c=='balor' else 'direction_set','series':ch+':accepted_illustration:'+v,'title':('발로르 · 선택 일러스트 v02' if c=='balor' else c.upper()+' · 신규 '+('남성' if c=='n01' else '여성'))+' · '+label+' · 일단 합격','description':'사용자 선택·일단 합격된 GC9 일러스트; 원본파일·제작출처 보존','review_note':('수정후 버전 선택 · 일단 합격 · 여백/저알파 기술미달 잔여 · 어깨 갑주 노출/측면 사자 전신' if c=='balor' else '신규남녀 일단 합격 · 이름·출신·소속·직업 미지정 · 원본 3방향 일러스트'),'approval_state':'provisionally_accepted_by_user','approval_quote':'수정후 버전으로 선택 했고 일단 합격처리' if c=='balor' else '신규남녀 일단 합격','approval_source':rel(approval),'style_validation_status':'provisionally_accepted_by_user','decision_status':'selected_illustration','future_reference_allowed':False,'common_style_master_approved':False,'gc9_applied':True,'helmet_state':'off' if c=='balor' else None,'links':links,'search_tags':['일러스트','일단 합격','선택본',c.upper(),label],'technical_review_status':'safe_area_and_low_alpha_residue' if c=='balor' else 'production_checks_completed','source_filename':p.name,'source_task':'MAIN03-20261109-21F94B82' if c=='balor' else 'MAIN03-20261109-5F7D5052','source_iteration':2 if c=='balor' else 1}
  assets.append({'metadata':meta(p),'classification':x})
patch={'illustration_style_status':'provisionally_accepted_by_user','production_state':'illustration_v02_provisionally_accepted_sd_reviews_separate','illustration_concept_approved':True,'illustration_latest_revision_approved':True,'illustration_current_views':['front'],'illustration_revision':2,'illustration_concept_view':'front','illustration_view_revisions':{'front':'splash_retry_v02'},'approval_quote':'수정후 버전으로 선택 했고 일단 합격처리','approval_source':rel(balorApproval),'historical_illustration_style_status':'rejected_by_user','sd_latest_review_note':'발로르 SD3종 불합격·대기; 신규SD마스터 별도미검토; 기존SD선택이력과 구분'}
d={'task':'MAIN03-20261110-20B313E5','updated_on':'2026-11-10','profiles':profiles,'profile_updates':{'balor':patch},'source_groups':[['splashApproved','신규 남녀 · 합격 일러스트3방향','splash 원본 연결','GC9',21]],'assets':assets,'excluded':['MAIN03-20261109-5133411E 발로르 SD3종: 불합격·대기; 이번신규연결 없음','MAIN01-20261110-D820F076 신규 발로르SD마스터: 미검토; 이번연결없음']}
for a in assets:
 for l in a['classification']['links']:
  assert (R/l['path']).exists(),l['path']
(R/'output/characters/catalog/approved-splash-assets.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(O/'evidence/approved-inputs.json').write_text(json.dumps([a['metadata'] for a in assets],ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'registered':len(assets),'profiles':len(profiles),'all_source_links_exist':True}))
