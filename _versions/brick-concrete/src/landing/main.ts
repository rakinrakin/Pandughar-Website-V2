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
const aperture = $(".hero-aperture");
const stage = $(".hero-stage");
// the aperture is a clip-path circle; radius and centre are driven in px so they tween cleanly
const ap = { r: 0, x: 0.7, y: 0.52 };
function apertureBase() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const narrow = w < 820;
  return { r: narrow ? w * 0.36 : Math.min(h * 0.33, w * 0.25), x: narrow ? 0.62 : 0.7, y: narrow ? 0.64 : 0.52 };
}
function drawAperture() {
  aperture.style.clipPath = `circle(${ap.r}px at ${ap.x * 100}% ${ap.y * 100}%)`;
}

if (!reduce) {
  const base = apertureBase();
  Object.assign(ap, { r: 0, x: base.x, y: base.y });
  drawAperture();

  // intro: the wall is there first, then the aperture opens and the inscription rises
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .to(ap, { r: base.r, duration: 2.2, ease: "expo.inOut", onUpdate: drawAperture }, 0.2)
    .from(".hero-video", { scale: 1.25, duration: 2.8, ease: "power2.out" }, 0.2)
    .from(".hero-brick", { yPercent: 100, duration: 1.6 }, 0.9)
    .from(".hero-band", { scaleX: 0, transformOrigin: "left center", duration: 1.8, ease: "expo.inOut" }, 0)
    .from(".hero .line-inner", { yPercent: 110, duration: 1.4, stagger: 0.06 }, 0.6)
    .from(".hero-bn, .hero-facts, .hero .plaque", { opacity: 0, y: 18, duration: 1.2, stagger: 0.1 }, 1.1)
    .from(".site-header .bar", { opacity: 0, y: -10, duration: 1 }, 0.8);

  // signature: scrolling opens the wall until the work fills the screen
  intro.eventCallback("onComplete", () => {
    gsap
      .timeline({
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
      })
      .to(ap, {
        r: () => Math.hypot(stage.clientWidth, stage.clientHeight),
        x: 0.5,
        y: 0.5,
        ease: "power2.in",
        onUpdate: drawAperture,
      }, 0)
      .to(".hero-copy", { x: -80, opacity: 0, ease: "power1.in" }, 0)
      .to(".hero-brick", { yPercent: 110, ease: "power1.in" }, 0)
      .to(".hero-band", { opacity: 0, ease: "none" }, 0.1);
  });
  window.addEventListener("resize", () => {
    if (window.scrollY < 10) {
      Object.assign(ap, apertureBase());
      drawAperture();
    }
  });

  // headlines outside the hero: words rise in, once
  $$("[data-split]").forEach((el) => {
    if (el.closest(".hero")) return;
    gsap.from($$(".line-inner", el), {
      yPercent: 110,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.05,
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  // the carved figures settle in turn, like letters being cut
  gsap.from(".carved .fig", {
    opacity: 0,
    y: 24,
    filter: "blur(6px)",
    duration: 1.4,
    ease: "expo.out",
    stagger: 0.14,
    scrollTrigger: { trigger: ".carved", start: "top 80%" },
  });
  gsap.from(".figures-brick", { yPercent: 100, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".figures", start: "top 70%" } });

  // reveals for supporting blocks
  $$("[data-reveal]").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  // arches open upward from the floor line
  $$("[data-clip]").forEach((fig) => {
    const img = $("img", fig);
    gsap
      .timeline({ scrollTrigger: { trigger: fig, start: "top 85%" } })
      .from(fig, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut" }, 0)
      .from(img, { scale: 1.3, duration: 2.2, ease: "expo.out" }, 0.2);
  });

  // slow parallax inside the foundation arch
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -10 }, {
      yPercent: 0,
      ease: "none",
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // the contact porthole turns slowly as you arrive
  gsap.from(".contact-porthole", { rotate: -40, scale: 0.8, opacity: 0, duration: 2, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 75%" } });

  // certificate strip drifts
  const row = $(".cert-row");
  row.innerHTML += row.innerHTML;
  $$("img", row).slice(14).forEach((img) => img.setAttribute("aria-hidden", "true"));
  gsap.to(row, { xPercent: -50, duration: 70, ease: "none", repeat: -1 });
} else {
  Object.assign(ap, apertureBase());
  drawAperture();
}

// count-up numbers (also correct without motion)
$$("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
  if (reduce) return void (el.textContent = fmt(target));
  const obj = { v: 0 };
  el.textContent = "0";
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
  header.classList.toggle("is-solid", y > 30);
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
const track = $(".arcade");
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
