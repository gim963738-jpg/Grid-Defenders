from pathlib import Path
out=Path(__file__).resolve().parent
f=out/'additions.js';s=f.read_text(encoding='utf-8')
s=s.replace("const byId=id=>", "const shortItem=d=>({'I04':'활력 수정','I05':'금 주머니','I10':'대형 방패','I11':'장창'}[d.id]||d.name);\nconst byId=id=>")
s=s.replace("<b>'+d.name+'</b><small>'+d.shape.length+'칸", "<b>'+shortItem(d)+'</b><small>'+(['I10','I11'].includes(d.id)?'시험 · ':'')+d.shape.length+'칸")
s=s.replace("items[byId(id)].name+' ×'+q).join(' + ')", "({'I02':'방패','I04':'수정','I03':'룬'}[id]||items[byId(id)].name)+' ×'+q).join(' + ')")
f.write_text(s,encoding='utf-8')
with (out/'additions.css').open('a',encoding='utf-8')as o:o.write('\n.catalog-tile>span:last-child{flex:1;min-width:0}.catalog-tile b{font-size:12px;white-space:nowrap}.catalog-tile small{white-space:nowrap}.recipe-choice>span{min-width:0;flex:1}.recipe-choice em{flex-shrink:0;white-space:nowrap;margin-left:8px}.recipe-choice small{white-space:nowrap}.craft-detail h1{visibility:visible;opacity:1;position:relative;z-index:1}\n')
print('Short list labels fit; full item names remain in details')
