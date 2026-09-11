from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

ASSETS = [
    ("kv-bg-wide.jpg", "kv-bg-wide.webp", 2400, 72),
    ("pmgo-sa-fall-kv.jpg", "pmgo-sa-fall-kv.webp", 2200, 70),
    ("kv-players-wide.jpg", "kv-players-wide.webp", 2200, 70),
    ("player-left.png", "player-left.webp", 840, 78),
    ("event-title-lockup.png", "event-title-lockup.webp", 1200, 82),
]


def resize_for_web(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image.copy()

    ratio = max_width / image.width
    size = (max_width, round(image.height * ratio))
    return image.resize(size, Image.Resampling.LANCZOS)


for source_name, output_name, max_width, quality in ASSETS:
    source = PUBLIC / source_name
    output = PUBLIC / output_name
    image = Image.open(source)
    has_alpha = image.mode in ("RGBA", "LA") or "transparency" in image.info
    mode = "RGBA" if has_alpha else "RGB"
    optimized = resize_for_web(image.convert(mode), max_width)
    optimized.save(
        output,
        "WEBP",
        quality=quality,
        method=6,
        lossless=False,
    )
    print(
        f"{source_name} -> {output_name}: "
        f"{source.stat().st_size:,} bytes to {output.stat().st_size:,} bytes"
    )
