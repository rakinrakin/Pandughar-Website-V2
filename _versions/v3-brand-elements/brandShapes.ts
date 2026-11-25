/**
 * Pandughar brand visual theme (brand/brand-visual-theme.png): circles, half-circles and the red sail
 * from the logo, semi-transparent so overlaps mix. Drawn as SVG strings; every stroke uses
 * pathLength="1" so it can be drawn in with stroke-dashoffset.
 */
const C = {
  green: "#70B868",
  teal: "#50A8B8",
  yellow: "#F8D084",
  crimson: "#E04864",
  grey: "#C8C8C8",
  mint: "#D8F0E8",
  red: "#E04838",
};

/** Arc path, angles in degrees clockwise from +x (SVG y-down). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const rad = (a: number) => (a * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function shape(d: string, color: string, width: number, extra = "") {
  return `<path class="bs-shape" d="${d}" fill="none" stroke="${color}" stroke-width="${width}" pathLength="1" ${extra}/>`;
}
const ring = (cx: number, cy: number, r: number, color: string, w = 46) => shape(arc(cx, cy, r, 0, 359.9), color, w, `data-cx="${cx}" data-cy="${cy}"`);
const half = (cx: number, cy: number, r: number, a0: number, color: string, w = 46) => shape(arc(cx, cy, r, a0, a0 + 180), color, w, `data-cx="${cx}" data-cy="${cy}"`);

/** The red sail: a curved blade that leaves the green ring's opening toward the upper right. */
const sail = (x: number, y: number, s = 1) =>
  `<path class="bs-sail" d="M0 118 C 22 70, 62 26, 124 0 C 98 32, 72 72, 48 124 Z" fill="${C.red}" transform="translate(${x} ${y}) scale(${s})"/>`;

/** Tall stack for the hero, like the brand sheet's column. */
export function heroStack() {
  return `<svg class="brand-stack" viewBox="0 0 420 1000" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
  <g class="bs-mix">
    ${ring(230, 70, 72, C.mint, 40)}
    ${ring(200, 140, 78, C.grey)}
    ${shape(arc(200, 320, 86, 340, 650), C.green, 50, 'data-cx="200" data-cy="320"')}
    ${half(232, 420, 72, 270, C.yellow)}
    ${ring(182, 575, 92, C.teal)}
    ${half(208, 700, 72, 90, C.grey)}
    ${half(236, 810, 78, 270, C.crimson)}
    ${half(184, 930, 80, 90, C.teal)}
  </g>
  ${sail(250, 196, 0.92)}
</svg>`;
}

/** Corner clusters behind the awards section. */
export function cornerClusters() {
  return `<svg class="brand-corners" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g class="bs-mix">
    ${ring(90, 120, 70, C.teal, 36)}
    ${half(170, 230, 60, 270, C.yellow, 36)}
    ${half(60, 330, 64, 90, C.crimson, 36)}
    ${ring(1350, 420, 74, C.green, 36)}
    ${half(1270, 310, 58, 90, C.grey, 36)}
    ${half(1380, 200, 60, 270, C.teal, 36)}
  </g>
</svg>`;
}

/** A row of half-circles along the footer's lower edge. */
export function footerRow() {
  const colors = [C.green, C.teal, C.yellow, C.crimson, C.grey, C.teal, C.green, C.yellow, C.crimson];
  const shapes = colors.map((c, i) => half(80 + i * 160, 200, 64, 180, c, 34)).join("");
  return `<svg class="brand-row" viewBox="0 0 1440 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <g class="bs-mix">${shapes}</g>
  ${sail(1300, 70, 0.7)}
</svg>`;
}
