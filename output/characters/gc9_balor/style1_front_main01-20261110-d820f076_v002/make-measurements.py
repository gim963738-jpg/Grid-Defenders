from pathlib import Path
import json
R=Path(__file__).parent;old=R.with_name('style1_front_main01-20261110-d820f076_v001')
prev=json.loads((old/'measurements.json').read_text(encoding='utf-8'));identity,style,rejected=prev
rejected.update(file='references/rejected-v001.png',label='차수1 반려 · 옆으로 퍼짐',source='Rejected, width counterexample ONLY')
style.update(file='references/style-front.png',label='선택1번 · 화풍/SD비율 참조')
identity.update(file='references/identity.png',label='승인 발로르 · 디자인 원본')
def spans(values):
 names=['shoulders','chest','waist','arms','shield','cape','feet'];out={}
 for k,v in zip(names,values):
  out[k]=dict(x1=v[0],x2=v[1],y=v[2],errorPx=v[3],applicable=v[0]!=v[1],method=('manual visible RIGHT upper arm center to body symmetry axis; far arm occluded' if k=='arms' else 'manual inferred full torso width from visible edge and symmetry; shield occlusion uncertainty' if k in ['chest','waist'] else 'manual visible component span; no hidden anatomy measured'))
 return out
rejected['widthMeasurements']=spans([(416,818,468,12),(537,716,540,18),(543,704,642,20),(462,623,593,15),(648,938,660,10),(292,963,947,10),(470,774,1045,8)])
style['widthMeasurements']=spans([(344,704,500,12),(443,647,589,16),(470,641,685,14),(350,555,680,14),(0,0,0,0),(0,0,0,0),(350,760,1390,10)])
new=dict(file='front.png',label='차수2 수정 · 세로 흐름 정돈',source='builtin generated native output; unapproved new revision',hairTop=152,sole=1154,bodyHeight=1002,footX=626,footY=1154,footROIs=[[485,1085,600,1160],[646,1080,774,1160]],measurementErrorPx=8,chin=415,faceRegion=[537,314,710,415],faceVerticalMethod='visible eyebrow line to chin; manual +/-8px; separates face from hair/skull',scalpCrown=dict(estimateY=222,errorPx=20,method='inferred dome beneath layered hair, from temples/forehead; not direct measurement'),detailROIs=dict(face=[470,148,772,420],grip=[360,646,504,794],guard=[425,728,585,861],lion=[552,463,687,597],shield=[635,411,905,1090],cape=[369,900,890,1142],pins=[529,441,724,494]))
new['widthMeasurements']=spans([(430,785,470,12),(542,705,545,18),(548,690,650,20),(476,626,622,15),(641,895,685,10),(379,877,1010,10),(488,767,1138,8)])
rejected['faceRegion']=[538,342,705,428];rejected['faceVerticalMethod']='visible eyebrow line to chin +/-8px'
(R/'measurements.json').write_text(json.dumps([rejected,style,new,identity],ensure_ascii=False,indent=2),encoding='utf-8')
print('measurement draft from inspected candidate03; adjust final shield after call4 actual view')
