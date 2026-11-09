"""A CSP-compatible chat player using the ACTUAL 240 rendered PNG frames.

Orca chat visuals have media-src 'none'. An HTML video element cannot play there.
Images and inline canvas drawing are permitted. No media, network or API is used.
"""
import base64
import io
import json
import os
from pathlib import Path
from PIL import Image
from render import OUT, save_json


def build():
    # Cache preview-size images rather than holding 240 full-size RGBA frames.
    frames = []
    for i in range(240):
        with Image.open(OUT/f'frames/strike_{i:04}.png') as image:
            frames.append(image.resize((192,192),Image.Resampling.LANCZOS))
    for cell in [192, 160, 128, 112, 96]:
        atlas = Image.new('RGBA', (cell*16, cell*15))
        for i, frame in enumerate(frames):
            atlas.paste(frame.resize((cell, cell), Image.Resampling.LANCZOS), ((i%16)*cell, (i//16)*cell))
        data = io.BytesIO()
        atlas.save(data, format='WEBP', quality=46, method=2)
        print(f'Atlas {cell}px: {len(data.getvalue())} bytes', flush=True)
        if len(data.getvalue()) <= 355_000:
            break
    encoded = base64.b64encode(data.getvalue()).decode('ascii')
    source = Path(__file__).with_name('chat_player.template.html').read_text(encoding='utf-8')
    content = source.replace('__CELL__', str(cell)).replace('__ATLAS__', encoded)
    if len(content.encode('utf-8')) >= 512*1024:
        raise ValueError('Chat visual exceeds 512 KiB')
    name = 'sword-strike-frames-v02.html'
    (OUT/name).write_text(content, encoding='utf-8')
    (OUT/'inline-preview.html').write_text(content, encoding='utf-8')
    scratch = os.environ.get('ORCA_CHAT_SCRATCH_DIR')
    if scratch:
        (Path(scratch)/name).write_text(content, encoding='utf-8')
    save_json(OUT/'chat-preview-v02.json', {
        'file': name, 'html_bytes': len(content.encode('utf-8')),
        'cell_resolution': cell, 'frames': 240, 'fps': 60, 'duration_seconds': 4,
        'method': 'actual PNG frames packed as a WebP image atlas, rendered with canvas',
        'csp_compatibility': "no video/audio element; media-src 'none' is supported",
        'preview_resampling': 'Only the chat preview is reduced; source videos and PNGs unchanged'})
    print(json.dumps({'file': name, 'bytes': len(content.encode('utf-8')), 'cell': cell}))


if __name__ == '__main__':
    build()
