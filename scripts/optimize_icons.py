from pathlib import Path

from PIL import Image


def optimize_icon(path: Path) -> None:
    with Image.open(path) as source:
        image = source.convert("RGBA")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        image.save(path, format="PNG", optimize=True, compress_level=9)


def main() -> None:
    asset_dir = Path("assets/images")
    names = ["icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png"]
    for name in names:
        optimize_icon(asset_dir / name)


if __name__ == "__main__":
    main()
