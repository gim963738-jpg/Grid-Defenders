"""Render a transparent, articulated sword strike from the saved imagegen atlas.

No video-generation API is used. The 240 output frames are rendered at their own
time samples using two-bone arm IK, a rigid sword, and a planted-foot body warp.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import zipfile

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/animation/sword-overhead-right-v01'
ASSETS = OUT / 'assets'
SIZE = 1024
FPS = 60
COUNT = 240
SCALE = 0.60
ORIGIN = np.array([300., 285.])


def save_json(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ease(v):
    v = np.clip(v, 0., 1.)
    return v * v * (3. - 2. * v)


def interpolate(t, keys):
    if t <= keys[0][0]:
        return np.array(keys[0][1:], dtype=float)
    for a, b in zip(keys, keys[1:]):
        if t <= b[0]:
            u = float(ease((t - a[0]) / (b[0] - a[0])))
            return np.array(a[1:]) * (1 - u) + np.array(b[1:]) * u
    return np.array(keys[-1][1:], dtype=float)


def pose(t):
    # hand x/y, clockwise sword angle measured from up, lean, crouch
    before = [
        (0.00, 454, 683, 142, 0, 0),
        (0.22, 454, 683, 142, -1, 1),
        (0.88, 480, 565, 54, -5, 5),
        (1.70, 403, 329, -18, -14, -7),
        (1.95, 399, 328, -23, -17, -7),
        (2.18, 389, 335, -38, -23, 0),
    ]
    after = [
        (2.68, 550, 650, 148, 52, 25),
        (2.80, 547, 647, 145, 50, 22),
        (3.02, 529, 654, 139, 32, 13),
        (3.60, 475, 653, 137, 0, 1),
        (4.00, 475, 653, 137, 0, 0),
    ]
    if t <= 2.18:
        values = interpolate(t, before)
    elif t < 2.68:
        u = (t - 2.18) / .5
        p = u ** 1.65
        # Accelerating arc: there is no stop at an intermediate swing pose.
        start = np.array([389., 335.])
        control = np.array([523., 360.])
        end = np.array([550., 650.])
        hand = (1-p)**2 * start + 2*(1-p)*p*control + p*p*end
        values = np.array([*hand, -38 + 186*p, -23 + 75*p, 25*p])
    else:
        values = interpolate(t, after)
    hand = values[:2]
    theta = math.radians(values[2])
    lean = values[3] + .35 * math.sin(t * 3.1)
    crouch = values[4] + .6 * math.sin(t * 6.2)
    # Position of the second glove on the same handle, towards the pommel.
    grip_offset = np.array([-math.sin(theta), math.cos(theta)]) * 24.
    joined = hand + grip_offset
    free = np.array([464., 645.]) + [lean*.9, crouch]
    gathering = float(ease((t - .18) / .65))
    far_hand = free*(1-gathering) + joined*gathering
    return hand, far_hand, theta, lean, crouch, gathering


def body_point(point, lean, crouch):
    x, y = point
    # Same deformation as the raster body: feet at y>=1030 remain planted.
    w = np.clip((1030-y)/610., 0., 1.5)
    v = float(ease((1030-y)/430.))
    return ORIGIN + [(x-150)*SCALE + lean*w, y*SCALE + crouch*v]


def premultiply(image):
    a = np.asarray(image).astype(np.float32) / 255.
    a[:, :, :3] *= a[:, :, 3:4]
    return a


def over(canvas, layer, x, y):
    h, w = layer.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(SIZE, x+w), min(SIZE, y+h)
    if x1 <= x0 or y1 <= y0:
        return
    src = layer[y0-y:y1-y, x0-x:x1-x]
    dst = canvas[y0:y1, x0:x1]
    dst[:] = src + dst*(1-src[:, :, 3:4])


def place(canvas, art, matrix):
    h, w = art.shape[:2]
    corners = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]])
    points = corners @ matrix.T
    minimum = np.floor(points.min(axis=0)).astype(int)-3
    maximum = np.ceil(points.max(axis=0)).astype(int)+3
    shifted = matrix.copy()
    shifted[:, 2] -= minimum
    target = cv2.warpAffine(art, shifted, tuple(maximum-minimum),
                            flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    target = np.clip(target, 0, 1)
    target[:, :, :3] = np.minimum(target[:, :, :3], target[:, :, 3:4])
    over(canvas, target, *minimum)


def segment_matrix(a, b, p, q):
    a, b, p, q = map(lambda v: np.asarray(v, float), (a, b, p, q))
    source, target = b-a, q-p
    scale = np.linalg.norm(target)/np.linalg.norm(source)
    angle = math.atan2(target[1], target[0])-math.atan2(source[1], source[0])
    c, s = math.cos(angle)*scale, math.sin(angle)*scale
    rotation = np.array([[c, -s], [s, c]])
    return np.column_stack((rotation, p - rotation@a))


def elbow(shoulder, wrist, a, b, side):
    vector = wrist-shoulder
    d = float(np.linalg.norm(vector))
    # The recorded stretch is checked; no IK endpoint is detached from a grip.
    stretch = max(1., d/(a+b-.1))
    a, b = a*stretch, b*stretch
    d = max(.01, d)
    along = (a*a-b*b+d*d)/(2*d)
    height = math.sqrt(max(0., a*a-along*along))
    direction = vector/d
    perpendicular = np.array([direction[1], -direction[0]])
    return shoulder+direction*along+perpendicular*height*side, stretch


def load_parts():
    atlas = Image.open(ASSETS/'rig-atlas.png').convert('RGBA')
    # Measured extraction boxes, not an assumed equal-cell grid.
    specs = {
        'body': (150, 0, 520, 1056),
        'near_upper': (700, 80, 870, 334),
        'near_forearm': (709, 375, 841, 624),
        'far_upper': (709, 650, 833, 836),
        'far_forearm': (709, 802, 833, 1022),
        'sword': (1080, 200, 1296, 871),
    }
    parts = {}
    for name, box in specs.items():
        art = atlas.crop(box)
        art.save(ASSETS/f'{name}.png')
        parts[name] = premultiply(art)
    return parts, specs


def render_body(canvas, art, lean, crouch):
    x0, y0, w, h = 220, 255, 420, 690
    yy, xx = np.mgrid[y0:y0+h, x0:x0+w].astype(np.float32)
    sy = np.arange(art.shape[0], dtype=np.float32)
    vertical = ORIGIN[1]+sy*SCALE+crouch*ease((1030-sy)/430.)
    source_y = np.interp(yy[:, 0], vertical, sy).astype(np.float32)
    source_y[yy[:, 0] < vertical[0]] = -10
    source_y[yy[:, 0] > vertical[-1]] = art.shape[0]+10
    shift = lean*np.clip((1030-source_y)/610., 0., 1.5)
    map_x = ((xx-ORIGIN[0]-shift[:, None])/SCALE).astype(np.float32)
    map_y = np.broadcast_to(source_y[:, None], xx.shape).copy()
    layer = cv2.remap(art, map_x, map_y, cv2.INTER_CUBIC,
                      borderMode=cv2.BORDER_CONSTANT)
    layer = np.clip(layer, 0, 1)
    layer[:, :, :3] = np.minimum(layer[:, :, :3], layer[:, :, 3:4])
    over(canvas, layer, x0, y0)


def frame_at(t, parts):
    canvas = np.zeros((SIZE, SIZE, 4), np.float32)
    hand, far_hand, theta, lean, crouch, gathering = pose(t)
    near_shoulder = body_point((290, 388), lean, crouch)
    far_shoulder = body_point((351, 386), lean, crouch)
    near_elbow, ns = elbow(near_shoulder, hand, 94., 102., 1)
    far_elbow, fs = elbow(far_shoulder, far_hand, 84., 96., 1)
    place(canvas, parts['far_upper'], segment_matrix(
        (62, 54), (59, 169), far_shoulder, far_elbow))
    place(canvas, parts['far_forearm'], segment_matrix(
        (59, 25), (67, 182), far_elbow, far_hand))
    render_body(canvas, parts['body'], lean, crouch)
    place(canvas, parts['near_upper'], segment_matrix(
        (84, 74), (72, 223), near_shoulder, near_elbow))
    # Sword is a rigid object. The same pivot drives both grip targets.
    c, s = math.cos(theta)*.55, math.sin(theta)*.55
    rotation = np.array([[c, -s], [s, c]])
    pivot = np.array([106., 570.])
    place(canvas, parts['sword'], np.column_stack((rotation, hand-rotation@pivot)))
    # Near glove and a foreground copy of just the far glove cover the hilt.
    place(canvas, parts['far_forearm'], segment_matrix(
        (59, 25), (67, 182), far_elbow, far_hand))
    place(canvas, parts['near_forearm'], segment_matrix(
        (64, 38), (77, 210), near_elbow, hand))
    alpha = canvas[:, :, 3:4]
    rgb = np.divide(canvas[:, :, :3], alpha, out=np.zeros_like(canvas[:, :, :3]), where=alpha>1.e-6)
    rgba = np.uint8(np.clip(np.concatenate((rgb, alpha), axis=2)*255+.5, 0, 255))
    # Remove only <=2/255 interpolation dust; retain the visible antialiased edge.
    # This is alpha cleanup, never a rectangular crop of a blade or body part.
    rgba[rgba[:, :, 3] <= 2] = 0
    info = {'hand': hand.tolist(), 'second_hand': far_hand.tolist(),
            'angle_degrees': math.degrees(theta), 'body_lean': float(lean),
            'body_crouch': float(crouch), 'grip_join': gathering,
            'near_arm_stretch': ns, 'far_arm_stretch': fs}
    return Image.fromarray(rgba), info


def background(kind, size=SIZE):
    if kind == 'battlefield':
        image = Image.open(ROOT/'게임/public/assets/battlefields/forest-clearing-v1.png').convert('RGB')
        return image.resize((size, size), Image.Resampling.LANCZOS).convert('RGBA')
    if kind == 'green':
        return Image.new('RGBA', (size, size), '#d9f6d7')
    if kind == 'light':
        return Image.new('RGBA', (size, size), '#eeeeed')
    yy, xx = np.indices((size, size))
    array = (((xx//32+yy//32)%2)*14+226).astype('uint8')
    return Image.fromarray(np.dstack((array, array, array, np.full_like(array, 255))))


def composite(image, kind):
    base = background(kind)
    base.alpha_composite(image)
    return base.convert('RGB')


def contact_sheet(parts):
    times = [0, .5, .88, 1.25, 1.70, 2.18, 2.42, 2.58, 2.68, 2.8, 3.2, 3.98]
    sheet = Image.new('RGB', (1536, 1230), '#f5f5f3')
    draw = ImageDraw.Draw(sheet)
    for j, t in enumerate(times):
        image, _ = frame_at(t, parts)
        x, y = (j%4)*384, (j//4)*410
        image = composite(image, 'green' if (j//4)%2 == 0 else 'light')
        sheet.paste(image.resize((384, 384), Image.Resampling.LANCZOS), (x, y))
        draw.text((x+12, y+389), f'{t:.2f}s  /  frame {min(240,round(t*60)+1):03}', fill='#303534')
    sheet.save(OUT/'motion-contact-sheet.jpg', quality=94)


def encode():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    inputs = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '60',
              '-i', str(OUT/'frames/strike_%04d.png'), '-frames:v', '240', '-an']
    commands = [
        (inputs + ['-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le',
                   '-alpha_bits', '16', '-vendor', 'apl0', '-metadata',
                   'comment=4 second 60fps transparent articulated animation; not generative video',
                   str(OUT/'sword-overhead-right-4s-60fps-alpha.mov')]),
        (inputs + ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0',
                   '-crf', '20', '-auto-alt-ref', '0', '-row-mt', '1',
                   '-metadata:s:v:0', 'alpha_mode=1',
                   str(OUT/'sword-overhead-right-4s-60fps-alpha.webm')]),
    ]
    for cmd in commands:
        print('Encoding', Path(cmd[-1]).name, flush=True)
        subprocess.run(cmd, check=True)
    # A conventional preview is explicitly marked: the alpha deliverables are above.
    base = background('checker').convert('RGB')
    preview = subprocess.Popen([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', '1024x1024',
        '-framerate', '60', '-i', '-', '-frames:v', '240', '-an',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', str(OUT/'preview-checkerboard.mp4')], stdin=subprocess.PIPE)
    for i in range(COUNT):
        image = base.copy().convert('RGBA')
        image.alpha_composite(Image.open(OUT/f'frames/strike_{i:04}.png'))
        preview.stdin.write(image.convert('RGB').tobytes())
    preview.stdin.close()
    if preview.wait():
        raise RuntimeError('Preview encoding failed')


def render_all(parts, specs):
    records, hashes, union = [], set(), [SIZE, SIZE, 0, 0]
    for i in range(COUNT):
        image, motion = frame_at(i/FPS, parts)
        path = OUT/f'frames/strike_{i:04}.png'
        image.save(path, compress_level=3)
        hashes.add(digest(path))
        alpha = np.asarray(image.getchannel('A'))
        bounds = image.getchannel('A').getbbox()
        edge = int(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max()))
        if edge:
            raise ValueError(f'Clipped alpha at frame {i}')
        for j in (0, 1):
            union[j] = min(union[j], bounds[j])
        for j in (2, 3):
            union[j] = max(union[j], bounds[j])
        records.append({'index': i, 'logical_frame': i+1, 'time': i/FPS,
                        'alpha_bbox': bounds, 'border_alpha_max': edge, **motion})
        if i%60 == 0:
            print(f'Rendered {i}/{COUNT}', flush=True)
    max_stretch = max(max(r['near_arm_stretch'], r['far_arm_stretch']) for r in records)
    padding = min(union[0], union[1], SIZE-union[2], SIZE-union[3])
    if padding < 24:
        raise ValueError(f'Insufficient transparent safety padding: {padding}px')
    save_json(OUT/'animation.json', {
        'version': 1, 'method': 'imagegen reference-derived rig + deterministic 2D animation',
        'generative_video_model_used': False, 'width': SIZE, 'height': SIZE,
        'fps': FPS, 'frame_count': COUNT, 'duration_seconds': COUNT/FPS,
        'frame_indexing': 'PNG names zero-based; logical_frame one-based',
        'frame_pattern': 'frames/strike_%04d.png', 'background': 'transparent',
        'facing': 'screen right, 90 degree profile', 'source_regions': specs,
        'body_origin': ORIGIN.tolist(), 'body_scale': SCALE,
        'planted_feet': True, 'damage_model': None,
        'motion_contact_frame': 162, 'motion_contact_seconds': 2.6833333333,
        'contact_is_visual_only': True, 'frames': records})
    save_json(OUT/'verification-frames.json', {
        'width': SIZE, 'height': SIZE, 'fps': FPS, 'frames': len(records),
        'duration_seconds': COUNT/FPS, 'unique_png_hashes': len(hashes),
        'all_frame_borders_fully_transparent': True, 'alpha_union_bbox': union,
        'minimum_canvas_padding': padding,
        'alpha_cleanup': 'Only <=2/255 alpha interpolation dust is zeroed; no silhouette cropping',
        'max_ik_arm_stretch': max_stretch,
        'source_right_sha256': digest(OUT/'source/right_090.png'),
        'rig_atlas_sha256': digest(ASSETS/'rig-atlas.png')})
    contact_sheet(parts)
    battlefield = background('battlefield')
    field_sheet = Image.new('RGB', (1280, 560), '#f0f0ed')
    for j, t in enumerate([0., 1.7, 2.42, 2.68]):
        image, _ = frame_at(t, parts)
        merged = battlefield.copy()
        merged.alpha_composite(image)
        field_sheet.paste(merged.convert('RGB').resize((320, 320), Image.Resampling.LANCZOS), (j*320, 0))
        # Actual background and a 390 px view are saved separately below.
    field_sheet = field_sheet.crop((0, 0, 1280, 320))
    field_sheet.save(OUT/'battlefield-composite-320.jpg', quality=94)
    image, _ = frame_at(2.68, parts)
    merged = battlefield.copy()
    merged.alpha_composite(image)
    merged.resize((390, 390), Image.Resampling.LANCZOS).convert('RGB').save(OUT/'battlefield-composite-390.jpg', quality=94)
    # Every logical frame is visible on a light/green full-frame audit sheet.
    audit = Image.new('RGB', (16*128, 15*144), '#eeeeed')
    draw = ImageDraw.Draw(audit)
    for i in range(COUNT):
        image = Image.open(OUT/f'frames/strike_{i:04}.png')
        tile = composite(image, 'green' if (i//16)%2 == 0 else 'light').resize((128, 128), Image.Resampling.LANCZOS)
        x, y = i%16*128, i//16*144
        audit.paste(tile, (x, y))
        draw.text((x+4, y+129), f'{i+1:03}', fill='#303030')
    audit.save(OUT/'all-240-frames-light-audit.jpg', quality=92)
    print(f'Finished {COUNT} frames; union={union}, max arm stretch={max_stretch:.4f}', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview-only', action='store_true')
    parser.add_argument('--encode-only', action='store_true')
    args = parser.parse_args()
    parts, specs = load_parts()
    if args.preview_only:
        contact_sheet(parts)
        print(OUT/'motion-contact-sheet.jpg')
        return
    if not args.encode_only:
        render_all(parts, specs)
    encode()


if __name__ == '__main__':
    main()
