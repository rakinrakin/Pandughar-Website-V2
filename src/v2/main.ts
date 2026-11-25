import "../industries/industries.css";
import "./v2.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createIndustries } from "../industries/turntable";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
if (!reduce) document.documentElement.classList.add("js-motion");

// ---------------------------------------------------------------- smooth scroll + anchors
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector<HTMLElement>(a.getAttribute("href")!);
  if (!target) return;
  e.preventDefault();
  closeMenu();
  if (lenis) lenis.scrollTo(target, { offset: target.id === "top" ? 0 : -80, duration: 1.4 });
  else target.scrollIntoView();
});

// ---------------------------------------------------------------- animated line wave (brand teal -> green)
function mountWave(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const LINES = 46;
  let w = 0;
  let h = 0;
  let visible = true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  // wave colours come from CSS (--wave-a / --wave-b as "r,g,b"), so each page version can theme them
  const css = getComputedStyle(document.documentElement);
  const ca = css.getPropertyValue("--wave-a").trim() || "80,168,184";
  const cb = css.getPropertyValue("--wave-b").trim() || "112,184,104";
  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.55;
    for (let i = 0; i < LINES; i++) {
      const k = i / (LINES - 1);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, `rgba(${ca},${0.05 + 0.35 * k})`);
      grad.addColorStop(0.6, `rgba(${cb},${0.08 + 0.4 * (1 - Math.abs(k - 0.5))})`);
      grad.addColorStop(1, `rgba(${ca},${0.04 + 0.2 * k})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const u = x / w;
        const env = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.5;
        const y =
          mid +
          (k - 0.5) * h * 0.38 * env +
          Math.sin(u * 5.2 + t * 0.00035 + k * 2.4) * h * 0.09 * env +
          Math.sin(u * 11 - t * 0.0005 + k * 5) * h * 0.025 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };
  if (reduce) return draw(0);
  const loop = (t: number) => {
    if (visible) draw(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
$$<HTMLCanvasElement>("[data-wave]").forEach(mountWave);

// ---------------------------------------------------------------- split headlines into words
function splitWords(el: HTMLElement) {
  const nodes = [...el.childNodes];
  el.textContent = "";
  nodes.forEach((n) => {
    if ((n as HTMLElement).tagName === "BR") return el.appendChild(n);
    (n.textContent ?? "").split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return el.appendChild(document.createTextNode(" "));
      const outer = document.createElement("span");
      outer.className = "line";
      const inner = document.createElement("span");
      inner.className = "line-inner";
      inner.textContent = part;
      outer.appendChild(inner);
      el.appendChild(outer);
    });
  });
}
$$("[data-split]").forEach(splitWords);

// ---------------------------------------------------------------- motion
if (!reduce) {
  gsap
    .timeline({ defaults: { ease: "expo.out" } })
    .from(".hero .line-inner", { yPercent: 115, duration: 1.4, stagger: 0.07 }, 0.15)
    .from(".wave", { opacity: 0, duration: 2 }, 0)
    .from(".top", { opacity: 0, y: -10, duration: 1 }, 0.4);

  $$("[data-split]").forEach((el) => {
    if (el.closest(".hero")) return;
    gsap.from($$(".line-inner", el), { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  $$("[data-rise]").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  // legacy video frame grows to full bleed as it comes in
  if (document.querySelector(".legacy-frame")) {
  gsap.fromTo(".legacy-frame", { scale: 0.86, borderRadius: 40 }, {
    scale: 1,
    borderRadius: 18,
    ease: "none",
    scrollTrigger: { trigger: ".legacy-frame", start: "top bottom", end: "top 20%", scrub: true },
  });
  gsap.from(".legacy-title span", { yPercent: 60, opacity: 0, stagger: 0.1, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".legacy-frame", start: "top 60%" } });
  }

  // foundation stack: each image opens as its row arrives
  $$(".stack-item").forEach((item, i) => {
    item.style.setProperty("--i", String(i));
    gsap.from($("figure", item), { clipPath: "inset(30% 0% 30% 0% round 12px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: item, start: "top 80%" } });
  });

  // floating certificates and contact photos drift at different speeds
  $$(".float, .cfloat").forEach((el, i) => {
    gsap.fromTo(el, { y: 60 + (i % 3) * 30 }, {
      y: -60 - (i % 2) * 50,
      rotate: (i % 2 ? 1 : -1) * (2 + (i % 3)),
      ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
} else {
  $$(".stack-item").forEach((item, i) => item.style.setProperty("--i", String(i)));
}

// count-up figures
$$("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
  if (reduce) return;
  const obj = { v: 0 };
  el.textContent = "0";
  gsap.to(obj, { v: target, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = fmt(obj.v)), scrollTrigger: { trigger: el, start: "top 90%" } });
});

// ---------------------------------------------------------------- top bar
const bar = $("#top-bar");
let lastY = 0;
const onScroll = (y: number) => {
  bar.classList.toggle("is-solid", y > 40);
  if (!menuOpen) {
    if (y > lastY + 4 && y > 400) bar.classList.add("is-hidden");
    if (y < lastY - 4) bar.classList.remove("is-hidden");
  }
  lastY = y;
};
if (lenis) lenis.on("scroll", ({ scroll }: { scroll: number }) => onScroll(scroll));
else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

// ---------------------------------------------------------------- full-screen menu
const menuBtn = $<HTMLButtonElement>(".menu-btn");
const menu = $("#menu");
let menuOpen = false;
function openMenu() {
  menuOpen = true;
  menu.hidden = false;
  menuBtn.setAttribute("aria-expanded", "true");
  menuBtn.textContent = "Close";
  bar.classList.remove("is-hidden");
  lenis?.stop();
  if (!reduce) {
    gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.inOut" });
    gsap.fromTo($$(".menu-col, .menu-foot", menu), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.06, delay: 0.25 });
  }
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  menu.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.textContent = "Menu";
  lenis?.start();
}
menuBtn.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuOpen) {
    closeMenu();
    menuBtn.focus();
  }
});

// ---------------------------------------------------------------- legacy sound toggle
const video = $<HTMLVideoElement>(".legacy-video");
const play = document.querySelector<HTMLButtonElement>(".play");
play?.addEventListener("click", () => {
  video.muted = !video.muted;
  if (video.paused) void video.play();
  const on = !video.muted;
  play!.setAttribute("aria-pressed", String(on));
  play!.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
  $(".play-label", play!).textContent = on ? "Mute" : "Sound";
});

// ---------------------------------------------------------------- news tabs + carousel
const track = $("#news-track");
const cards = $$<HTMLAnchorElement>(".news-card", track);
const progress = $("#news-progress");
const tabs = $$<HTMLButtonElement>(".tabs button");
const updateProgress = () => {
  const max = track.scrollWidth - track.clientWidth;
  const ratio = max > 0 ? track.scrollLeft / max : 1;
  progress.style.width = `${Math.max(12, ratio * 100)}%`;
};
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    const f = tab.dataset.filter!;
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    cards.forEach((c) => (c.hidden = f !== "all" && c.dataset.co !== f));
    track.scrollLeft = 0;
    updateProgress();
  }),
);
$$<HTMLButtonElement>(".arrow").forEach((b) =>
  b.addEventListener("click", () => {
    const card = cards.find((c) => !c.hidden);
    const step = (card?.offsetWidth ?? 300) + 24;
    track.scrollBy({ left: Number(b.dataset.dir) * step, behavior: reduce ? "auto" : "smooth" });
  }),
);
track.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

// ---------------------------------------------------------------- 3D business disc
// the api is kept on the element so page versions (v3) can drive select/close from their own UI
($("#industries") as HTMLElement & { industries?: unknown }).industries = createIndustries($("#industries"), {
  config: { distance: 19, targetForward: 7.8, targetY: 1.1, elevation: 16, focusDistance: 16, focusTargetY: 1.4 },
});

// ---------------------------------------------------------------- contact form (draft: validates, does not send)
const form = $<HTMLFormElement>("#contact-form");
const note = $("#form-note");
form.addEventListener("input", () => {
  note.textContent = "";
  note.classList.remove("is-error");
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") ?? "").trim();
  if (!String(data.get("name") ?? "").trim() || !String(data.get("message") ?? "").trim()) {
    note.textContent = "Add your name and a message first.";
    note.classList.add("is-error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    note.textContent = "Enter a valid email address.";
    note.classList.add("is-error");
    return;
  }
  note.textContent = "Thanks. This is a draft form, so nothing has been sent yet.";
  form.reset();
});

window.addEventListener("load", () => ScrollTrigger.refresh());
