export function hexToHslChannels(input: string | null | undefined): string | null {
  if (!input) return null;

  let hex = input.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;

  // Support: #RGB, #RRGGBB, #RRGGBBAA
  if (![4, 7, 9].includes(hex.length)) return null;

  const expand = (s: string) => s.split('').map((c) => c + c).join('');

  let rHex = '';
  let gHex = '';
  let bHex = '';

  if (hex.length === 4) {
    const rgb = expand(hex.slice(1));
    rHex = rgb.slice(0, 2);
    gHex = rgb.slice(2, 4);
    bHex = rgb.slice(4, 6);
  } else {
    // Ignore alpha if present (#RRGGBBAA)
    rHex = hex.slice(1, 3);
    gHex = hex.slice(3, 5);
    bHex = hex.slice(5, 7);
  }

  const r = parseInt(rHex, 16);
  const g = parseInt(gHex, 16);
  const b = parseInt(bHex, 16);

  if ([r, g, b].some((n) => Number.isNaN(n))) return null;

  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  const hh = Math.round(h);
  const ss = Math.round(s * 100);
  const ll = Math.round(l * 100);

  // Format for modern CSS: hsl(<h> <s>% <l>%)
  return `${hh} ${ss}% ${ll}%`;
}
