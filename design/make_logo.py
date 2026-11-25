"""Generate the Better Mandaluyong seal and mark SVGs.

Both are built from the city seal's elements (27 stars, laurel, rising sun,
skyline, dove, waves), redrawn flat in the BetterGov palette
(blue #0032A0, gold #F2C91D). Lettering is converted to outlines in Figtree
ExtraBold (the BetterGov typeface, SIL OFL) so the SVGs need no fonts.

Needs fontTools (pip install fonttools) and the Figtree variable font:
  curl -L -o Figtree.ttf "https://github.com/google/fonts/raw/main/ofl/figtree/Figtree%5Bwght%5D.ttf"

Usage (from the repo root):
  python3 design/make_logo.py Figtree.ttf public
"""
import math
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

BLUE = "#0032A0"
GOLD = "#F2C91D"
WHITE = "#FFFFFF"

FONT_PATH, OUT = sys.argv[1], Path(sys.argv[2])
_font = instantiateVariableFont(TTFont(FONT_PATH), {"wght": 800})
_gs = _font.getGlyphSet()
_cmap = _font.getBestCmap()
_UPM = _font["head"].unitsPerEm


def f(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


def pt(p):
    return f"{f(p[0])},{f(p[1])}"


def circle(cx, cy, r):
    return (f"M{f(cx - r)},{f(cy)}a{f(r)},{f(r)} 0 1,0 {f(2 * r)},0"
            f"a{f(r)},{f(r)} 0 1,0 {f(-2 * r)},0Z")


# ---------------------------------------------------------------- lettering
def _glyph(ch):
    name = _cmap[ord(ch)]
    return name, _gs[name].width


def _glyph_path(ch, m):
    name, _ = _glyph(ch)
    pen = SVGPathPen(_gs, ntos=f)
    _gs[name].draw(TransformPen(pen, m))
    return pen.getCommands()


def _text_width(text, size, track):
    s = size / _UPM
    return sum(_glyph(ch)[1] * s for ch in text) + track * (len(text) - 1)


def arc_text(text, cx, cy, r, center_deg, size, track, top=True):
    """Text set on a circle with its baseline at radius r.
    top=True: letter tops point outward, reads clockwise (top of a seal).
    top=False: letter tops point inward, reads counter-clockwise (bottom)."""
    s = size / _UPM
    pos = -_text_width(text, size, track) / 2
    cmds = []
    for ch in text:
        _, adv = _glyph(ch)
        w = adv * s
        mid = pos + w / 2
        if top:
            th = math.radians(center_deg) + mid / r
            rot = th + math.pi / 2
        else:
            th = math.radians(center_deg) - mid / r
            rot = th - math.pi / 2
        px, py = cx + r * math.cos(th), cy + r * math.sin(th)
        cr, sr = math.cos(rot), math.sin(rot)
        if ch != " ":
            cmds.append(_glyph_path(ch, (s * cr, s * sr, s * sr, -s * cr,
                                         px - w / 2 * cr, py - w / 2 * sr)))
        pos += w + track
    return "".join(cmds)


# ---------------------------------------------------------------- motifs
def star(cx, cy, r, rot_deg=-90, inner=0.4):
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot_deg + i * 36)
        pts.append(pt((cx + rr * math.cos(a), cy + rr * math.sin(a))))
    return "M" + "L".join(pts) + "Z"


def ph_sun(cx, cy, r, ray_in, ray_out, side_out, half=0.075, side_off=16):
    """Philippine-flag sun: disc and 8 primary rays, each flanked by 2 minor rays."""
    d = [circle(cx, cy, r)]
    for k in range(8):
        base = k * 45 - 90
        for off, out, hw in ((0, ray_out, half), (-side_off, side_out, half * 0.7),
                             (side_off, side_out, half * 0.7)):
            a = math.radians(base + off)
            tip = (cx + out * math.cos(a), cy + out * math.sin(a))
            p1 = (cx + ray_in * math.cos(a - hw), cy + ray_in * math.sin(a - hw))
            p2 = (cx + ray_in * math.cos(a + hw), cy + ray_in * math.sin(a + hw))
            d.append(f"M{pt(p1)}L{pt(tip)}L{pt(p2)}Z")
    return "".join(d)


def wave(x0, x1, y, amp, wl, phase=0.0, bottom=None, step=3):
    """Band whose top edge is a sine wave, filled down to `bottom`."""
    pts = []
    x = x0
    while x <= x1 + 0.01:
        pts.append((x, y + amp * math.sin(2 * math.pi * (x - x0) / wl + phase)))
        x += step
    return ("M" + "L".join(pt(p) for p in pts)
            + f"L{f(x1)},{f(bottom)}L{f(x0)},{f(bottom)}Z")


def leaf(px, py, ang, length, width):
    """Pointed leaf from (px, py) in direction ang (radians)."""
    tx, ty = px + length * math.cos(ang), py + length * math.sin(ang)
    nx, ny = -math.sin(ang), math.cos(ang)
    mx, my = px + (tx - px) * 0.45, py + (ty - py) * 0.45
    return (f"M{f(px)},{f(py)}Q{f(mx + nx * width)},{f(my + ny * width)} {f(tx)},{f(ty)}"
            f"Q{f(mx - nx * width)},{f(my - ny * width)} {f(px)},{f(py)}Z")


def laurel(cx, cy, r, a_start, a_end, n=8, leaf_len=25, leaf_w=8.5):
    """Laurel branch along a circle from a_start to a_end (degrees); leaves
    point toward a_end and shrink toward the tip. Returns (stem, leaves)."""
    sgn = 1 if a_end > a_start else -1
    a0, a1 = math.radians(a_start), math.radians(a_end)
    s0 = (cx + r * math.cos(a0), cy + r * math.sin(a0))
    s1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
    stem = f"M{pt(s0)}A{f(r)},{f(r)} 0 0,{1 if sgn > 0 else 0} {pt(s1)}"
    leaves = []
    for i in range(n):
        for side, lag in ((-1, 0.0), (1, 0.5)):          # alternate the two rows
            t = (i + 0.35 + lag) / (n + 0.5)
            a = a0 + (a1 - a0) * t
            p = (cx + r * math.cos(a), cy + r * math.sin(a))
            k = 1 - 0.4 * t
            ang = a + sgn * math.pi / 2 + side * math.radians(32)
            leaves.append(leaf(*p, ang, leaf_len * k, leaf_w * k))
    leaves.append(leaf(*s1, a1 + sgn * math.pi / 2, leaf_len * 0.6, leaf_w * 0.6))
    return stem, "".join(leaves)


# ---------------------------------------------------------------- dove
def _feathers(start, notches, depth, outward_sign):
    """Quadratic lobes from `start` through each notch; lobes bulge to one side."""
    segs, prev = [], start
    for n, dep in zip(notches, depth):
        dx, dy = n[0] - prev[0], n[1] - prev[1]
        L = math.hypot(dx, dy)
        nx, ny = -dy / L * outward_sign, dx / L * outward_sign
        mx, my = (prev[0] + n[0]) / 2, (prev[1] + n[1]) / 2
        segs.append(("Q", (mx + nx * dep * 2, my + ny * dep * 2), n))
        prev = n
    return segs


def _reverse(start, segs):
    """Reverse a segment list that begins at `start`."""
    pts = [start] + [s[-1] for s in segs]
    out = []
    for i in range(len(segs) - 1, -1, -1):
        seg, to = segs[i], pts[i]
        if seg[0] == "L":
            out.append(("L", to))
        elif seg[0] == "Q":
            out.append(("Q", seg[1], to))
        else:
            out.append(("C", seg[2], seg[1], to))
    return pts[-1], out


def _mirror(segs):
    m = lambda p: (-p[0], p[1])
    return [(s[0],) + tuple(m(p) for p in s[1:]) for s in segs]


# Left wing in dove-local units (dove centre at 0,0; head turned to the left).
_SHOULDER = (-15, -6)
_WINGTIP = (-140, -50)
_WING_LEAD = [("C", (-46, -42), (-98, -62), _WINGTIP)]
_WING_TRAIL = _feathers(
    _WINGTIP,
    [(-131, -31), (-118, -18), (-101, -7), (-82, 2), (-61, 9), (-39, 13), (-17, 15)],
    [9, 10, 10, 9.5, 9, 8, 6],
    outward_sign=1,
)


def dove(cx, cy, s=1.0, tilt_deg=-5):
    """Front-on gliding dove, wings spread wide, head turned left, tail fanned.
    Returns (body path, eye path)."""
    c, sn = math.cos(math.radians(tilt_deg)), math.sin(math.radians(tilt_deg))
    T = lambda p: (cx + s * (p[0] * c - p[1] * sn), cy + s * (p[0] * sn + p[1] * c))

    segs = [
        ("L", (-31, -33)),                                  # top of beak
        ("C", (-29, -47), (-7, -49), (-2, -35)),            # crown
        ("C", (2, -25), (8, -13), (15, -6)),                # nape to right shoulder
    ]
    segs += _mirror(_WING_LEAD + _WING_TRAIL)               # right wing
    segs += [("C", (21, 26), (27, 38), (32, 50))]           # right flank to tail
    segs += _feathers((32, 50), [(18, 57), (3, 60), (-12, 57), (-27, 49)],
                      [5, 5, 5, 5], outward_sign=-1)        # tail fan
    segs += [("C", (-22, 38), (-18, 26), (-17, 15))]        # left flank
    _, left = _reverse(_SHOULDER, _WING_LEAD + _WING_TRAIL)
    segs += left                                            # left wing, tip-first
    segs += [("C", (-22, -12), (-29, -18), (-34, -22))]     # throat
    beak = (-46, -29)

    d = f"M{pt(T(beak))}"
    for seg in segs:
        d += seg[0] + " ".join(pt(T(p)) for p in seg[1:])
    d += "Z"
    ex, ey = T((-17, -36))
    return d, circle(ex, ey, 3.2 * s)


# ---------------------------------------------------------------- scene
def skyline(cx, base):
    """Skyline silhouettes around a central tower. Returns (blue, white windows)."""
    blds = [(-176, -128, 40), (-128, -98, 26), (-98, -62, 58), (-62, -24, 96),
            (24, 62, 112), (62, 98, 78), (98, 138, 54), (138, 180, 36)]
    d = "".join(f"M{f(cx + x0)},{f(base + 2)}V{f(base - h)}H{f(cx + x1)}V{f(base + 2)}Z"
                for x0, x1, h in blds)
    # central tower with a stepped crown and spire
    t0, t1, top = cx - 24, cx + 24, base - 182
    d += (f"M{f(t0)},{f(base + 2)}V{f(top + 30)}H{f(t0 + 6)}V{f(top + 16)}H{f(t0 + 14)}"
          f"V{f(top + 4)}H{f(cx - 2)}V{f(top - 14)}H{f(cx + 2)}V{f(top + 4)}H{f(t1 - 14)}"
          f"V{f(top + 16)}H{f(t1 - 6)}V{f(top + 30)}H{f(t1)}V{f(base + 2)}Z")
    win = ""
    y = top + 40
    while y < base - 60:
        win += f"M{f(t0 + 9)},{f(y)}H{f(t1 - 9)}V{f(y + 3.5)}H{f(t0 + 9)}Z"
        y += 12
    for x0, x1, h in (blds[3], blds[4]):                    # slits on the mid-rises
        for xs in (x0 + 11, x1 - 14):
            win += f"M{f(cx + xs)},{f(base - h + 12)}h3V{f(base - 50)}h-3Z"
    return d, win


def scene(cx, cy, R, base_off=36):
    base = cy + base_off
    x0, x1, bot = cx - R - 4, cx + R + 4, cy + R + 4
    sil, win = skyline(cx, base)
    dv, eye = dove(cx, base + 8, 0.93)
    return "\n    ".join([
        f'<path fill="{GOLD}" d="{ph_sun(cx - 80, base - 64, 30, 38, 98, 70)}"/>',
        f'<path fill="{BLUE}" d="{sil}"/>',
        f'<path fill="{WHITE}" d="{win}"/>',
        f'<path fill="{GOLD}" d="{wave(x0, x1, base + 10, 5, 92, 0.3, bot)}"/>',
        f'<path fill="{BLUE}" d="{wave(x0, x1, base + 34, 6, 108, 2.2, bot)}"/>',
        f'<path fill="{GOLD}" d="{wave(x0, x1, base + 62, 6, 120, 4.0, bot)}"/>',
        f'<path fill="{BLUE}" d="{wave(x0, x1, base + 88, 6, 132, 5.6, bot)}"/>',
        f'<path fill="{WHITE}" stroke="{BLUE}" stroke-width="4" stroke-linejoin="round" d="{dv}"/>',
        f'<path fill="{BLUE}" d="{eye}"/>',
    ])


def medallion(cx, cy, R, clip_id):
    """White scene disc of radius R, clipped, with a gold rule around it."""
    return "\n  ".join([
        f'<clipPath id="{clip_id}"><circle cx="{cx}" cy="{cy}" r="{R}"/></clipPath>',
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{WHITE}"/>',
        f'<g clip-path="url(#{clip_id})">\n    {scene(cx, cy, R)}\n  </g>',
        f'<circle cx="{cx}" cy="{cy}" r="{R + 1.5}" fill="none" stroke="{GOLD}" stroke-width="3"/>',
    ])


# ---------------------------------------------------------------- outputs
def seal():
    cx = cy = 256
    R_OUT, R_SEP, R_STAR, R_SCENE = 252, 195, 177, 158
    stars = "".join(
        star(cx + R_STAR * math.cos(math.radians(a)), cy + R_STAR * math.sin(math.radians(a)),
             7.5, rot_deg=a)
        for a in (-90 + i * 360 / 27 for i in range(27)))   # one per barangay
    # two branches crossing at the bottom, growing up and out toward the text
    s1, l1 = laurel(cx, cy, 222, 84, 166, n=9)
    s2, l2 = laurel(cx, cy, 222, 96, 14, n=9)
    body = "\n  ".join([
        f'<circle cx="{cx}" cy="{cy}" r="{R_OUT}" fill="{BLUE}"/>',
        f'<circle cx="{cx}" cy="{cy}" r="{R_OUT - 7}" fill="none" stroke="{WHITE}" stroke-width="1.5"/>',
        f'<circle cx="{cx}" cy="{cy}" r="{R_SEP}" fill="none" stroke="{GOLD}" stroke-width="3"/>',
        f'<path fill="{GOLD}" d="{stars}"/>',
        f'<path fill="{WHITE}" d="{arc_text("BETTER MANDALUYONG", cx, cy, 208, -90, 34, 3.2)}"/>',
        f'<path fill="none" stroke="{GOLD}" stroke-width="2.5" stroke-linecap="round" d="{s1}{s2}"/>',
        f'<path fill="{GOLD}" d="{l1}{l2}"/>',
        medallion(cx, cy, R_SCENE, "bm-seal"),
    ])
    return svg_doc(body, "Better Mandaluyong seal",
                   "Seal-style emblem: 27 stars for the barangays, a laurel wreath, "
                   "a rising Philippine sun over the skyline, a dove of peace, and blue "
                   "and gold waves.")


def mark():
    """Compact mark: the seal's centre medallion, enlarged, without the ring."""
    cx = cy = 256
    R_SCENE = 158
    k = 222 / R_SCENE
    body = "\n  ".join([
        f'<circle cx="{cx}" cy="{cy}" r="252" fill="{BLUE}"/>',
        f'<g transform="translate({cx} {cy}) scale({f(k)}) translate({-cx} {-cy})">\n  '
        + medallion(cx, cy, R_SCENE, "bm-mark") + "\n  </g>",
    ])
    return svg_doc(body, "Better Mandaluyong mark",
                   "A dove of peace over the Mandaluyong skyline, a rising Philippine "
                   "sun, and blue and gold waves.")


def svg_doc(body, title, desc):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" '
            f'aria-labelledby="t d">\n  <title id="t">{title}</title>\n'
            f'  <desc id="d">{desc}</desc>\n  {body}\n</svg>\n')


OUT.mkdir(parents=True, exist_ok=True)
(OUT / "logo-seal.svg").write_text(seal())
(OUT / "logo-mark.svg").write_text(mark())
print("ok", sorted((p.name, p.stat().st_size) for p in OUT.glob("logo-*.svg")))
