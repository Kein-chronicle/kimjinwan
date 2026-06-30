#!/usr/bin/env python3
# projects.json → web/js/data.js (+ 프로젝트 이미지 web용 복사/리사이즈)
import json, os, glob, subprocess, re

BASE=os.path.expanduser("~/Portfolio")
WEB=f"{BASE}/web"
IMGDIR=f"{BASE}/extracted/images"
OUTIMG=f"{WEB}/assets/projects"
os.makedirs(OUTIMG, exist_ok=True)

data=json.load(open(f"{BASE}/extracted/projects.json"))
projects=data["projects"]
import sys; sys.path.insert(0,WEB)
from trans_en import TRANS_EN

# 회사 영문/순서
COMP_EN={"에쿼티언":"Equtian","엠투에스":"M2S","오비고":"Obigo","더팀지케이":"TheTeamGK","지엔글로벌":"GN Global"}
COMP_KO_FULL={"에쿼티언":"에쿼티언","엠투에스":"엠투에스","오비고":"오비고(Obigo)","더팀지케이":"더팀지케이","지엔글로벌":"지엔글로벌"}

def find_img(slide):
    for ext in ("png","jpg","jpeg"):
        g=sorted(glob.glob(f"{IMGDIR}/slide{slide:02d}_img*.{ext}"))
        if g: return g[0]
    return None

out=[]
for i,p in enumerate(projects):
    img=""
    if p.get("slide"):
        src=find_img(p["slide"])
        if src:
            dst=f"{OUTIMG}/p{i:02d}.jpg"
            subprocess.run(["sips","-s","format","jpeg","-Z","900",src,"--out",dst],
                           capture_output=True)
            img=f"assets/projects/p{i:02d}.jpg"
    te=TRANS_EN.get(i,("",""))
    out.append({
        "id":i, "year":p["year"], "company":p["company"],
        "companyEn":COMP_EN.get(p["company"],p["company"]),
        "role":p["role"], "name":p["name"],
        "nameEn":te[0], "descEn":te[1],
        "desc":p["desc"], "stack":p.get("stack",[]),
        "img":img,
        "client":p.get("client",""), "period":p.get("period",""),
        "highlights":p.get("highlights",[]),
    })

js="window.PROJECTS = "+json.dumps(out, ensure_ascii=False, indent=1)+";\n"
open(f"{WEB}/js/data.js","w",encoding="utf-8").write(js)
print(f"프로젝트 {len(out)}개, 이미지 {sum(1 for o in out if o['img'])}개")
