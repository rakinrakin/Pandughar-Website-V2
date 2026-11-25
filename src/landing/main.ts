import "../industries/industries.css";
import "./landing.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createIndustries } from "../industries/turntable";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
if (!reduce) document.documentElement.classList.add("js-motion");

// ---------------------------------------------------------------- smooth scroll
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const header = $("#header");
const headerH = () => header.offsetHeight;
function scrollToTarget(target: string) {
  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: target === "#top" ? 0 : -headerH() + 1, duration: 1.4 });
  else el.scrollIntoView();
}
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.getAttribute("href") === "#") return;
  e.preventDefault();
  closeMega();
  closeMobile();
  scrollToTarget(a.getAttribute("href")!);
});

// ---------------------------------------------------------------- split headlines into words
function splitWords(el: HTMLElement) {
  const wrap = (text: string, parent: Node) => {
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return parent.appendChild(document.createTextNode(" "));
      const outer = document.createElement("span");
      outer.className = "line";
      outer.style.display = "inline-block";
      const inner = document.createElement("span");
      inner.className = "line-inner";
      inner.textContent = part;
      outer.appendChild(inner);
      parent.appendChild(outer);
    });
  };
  const nodes = [...el.childNodes];
  el.textContent = "";
  nodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) wrap(n.textContent ?? "", el);
    else if ((n as HTMLElement).tagName === "BR") el.appendChild(n);
    else {
      const clone = (n as HTMLElement).cloneNode(false) as HTMLElement;
      wrap(n.textContent ?? "", clone);
      el.appendChild(clone);
    }
  });
}
$$("[data-split]").forEach((el) => splitWords(el));

// ---------------------------------------------------------------- motion
if (!reduce) {
  // hero intro
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".hero-video", { scale: 1.12, duration: 2.6, ease: "power2.out" }, 0)
    .from(".hero .line-inner", { yPercent: 110, duration: 1.4, stagger: 0.07 }, 0.25)
    .to("[data-intro]", { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }, 0.7)
    .from(".site-header .bar", { opacity: 0, y: -12, duration: 1 }, 0.5);

  // hero content drifts and fades as you leave
  gsap.to(".hero-content", {
    yPercent: -18,
    opacity: 0.2,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // section headlines: words rise in
  $$("[data-split]").forEach((el) => {
    if (el.closest(".hero")) return;
    gsap.from($$(".line-inner", el), {
      yPercent: 110,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  // generic reveals
  $$("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  ScrollTrigger.batch(".stats li", {
    start: "top 88%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });

  // images open from a smaller window
  $$("[data-clip]").forEach((fig) => {
    const img = $("img", fig);
    gsap
      .timeline({ scrollTrigger: { trigger: fig, start: "top 85%" } })
      .from(fig, { clipPath: "inset(12% 10% 12% 10% round 4px)", duration: 1.6, ease: "expo.out" }, 0)
      .from(img, { scale: 1.25, duration: 2, ease: "expo.out" }, 0);
  });

  // slow parallax inside the big foundation image
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -12 },
      { yPercent: 0, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
    );
  });

  // brand shapes drift
  gsap.to(".shape-ring", { rotate: 40, yPercent: -30, ease: "none", scrollTrigger: { trigger: ".numbers", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.to(".shape-half", { yPercent: -45, ease: "none", scrollTrigger: { trigger: ".numbers", start: "top bottom", end: "bottom top", scrub: true } });

  // certificate marquee
  const row = $(".cert-row");
  row.innerHTML += row.innerHTML;
  $$("img", row).slice(14).forEach((img) => img.setAttribute("aria-hidden", "true"));
  gsap.to(row, { xPercent: -50, duration: 60, ease: "none", repeat: -1 });
}

// count-up numbers (also correct without motion)
$$("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
  if (reduce) return void (el.textContent = fmt(target));
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 2.2,
    ease: "power3.out",
    onUpdate: () => (el.textContent = fmt(obj.v)),
    scrollTrigger: { trigger: el, start: "top 90%" },
  });
});

// ---------------------------------------------------------------- header: solid after the hero, hides on scroll down
const hero = $(".hero");
let lastY = 0;
function onScroll(y: number) {
  header.classList.toggle("is-solid", y > hero.offsetHeight - headerH() - 10);
  const goingDown = y > lastY + 4;
  const goingUp = y < lastY - 4;
  if (!header.classList.contains("is-open")) {
    if (goingDown && y > hero.offsetHeight) header.classList.add("is-hidden");
    if (goingUp) header.classList.remove("is-hidden");
  }
  lastY = y;
}
if (lenis) lenis.on("scroll", ({ scroll }: { scroll: number }) => onScroll(scroll));
else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

// ---------------------------------------------------------------- mega menu
const triggers = $$<HTMLButtonElement>(".nav-trigger");
let openId: string | null = null;
let hoverTimer = 0;
function openMega(id: string) {
  if (openId === id) return;
  closeMega(true);
  openId = id;
  const panel = document.getElementById(id)!;
  panel.hidden = false;
  header.classList.add("is-open");
  header.classList.remove("is-hidden");
  triggers.forEach((t) => t.setAttribute("aria-expanded", String(t.getAttribute("aria-controls") === id)));
  if (!reduce) {
    gsap.fromTo(panel, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" });
    gsap.fromTo($$(".mega-cols > div, .mega-feature", panel), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.03 });
  }
}
function closeMega(keepHeader = false) {
  if (!openId) return;
  document.getElementById(openId)!.hidden = true;
  openId = null;
  triggers.forEach((t) => t.setAttribute("aria-expanded", "false"));
  if (!keepHeader && !mobileOpen) header.classList.remove("is-open");
}
const canHover = window.matchMedia("(hover: hover)").matches;
triggers.forEach((t) => {
  const id = t.getAttribute("aria-controls")!;
  t.addEventListener("click", () => (openId === id ? closeMega() : openMega(id)));
  if (canHover) {
    t.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => openMega(id), openId ? 0 : 120);
    });
  }
});
if (canHover) {
  header.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => closeMega(), 220);
  });
  header.addEventListener("mouseenter", () => clearTimeout(hoverTimer));
  $$(".nav-link, .btn-contact, .brand").forEach((el) => el.addEventListener("mouseenter", () => closeMega()));
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (openId) {
    const t = triggers.find((x) => x.getAttribute("aria-controls") === openId);
    closeMega();
    t?.focus();
  }
  closeMobile();
});
document.addEventListener("click", (e) => {
  if (openId && !header.contains(e.target as Node)) closeMega();
});

// ---------------------------------------------------------------- mobile menu
const toggle = $<HTMLButtonElement>(".menu-toggle");
const mobile = $("#mobile-menu");
let mobileOpen = false;
function closeMobile() {
  if (!mobileOpen) return;
  mobileOpen = false;
  mobile.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open menu");
  header.classList.remove("is-open");
  lenis?.start();
}
toggle.addEventListener("click", () => {
  if (mobileOpen) return closeMobile();
  mobileOpen = true;
  mobile.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Close menu");
  header.classList.add("is-open");
  lenis?.stop();
});

// ---------------------------------------------------------------- news: drag to scroll on desktop
const track = $(".news-track");
let down = false;
let startX = 0;
let startLeft = 0;
track.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return;
  down = true;
  startX = e.clientX;
  startLeft = track.scrollLeft;
  track.style.scrollSnapType = "none";
});
window.addEventListener("pointermove", (e) => {
  if (!down) return;
  track.scrollLeft = startLeft - (e.clientX - startX);
});
window.addEventListener("pointerup", () => {
  if (!down) return;
  down = false;
  track.style.scrollSnapType = "";
});
track.addEventListener("click", (e) => {
  if (Math.abs(track.scrollLeft - startLeft) > 6) e.preventDefault();
}, true);

// ---------------------------------------------------------------- 3D business disc
// closer framing than the demo default: the disc is larger than the stage, like dholding.ru
createIndustries($("#industries"), {
  config: { distance: 19, targetForward: 7.8, targetY: 1.1, elevation: 16, focusDistance: 16, focusTargetY: 1.4 },
});

// ---------------------------------------------------------------- contact form (draft: validates, does not send yet)
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

// refresh trigger positions once fonts and images settle
window.addEventListener("load", () => ScrollTrigger.refresh());
