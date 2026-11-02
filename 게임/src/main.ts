import { Application, Graphics, Text } from 'pixi.js';

const host = document.querySelector<HTMLElement>('#app')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

async function start(): Promise<void> {
  const app = new Application();

  // 실행 확인용 세로 캔버스. 최종 UI 배치 또는 해상도가 아니다.
  await app.init({
    width: 390,
    height: 694,
    background: '#111c2e',
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    antialias: true,
  });

  const marker = new Graphics()
    .roundRect(-22, -22, 44, 44, 6)
    .fill('#f3b74c');
  marker.position.set(195, 290);

  const label = new Text({
    text: 'Grid Defenders\nPixiJS 실행 확인',
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 22,
      fill: '#e2e8f0',
      align: 'center',
      lineHeight: 34,
    },
  });
  label.anchor.set(0.5);
  label.position.set(195, 365);
  app.stage.addChild(marker, label);
  app.canvas.setAttribute('aria-label', 'Grid Defenders, PixiJS 실행 확인');
  host.appendChild(app.canvas);
  status.hidden = true;

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      app.destroy(true, { children: true });
    });
  }
}

void start().catch((error: unknown) => {
  status.hidden = false;
  status.textContent = '화면을 시작하지 못했습니다. 브라우저의 그래픽 지원을 확인해 주세요.';
  console.error('PixiJS 초기화 실패:', error);
});
