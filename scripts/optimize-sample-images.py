from pathlib import Path

from PIL import Image, ImageOps

ASSET_DIRECTORY = Path(__file__).resolve().parents[1] / "public" / "sample-listings"
MAX_DIMENSION = 1600


def optimize(image_path: Path) -> None:
    with Image.open(image_path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
        image.save(image_path, "JPEG", quality=82, optimize=True, progressive=True)


for asset in sorted(ASSET_DIRECTORY.glob("*.jpg")):
    optimize(asset)
    print(asset.name)
