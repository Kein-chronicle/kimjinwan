"""Render the Kein mark (rounded tile + geometric K + forward dot) as PNG/ICO favicons.

Geometry is the same 32-unit grid as favicon.svg and kMark() in scripts/lib/render.mjs.
Each size is drawn on its own canvas at 8x and downsampled, so 16/32 px stay crisp
instead of being shrunk from one large image. No fonts or external image inputs.

usage: python3 scripts/build_icons.py . --background '#3B4BDB' --accent '#FFB547'
"""
from pathlib import Path
import argparse
from PIL import Image, ImageDraw

K = [(8, 6), (14, 6), (14, 14), (21, 6), (28, 6), (19.1, 16.1), (22.5, 19.5), (18.5, 23.5), (14, 19), (14, 26), (8, 26)]
DOT = (25.5, 25.5, 3.25)
RADIUS = 8
SS = 8  # supersampling factor

p = argparse.ArgumentParser()
p.add_argument("output")
p.add_argument("--background", required=True)
p.add_argument("--accent", required=True, help="dot colour")
p.add_argument("--ink", default="#ffffff", help="K colour")
args = p.parse_args()


def render(size: int, radius: float = RADIUS) -> Image.Image:
    big = size * SS
    u = big / 32
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, big - 1, big - 1), radius=radius * u, fill=args.background)
    d.polygon([(x * u, y * u) for x, y in K], fill=args.ink)
    cx, cy, r = DOT
    d.ellipse(((cx - r) * u, (cy - r) * u, (cx + r) * u, (cy + r) * u), fill=args.accent)
    return im.resize((size, size), Image.Resampling.LANCZOS)


dest = Path(args.output)
dest.mkdir(parents=True, exist_ok=True)
render(96).save(dest / "favicon-96.png", optimize=True)
# iOS masks the touch icon itself and paints transparent corners black: full-bleed square.
render(180, radius=0).save(dest / "apple-touch-icon.png", optimize=True)
ico = [render(s) for s in (16, 32, 48, 64, 128, 256)]
ico[-1].save(dest / "favicon.ico", format="ICO", sizes=[i.size for i in ico], append_images=ico[:-1])
