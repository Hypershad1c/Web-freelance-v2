from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/upload/WhatsAppImage2026-08-13at15.20.23.jpeg')
MASTER = Path('/home/ubuntu/domify-lead-hotfix/public/brand/domify-logo-master.png')
ROOT = Path('/home/ubuntu/domify-lead-hotfix')
PUBLIC = ROOT / 'public'
APP = ROOT / 'src' / 'app'
BRAND = PUBLIC / 'brand'
IOS = PUBLIC / 'ios'


def resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.resize(size, Image.Resampling.LANCZOS)


def fit_contain(image: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    scale = min(target_size[0] / image.width, target_size[1] / image.height)
    return resize(image, (max(1, round(image.width * scale)), max(1, round(image.height * scale))))


def remove_dark_background(image: Image.Image) -> Image.Image:
    rgba = image.convert('RGBA')
    cleaned = []
    for red, green, blue, alpha in rgba.getdata():
        # The source artwork uses a very dark navy backdrop. Keep the bright blue mark
        # and white wordmark while removing only the low-luminance backdrop.
        if red < 65 and green < 95 and blue < 125 and blue - red < 85:
            cleaned.append((red, green, blue, 0))
        else:
            cleaned.append((red, green, blue, alpha))
    rgba.putdata(cleaned)
    return rgba


def square_icon(mark: Image.Image, background: tuple[int, int, int], size: int, inset_ratio: float) -> Image.Image:
    canvas = Image.new('RGB', (size, size), background)
    safe = int(size * inset_ratio)
    fitted = fit_contain(mark, (size - safe * 2, size - safe * 2))
    canvas.paste(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return canvas


def splash_screen(logo: Image.Image, background: tuple[int, int, int], size: tuple[int, int]) -> Image.Image:
    canvas = Image.new('RGB', size, background)
    logo_width = round(size[0] * 0.60)
    logo_height = round(logo_width * logo.height / logo.width)
    fitted = resize(logo, (logo_width, logo_height))
    y = round(size[1] * 0.42) - fitted.height // 2
    position = ((size[0] - fitted.width) // 2, y)
    canvas.paste(fitted, position, fitted if fitted.mode == 'RGBA' else None)
    return canvas


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, format='PNG', optimize=True)


def main() -> None:
    source = Image.open(SOURCE).convert('RGB')
    master = Image.open(MASTER).convert('RGB') if MASTER.exists() else source
    if source.size != (1600, 900):
        raise RuntimeError(f'Unexpected supplied logo dimensions: {source.width}x{source.height}')

    BRAND.mkdir(parents=True, exist_ok=True)
    IOS.mkdir(parents=True, exist_ok=True)
    background = source.getpixel((0, 0))

    # The high-resolution master preserves the complete supplied horizontal wordmark for web placements.
    horizontal = master.crop((500, 400, 2060, 1040)) if master.size == (2560, 1440) else source.crop((360, 245, 1225, 635))
    transparent_horizontal = remove_dark_background(horizontal)
    save_png(transparent_horizontal, BRAND / 'domify-logo-horizontal.png')

    # The icon uses the unique fingerprint only, allowing every iOS home-screen surface to remain legible.
    fingerprint = source.crop((440, 300, 700, 565))
    icons = {
        'icon-192.png': square_icon(fingerprint, background, 192, 0.12),
        'icon-512.png': square_icon(fingerprint, background, 512, 0.12),
        'icon-1024.png': square_icon(fingerprint, background, 1024, 0.12),
        'icon-192-maskable.png': square_icon(fingerprint, background, 192, 0.23),
        'icon-512-maskable.png': square_icon(fingerprint, background, 512, 0.23),
        'apple-touch-icon-120x120.png': square_icon(fingerprint, background, 120, 0.16),
        'apple-touch-icon-152x152.png': square_icon(fingerprint, background, 152, 0.16),
        'apple-touch-icon-167x167.png': square_icon(fingerprint, background, 167, 0.16),
        'apple-touch-icon-180x180.png': square_icon(fingerprint, background, 180, 0.16),
    }
    for filename, icon in icons.items():
        save_png(icon, PUBLIC / filename)

    # Apple searches this conventional filename when an explicit link cannot be read.
    save_png(icons['apple-touch-icon-180x180.png'], PUBLIC / 'apple-touch-icon.png')
    save_png(resize(icons['icon-192.png'], (16, 16)), PUBLIC / 'favicon-16.png')
    save_png(resize(icons['icon-192.png'], (32, 32)), PUBLIC / 'favicon-32.png')
    icons['icon-1024.png'].convert('RGBA').save(APP / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

    # Launch images prevent an unbranded blank transition when the site opens from an iOS home-screen icon.
    splash_sizes = {
        'apple-splash-1170x2532.png': (1170, 2532),
        'apple-splash-1284x2778.png': (1284, 2778),
        'apple-splash-1290x2796.png': (1290, 2796),
        'apple-splash-1488x2266.png': (1488, 2266),
        'apple-splash-1536x2048.png': (1536, 2048),
        'apple-splash-1620x2160.png': (1620, 2160),
        'apple-splash-1668x2388.png': (1668, 2388),
        'apple-splash-1668x2224.png': (1668, 2224),
        'apple-splash-2048x2732.png': (2048, 2732),
    }
    for filename, size in splash_sizes.items():
        save_png(splash_screen(transparent_horizontal, background, size), IOS / filename)

    print('Prepared high-resolution website logo, browser icons, iOS touch icons, and iOS launch screens.')


if __name__ == '__main__':
    main()
