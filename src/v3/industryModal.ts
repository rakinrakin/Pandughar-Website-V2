/**
 * Floating industry card for the v3 page. Opens on the turntable's `industry:select` event,
 * sitting in the right 40% while the selected industry is framed in the left 60%.
 * Content: title, description, and the logos of the companies in that industry.
 */
import { gsap } from "gsap";
import type { IndustriesApi } from "../industries/turntable";

interface Company { name: string; logo: string; href: string }
interface Industry { title: string; description: string; companies: Company[] }

const PAGE = "https://pandughar.com";
export const INDUSTRIES: Record<string, Industry> = {
  "real-estate": {
    title: "Real Estate",
    description:
      "Where the group began in 1995. Urban has completed more than 130 projects in Dhaka's prime neighbourhoods and housed over 2,100 families, with nine in ten projects coming through landowners' referrals.",
    companies: [{ name: "Urban Design and Development", logo: "/media/logos/urban.png", href: `${PAGE}/our-business/urban-design-development-limited/` }],
  },
  manufacturing: {
    title: "Manufacturing",
    description:
      "Interstoff is a vertically integrated knit garment manufacturer, founded in 2000, with fabric, print, embroidery and laundry under one roof. It makes for Marks and Spencer, Tesco, H&M and Next.",
    companies: [{ name: "Interstoff Group", logo: "/media/logos/interstoff.png", href: `${PAGE}/our-business/interstoff-group/` }],
  },
  fmcg: {
    title: "FMCG",
    description:
      "Polar has made ice cream for Bangladesh since 1987 and was the country's first ISO 22000 certified dairy company. Dan Cake bakes to Danish standards, and Route to Market distributes for Nestlé, Marico and more.",
    companies: [
      { name: "Polar Ice Cream", logo: "/media/logos/polar.png", href: `${PAGE}/our-business/dhaka-ice-cream-industries-limited/` },
      { name: "Dan Cake", logo: "/media/logos/dancake.png", href: `${PAGE}/our-business/dan-foods-ltd/` },
      { name: "Route to Market", logo: "/media/logos/rtm.png", href: `${PAGE}/our-business/route-to-market-international-limited/` },
    ],
  },
  "lift-elevator": {
    title: "Lift and Elevator",
    description:
      "Since 2000, Orbit Technologies has supplied, installed and maintained elevators, escalators and moving walkways, from turnkey design to emergency service.",
    companies: [{ name: "Orbit Technologies", logo: "/media/logos/orbit.png", href: `${PAGE}/our-business/orbit-technologies-ltd/` }],
  },
  agro: {
    title: "Agro",
    description:
      "Hybrid and open-pollinated vegetable seeds, from cabbage and cauliflower to chilli and okra, sold to farmers through a nationwide network of dealers and distributors.",
    companies: [
      { name: "Pandughar Agro Corporation", logo: "/media/logos/pandughar-agro-corp.png", href: `${PAGE}/our-business/pandughar-agro-corporation/` },
      { name: "Pandughar Agro and Foods", logo: "/media/logos/pandughar-agro-foods.png", href: `${PAGE}/our-business/pandughar-agro-and-foods-limited/` },
    ],
  },
  it: {
    title: "Information Technology",
    description:
      "Auleek is a 3D game art studio with more than 400 projects for clients in nine countries, including work featured on Netflix Games and Amazon Prime.",
    companies: [{ name: "Auleek", logo: "/media/logos/auleek.png", href: `${PAGE}/our-business/auleek-ltd/` }],
  },
  facilities: {
    title: "Facilities Management",
    description:
      "Since 2007, Sublime has kept buildings running: professional cleaning, MEP repair and maintenance, and property care, led by two retired Army officers.",
    companies: [{ name: "Sublime Facilities Management", logo: "/media/logos/sublime.png", href: `${PAGE}/sublime-facilities-management-ltd/` }],
  },
  "asset-management": {
    title: "Asset Management",
    description:
      "IPR Asset Management, licensed by the Bangladesh Securities and Exchange Commission in 2022, manages institutional funds through discretionary portfolio management.",
    companies: [{ name: "IPR Asset Management", logo: "/media/logos/ipr.png", href: `${PAGE}/ipr-asset-management-ltd/` }],
  },
};

export function mountIndustryModal(stage: HTMLElement & { industries?: IndustriesApi }) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const card = document.createElement("aside");
  card.className = "ind-modal";
  card.hidden = true;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-labelledby", "ind-modal-title");
  card.innerHTML = `
    <button type="button" class="ind-modal-close" aria-label="Close">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <h3 class="ind-modal-title" id="ind-modal-title"></h3>
    <p class="ind-modal-desc"></p>
    <p class="ind-modal-label">Companies</p>
    <ul class="ind-modal-logos"></ul>`;
  stage.appendChild(card);

  const title = card.querySelector<HTMLElement>(".ind-modal-title")!;
  const desc = card.querySelector<HTMLElement>(".ind-modal-desc")!;
  const logos = card.querySelector<HTMLElement>(".ind-modal-logos")!;

  function fill(id: string) {
    const ind = INDUSTRIES[id];
    if (!ind) return false;
    title.textContent = ind.title;
    desc.textContent = ind.description;
    logos.classList.toggle("is-single", ind.companies.length === 1);
    logos.innerHTML = ind.companies
      .map((c) => `<li><a href="${c.href}"><span class="ind-logo"><img src="${c.logo}" alt="${c.name}" loading="lazy" /></span><span class="ind-name">${c.name} <span aria-hidden="true">↗</span></span></a></li>`)
      .join("");
    return true;
  }

  stage.addEventListener("industry:select", (e) => {
    const { id } = (e as CustomEvent<{ id: string }>).detail;
    const wasOpen = !card.hidden;
    if (!fill(id)) return;
    card.hidden = false;
    if (reduce) return;
    if (wasOpen) {
      gsap.fromTo(card.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.04 });
    } else {
      gsap.fromTo(card, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.8, ease: "expo.out", delay: 0.35 });
      gsap.fromTo(logos.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.06, delay: 0.55 });
    }
  });

  const hide = () => {
    if (card.hidden) return;
    if (reduce) return void (card.hidden = true);
    gsap.to(card, { opacity: 0, x: 30, duration: 0.35, ease: "power2.in", onComplete: () => void (card.hidden = true) });
  };
  stage.addEventListener("industry:close", hide);
  card.querySelector(".ind-modal-close")!.addEventListener("click", () => stage.industries?.close());
  // clicks inside the card must not reach the canvas handlers
  card.addEventListener("pointerdown", (e) => e.stopPropagation());
}
