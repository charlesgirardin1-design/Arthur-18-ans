"""Génère les miniatures WebP de la pellicule et de la frise (images/galerie/mini/).
À relancer après chaque ajout de photos :  python3 tools/miniatures.py
"""
import os, glob
from PIL import Image, ImageOps
SRC = 'images/galerie'; DST = os.path.join(SRC, 'mini'); os.makedirs(DST, exist_ok=True)
attendus = set()
for f in sorted(glob.glob(os.path.join(SRC, '*.jpg'))):
    out = os.path.join(DST, os.path.basename(f)[:-4] + '.webp'); attendus.add(out)
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        continue
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    im.thumbnail((520, 520), Image.LANCZOS)
    im.save(out, 'WEBP', quality=72, method=6)
for f in glob.glob(os.path.join(DST, '*.webp')):
    if f not in attendus: os.remove(f)
print(len(attendus), 'miniatures')
