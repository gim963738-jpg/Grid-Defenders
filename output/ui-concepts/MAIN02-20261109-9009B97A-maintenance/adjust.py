from pathlib import Path
out=Path(__file__).resolve().parent
p=out/'maintenance.js';s=p.read_text(encoding='utf-8');s=s.replace('function bigInventory(){const entries=','function bigInventory(n){const entries=n===2?[]:').replace('bigInventory()','bigInventory(n)').replace('창고 공간 부족 · 영웅에게 구매','창고 부족 · 영웅 장착').replace('돌려서 창고 보관 / 영웅 바로 장착','회전 보관 / 바로 장착').replace('상품 선택 → 목적지 선택','목적지를 골라 구매')
s=s.replace("+smallStorage(cols,n)+bigInventory(n)","+smallStorage(cols,n)+'<div class=\"ability-summary\"><b>아리아 · 체력 1,100 / 공격 90</b><small>연속 검격 · 6연타 · 쿨타임 8초</small></div>'+bigInventory(n)")
p.write_text(s,encoding='utf-8')
