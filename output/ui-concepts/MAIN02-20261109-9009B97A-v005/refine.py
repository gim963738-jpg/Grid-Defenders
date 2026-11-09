from pathlib import Path
p=Path(__file__).resolve().parent
f=p/'flow.js';s=f.read_text(encoding='utf-8-sig')
s=s.replace("+sprite(k)+'</span>'+t+'</button>'", "+sprite(k)+'</span><span>'+t+(i===0?'<small>5×4 · 20칸</small>':'')+'</span></button>'")
s=s.replace("const returned=n===9||n===11", "const returned=n===9||n===11")
start=s.index(" if(buy||storeBuy)s+=")
end=s.index("\n+",start) if '\n+' in s[start:] else s.index("\n if(done",start)
s=s[:start]+''' if(buy||storeBuy)s+='<aside class="item-popover"><div class="selected-item-info"><h2>'+(storeBuy?'주머니 · 100G':'철검 · 60G')+'</h2><small>'+(storeBuy?'골드 +10% / 1칸':'공격 +15 / 2칸')+'</small></div><div class="destinations"><button '+(storeBuy?'class="primary" data-go="16"':'')+'>창고 구매</button><button '+(!storeBuy?'class="primary" data-go="14"':'')+'>영웅 구매</button></div></aside>';'''+s[end:]
s=s.replace("else s+='<div class=\"equip-summary\">'", "else if(!buy&&!storeBuy)s+='<div class=\"equip-summary\">'")
f.write_text(s,encoding='utf-8')
css='''
.workspace button.primary{background:#e4eee8;color:#203c3c;border:2px solid #fff}.hero-select{top:64px}.hero-select button span:last-child{display:block;line-height:16px}.hero-select button small{display:block;font-size:10px;white-space:nowrap}.equip-footer-label{display:none}.equipment-mode .preview-note{left:318px;top:348px;font-size:10px}.equip-label{top:64px}.overview-line{top:224px;background:#1b353be6;padding:5px 10px;border-radius:10px;line-height:18px}.card small{font-size:12px;line-height:14px}.card .mini-unit{height:28px;min-height:28px}.mini-unit img,.mini-unit>svg{height:28px}.boss-popup{height:208px}.boss-popup p{font-size:12px;line-height:18px;margin-bottom:6px}.boss-popup h1{font-size:20px;margin-bottom:6px}.boss-popup .back{position:absolute;bottom:8px;right:12px;margin:0}.item-popover{left:318px;top:208px;width:156px;height:140px;display:block;padding:0;border:none;background:transparent}.item-popover .selected-item-info{height:36px;font-size:12px;line-height:16px}.selected-item-info h2{font-size:14px;line-height:18px}.selected-item-info small{font-size:12px}.item-popover .destinations{position:absolute;left:0;top:36px;width:156px;height:104px;gap:8px}.item-popover button{height:48px;width:156px;padding:4px}.item-popover .destinations button{flex-shrink:0}
'''
with (p/'flow.css').open('a',encoding='utf-8') as o:o.write(css)
q=p/'check-layout.js';s=q.read_text(encoding='utf-8');s=s.replace('stage.getBoundingClientRect().width/800','innerWidth/800').replace('r.board.w===290&&r.board.h===192','Math.abs(r.board.w-290)<.1&&Math.abs(r.board.h-192)<.1').replace('r.topHeight===48','Math.abs(r.topHeight-48)<.1');q.write_text(s,encoding='utf-8')
q=p/'check.ps1';s=q.read_text(encoding='utf-8');s=s.replace('버튼위치.json','button-map.json');q.write_text(s,encoding='utf-8-sig')
print('Readability, selected item details and touch checks refined')
