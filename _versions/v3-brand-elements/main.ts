// Version 3 reuses the version 2 page logic; v3.css loads after v2.css and re-themes it
// (white ground, Sora, brand green and red). The Urmi line waves are replaced with the
// Pandughar circle language: a tile emblem in the hero and a half-circle band in the footer.
import "../v2/main";
import "./v3.css";
import { gsap } from "gsap";
import { footerRow } from "./brandShapes";
import { TILES, clip, radius, tilesHTML } from "./heroTiles";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// hero wave -> tile emblem; awards wave -> removed; footer wave -> half-circle band
document.querySelectorAll<HTMLCanvasElement>("[data-wave]").forEach((canvas) => {
  if (canvas.classList.contains("wave-foot")) canvas.insertAdjacentHTML("afterend", footerRow());
  else if (!canvas.classList.contains("wave-soft")) canvas.insertAdjacentHTML("afterend", tilesHTML());
  canvas.remove();
});

const tiles = gsap.utils.toArray<HTMLElement>(".tiles .tile");
const shapes = tiles.map((t) => t.querySelector<HTMLElement>(".tile-shape")!);

if (!reduce) {
  // assembly: each shape grows out of its anchor point, in a scattered order
  const order = [4, 0, 8, 2, 6, 1, 7, 3, 5];
  shapes.forEach((s, i) => gsap.set(s, { clipPath: clip(TILES[i], TILES[i].at, 0) }));
  const intro = gsap.timeline({ delay: 0.3 });
  order.forEach((i, n) => {
    intro.to(shapes[i], { clipPath: clip(TILES[i], TILES[i].at), duration: 1.1, ease: "expo.out" }, n * 0.09);
  });
  intro.from(".tile-sail path", { scale: 0, transformOrigin: "38% 78%", duration: 1, ease: "back.out(1.7)" }, 0.5);

  // scroll: half and quarter shapes slide their curve round the tile to a new edge
  intro.eventCallback("onComplete", () => {
    TILES.forEach((t, i) => {
      if (t.at[0] === t.next[0] && t.at[1] === t.next[1]) return;
      gsap.fromTo(
        shapes[i],
        { clipPath: clip(t, t.at) },
        { clipPath: clip(t, t.next), ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } },
      );
    });
    gsap.to(".tiles", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  // hover: a tile turns a quarter
  tiles.forEach((tile) => {
    let turns = 0;
    tile.addEventListener("mouseenter", () => {
      turns += 1;
      gsap.to(tile, { rotation: turns * 90, duration: 0.8, ease: "expo.out" });
    });
  });

  // footer band draws in when reached
  const footShapes = gsap.utils.toArray<SVGPathElement>(".brand-row .bs-shape");
  gsap.set(footShapes, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.to(footShapes, { strokeDashoffset: 0, duration: 1.4, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".brand-row", start: "top 90%" } });
  gsap.from(".brand-row .bs-sail", { scale: 0, transformOrigin: "0% 100%", duration: 1, ease: "back.out(1.6)", scrollTrigger: { trigger: ".brand-row", start: "top 90%" } });
}

// keep radius() referenced for future tile kinds that change size on hover
void radius;
