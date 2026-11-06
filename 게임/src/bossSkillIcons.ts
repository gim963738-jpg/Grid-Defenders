import type {UnitKind} from './defenseConfig';
import {assassinSkillIcon} from './heroArt';
import {BLADE_SHEET_URL} from './bladeSkill';
import {FIRE_SHEET_URL} from './fireSkill';
import {BLOND_SKILL_ICON_URL} from './blondArt';

export const COMMANDER_SKILL_ICON='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 28V5m0 1h17l-4 6 4 6H9" fill="#79612d" stroke="#f2d48b" stroke-width="2" stroke-linejoin="round"/><path d="m13 14 4-6 4 6m-4-6v9M5 28h9" fill="none" stroke="#fff0bd" stroke-width="2" stroke-linecap="round"/></svg>';

export function bossSkillIcon(kind:UnitKind,active=false):string{
  if(kind==='blond'&&active)return `<img src="${BLOND_SKILL_ICON_URL}" alt="" draggable="false">`;
  if(active){
    if(kind==='assassin')return assassinSkillIcon('boss');
    if(kind==='melee'||kind==='ranged')return `<svg viewBox="${kind==='melee'?'16 338 193 194':'37 369 198 198'}" aria-hidden="true"><image href="${kind==='melee'?BLADE_SHEET_URL:FIRE_SHEET_URL}" width="1536" height="1024"/></svg>`;
  }
  const paths=kind==='ranged'?'<path d="M16 4v24M6 10l20 12M6 22l20-12m-14-4 4 4 4-4m-8 20 4-4 4 4M6 15l5-1-1-5m12 14-1-5 5-1M6 17l5 1-1 5m12-14-1 5 5 1"/>':
    kind==='tank'?'<path d="m16 4 10 4v9c0 5-5 9-10 12C11 26 6 22 6 17V8Zm0 4v16M10 11h12"/>':
    kind==='healer'?'<path d="M16 4v24M11 9h10M9 16h14m-7-4v8M8 28h16"/><circle cx="16" cy="8" r="4"/>':
    kind==='arcanist'?'<path d="m16 4 4 8 9 4-9 4-4 8-4-8-9-4 9-4Zm0 8v8m-4-4h8"/>':
    '<path d="m9 24 15-17 3-3-1 5-15 17M6 19l9 8M4 29l5-5"/>';
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="4" fill="${kind==='ranged'?'#244758':'#46352d'}"/><g fill="none" stroke="${kind==='ranged'?'#b5eaff':'#f1d49a'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}
