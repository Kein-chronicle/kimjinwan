"""Render the site's geometric K monogram; no fonts or external image inputs."""
from pathlib import Path
import argparse
from PIL import Image, ImageDraw

p = argparse.ArgumentParser()
p.add_argument("output")
p.add_argument("--background", required=True)
p.add_argument("--accent", required=True)
args = p.parse_args()
dest = Path(args.output)
dest.mkdir(parents=True, exist_ok=True)
im = Image.new("RGBA", (512, 512))
draw = ImageDraw.Draw(im)
draw.rounded_rectangle((0, 0, 511, 511), radius=104, fill=args.background)
draw.polygon([(128,112),(200,112),(200,222),(302,112),(396,112),(266,250),(400,400),(302,400),(200,286),(200,400),(128,400)], fill="#ffffff")
draw.ellipse((364,364,428,428), fill=args.accent)
for size, name in [(96,"favicon-96.png"),(180,"apple-touch-icon.png")]:
    im.resize((size,size),Image.Resampling.LANCZOS).save(dest/name)
im.save(dest/"favicon.ico",format="ICO",sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])

