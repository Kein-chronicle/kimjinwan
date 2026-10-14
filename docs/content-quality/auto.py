import json,glob,re,os,html,itertools,collections,sys
R=os.path.expanduser('~/Projects/kimjinwan')
def strip(h):
    h=re.sub(r'<(script|style)[\s\S]*?</\1>','',h)
    heads=len(re.findall(r'<h[2-4]\b',h)); lis=len(re.findall(r'<li\b',h)); imgs=len(re.findall(r'<img\b',h)); links=len(re.findall(r'<a\b[^>]*href',h)); pre=len(re.findall(r'<(pre|table)\b',h))
    t=html.unescape(re.sub(r'<[^>]+>',' ',h)); t=re.sub(r'\s+',' ',t).strip()
    return t,dict(heads=heads,lis=lis,imgs=imgs,links=links,blocks=pre)
def flat(o):
    if isinstance(o,str): return [o]
    if isinstance(o,dict): return [x for v in o.values() for x in flat(v)]
    if isinstance(o,list): return [x for v in o for x in flat(v)]
    return []
docs=[]
def add(sec,slug,title,text,st,date=None,extra=None):
    docs.append(dict(sec=sec,slug=slug,title=title,text=text,st=st,date=date,extra=extra or {}))
for f in sorted(glob.glob(R+'/content-src/blog/*/*.json')):
    d=json.load(open(f)); t,st=strip(d['body']); add('blog/'+d['category'],d['slug'],d['title'],t,st,d['date'])
for f in sorted(glob.glob(R+'/content-src/column/*.json')):
    d=json.load(open(f)); t,st=strip(d['body']); add('column',d['slug'],d['title'],t,st,d['date'])
for f in sorted(glob.glob(R+'/content-src/gamenews/*.json')):
    d=json.load(open(f)); t,st=strip(d['body']); add('gamenews/'+d['game'],d['slug'],d['title'],t,st,d['date'])
for f in sorted(glob.glob(R+'/content-src/gizmo/*.json')):
    d=json.load(open(f)); t=' '.join(flat({k:v for k,v in d.items() if k in('description','audience','result','steps','prompt','trouble')})); add('gizmo',d['slug'],d['title'],t,dict(heads=0,lis=len(d.get('steps',[])),imgs=0,links=0,blocks=1))
for f in sorted(glob.glob(R+'/data/authoring/games/*.json')):
    if f.endswith('_progress.json'): continue
    d=json.load(open(f)); t=' '.join(flat({k:v for k,v in d.items() if k not in('verified','images','id')})); gid=d['id']; gt=json.load(open(R+'/content-src/games/'+gid+'.json'))['title']; add('games',gid,(gt['ko'] if isinstance(gt,dict) else gt),t,dict(heads=0,lis=len(d.get('rules',[]))+len(d.get('tips',[])),imgs=len(d.get('images',[])),links=0,blocks=0),extra=dict(verified=d.get('verified',{}).get('date')))
for f in sorted(glob.glob(R+'/content-src/tools/*.json')):
    d=json.load(open(f)); t=' '.join(flat({k:v for k,v in d.items() if k not in('title','categories','slug')})); add('tools',d['slug'],d['title'],t,dict(heads=0,lis=len(d.get('inputs',[])),imgs=1,links=0,blocks=len(d.get('blocks',[]))))
for f in sorted(glob.glob(R+'/data/authoring/apps/*.json')):
    if f.endswith('_progress.json'): continue
    d=json.load(open(f)); t=' '.join(flat({k:v for k,v in d.items() if k in('oneLiner','about','audience','features','howTo','notes','guide')})); add('apps',d['slug'],d['name'],t,dict(heads=0,lis=len(d.get('features',[]))+len(d.get('howTo',[])),imgs=len(d.get('images',[])),links=1,blocks=0))
def shingles(t,n=4):
    w=re.findall(r'[0-9A-Za-z가-힣]+',t); return set(tuple(w[i:i+n]) for i in range(max(0,len(w)-n+1)))
for d in docs: d['sh']=shingles(d['text'])
# 역색인으로 최대 유사도(포함도) 계산
inv=collections.defaultdict(list)
for i,d in enumerate(docs):
    for s in d['sh']: inv[s].append(i)
for i,d in enumerate(docs):
    cnt=collections.Counter()
    for s in d['sh']:
        for j in inv[s]:
            if j!=i: cnt[j]+=1
    best=(0,None)
    for j,c in cnt.items():
        o=c/max(1,len(d['sh']))   # 이 문서의 몇 %가 다른 문서와 겹치는가
        if o>best[0]: best=(o,j)
    d['dup']=best[0]; d['dupwith']=docs[best[1]]['sec']+'/'+docs[best[1]]['slug'] if best[1] is not None else ''
    # 문서 전체에서 여러 문서에 반복되는 구절 비율
    tot=len(d['sh']) or 1
    d['boiler']=sum(1 for s in d['sh'] if len(inv[s])>=4)/tot
MIN={'blog':1800,'column':2000,'gamenews':1500,'gizmo':500,'games':900,'tools':600,'apps':900}
def sc(d):
    k=d['sec'].split('/')[0]; n=len(re.sub(r'\s','',d['text'])); m=MIN[k]
    A=25*min(1,n/m)
    B=30*max(0,1-d['dup']*1.6)*(1-min(0.6,d['boiler']*1.5))
    nums=len(re.findall(r'\d+',d['text'])); first=len(re.findall(r'(확인했|재현|실행|직접|측정|시험|비교했|열어 보|눌러 보|플레이|해 봤|해보|돌려|결과는|나왔)',d['text']))
    C=20*min(1,(nums/ max(1,n/1000))/6*0.5+first/6*0.5)
    st=d['st']; D=10*min(1,(min(st['heads'],4)/4)*0.5+(min(st['lis']+st['blocks'],6)/6)*0.5) if k in('blog','column','gamenews') else 10*min(1,(min(st['lis'],6)/6))
    E=0
    if k in('blog','column','gamenews'): E=15*min(1,(0.4 if d['date'] else 0)+min(st['links'],5)/5*0.4+min(st['imgs'],2)/2*0.2)
    else: E=15*min(1,0.4+min(st['imgs'],3)/3*0.4+0.2)
    return dict(A=A,B=B,C=C,D=D,E=E,total=A+B+C+D+E,n=n)
out=[]
for d in docs:
    s=sc(d); out.append(dict(sec=d['sec'],slug=d['slug'],title=d['title'],date=d['date'],dup=round(d['dup'],2),dupwith=d['dupwith'],boiler=round(d['boiler'],2),**{k:round(v,1) for k,v in s.items()},**d['st']))
json.dump(out,open(os.path.dirname(os.path.abspath(__file__))+'/auto.json','w'),ensure_ascii=False,indent=1)
by=collections.defaultdict(list)
for o in out: by[o['sec'].split('/')[0]].append(o)
for k,v in by.items():
    tot=[x['total'] for x in v]; ns=sorted(x['n'] for x in v)
    print(k,len(v),'평균점수',round(sum(tot)/len(tot),1),'최저',round(min(tot),1),'글자 중앙',ns[len(ns)//2],'min',ns[0],'<70점',sum(1 for t in tot if t<70),'dup>0.3',sum(1 for x in v if x['dup']>0.3))
