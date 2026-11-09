from pathlib import Path
import requests,json,concurrent.futures
root=Path(__file__).resolve().parent
items=[
('arknights','play-shot13.png','https://play-lh.googleusercontent.com/dIRo98UsCs97OACxqBZTC1a3BlyY_aut0d023r1ciWxt4QqiUG94zjxR5WBLTqO6rk21osLGmvCeq1QrqHKOWg=s0'),
('arknights','play-shot14.png','https://play-lh.googleusercontent.com/aMDRHi7H8LiwNgVy7Se6IMqasSX2sd8oP_h-S0Ms1keNQSk8jn-syA8vuLIbif3sJMxgItoW8XItbeiOWsOHpQ=s0'),
('azur_lane','play-shot12.png','https://play-lh.googleusercontent.com/ditaQc7rJL1QDPwuPnEO5KhcuowHxghtIU57uzfwetstkyqVrV8suu9c3S8LDFH7r_t58ab8IZUB7qQqykJs6AA=s0'),
('priconne','battle-poster.png','https://priconne-redive.jp/_app/immutable/assets/sytem_battle_mov.j6GlQwzA.png'),
('priconne','battle-video.mp4','https://priconne-redive.jp/_app/immutable/assets/sytem_battle_mov.D60HnmKq.mp4'),
('guardian_tales','official-background.mp4','https://guardiantales.com/images/WebsiteBackground.mp4'),
('guardian_tales','official-explore1.jpg','https://guardiantales.com/images/pc/img_explore1_200625.jpg'),
('odin_sphere','official-osl4.jpg','https://atlus.com/wp-content/uploads/2015/09/osl4.jpg'),
('odin_sphere','official-osl3.jpg','https://atlus.com/wp-content/uploads/2015/09/osl3.jpg'),
('odin_sphere','official-osl2.jpg','https://atlus.com/wp-content/uploads/2015/09/osl2.jpg'),
('odin_sphere','official-osl1.jpg','https://atlus.com/wp-content/uploads/2015/09/osl1.jpg')]
def one(item):
    key,name,url=item;p=root/'references'/key/name;p.parent.mkdir(exist_ok=True,parents=True)
    try:
        r=requests.get(url,timeout=60);r.raise_for_status();p.write_bytes(r.content);return dict(game=key,file=str(p.relative_to(root)),url=url,bytes=len(r.content))
    except Exception as e:return dict(game=key,file=name,url=url,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:data=list(pool.map(one,items))
(root/'download-more-records.json').write_text(json.dumps(data,indent=2),'utf-8')
print(json.dumps(data))
