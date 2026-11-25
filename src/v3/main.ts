// Version 3 reuses the version 2 page logic; v3.css loads after v2.css and re-themes it
// (white ground, Sora, brand green and red). Adds the floating industry card.
import "../v2/main";
import "./v3.css";
import { mountIndustryModal } from "./industryModal";
import { mountIndustryAutopilot } from "./industryAutopilot";

mountIndustryModal(document.getElementById("industries")!);
mountIndustryAutopilot(document.getElementById("industries")!);

// hero video frame eases back from full size as the page scrolls on
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  gsap.to(".hero-frame", {
    scale: 0.9,
    borderRadius: 28,
    ease: "none",
    scrollTrigger: { trigger: ".hero-video", start: "top top", end: "bottom top", scrub: true },
  });
}

// numbers: the blocks rise one after another and each figure counts up as its block arrives
{
  const blocks = Array.from(document.querySelectorAll<HTMLElement>(".num-block"));
  const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const tl = gsap.timeline({ paused: true });
    blocks.forEach((block, i) => {
      const num = block.querySelector<HTMLElement>("[data-num]")!;
      const obj = { v: 0 };
      num.textContent = "0";
      const at = i * 0.28;
      tl.fromTo(block, { y: 160, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out" }, at);
      tl.to(obj, { v: Number(num.dataset.num), duration: 1.8, ease: "power3.out", onUpdate: () => (num.textContent = fmt(obj.v)) }, at + 0.1);
    });
    ScrollTrigger.create({ trigger: ".num-grid", start: "top 78%", once: true, onEnter: () => tl.play() });
  }
}

// language pill: marks the chosen language (Bangla copy is still to come)
document.querySelectorAll<HTMLButtonElement>(".lang button").forEach((btn, _, all) =>
  btn.addEventListener("click", () => all.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)))),
);

// the menu is a drop-down panel now: a click outside it closes it
document.addEventListener("pointerdown", (e) => {
  const menu = document.getElementById("menu")!;
  const btn = document.querySelector<HTMLButtonElement>(".menu-btn")!;
  const t = e.target as Node;
  if (!menu.hidden && !menu.contains(t) && !btn.contains(t)) btn.click();
});

// page loader: the mark spins while the page loads, then fades out (at least 0.9s on screen, 4s at most)
{
  const loader = document.getElementById("loader");
  if (loader) {
    const started = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(() => {
        loader.classList.add("is-done");
        setTimeout(() => loader.remove(), 600);
      }, Math.max(0, 900 - (performance.now() - started)));
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    setTimeout(finish, 4000);
  }
}
