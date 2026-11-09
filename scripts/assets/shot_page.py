import sys, asyncio
from playwright.async_api import async_playwright
# usage: shot.py url out.png [width] [height] [full]
async def main():
    url,out=sys.argv[1],sys.argv[2]
    w=int(sys.argv[3]) if len(sys.argv)>3 else 900
    h=int(sys.argv[4]) if len(sys.argv)>4 else 1600
    full=len(sys.argv)>5 and sys.argv[5]=="full"
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={"width":w,"height":h},device_scale_factor=2,locale="zh-TW")
        try: await pg.goto(url,wait_until="networkidle",timeout=60000)
        except Exception as e: print("goto:",e)
        await pg.wait_for_timeout(3000)
        # remove common cookie/overlay banners
        await pg.evaluate("""()=>{for(const s of ['[id*=cookie]','[class*=cookie]','[class*=consent]','[id*=consent]','.modal','[class*=popup]','[class*=Popup]']) document.querySelectorAll(s).forEach(e=>{if(e.offsetHeight<window.innerHeight*0.9)e.remove()})}""")
        await pg.screenshot(path=out,full_page=full)
        print("title:",await pg.title())
        await b.close()
asyncio.run(main())
