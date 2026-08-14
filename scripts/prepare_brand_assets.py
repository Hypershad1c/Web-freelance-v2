from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/upload/WhatsAppImage2026-08-13at15.20.23.jpeg')
ROOT = Path('/home/ubuntu/domify-lead-hotfix')
PUBLIC = ROOT / 'public'
APP = ROOT / 'src' / 'app'


def resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.resize(size, Image.Resampling.LANCZOS)


def square_icon(mark: Image.Image, background: tuple[int, int, int], size: int, inset_ratio: float) -> Image.Image:
    canvas = Image.new('RGB', (size, size), background)
    safe = int(size * inset_ratio)
    target = size - (safe * 2)
    scale = min(target / mark.width, target / mark.height)
    mark_size = (max(1, round(mark.width * scale)), max(1, round(mark.height * scale)))
    fitted = resize(mark, mark_size)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.paste(fitted, (x, y))
    return canvas


def main() -> None:
    source = Image.open(SOURCE).convert('RGB')
    width, height = source.size
    if (width, height) != (1600, 900):
        raise RuntimeError(f'Unexpected supplied logo dimensions: {width}x{height}')

    background = source.getpixel((0, 0))
    brand_dir = PUBLIC / 'brand'
    brand_dir.mkdir(parents=True, exist_ok=True)

    # Preserve the full fingerprint-plus-wordmark composition for web placement.
    horizontal = source.crop((360, 245, 1225, 635))
    horizontal.save(brand_dir / 'domify-logo-horizontal.png', optimize=True)

    # A square app icon uses the distinctive fingerprint only, with conservative safe padding.
    fingerprint = source.crop((440, 300, 700, 565))
    any_192 = square_icon(fingerprint, background, 192, 0.12)
    any_512 = square_icon(fingerprint, background, 512, 0.12)
    maskable_192 = square_icon(fingerprint, background, 192, 0.23)
    maskable_512 = square_icon(fingerprint, background, 512, 0.23)
    apple = square_icon(fingerprint, background, 180, 0.16)

    any_192.save(PUBLIC / 'icon-192.png', optimize=True)
    any_512.save(PUBLIC / 'icon-512.png', optimize=True)
    maskable_192.save(PUBLIC / 'icon-192-maskable.png', optimize=True)
    maskable_512.save(PUBLIC / 'icon-512-maskable.png', optimize=True)
    apple.save(PUBLIC / 'apple-touch-icon.png', optimize=True)
    resize(any_192, (16, 16)).save(PUBLIC / 'favicon-16.png', optimize=True)
    resize(any_192, (32, 32)).save(PUBLIC / 'favicon-32.png', optimize=True)
    any_512.convert('RGBA').save(APP / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

    print('Prepared horizontal logo plus browser and installable-app icon assets.')


if __name__ == '__main__':
    main()
