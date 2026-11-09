"""Extract every video frame at its original resolution and timestamps."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import zipfile
from PIL import Image, ImageDraw
import imageio_ffmpeg


def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    output = args.output.resolve()
    frames_dir = output/'frames'
    if output.exists() and any(output.iterdir()):
        raise FileExistsError(f'Output already contains files: {output}')
    frames_dir.mkdir(parents=True, exist_ok=True)
    source_hash = sha(source)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, '-hide_banner', '-nostdin', '-i', str(source),
               '-map', '0:v:0', '-an', '-vf', 'showinfo',
               '-fps_mode', 'passthrough', '-start_number', '1',
               '-compression_level', '3', str(frames_dir/'frame_%04d.png')]
    result = subprocess.run(command, capture_output=True, encoding='utf-8', errors='replace')
    (output/'extraction.log').write_text(result.stderr, encoding='utf-8')
    if result.returncode:
        raise RuntimeError(result.stderr[-3000:])
    frame_info = re.findall(r'\bn:\s*(\d+)\s+pts:\s*(-?\d+)\s+pts_time:\s*([\d.eE+-]+)', result.stderr)
    assert frame_info, 'No decoded frame timestamps found'
    paths = sorted(frames_dir.glob('frame_*.png'))
    assert len(paths) == len(frame_info), (len(paths), len(frame_info))
    expected_size = None
    records = []
    for i, (path, info) in enumerate(zip(paths, frame_info), start=1):
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            size, mode = image.size, image.mode
        if expected_size is None:
            expected_size = size
        assert size == expected_size
        assert int(info[0]) == i-1
        records.append({'frame': i, 'file': f'frames/{path.name}',
                        'source_decode_index': int(info[0]), 'source_pts': int(info[1]),
                        'source_time_seconds': float(info[2]), 'width': size[0],
                        'height': size[1], 'mode': mode, 'sha256': sha(path)})
    assert sha(source) == source_hash, 'Source file changed during extraction'
    dt = [b['source_time_seconds']-a['source_time_seconds'] for a,b in zip(records,records[1:])]
    average = sum(dt)/len(dt) if dt else None
    fps = 1/average if average else None
    # Small labelled overview; the full-resolution PNG files are never resized.
    indices = sorted(set(round(j*(len(paths)-1)/23) for j in range(min(24,len(paths)))))
    thumb_w = 320
    thumb_h = round(expected_size[1]*thumb_w/expected_size[0])
    rows = (len(indices)+3)//4
    sheet = Image.new('RGB', (thumb_w*4,(thumb_h+25)*rows), '#ededeb')
    draw = ImageDraw.Draw(sheet)
    for j,index in enumerate(indices):
        with Image.open(paths[index]) as image:
            tile = image.convert('RGB').resize((thumb_w,thumb_h),Image.Resampling.LANCZOS)
        x,y = (j%4)*thumb_w,(j//4)*(thumb_h+25)
        sheet.paste(tile,(x,y))
        draw.text((x+8,y+thumb_h+5),f'{index+1:04d}  |  {records[index]["source_time_seconds"]:.3f}s',fill='#262c34')
    sheet.save(output/'contact-sheet.jpg',quality=93)
    manifest = {'source': str(source), 'source_sha256': source_hash,
                'source_unchanged': True, 'operation': 'all original video frames to PNG',
                'resampling': False, 'interpolation': False, 'background_removal': False,
                'frame_count': len(records), 'width': expected_size[0], 'height': expected_size[1],
                'fps_from_timestamps': fps, 'estimated_video_duration_seconds':
                records[-1]['source_time_seconds']+average if average else None,
                'all_pngs_verified': True, 'numbering': 'one-based, zero-padded four digits',
                'frames': records}
    (output/'frames.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    archive = output/(source.stem+'-frames.zip')
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED) as z:
        for path in paths:
            z.write(path, f'frames/{path.name}')
        for name in ['frames.json','contact-sheet.jpg','extraction.log']:
            z.write(output/name,name)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert len([n for n in z.namelist() if n.startswith('frames/')]) == len(paths)
    print(json.dumps({'output':str(output),'frame_count':len(paths),'size':expected_size,
                      'fps':fps,'archive':str(archive),'archive_bytes':archive.stat().st_size},ensure_ascii=False))


if __name__ == '__main__':
    main()
