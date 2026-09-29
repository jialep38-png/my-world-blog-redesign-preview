"""Download the OFL Chinese fallback, subset to the site's characters, for self-hosting.

Run again after adding text: python scripts/prepare-fonts.py
Only Python's standard library is required. The website has no Google Fonts
runtime dependency; all font files and license notices are served locally.
"""

from pathlib import Path
import json
import re
import string
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "fonts"
AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/130.0.0.0 Safari/537.36"
)


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": AGENT})
    with urlopen(request, timeout=45) as response:
        return response.read()


def main() -> None:
    source = "".join((ROOT / name).read_text(encoding="utf-8")
                     for name in ("index.html", "follow-blog.js", "reading-data.js"))
    glyphs = "".join(sorted(set(string.printable.strip() + " " + "".join(
        character for character in source if ord(character) > 127
    ))))
    specs = (
        ("Noto Sans SC:wght@300..600", "noto-sans-sc", "Noto Sans SC", "normal", "300 600", "notosanssc", glyphs),
    )
    FONTS.mkdir(exist_ok=True)
    rules = []
    manifest = []
    # Keep text-subsetting requests bounded. unicode-range loads only the pieces
    # needed by the current page instead of every archived article at startup.
    chunks = []
    for query, filename, family, style, weight, directory, text in specs:
        for index, start in enumerate(range(0, len(text), 650)):
            part = text[start:start+650]
            name = filename if index == 0 else f'{filename}-{index+1}'
            chunks.append((query, name, family, style, weight, directory, part))
    for query, filename, family, style, weight, directory, text in chunks:
        url = "https://fonts.googleapis.com/css2?" + urlencode({
            "family": query, "display": "swap", "text": text
        })
        css = fetch(url).decode("utf-8")
        sources = list(dict.fromkeys(re.findall(r"url\((https://[^)]+)\)", css)))
        if len(sources) != 1 or urlparse(sources[0]).hostname != "fonts.gstatic.com":
            raise RuntimeError(f"Unexpected font response for {family}: {css}")
        data = fetch(sources[0])
        if data[:4] != b"wOF2":
            raise RuntimeError(f"Expected WOFF2 for {family}, received {data[:4]!r}")
        (FONTS / f"{filename}.woff2").write_bytes(data)
        license_url = f"https://raw.githubusercontent.com/google/fonts/main/ofl/{directory}/OFL.txt"
        notice = FONTS / f"OFL-{filename}.txt"
        if not notice.exists():
            notice.write_bytes(fetch(license_url))
        rules.append(
            "@font-face {\n"
            f'  font-family: "{family}";\n'
            f'  src: url("{filename}.woff2?v=8") format("woff2");\n'
            f"  font-style: {style};\n"
            f"  font-weight: {weight};\n"
            "  font-display: swap;\n"
            + (f"  unicode-range: {','.join(f'U+{ord(c):X}' for c in text)};\n" if family.startswith('Noto') else '') +
            "}\n"
        )
        manifest.append({"family": family, "style": style, "weight": weight,
                         "file": f"{filename}.woff2", "bytes": len(data),
                         "source": sources[0], "license": license_url})
        print(f"{family}: {len(data):,} bytes, {len(text)} requested characters")
    (FONTS / "fonts.css").write_text("\n".join(rules), encoding="utf-8")
    (FONTS / "sources.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
