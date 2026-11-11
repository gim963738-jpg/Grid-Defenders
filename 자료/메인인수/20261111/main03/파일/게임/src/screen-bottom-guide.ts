import './screen-bottom-guide.css';

/** Temporary layout guide; independent of scene state and pointer input. */
export function mountScreenBottomGuide(maxWidth = '480px') {
  const guide = document.createElement('div');
  guide.className = 'screen-bottom-guide';
  guide.style.setProperty('--guide-width', maxWidth);
  guide.setAttribute('aria-hidden', 'true');
  guide.innerHTML = '<span>✂ 화면 바닥 · 여기까지가 현재 화면</span>';
  document.body.append(guide);
}
