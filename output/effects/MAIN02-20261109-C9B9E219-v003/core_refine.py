from pathlib import Path
P=Path(__file__).resolve().parent;p=P/'build.py';s=p.read_text('utf-8')
old="poly([[-69,1],[-47,-8],[-50,-18],[-29,-16],[-28,-35],[-9,-27],[3,-48],[13,-29],[29,-35],[32,-19],[48,-22],[48,-8],[70,-1],[42,9],[8,12],[-31,8]],'#fff');"
new="fc.beginPath();fc.moveTo(-67,1);fc.bezierCurveTo(-51,-4,-51,-20,-34,-21);fc.bezierCurveTo(-26,-38,-14,-24,-5,-36);fc.bezierCurveTo(8,-50,20,-32,29,-30);fc.bezierCurveTo(44,-34,40,-14,54,-9);fc.bezierCurveTo(59,-3,66,-3,68,1);fc.bezierCurveTo(42,12,-35,14,-67,1);fc.fillStyle='#fff';fc.fill();"
assert old in s;s=s.replace(old,new);p.write_text(s,'utf-8')
