/**
 * v3 industry section autopilot. When the section scrolls into view the disc focuses the
 * first industry and steps through all eight, opening each one's card. Any drag, click or
 * arrow press hands control to the visitor; after a quiet spell the tour picks up again.
 * Also adds the "drag to explore" pill and the previous / next arrows.
 */
import type { IndustriesApi } from "../industries/turntable";
import { INDUSTRY_IDS } from "../industries/turntable";

const STEP_MS = 6500; // time on each industry
const RESUME_MS = 12000; // quiet time after an interaction before the tour resumes

export function mountIndustryAutopilot(stage: HTMLElement & { industries?: IndustriesApi }) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const n = INDUSTRY_IDS.length;
  let index = 0;
  let inView = false;
  let started = false;
  let hold = false; // pointer is over the card: pause while reading
  let userUntil = 0; // autopilot waits until this time after an interaction
  let stepAt = 0;
  let raf = 0;

  const ui = document.createElement("div");
  ui.className = "ind-controls";
  ui.innerHTML = `
    <p class="ind-hint"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12h8M5 9l-3 3 3 3M19 9l3 3-3 3"/></svg>Drag to explore, or select an industry</p>
    <div class="ind-nav">
      <button type="button" class="ind-arrow" data-dir="-1" aria-label="Previous industry"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <span class="ind-count" aria-live="polite"><b>01</b> / ${String(n).padStart(2, "0")}</span>
      <button type="button" class="ind-arrow" data-dir="1" aria-label="Next industry"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
      <span class="ind-progress" aria-hidden="true"><i></i></span>
    </div>`;
  stage.appendChild(ui);
  const count = ui.querySelector("b")!;
  const bar = ui.querySelector<HTMLElement>(".ind-progress i")!;
  const hint = ui.querySelector<HTMLElement>(".ind-hint")!;

  const api = () => stage.industries;
  const go = (i: number) => api()?.select(((i % n) + n) % n);

  function interact() {
    userUntil = performance.now() + RESUME_MS;
    hint.classList.add("is-done");
  }

  stage.addEventListener("industry:select", (e) => {
    index = (e as CustomEvent<{ index: number }>).detail.index;
    count.textContent = String(index + 1).padStart(2, "0");
    stepAt = performance.now() + STEP_MS;
  });

  ui.addEventListener("pointerdown", (e) => e.stopPropagation());
  ui.querySelectorAll<HTMLButtonElement>(".ind-arrow").forEach((b) =>
    b.addEventListener("click", () => {
      interact();
      go(index + Number(b.dataset.dir));
    }),
  );
  // drags and clicks on the canvas
  stage.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest(".ind-modal")) return;
    interact();
  });
  const card = () => stage.querySelector(".ind-modal");
  stage.addEventListener("pointerover", (e) => (hold = !!card()?.contains(e.target as Node)));
  stage.addEventListener("pointerleave", () => (hold = false));

  let last = 0;
  function tick(now: number) {
    raf = requestAnimationFrame(tick);
    const dt = last ? now - last : 0;
    last = now;
    const paused = hold || now < userUntil || reduce;
    if (paused) {
      stepAt += dt; // freeze the countdown and its bar while paused
      return;
    }
    if (now >= stepAt) go(index + 1);
    bar.style.transform = `scaleX(${progress(now)})`;
  }
  const progress = (now: number) => Math.min(1, Math.max(0, 1 - (stepAt - now) / STEP_MS));

  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !started) {
        started = true;
        go(0);
      }
      if (inView && !raf) {
        stepAt = performance.now() + STEP_MS; // fresh full step after coming back into view
        raf = requestAnimationFrame(tick);
      }
      if (!inView && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
    },
    { threshold: 0.45 },
  ).observe(stage);
}
