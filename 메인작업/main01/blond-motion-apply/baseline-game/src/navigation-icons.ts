// Shared gold engraving icon family: same canvas, stroke and visual bounds.
const ICONS={
 shop:'<path d="M5 14h22v14H5z" fill="currentColor" fill-opacity=".12"/><path d="M4 9h24l-2-5H6zM4 9v4c0 3 4 3 5 0 1 3 5 3 7 0 2 3 6 3 7 0 1 3 5 3 5 0V9M10 9l1-5m10 5-1-5M16 4v9M4 28h24M10 28V18h7v10M21 18h3v5h-3z"/>',
 hero:'<path d="M8 15c0-8 4-11 8-11s8 3 8 11v7l-8 7-8-7z" fill="currentColor" fill-opacity=".12"/><path d="M16 4v10M8 15l8 3 8-3M16 18v11M8 15l-3 3 3 8m16-11 3 3-3 8M11 12h3m4 0h3M12 22l-1 2m9-2 1 2M12 4l4-2 4 2"/>',
 battle:'<path d="m5 3 5 2 15 17-3 3L5 10zM27 3l-5 2L7 22l3 3 17-15z" fill="currentColor" fill-opacity=".12"/><path d="m4 22 6 6m12-6 6 6M7 25l-4 4m22-4 4 4M9 8l7 8m7-8-7 8"/>',
 barracks:'<path d="M5 11h22v17H5zM3 5h8v8H3zm18 0h8v8h-8z" fill="currentColor" fill-opacity=".12"/><path d="M3 3v4m4-4v4m4-4v4m10-4v4m4-4v4m4-4v4M11 28v-8a5 5 0 0 1 10 0v8M16 15v13M3 28h26M16 5v6m0-6h4l-1 2 1 2h-4"/>',
 records:'<path d="M7 4h19v23H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="currentColor" fill-opacity=".12"/><path d="M8 4v23M7 27a3 3 0 0 1 0-6h19M13 9h9m-9 4h9m-9 4h5M21 23v7l-3-2-3 2v-7"/>',
} as const;
export function navigationIcon(name:keyof typeof ICONS){
 return `<svg class="navigation-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
export function paintNavigationIcons(){
 for(const name of Object.keys(ICONS) as (keyof typeof ICONS)[]){
  const target=document.querySelector<HTMLElement>(`.bottom-nav .art-${name==='records'?'record':name}`);
  if(target)target.innerHTML=navigationIcon(name);
 }
}
