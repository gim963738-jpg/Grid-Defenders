from pathlib import Path
P=Path(__file__).resolve().parent;p=P/'build.py';s=p.read_text('utf-8')
s=s.replace("if args.spec:spec=json.loads", "spec['rayDesign']=[[-174,151,11,.003],[-154,221,18,.013],[-143,172,10,0],[-126,299,24,.006],[-114,192,11,.018],[-100,247,17,0],[-88,164,13,.011],[-75,284,23,.016],[-60,206,13,.004],[-42,257,22,.008],[-25,177,10,.019],[-8,202,15,.002]]\nspec['layers']['rays'].update(growthTau=.028,tearStart=.105,tearDuration=.15,detachDistance=43)\nspec['phases']={'contact':.3,'compressedCore':[.3,.335],'fanGrowth':[.317,.40],'tearAndDetach':[.422,.657],'particles':[.335,.705],'allClearBy':.717,'rayDesignFields':['angleDegrees','lengthPx','halfWidthPx','delaySeconds']}\nif args.spec:spec=json.loads")
beg=s.index('const rayDesign=');end=s.index(';',beg)
s=s[:beg]+'const rayDesign=spec.rayDesign'+s[end:]
s=s.replace('Math.exp(-age/.028)','Math.exp(-age/p.growthTau)').replace('(age-.105)/.15','(age-p.tearStart)/p.tearDuration').replace('15+tear*43','15+tear*p.detachDistance')
p.write_text(s,'utf-8')
