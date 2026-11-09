from pathlib import Path
import json
import cv2
from PIL import Image, ImageDraw

source = Path(r'C:\Users\user\Downloads\Video Project.mp4')
out = Path(__file__).resolve().parent
capture = cv2.VideoCapture(str(source))
if not capture.isOpened():
    raise RuntimeError('Cannot open reference video')
fps = capture.get(cv2.CAP_PROP_FPS)
count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
metadata = {'path': str(source), 'fps': fps, 'frames': count, 'width': width, 'height': height, 'duration': count / fps}
(out / 'reference-metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
samples = sorted(set(round(i * (count - 1) / 15) for i in range(16)))
tile_width = 320
tile_height = round(tile_width * height / width)
sheet = Image.new('RGB', (tile_width * 4, (tile_height + 28) * 4), '#20252d')
draw = ImageDraw.Draw(sheet)
for n, index in enumerate(samples):
    capture.set(cv2.CAP_PROP_POS_FRAMES, index)
    success, frame = capture.read()
    if not success:
        continue
    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    image.save(out / f'reference-{index:04d}.png')
    image.thumbnail((tile_width, tile_height))
    x, y = (n % 4) * tile_width, (n // 4) * (tile_height + 28)
    sheet.paste(image, (x, y))
    draw.text((x + 6, y + tile_height + 6), f'{index / fps:.3f}s / frame {index}', fill='white')
capture.release()
sheet.save(out / 'reference-contact.jpg', quality=92)
print(json.dumps(metadata))
