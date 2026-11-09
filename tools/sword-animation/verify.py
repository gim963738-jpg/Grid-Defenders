"""Decode both deliverable videos and verify alpha, frames, timing and source provenance."""
from pathlib import Path
import json
import re
import subprocess
import numpy as np
from PIL import Image
from render import OUT, ROOT, FPS, COUNT, SIZE, digest, save_json
import imageio_ffmpeg


def verify_video(path, decoder=None):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    metadata = subprocess.run([ffmpeg, '-hide_banner', '-i', str(path)],
        capture_output=True, encoding='utf-8', errors='replace').stderr
    assert '00:00:04.00' in metadata, metadata
    assert '60 fps' in metadata, metadata
    args = [ffmpeg, '-hide_banner', '-loglevel', 'error']
    if decoder:
        args += ['-c:v', decoder]
    process = subprocess.Popen(args+['-i', str(path), '-an', '-pix_fmt', 'rgba',
                               '-f', 'rawvideo', '-'], stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)
    count, opaque_mins, transparent_counts, border_max, differences = 0, [], [], 0, []
    while True:
        data = process.stdout.read(SIZE*SIZE*4)
        if not data:
            break
        assert len(data) == SIZE*SIZE*4, 'Incomplete decoded frame'
        pixels = np.frombuffer(data, np.uint8).reshape(SIZE, SIZE, 4)
        alpha = pixels[:, :, 3]
        original_alpha = np.asarray(Image.open(OUT/f'frames/strike_{count:04}.png'))[:, :, 3]
        differences.append(float(np.abs(alpha.astype(float)-original_alpha).mean()))
        border_max = max(border_max, int(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max())))
        assert alpha[0, 0] == 0 and alpha[-1, -1] == 0
        opaque_mins.append(int(alpha.max()))
        transparent_counts.append(int((alpha==0).sum()))
        count += 1
    stderr = process.stderr.read().decode('utf-8', errors='replace')
    assert process.wait() == 0, stderr
    assert count == COUNT, count
    assert border_max == 0, border_max
    assert min(opaque_mins) >= 250
    assert min(transparent_counts) > SIZE*SIZE*.7
    progress_cmd = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-progress', 'pipe:1',
                    '-nostats', '-i', str(path), '-an', '-f', 'null', '-']
    progress = subprocess.run(progress_cmd, check=True, capture_output=True, text=True).stdout
    exact_time = int(re.findall(r'out_time_us=(\d+)', progress)[-1])
    assert exact_time == 4_000_000, exact_time
    return {'file': path.name, 'bytes': path.stat().st_size, 'sha256': digest(path),
            'decoded_frames': count, 'fps': FPS, 'duration_us': exact_time,
            'decoded_rgba': True, 'all_frame_borders_alpha_zero': True,
            'minimum_fully_transparent_pixels_per_frame': min(transparent_counts),
            'minimum_frame_max_alpha': min(opaque_mins),
            'mean_alpha_absolute_error_vs_png': float(np.mean(differences)),
            'decoder_override': decoder, 'ffmpeg_metadata': metadata}


source = Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger/pixel_8views_v01/images/03_right_090.png')
assert digest(source) == digest(OUT/'source/right_090.png')
videos = []
for name, decoder in [('sword-overhead-right-4s-60fps-alpha.mov', None),
                       ('sword-overhead-right-4s-60fps-alpha.webm', 'libvpx-vp9')]:
    print('Verifying', name, flush=True)
    videos.append(verify_video(OUT/name, decoder))
save_json(OUT/'verification-video.json', {
    'source_copy_byte_identical': True, 'source_worktree': str(source.parents[5]),
    'source_branch': 'gim963738-jpg/캐릭터디자인2',
    'frame_verification': json.loads((OUT/'verification-frames.json').read_text(encoding='utf-8')),
    'videos': videos, 'game_runtime_integration_tested': False,
    'battlefield_image_composite_created': True,
    'user_final_visual_approval': 'not yet received'})
print('Both videos verified: 4.000 seconds, 60fps, 240 RGBA frames, transparent borders.', flush=True)
