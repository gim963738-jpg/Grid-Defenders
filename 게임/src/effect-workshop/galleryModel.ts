import { PRESET_INFO, createPreset, type EffectRecipe, type PresetId, type SavedEffect } from './model';

export type GallerySource = 'all' | 'preset' | 'saved';
export interface GalleryItem {
  key: string; source: 'preset' | 'saved'; recipe: EffectRecipe; description: string; href: string; updatedAt?: string;
}
export function galleryItems(entries: SavedEffect[]): GalleryItem[] {
  return [
    ...PRESET_INFO.map(p => ({ key: `preset:${p.id}`, source: 'preset' as const, recipe: createPreset(p.id), description: p.description, href: `./effect-workshop.html?preset=${encodeURIComponent(p.id)}` })),
    ...entries.map(e => ({ key: `saved:${e.id}`, source: 'saved' as const, recipe: e.recipe, description: '저장한 작업을 이어서 편집합니다.', updatedAt: e.updatedAt, href: `./effect-workshop.html?entry=${encodeURIComponent(e.id)}` })),
  ];
}
export function filterGallery(items: GalleryItem[], source: GallerySource, query: string): GalleryItem[] {
  const term = query.trim().toLocaleLowerCase();
  return items.filter(item => (source === 'all' || item.source === source) && `${item.recipe.name} ${item.description}`.toLocaleLowerCase().includes(term));
}
/** Each card plays its own authored timing, then holds the last frame briefly. */
export function galleryFrameAt(recipe: EffectRecipe, elapsedMs: number): number {
  const { frames, fps } = recipe.settings, duration = frames / fps * 1000;
  return Math.min(frames - 1, Math.floor(Math.max(0, elapsedMs) % (duration + 300) / 1000 * fps));
}
export function galleryLaunch(search: string): { entry?: string; preset?: PresetId; requested: boolean } {
  const p = new URLSearchParams(search), entry = p.get('entry'), preset = p.get('preset');
  if (entry) return { entry, requested: true };
  if (preset && PRESET_INFO.some(p => p.id === preset)) return { preset: preset as PresetId, requested: true };
  return { requested: p.has('entry') || p.has('preset') };
}
export function makeConceptRequest(kind: string, mood: string, seconds: string, references: GalleryItem[]): string {
  const refs = references.length ? references.map(item => `- ${item.source === 'preset' ? '기본 효과' : '내 작업'}: ${item.recipe.name}`).join('\n') : '- 특정 참고 효과 없음';
  return `Grid Defenders 개인 이펙트 공방에 비교할 수 있는 완성 시안 3개를 만들어 주세요.\n\n사용처: ${kind}\n느낌: ${mood.trim() || '주동작이 선명하고 타격 순간이 화려한 연출'}\n전체 길이: 약 ${seconds}초\n참고 효과:\n${refs}\n\n색만 바꾸지 말고 움직임과 실루엣이 다른 세 가지로 제안해 주세요. A는 빠르고 선명하게, B는 응집 후 크게 터지게, C는 경로·회전·분열을 활용해 주세요. 준비 → 주동작 → 타격 → 잔상의 순서를 잡고, 가장 중요한 순간에 밝기와 크기를 집중해 주세요. 위 사용처에 맞지 않는 단계는 생략해도 됩니다.\n\n세 시안은 갤러리에서 비교할 수 있도록 각각 새 작업으로 저장하고 기존 작업을 보존해 주세요. 배경은 투명하게, 원본 여백과 기준점을 지키고 밝은 배경과 실제 전장에서 확인해 주세요. 피해·사거리·대상 수는 추가하지 마세요. 지원되지 않는 연출은 먼저 설명해 주세요.`;
}
