// Shared wording keeps repeated data out of the production bundle. These helpers
// preserve the full display strings; city-specific places stay in their modules.
export const hours1To2 = '1–2 小时';
export const hours1_5To2 = '1.5–2 小时';
export const hours2To3 = '2–3 小时';
export const hours2To4 = '2–4 小时';
export const hours3To4 = '3–4 小时';
export const hours3To5 = '3–5 小时';
export const hours4To6 = '4–6 小时';

export function metro(
  lines: string,
  station: string,
  connection = '，步行前往',
): string {
  return `地铁 ${lines} 号线${station}站${connection}`;
}
