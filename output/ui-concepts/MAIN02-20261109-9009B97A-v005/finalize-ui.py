from pathlib import Path
p=Path(__file__).resolve().parent
f=p/'flow.js';s=f.read_text(encoding='utf-8')
s=s.replace("'16-buy-storage-complete'];", "'16-buy-storage-complete','17-hero-to-storage-preview','18-hero-to-storage-complete'];")
s=s.replace("'상품 이월 보관 · 완료'];", "'상품 이월 보관 · 완료','영웅 장비 보관 · 확인','영웅 장비 보관 · 완료'];")
s=s.replace('16:495};','16:495,17:495,18:495};')
s=s.replace("<aside class=\"detail\"><header>","<aside class=\"detail\"><button class=\"detail-close\" aria-label=\"영웅 상세 닫기\">×</button><header>")
s=s.replace("const preview=n===12,done=n===7,buy=n===13,heroDone=n===14,storeBuy=n===15,storeDone=n===16;", "const preview=n===12,done=n===7,buy=n===13,heroDone=n===14,storeBuy=n===15,storeDone=n===16,reverse=n===17,reverseDone=n===18;")
s=s.replace("done?[[4,0,4]]", "done||reverse?[[4,0,4]]")
s=s.replace("inventory=done?[[0,0,5]]", "inventory=done||reverse?[[0,0,5]]")
s=s.replace("{galeFrom:done,pouchTarget:storeBuy}","{galeFrom:done,pouchTarget:storeBuy,galeTarget:reverse}")
s=s.replace("{galeTarget:preview,bad:preview,ironTarget:buy}","{galeTarget:preview,bad:preview,ironTarget:buy,galeFrom:reverse}")
s=s.replace(" if(preview)s+=", " if(reverse)s+='<div class=\"transfer-status\"><b>창고로 이동</b><small>아리아 출발 → 창고<br>L자 빈칸 3개 · 적합</small></div><button class=\"transfer-confirm primary\" style=\"position:absolute;left:318px;top:300px;width:156px;height:48px\" data-go=\"18\">이동 확정</button>';\n else if(reverseDone)s+='<div class=\"transfer-status\"><b>✓ 이동 완료</b><small>아리아 장비 해제<br>창고 4칸 사용<br>재화 차감 없음</small></div>';\n else if(preview)s+=")
s=s.replace("if(done||heroDone||storeDone)","if(done||heroDone||storeDone||reverseDone)")
s=s.replace("(done?'착용 완료 · 재화 차감 없음':heroDone?", "(reverseDone?'창고 이동 완료 · 재화 차감 없음':done?'착용 완료 · 재화 차감 없음':heroDone?")
s=s.replace('[6,7,12,13,14,15,16]', '[6,7,12,13,14,15,16,17,18]')
s=s.replace("stage.querySelectorAll('[data-go]').forEach", "stage.querySelectorAll('.detail-close').forEach(b=>b.onclick=()=>{stage.querySelector('.detail')?.remove();stage.querySelector('.hero-side-label')?.remove();});stage.querySelectorAll('[data-go]').forEach")
s=s.replace("finalUnits.forEach(u=>s+=unitActor(u));", "finalUnits.forEach(u=>s+=unitActor(u).replace('<span class=\"actor-id\">','<span class=\"hp\"></span><span class=\"actor-id\">'));")
f.write_text(s,encoding='utf-8')
css='''
.detail header{height:44px;padding-right:48px}.detail dl{margin:4px 0}.detail-close{position:absolute;right:8px;top:8px;width:48px;height:48px;font-size:24px}.transfer-status:has(+.transfer-confirm){height:64px;overflow:hidden;padding:5px 9px;line-height:18px}.transfer-status:has(+.transfer-confirm) small{line-height:16px;font-size:12px}.transfer-status:has(+.transfer-confirm) b{font-size:14px}
'''
with (p/'flow.css').open('a',encoding='utf-8') as o:o.write(css)
f=p/'check-layout.js';s=f.read_text(encoding='utf-8').replace('n<=16','n<=18').replace('results[n-1].board.w===290&&results[n-1].board.h===192','Math.abs(results[n-1].board.w-290)<.1&&Math.abs(results[n-1].board.h-192)<.1').replace('[6,7,12,13,14,15,16]','[6,7,12,13,14,15,16,17,18]');f.write_text(s,encoding='utf-8')
f=p/'render.ps1';s=f.read_text(encoding='utf-8').replace('[int]$Last=16','[int]$Last=18').replace("'16-buy-storage-complete')", "'16-buy-storage-complete','17-hero-to-storage-preview','18-hero-to-storage-complete')");f.write_text(s,encoding='utf-8-sig')
print('Hero close and both equipment directions completed')
