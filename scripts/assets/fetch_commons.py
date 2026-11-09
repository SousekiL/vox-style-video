# usage: fetch_commons.py <out_dir> "<File:Title>|<outname>|<page or 0>|<width>" ...
import sys, json, time, urllib.request, urllib.parse, urllib.error, os
UA={"User-Agent":"TAVideoResearch/1.0 (https://github.com/SousekiL; educational video asset fetch)"}
def get(u):
    for i in range(10):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code==429: print('429 wait',flush=True); time.sleep(15*(i+1)); continue
            raise
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
man=json.load(open(f"{out}/manifest.json")) if os.path.exists(f"{out}/manifest.json") else {}
for spec in sys.argv[2:]:
    title,name,page,w=spec.split("|"); page=int(page); w=int(w)
    p=dict(action="query",titles=title,prop="imageinfo",iiprop="url|extmetadata|size",format="json",iiurlwidth=w)
    if page: p["iiurlparam"]=f"page{page}-{w}px"
    r=json.loads(get("https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode(p)))
    pg=list(r["query"]["pages"].values())[0]
    if "imageinfo" not in pg: print("MISSING",title); continue
    ii=pg["imageinfo"][0]; m=ii.get("extmetadata",{})
    url=ii.get("thumburl") or ii["url"]
    data=get(url); ext=".jpg" if url.lower().split("?")[0].endswith((".jpg",".jpeg")) else ".png"
    fn=f"{out}/{name}{ext}"; open(fn,"wb").write(data)
    man[name]={"file":os.path.basename(fn),"title":title,"page":page,"desc_url":ii.get("descriptionurl"),
      "license":m.get("LicenseShortName",{}).get("value"),"artist":m.get("Artist",{}).get("value","")[:200],
      "date":m.get("DateTimeOriginal",{}).get("value","")[:100],"pages":ii.get("pagecount")}
    json.dump(man,open(f"{out}/manifest.json","w"),ensure_ascii=False,indent=1)
    print("OK",name,len(data),ii.get("pagecount"),man[name]["license"]); time.sleep(20)
json.dump(man,open(f"{out}/manifest.json","w"),ensure_ascii=False,indent=1)
