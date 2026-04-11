#!/usr/bin/env python3
"""
Unified Zavis brand asset generator.

Generates PNG + SVG versions of the Zavis wordmark and icon, both driven
from the same layout math so they render identically.

SVG outputs are self-contained: glyphs are converted to <path> outlines
extracted directly from DMSans.ttf, so there is NO font dependency at
render time. The dot's position is computed from the actual glyph advance
widths (not hardcoded), so it never drifts.
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import Image, ImageDraw, ImageFont

DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(DIR, "DMSans.ttf")

# Palette
GREEN_HEX = "#00c853"
GREEN_RGBA = (0, 200, 83, 255)
DARK_HEX = "#1a1a1a"
DARK_RGBA = (26, 26, 26, 255)
LIGHT_HEX = "#f5f5f0"
LIGHT_RGBA = (245, 245, 240, 255)
CREAM_HEX = "#f5f0e8"
CREAM_RGBA = (245, 240, 232, 255)
BG_DARK_HEX = "#111111"
BG_DARK_RGBA = (17, 17, 17, 255)
TRANSPARENT = (0, 0, 0, 0)

# --- Load DM Sans at opsz=14, wght=700 ---
_raw = TTFont(FONT_PATH)
if "fvar" in _raw:
    font_tt = instantiateVariableFont(_raw, {"opsz": 14, "wght": 700}, inplace=False)
else:
    font_tt = _raw

glyph_set = font_tt.getGlyphSet()
cmap = font_tt["cmap"].getBestCmap()
hmtx = font_tt["hmtx"]
upm = font_tt["head"].unitsPerEm
ascent_u = font_tt["hhea"].ascent
descent_u = font_tt["hhea"].descent  # negative


def glyph_path(ch):
    name = cmap[ord(ch)]
    pen = SVGPathPen(glyph_set)
    glyph_set[name].draw(pen)
    adv, _ = hmtx[name]
    return pen.getCommands(), adv


def glyph_bounds(ch):
    name = cmap[ord(ch)]
    bp = BoundsPen(glyph_set)
    glyph_set[name].draw(bp)
    return bp.bounds  # (xMin, yMin, xMax, yMax) in font units


def build_wordmark(text_hex, text_rgba, out_base):
    text = "zavis"
    font_size = 120.0  # logical SVG units
    scale = font_size / upm

    # Advance-width layout AND collect ink bounds of each glyph
    x_u = 0
    glyphs = []
    ink_ymin_u = 0  # baseline
    ink_ymax_u = 0
    for ch in text:
        d, adv = glyph_path(ch)
        glyphs.append((x_u, d))
        b = glyph_bounds(ch)
        if b:
            _, ymin, _, ymax = b
            ink_ymin_u = min(ink_ymin_u, ymin)
            ink_ymax_u = max(ink_ymax_u, ymax)
        x_u += adv
    text_w = x_u * scale
    ink_top = ink_ymax_u * scale     # distance above baseline to highest ink
    ink_bot = -ink_ymin_u * scale    # distance below baseline to lowest ink (0 if no descenders)

    dot_r = font_size * 0.11
    gap = font_size * 0.07

    pad = font_size * 0.18
    # Canvas must include: ink above baseline (and dot top is baseline - 2*dot_r),
    # ink below baseline (dot bottom is exactly on baseline)
    top_extent = max(ink_top, 2 * dot_r)
    bot_extent = ink_bot
    baseline_y = pad + top_extent
    total_h = pad + top_extent + bot_extent + pad

    dot_cx = pad + text_w + gap + dot_r
    dot_cy = baseline_y - dot_r  # bottom of dot rests on the baseline

    total_w = pad + text_w + gap + dot_r * 2 + pad

    # ---- SVG (outlined paths) ----
    path_els = []
    for x_unit, d in glyphs:
        tx = pad + x_unit * scale
        path_els.append(
            f'  <path d="{d}" transform="translate({tx:.3f} {baseline_y:.3f}) '
            f'scale({scale:.6f} {-scale:.6f})" fill="{text_hex}"/>'
        )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {total_w:.2f} {total_h:.2f}" '
        f'width="{total_w * 2:.0f}" height="{total_h * 2:.0f}">\n'
        + "\n".join(path_els)
        + "\n"
        + f'  <circle cx="{dot_cx:.3f}" cy="{dot_cy:.3f}" r="{dot_r:.3f}" fill="{GREEN_HEX}"/>\n'
        + "</svg>\n"
    )
    with open(f"{out_base}.svg", "w") as f:
        f.write(svg)

    # ---- PNG (PIL, supersampled) ----
    ss = 4
    pil_font = ImageFont.truetype(FONT_PATH, int(round(font_size * ss)))
    try:
        pil_font.set_variation_by_axes([14, 700])
    except Exception:
        pass

    W = int(round(total_w * ss))
    H = int(round(total_h * ss))
    img = Image.new("RGBA", (W, H), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    # anchor="ls" → x=left of advance, y=baseline (matches SVG layout)
    draw.text((pad * ss, baseline_y * ss), text, fill=text_rgba, font=pil_font, anchor="ls")

    cx, cy, r = dot_cx * ss, dot_cy * ss, dot_r * ss
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN_RGBA)

    img = img.resize((int(round(total_w * 2)), int(round(total_h * 2))), Image.LANCZOS)
    img.save(f"{out_base}.png")
    print(f"  {os.path.basename(out_base)}.svg / .png  ({img.size[0]}x{img.size[1]})")


def build_icon(bg_hex, bg_rgba, text_hex, text_rgba, out_base, size=512):
    radius = size * 0.1875  # 96/512
    font_size = size * 0.625  # 320/512 — cap size
    scale = font_size / upm

    z_d, _ = glyph_path("Z")
    z_xmin, z_ymin, z_xmax, z_ymax = glyph_bounds("Z")
    ink_w = (z_xmax - z_xmin) * scale
    cap_h = (z_ymax - z_ymin) * scale

    dot_r = font_size * 0.085
    gap = font_size * 0.06

    content_w = ink_w + gap + dot_r * 2
    ink_start_x = (size - content_w) / 2

    # Center the cap vertically; baseline is cap-top + cap height (y_font=0)
    cap_top_y = (size - cap_h) / 2
    baseline_y = cap_top_y + z_ymax * scale

    # Put the Z glyph so its ink-left lands exactly at ink_start_x
    z_tx = ink_start_x - z_xmin * scale
    z_ty = baseline_y

    dot_cx = ink_start_x + ink_w + gap + dot_r
    dot_cy = baseline_y - dot_r

    # ---- SVG ----
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">\n'
        f'  <rect width="{size}" height="{size}" rx="{radius:.2f}" fill="{bg_hex}"/>\n'
        f'  <path d="{z_d}" transform="translate({z_tx:.3f} {z_ty:.3f}) '
        f'scale({scale:.6f} {-scale:.6f})" fill="{text_hex}"/>\n'
        f'  <circle cx="{dot_cx:.3f}" cy="{dot_cy:.3f}" r="{dot_r:.3f}" fill="{GREEN_HEX}"/>\n'
        f"</svg>\n"
    )
    with open(f"{out_base}.svg", "w") as f:
        f.write(svg)

    # ---- PNG ----
    ss = 4
    pil_font = ImageFont.truetype(FONT_PATH, int(round(font_size * ss)))
    try:
        pil_font.set_variation_by_axes([14, 700])
    except Exception:
        pass

    s = size * ss
    mask = Image.new("L", (s, s), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, s, s], radius=int(round(radius * ss)), fill=255)

    img = Image.new("RGBA", (s, s), TRANSPARENT)
    bg = Image.new("RGBA", (s, s), bg_rgba)
    img.paste(bg, mask=mask)
    draw = ImageDraw.Draw(img)

    # anchor="ls" → PIL's x is the advance-left; z_tx already accounts for lsb
    draw.text((z_tx * ss, baseline_y * ss), "Z", fill=text_rgba, font=pil_font, anchor="ls")

    cx, cy, r = dot_cx * ss, dot_cy * ss, dot_r * ss
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN_RGBA)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(f"{out_base}.png")
    print(f"  {os.path.basename(out_base)}.svg / .png  ({size}x{size})")


if __name__ == "__main__":
    print("Generating Zavis brand assets (unified SVG + PNG)...")
    build_wordmark(DARK_HEX, DARK_RGBA, os.path.join(DIR, "zavis-logo-dark"))
    build_wordmark(LIGHT_HEX, LIGHT_RGBA, os.path.join(DIR, "zavis-logo-light"))
    build_icon(CREAM_HEX, CREAM_RGBA, DARK_HEX, DARK_RGBA, os.path.join(DIR, "zavis-icon-light"))
    build_icon(BG_DARK_HEX, BG_DARK_RGBA, LIGHT_HEX, LIGHT_RGBA, os.path.join(DIR, "zavis-icon-dark"))
    print("Done!")
