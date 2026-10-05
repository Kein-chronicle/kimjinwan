// scripts/lib/icons.mjs — 인라인 SVG 라인 아이콘(Lucide 스타일, 직접 작성, 외부 의존성 없음)
const P = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  'user-check': '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><path d="m16 11 2 2 4-4"/>',
  code: '<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m14 4-4 16"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15v4M17 17h4"/>',
  'shield-check': '<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6"/><path d="M11 11V3.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 11V5a1.5 1.5 0 0 1 3 0v8"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15c0 4-3 7-7 7h-1c-3 0-4.5-1.5-6-4l-2.5-4.2a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
  factory: '<path d="M3 21V10l6 4V10l6 4V6h3v15z"/><path d="M3 21h18"/><path d="M8 17h1M12 17h1M16 17h1"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><path d="M15.5 11.5h.01M18 13.5h.01"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-4-4-4 1 1-4 8-8z"/><path d="m15 9 3-3"/>',
  smartphone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  'book-open': '<path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2z"/><path d="M12 6v14"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18-3-3-3-15 0-18z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  'arrow-up-right': '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  workflow: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M6.5 10v4a3 3 0 0 0 3 3H14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  'bar-chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-9 9"/>',
  'file-text': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  rocket: '<path d="M5 15c-1.5 1.2-2 4-2 6 2 0 4.8-.5 6-2"/><path d="M12 15 9 12c.5-4 4-8.5 11-9 0 7-5 10.5-8 12z"/><circle cx="15" cy="9" r="1.2"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4"/><circle cx="12" cy="3.5" r=".5"/><path d="M9 14h.01M15 14h.01"/><path d="M2 14h2M20 14h2"/>',
  brain: '<path d="M12 5a3 3 0 0 0-5.7-1.2A3.5 3.5 0 0 0 4 10a3.5 3.5 0 0 0 1 6 3 3 0 0 0 5 2.5c.6.6 2 .6 2 0z"/><path d="M12 5a3 3 0 0 1 5.7-1.2A3.5 3.5 0 0 1 20 10a3.5 3.5 0 0 1-1 6 3 3 0 0 1-5 2.5"/><path d="M12 5v14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};
export const ICON_NAMES = Object.keys(P);
export function icon(name, {size = 18, cls = ''} = {}) {
  if (!Object.hasOwn(P, name)) throw new Error(`unknown icon: ${name}`);
  return `<svg class="ico${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name]}</svg>`;
}
