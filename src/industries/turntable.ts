/**
 * Pandughar industries turntable (3D disc + models only; no text, no buttons).
 * - Perspective camera, low angle, like dholding.ru: the disc reads as a wide flat ellipse.
 * - Hover: the industry under the cursor fades to its brand colours (others stay clay).
 * - Drag: the disc turns and settles on the nearest industry.
 * - Click: the industry turns to the front (short way); the camera eases to the "focus" framing
 *   (its own angle, distance and horizontal position). Emits `industry:select`.
 * - Click empty space / Escape / close(): back to the rest framing. Emits `industry:close`.
 * Every framing value lives in `config` and can be changed live (see devControls.ts).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import paletteData from "./palette.json";
import { focusOffset, nearestIndex, shortestRotation, wrapAngle } from "./math";

type ToneColours = Record<string, { clay: string; colour: string }>;
const PALETTE = paletteData as { order: string[]; industries: Record<string, ToneColours> };
export const INDUSTRY_IDS: string[] = PALETTE.order;

export const DEFAULT_CONFIG = {
  // rest camera
  fov: 28,
  elevation: 17, // degrees above the disc
  distance: 30, // camera distance from its target
  targetY: 1.3,
  targetForward: 7.2, // how far toward the front of the disc the camera aims
  // focus (selected) camera
  focusFov: 28,
  focusElevation: 15,
  focusDistance: 24,
  focusTargetY: 1.6,
  focusHorizontal: 0.6, // selected industry centred in the left <this> share of the width (1 = centre)
  portraitLift: 0.24, // on tall screens the focused industry is centred and raised by this share of the height
  portraitZoomOut: 1.35, // and the focus camera pulls back by this factor so the model fits the narrow width
  // layout
  ringRadius: 8.8,
  discRadius: 12.4,
  discThickness: 0.3,
  // motion
  rotateSpeed: 5,
  cameraSpeed: 3.2,
  colourSpeed: 7,
  dragSensitivity: 0.0035,
  // light
  ambient: 2.1,
  sun: 1.6,
};
export type IndustriesConfig = typeof DEFAULT_CONFIG;

export interface IndustriesOptions {
  modelsUrl?: string;
  dracoUrl?: string;
  config?: Partial<IndustriesConfig>;
}

export interface IndustriesApi {
  config: IndustriesConfig; // live: change values and the scene follows
  select(idOrIndex: string | number): void;
  close(): void;
  rotateTo(index: number): void;
  destroy(): void;
}

const N = PALETTE.order.length;
const STEP = (Math.PI * 2) / N;
const RIM_REST = new THREE.Color("#C8C8C8");
const deg = THREE.MathUtils.degToRad;

export function createIndustries(container: HTMLElement, opts: IndustriesOptions = {}): IndustriesApi {
  const cfg: IndustriesConfig = { ...DEFAULT_CONFIG, ...opts.config };
  const modelsUrl = opts.modelsUrl ?? "/models";
  const dracoUrl = opts.dracoUrl ?? "/draco/";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "industries-canvas";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov, 1, 0.1, 400);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xd6d8de, cfg.ambient);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, cfg.sun);
  sun.position.set(-8, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 80 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 192),
    new THREE.MeshStandardMaterial({ color: "#EDEDEF", roughness: 0.9 }),
  );
  disc.receiveShadow = true;
  world.add(disc);
  const rimMat = new THREE.MeshStandardMaterial({ color: RIM_REST.clone(), roughness: 0.7 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 192, 1, true), rimMat);
  world.add(rim);

  // ---------- industries ----------
  interface Slot {
    id: string;
    group: THREE.Group;
    mats: { mat: THREE.MeshStandardMaterial; clay: THREE.Color; colour: THREE.Color }[];
    rimColour: THREE.Color;
    t: number;
    anim?: (seconds: number) => void; // per-model idle motion (e.g. the lift cab)
  }
  const slots: Slot[] = PALETTE.order.map((id, i) => {
    const group = new THREE.Group();
    group.userData.index = i;
    world.add(group);
    const tones = PALETTE.industries[id];
    const primary = tones.primary?.colour ?? tones.accent?.colour ?? "#C8C8C8";
    return { id, group, mats: [], rimColour: new THREE.Color(primary), t: 0 };
  });

  function layout() {
    disc.scale.set(cfg.discRadius, cfg.discThickness, cfg.discRadius);
    disc.position.y = -cfg.discThickness / 2;
    rim.scale.set(cfg.discRadius + 0.015, 0.1, cfg.discRadius + 0.015);
    rim.position.y = -cfg.discThickness - 0.05;
    slots.forEach((s, i) => {
      const a = i * STEP;
      s.group.position.set(Math.sin(a) * cfg.ringRadius, 0, Math.cos(a) * cfg.ringRadius);
      s.group.rotation.y = a - Math.PI / 4; // model's iso front faces outward, toward the camera
    });
  }

  const draco = new DRACOLoader().setDecoderPath(dracoUrl);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  slots.forEach((slot) => {
    loader.load(`${modelsUrl}/${slot.id}.glb`, (gltf) => {
      const root = gltf.scene;
      const plaza = root.getObjectByName("plaza");
      const box = new THREE.Box3().setFromObject(plaza ?? root);
      const centre = box.getCenter(new THREE.Vector3());
      root.position.set(-centre.x, -box.min.y, -centre.z);
      const tones = PALETTE.industries[slot.id];
      const seen = new Map<string, THREE.MeshStandardMaterial>();
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const src = mesh.material as THREE.MeshStandardMaterial;
        let mat = seen.get(src.name);
        if (!mat) {
          mat = src.clone();
          const tone = src.name.split(":")[1] ?? "base";
          const pair = tones[tone] ?? { clay: "#ECECEE", colour: "#ECECEE" };
          const clay = new THREE.Color(pair.clay);
          mat.color.copy(clay);
          mat.roughness = tone === "glass" ? 0.35 : 0.6;
          mat.metalness = 0;
          seen.set(src.name, mat);
          slot.mats.push({ mat, clay, colour: new THREE.Color(pair.colour) });
        }
        mesh.material = mat;
        mesh.userData.index = slot.group.userData.index;
      });
      slot.group.add(root);
      if (slot.id === "lift-elevator" && !reduce) slot.anim = liftMotion(root);
    });
  });

  /**
   * Lift & Elevator: the cab rides up and down the shaft, the counterweight moves the other way,
   * and both cables shorten or lengthen so they stay tied to the machine room. Cylinders are
   * modelled with their origin at the bottom, so a cable is stretched by scaling Y from its foot.
   */
  function liftMotion(root: THREE.Object3D) {
    const get = (n: string) => root.getObjectByName(n);
    const cab = ["cab", "cab_top", "cab_floor", "cab_door0", "cab_door1"].map(get).filter(Boolean) as THREE.Object3D[];
    const cw = get("counterweight");
    const cable = get("cable");
    const cwCable = get("cw_cable");
    if (!cab.length) return undefined;
    const base = new Map<THREE.Object3D, number>();
    [...cab, cw, cable, cwCable].forEach((o) => o && base.set(o, o.position.y));
    const cableLen = cable ? new THREE.Box3().setFromObject(cable).getSize(new THREE.Vector3()).y : 0;
    const cwCableLen = cwCable ? new THREE.Box3().setFromObject(cwCable).getSize(new THREE.Vector3()).y : 0;
    const DOWN = -0.95; // cab travel below its modelled height (stays above the pit)
    const UP = 1.15; // and above it (stays below the machine room)
    return (s: number) => {
      // ease in and out at each floor: a slow sine with a short dwell at the ends
      const raw = Math.sin(s * 0.45);
      const u = 0.5 + 0.5 * Math.sign(raw) * Math.min(1, Math.abs(raw) * 1.25);
      const dy = DOWN + (UP - DOWN) * u;
      for (const o of cab) o.position.y = base.get(o)! + dy;
      if (cable && cableLen > 0) {
        cable.position.y = base.get(cable)! + dy;
        cable.scale.y = Math.max(0.02, (cableLen - dy) / cableLen);
      }
      const cdy = -dy * 0.8;
      if (cw) cw.position.y = base.get(cw)! + cdy;
      if (cwCable && cwCableLen > 0) {
        cwCable.position.y = base.get(cwCable)! + cdy;
        cwCable.scale.y = Math.max(0.02, (cwCableLen - cdy) / cwCableLen);
      }
    };
  }

  // ---------- state ----------
  let rot = 0;
  let targetRot = 0;
  let active = 0;
  let hovered = -1;
  let focused = false;
  let focusT = 0; // 0 rest framing -> 1 focus framing

  const emit = (name: string) =>
    container.dispatchEvent(
      new CustomEvent(name, { bubbles: true, detail: { id: slots[active].id, index: active } }),
    );

  function rotateTo(index: number) {
    active = ((index % N) + N) % N;
    targetRot = shortestRotation(targetRot, active, N);
    if (focused) emit("industry:select");
  }
  function select(idOrIndex: string | number) {
    const i = typeof idOrIndex === "number" ? idOrIndex : PALETTE.order.indexOf(idOrIndex);
    if (i < 0) return;
    active = ((i % N) + N) % N;
    targetRot = shortestRotation(targetRot, active, N);
    focused = true;
    container.classList.add("is-focused");
    emit("industry:select");
  }
  function close() {
    if (!focused) return;
    focused = false;
    container.classList.remove("is-focused");
    emit("industry:close");
  }

  // ---------- pointer: hover, drag, click ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(e: PointerEvent): number {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(slots.map((s) => s.group), true)[0];
    return hit ? ((hit.object.userData.index as number) ?? -1) : -1;
  }
  let dragging = false;
  let moved = false;
  let dragX = 0;
  let dragRot = 0;
  const el = renderer.domElement;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    moved = false;
    dragX = e.clientX;
    dragRot = rot;
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 5) moved = true;
      if (moved) {
        rot = targetRot = dragRot + dx * cfg.dragSensitivity;
        el.classList.add("is-dragging");
      }
      return;
    }
    hovered = pick(e);
    el.style.cursor = hovered >= 0 ? "pointer" : "grab";
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("is-dragging");
    if (moved) {
      active = nearestIndex(rot, N);
      targetRot = shortestRotation(rot, active, N);
      if (focused) emit("industry:select"); // dragging while focused moves the focus along
      return;
    }
    const i = pick(e);
    if (i >= 0) select(i);
    else close(); // click on empty space closes the focus
  };
  const onLeave = () => (hovered = -1);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("pointerleave", onLeave);
  window.addEventListener("keydown", onKey);

  // ---------- sizing ----------
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // ---------- frame loop (exponential easing retargets cleanly mid-transition) ----------
  const target = new THREE.Vector3();
  const lerp = THREE.MathUtils.lerp;
  let last = performance.now();
  let raf = 0;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = (speed: number) => (reduce ? 1 : 1 - Math.exp(-speed * dt));

    layout();
    hemi.intensity = cfg.ambient;
    sun.intensity = cfg.sun;

    if (!dragging) rot += (targetRot - rot) * k(cfg.rotateSpeed);
    world.rotation.y = rot;

    // camera framing: blend rest -> focus (focus waits until the disc has nearly stopped turning)
    const settled = Math.abs(wrapAngle(targetRot - rot)) < 0.25;
    focusT += ((focused && settled ? 1 : 0) - focusT) * k(cfg.cameraSpeed);
    const fov = lerp(cfg.fov, cfg.focusFov, focusT);
    const elev = deg(lerp(cfg.elevation, cfg.focusElevation, focusT));
    const portrait = camera.aspect < 0.9;
    const dist = lerp(cfg.distance, cfg.focusDistance * (portrait ? cfg.portraitZoomOut : 1), focusT);
    const ty = lerp(cfg.targetY, cfg.focusTargetY, focusT);
    // slide the target right so the front industry sits in the middle of the left share
    const visW = 2 * dist * Math.tan(deg(fov) / 2) * camera.aspect;
    const shift = portrait ? 0 : focusOffset(visW, 1, cfg.focusHorizontal) * focusT;
    target.set(shift, ty, cfg.targetForward);
    camera.fov = fov;
    const lift = portrait ? cfg.portraitLift * focusT : 0;
    if (lift > 0.001) {
      const w = container.clientWidth, h = container.clientHeight;
      camera.setViewOffset(w, h, 0, lift * h, w, h); // shift the picture up, leaving room for the card below
    } else if (camera.view?.enabled) camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.position.set(target.x, target.y + Math.sin(elev) * dist, target.z + Math.cos(elev) * dist);
    camera.lookAt(target);

    // colour: hovered industry and the focused one fade to brand colours; the rest stay clay
    let rimT = 0;
    slots.forEach((s, i) => {
      const want = i === hovered || (focused && i === active) ? 1 : 0;
      s.t += (want - s.t) * k(cfg.colourSpeed);
      for (const m of s.mats) m.mat.color.copy(m.clay).lerp(m.colour, s.t);
      s.anim?.(now / 1000);
      if (s.t > rimT) {
        rimT = s.t;
        rimMat.color.copy(RIM_REST).lerp(s.rimColour, s.t);
      }
    });
    if (rimT < 0.001) rimMat.color.copy(RIM_REST);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    config: cfg,
    select,
    close,
    rotateTo,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      renderer.dispose();
      draco.dispose();
      container.replaceChildren();
    },
  };
}
