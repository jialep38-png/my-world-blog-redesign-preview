"""Create smaller delivery assets from the preserved editorial image sources."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def webp(source: str, destination: str, width: int | None = None) -> None:
    with Image.open(ROOT / source) as original:
        image = original.convert("RGB")
        if width is not None:
            height = round(image.height * width / image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        path = ROOT / destination
        image.save(path, "WEBP", quality=84, method=6)
        print(f"{path.relative_to(ROOT)}: {path.stat().st_size:,} bytes")


webp("assets/author/portrait.jpg", "assets/author/portrait-360.webp", 360)
webp("assets/author/portrait.jpg", "assets/author/portrait-640.webp", 640)
webp("assets/work/paper-radar-sculpture.png", "assets/work/paper-radar-sculpture.webp")
