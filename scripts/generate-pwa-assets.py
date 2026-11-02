#!/usr/bin/env python3
"""Generate PWA images from the project's logo font (requires Pillow)."""

from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "public/fonts/ethnocentric.woff2"
ICONS = ROOT / "public/icons"
SPLASH = ROOT / "public/splash"


def centered_text(image, parts, size):
    font = ImageFont.truetype(FONT, size)
    draw = ImageDraw.Draw(image)
    text = "".join(text for text, _ in parts)
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    x = (image.width - (right - left)) / 2 - left
    y = (image.height - (bottom - top)) / 2 - top
    for text, color in parts:
        draw.text((x, y), text, font=font, fill=color)
        x += draw.textlength(text, font=font)


def save_png(image, path):
    image.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(
        path, optimize=True
    )


def main():
    # A square, opaque background lets iOS and Android apply their own masks.
    # The glyph stays within Android's central 80% maskable safe area.
    for filename, size in (
        ("apple-touch-icon.png", 180),
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("icon-maskable-512.png", 512),
    ):
        image = Image.new("RGB", (size * 3, size * 3), "#141414")
        centered_text(image, [("G", "#b8cfac")], int(size * 3 * 0.58))
        image = image.resize((size, size), Image.Resampling.LANCZOS)
        save_png(image, ICONS / filename)

    # The iOS launch screen matches the initial HTML screen. The HTML links
    # define the supported dimensions and corresponding pixel ratios.
    html = (ROOT / "index.html").read_text()
    links = re.findall(
        r'-webkit-device-pixel-ratio: (\d)[^"]*"\s+href="/splash/apple-splash-(\d+)x(\d+)\.png"',
        html,
    )
    if not links:
        raise ValueError("No iOS startup images found in index.html")

    for ratio, width, height in links:
        for suffix, background, foreground, accent in (
            ("", "#fafafa", "#171717", "#365e48"),
            ("-dark", "#141414", "#f5f5f5", "#b8cfac"),
        ):
            image = Image.new("RGB", (int(width), int(height)), background)
            centered_text(
                image,
                [("PR", foreground), ("G", accent), ("RSS", foreground)],
                24 * int(ratio),
            )
            save_png(image, SPLASH / f"apple-splash-{width}x{height}{suffix}.png")


if __name__ == "__main__":
    main()
