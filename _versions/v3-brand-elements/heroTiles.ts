/**
 * Hero emblem: a 3x3 grid of geometric tiles built from the brand's circle language.
 * Every shape is a clip-path circle anchored to a tile edge or corner:
 *   half    -> circle(50% at <edge midpoint>)   a half-disc opening away from that edge
 *   quarter -> circle(100% at <corner>)         a quarter-disc filling the tile from that corner
 *   circle  -> circle(50% at 50% 50%)
 * Moving the anchor along the edges morphs the shape (the curve slides round the tile),
 * which is what the scroll and hover motion animate.
 */
export type Anchor = [number, number]; // percent x, percent y

export interface Tile {
  kind: "half" | "quarter" | "circle" | "sail";
  at: Anchor;
  next: Anchor; // where the anchor travels on scroll
  color?: string;
  media?: { src: string; video?: boolean; alt?: string };
}

const C = { green: "#007037", leaf: "#70B868", teal: "#50A8B8", yellow: "#F8D084", crimson: "#E04864", grey: "#C8C8C8", red: "#D94F44" };

export const TILES: Tile[] = [
  { kind: "half", at: [50, 100], next: [100, 50], color: C.leaf },
  { kind: "circle", at: [50, 50], next: [50, 50], media: { src: "/media/hero.mp4", video: true } },
  { kind: "quarter", at: [0, 100], next: [0, 0], color: C.teal },
  { kind: "quarter", at: [100, 0], next: [100, 100], color: C.yellow },
  { kind: "sail", at: [50, 100], next: [50, 100], color: C.green },
  { kind: "half", at: [0, 50], next: [50, 0], color: C.crimson },
  { kind: "half", at: [50, 0], next: [0, 50], media: { src: "/media/news-urban-sky.jpg", alt: "Urban Sky, Dhanmondi" } },
  { kind: "circle", at: [50, 50], next: [50, 50], color: C.grey },
  { kind: "quarter", at: [100, 100], next: [0, 100], media: { src: "/media/news-polar.jpg", alt: "Polar Chill Station" } },
];

export const radius = (t: Tile) => (t.kind === "quarter" ? 100 : 50);
export const clip = (t: Tile, at: Anchor, r = radius(t)) => `circle(${r}% at ${at[0]}% ${at[1]}%)`;

export function tilesHTML() {
  const cells = TILES.map((t, i) => {
    let inner = "";
    if (t.media?.video) inner = `<video src="${t.media.src}" autoplay muted loop playsinline aria-hidden="true"></video>`;
    else if (t.media) inner = `<img src="${t.media.src}" alt="${t.media.alt ?? ""}" />`;
    const sail =
      t.kind === "sail"
        ? `<svg class="tile-sail" viewBox="0 0 100 100" aria-hidden="true"><path d="M38 78 C 46 52, 64 30, 96 14 C 82 36, 70 58, 62 84 Z" fill="${C.red}"/></svg>`
        : "";
    const style = t.media ? "" : `background:${t.color};`;
    return `<div class="tile" data-i="${i}"><div class="tile-shape" style="${style}clip-path:${clip(t, t.at)}">${inner}</div>${sail}</div>`;
  }).join("");
  return `<div class="tiles" aria-hidden="true">${cells}</div>`;
}
