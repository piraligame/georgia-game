from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path.home()/"Documents"/"GeorgiaGame"
res=root/"android"/"app"/"src"/"main"/"res"
S=1024
def artwork(transparent=False):
 im=Image.new("RGBA",(S,S),(0,0,0,0) if transparent else (13,38,42,255))
 d=ImageDraw.Draw(im)
 if not transparent:
  for y in range(S):
   k=y/S
   d.line([(0,y),(S,y)],fill=(int(17+11*k),int(53-17*k),int(55-22*k),255))
 # circle and stone fortress crest
 d.ellipse((142,104,882,844),fill=(20,63,57,255),outline=(247,202,116,255),width=26)
 d.ellipse((177,139,847,809),outline=(126,93,46,255),width=10)
 # battlement silhouette above flag
 stone=(179,164,133,255)
 # The five battlements were centered at X=485 while the flag was X=512.
 # Shift ONLY the castle layer +27px to align their actual center axes.
 castle_xshift=27
 battlement=[(281,370),(281,298),(326,298),(326,326),(357,326),(357,283),(404,283),(404,330),(455,330),(455,278),(504,278),(504,327),(555,327),(555,284),(606,284),(606,326),(643,326),(643,295),(689,295),(689,370)]
 d.polygon([(x+castle_xshift,y) for x,y in battlement],fill=stone)
 d.rectangle((306+castle_xshift,354,667+castle_xshift,597),fill=(133,123,110,255))
 d.arc((315+castle_xshift,360,660+castle_xshift,640),180,360,fill=(86,79,73,255),width=18)
 # The flag and the castle now share the same centreline at 512 px.
 assert (281+689)/2+castle_xshift == (297+727)/2
 # Georgian five-cross flag
 d.rounded_rectangle((297,380,727,640),radius=23,fill=(249,250,246,255),outline=(249,209,127,255),width=13)
 red=(199,32,48,255)
 d.rectangle((495,390,535,627),fill=red)
 d.rectangle((312,492,710,531),fill=red)
 def small_cross(x,y):
  d.rectangle((x-8,y-27,x+8,y+27),fill=red)
  d.rectangle((x-27,y-8,x+27,y+8),fill=red)
 for x in (388,635):
  for y in (440,580):small_cross(x,y)
 # logo lettering
 try:font=ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf",93)
 except:font=ImageFont.load_default()
 text="GEORGIA"
 box=d.textbbox((0,0),text,font=font)
 tx=(S-(box[2]-box[0]))/2
 d.text((tx,712),text,font=font,fill=(255,221,151,255),stroke_width=2,stroke_fill=(32,33,30,255))
 return im
icon=artwork(False);fore=artwork(True)
assets=root/"assets"/"icons";assets.mkdir(parents=True,exist_ok=True)
icon.save(assets/"georgia-launcher.png",optimize=True)
sizes={"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}
for density,n in sizes.items():
 folder=res/("mipmap-"+density)
 folder.mkdir(exist_ok=True)
 icon.resize((n,n),Image.Resampling.LANCZOS).save(folder/"ic_launcher.png",optimize=True)
 icon.resize((n,n),Image.Resampling.LANCZOS).save(folder/"ic_launcher_round.png",optimize=True)
 fore.resize((int(n*2.25),int(n*2.25)),Image.Resampling.LANCZOS).save(folder/"ic_launcher_foreground.png",optimize=True)
bg=res/"values"/"ic_launcher_background.xml"
bg.write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#0d262a</color></resources>\n',encoding="utf-8")
for splash in res.rglob("splash.png"):
 if "drawable" not in str(splash.parent):continue
 old=Image.open(splash)
 w,h=old.size
 bgim=Image.new("RGBA",(w,h),(13,38,42,255))
 n=int(min(w,h)*.42)
 mark=icon.resize((n,n),Image.Resampling.LANCZOS)
 bgim.alpha_composite(mark,((w-n)//2,(h-n)//2))
 bgim.convert("RGB").save(splash,optimize=True)
print("GEORGIA_ANDROID_BRANDED_ICON_AND_SPLASH_READY")
