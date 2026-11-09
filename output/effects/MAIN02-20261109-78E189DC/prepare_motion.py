from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parent
job=P/'character-job'
text=(job/'prompt.txt').read_text(encoding='utf-8').splitlines()
prompt='\n'.join(text[:5])+'''
ONE continuous THREE-STRIKE SWORD COMBO toward screen RIGHT. The near right hand holds the long sword for all three strikes; the far left hand keeps the short dagger low as a guard. Both hands remain visibly attached. Never turn around or mirror. Real articulated body motion: shoulders, sword arm, wrist, torso, hips, knees and planted feet coordinate for weight transfer. Do not rotate a frozen whole-body illustration. Exactly three sword swings, not a looping single swing.
Timeline for this6-second take: 0.0-0.4 s hold the supplied neutral stance; 0.4-1.2 s raise the LONG SWORD over the head, right elbow lifts and torso draws back; 1.2-1.7 s STRIKE ONE: a strong TOP-TO-BOTTOM downcut in the open space in front to the RIGHT, knees flex and weight lowers, sword ends low-right. 1.7-2.2 s connect from that low stance, drawing the sword underneath; 2.2-2.7 s STRIKE TWO: sweep the same sword BOTTOM-TO-TOP toward upper-RIGHT, knees straighten and right shoulder rises, end with the sword high. 2.7-3.3 s briefly load that high pose, hips and torso coil while facing right; 3.3-3.9 s STRIKE THREE: a strong DIAGONAL from HIGH to LOWER-RIGHT, arm extends forward, torso and hips follow, sword finishes low-right. 3.9-5.2 s recover naturally forward in time into the original neutral stance; 5.2-6.0 s hold the original neutral stance.
Each full sword swing visibly covers a broad arc in front of the body. Preserve the complete head, hair, face, armor, hand grip, sword blade, dagger and both boots. Keep the exact blond hair, blue scarf, silver armor and asymmetrical boots of the reference. Keep the body and weapon design stable; no weapon morphing, duplicates, detached parts, backward-played recovery or extra strikes.
Body only: animate body, clothes and held physical weapons. No glowing trails, no particles, sparks, energy, rings, starbursts, speed lines, dust or new scene. The game adds WHITE VFX separately later.
Avoid text, floor, shadow, camera movement, key-colored light, extra limbs, turnarounds, static mannequin motion and weapon disappearance. Entire motion remains within the numeric work region with margins.
'''
(job/'prompt.txt').write_text(prompt,encoding='utf-8')
d=json.loads((job/'registration_job.json').read_text(encoding='utf-8'))
d['action']='attack-three-combo';d['timeline']=[dict(startS=a,endS=b,text=c) for a,b,c in [(0,.4,'neutral'),(.4,1.2,'raise sword'),(1.2,1.7,'downcut'),(1.7,2.2,'low connection'),(2.2,2.7,'upcut'),(2.7,3.3,'high load'),(3.3,3.9,'diagonal downcut'),(3.9,5.2,'recover'),(5.2,6,'neutral')]]
d['prompt']['sha256']=hashlib.sha256(prompt.encode()).hexdigest()
(job/'registration_job.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
(P/'사전확인.md').write_text('MAIN02-20261109-78E189DC 차수1 effects / 사용자확인 진행. 기존공격모션을조사했으나 대상3연격없음. 기존금발검사 오른쪽원본을사본보존하고 영상스킬로 실제관절동작을생성한다. 내려치기/올려치기/사선내려치기 손과검궤적을확인한후 넓고휘어진백색VFX 합성. 더미/정지그림회전으로완료하지않고 생성장애는부분결과로정직하게회신. 기존6연격/게임/타팀원본 수정금지.\n',encoding='utf-8')
