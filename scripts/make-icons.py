"""Génère les icônes PWA depuis public/logo-bts2.jpeg (tuile orange à engrenage)."""
from PIL import Image

src = Image.open("public/logo-bts2.jpeg").convert("RGB")
tile = src.crop((85, 246, 366, 525))  # tuile engrenage, ~carrée
tile = tile.resize((max(tile.size),) * 2, Image.LANCZOS)

def icon(size, fill, bg, name):
    canvas = Image.new("RGB", (size, size), bg)
    t = tile.resize((int(size * fill),) * 2, Image.LANCZOS)
    canvas.paste(t, ((size - t.width) // 2, (size - t.height) // 2))
    canvas.save(f"public/{name}", optimize=True)

icon(512, 0.78, "white", "icon-512.png")
icon(192, 0.78, "white", "icon-192.png")
icon(512, 1.0, (255, 122, 0), "icon-maskable-512.png")   # plein cadre, zone sûre respectée
icon(180, 1.0, (255, 122, 0), "apple-touch-icon.png")    # iOS applique ses propres coins
print("ok")
