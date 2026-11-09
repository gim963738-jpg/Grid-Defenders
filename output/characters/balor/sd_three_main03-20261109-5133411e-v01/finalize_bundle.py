from pathlib import Path
import json,hashlib,zipfile
ROOT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
p=ROOT/'generation-record.json'
d=json.loads(p.read_text(encoding='utf-8'))
roles=[
 ['approved_balor_identity_design','approved_SD_style_proportions_only','grip_anatomy_only','user_grip_connection_only'],
 ['new_front_SD_consistency_master','approved_balor_identity_design','approved_SD45_style_proportions_camera_only','grip_anatomy_only','user_grip_connection_only'],
 ['new_front_SD_consistency_master','approved_balor_identity_design','approved_SD90_style_proportions_camera_only','grip_anatomy_only','user_grip_connection_only'],
 ['right90_candidate_edit_target','approved_SD90_rotation_camera_only'],
 ['front_alpha_cleanup_edit_target']]
for c,rs in zip(d['calls'],roles):
 for r,role in zip(c['referenceOrder'],rs):r['role']=role
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
doctor=json.loads((ROOT/'evidence/doctor.json').read_text())
issues=[c for c in doctor['checks'] if c['status'] in ['WARN','FAIL','MISSING']]
(ROOT/'evidence/doctor-issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2),encoding='utf-8')
f=ROOT/'보고.md'
with f.open('a',encoding='utf-8') as w:
 w.write('\n\n# Capability check 원문 WARN/MISSING\n이번 host_image 경로에필요한도구는사용가능. 아래보조경로/의존성진단은숨기지않으며설치나API전환은실행하지않았다.\n\n')
 for c in issues:w.write('- ['+c['status']+'] '+c['id']+': '+c['detail']+'\n')
expected=json.loads((ROOT/'evidence/alpha-inspection.json').read_text())
checks=[]
for a in expected:checks.append(dict(file=a['file'],shaMatches=sha(ROOT/a['file'])==a['sha256']))
checks.extend(dict(file=c['file'],sourceBytesMatch=sha(ROOT/c['file'])==sha(c['source'])) for c in d['calls'])
validation=dict(task='MAIN03-20261109-5133411E',iteration=1,checks=checks,filesExist=all((ROOT/n).exists() for n in ['front.png','idle_right_045.png','right_090.png','index.html','manifest.json','generation-record.json','보고.md','제작기준.md','evidence/읽기확인.json','evidence/review-browser-canvas.png']),technicalAcceptance=False,userAcceptance=False)
(ROOT/'evidence/delivery-validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(ROOT/'originals.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in ROOT.rglob('*'):
  if p.is_file() and p.name!='originals.zip' and 'invalid' not in p.name:z.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(ROOT/'originals.zip') as z:
 assert z.testzip() is None
 for a in expected:assert hashlib.sha256(z.read(a['file'])).hexdigest()==a['sha256']
print(json.dumps(dict(validation=validation,zipEntries=len(zipfile.ZipFile(ROOT/'originals.zip').namelist()),zipSha256=sha(ROOT/'originals.zip')),ensure_ascii=False,indent=2))
