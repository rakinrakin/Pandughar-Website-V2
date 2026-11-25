/**
 * Live tuning panel for the turntable (dev only: `npm run dev`, or add `?dev` to the URL).
 * Change values, then "Copy settings" puts the JSON on the clipboard to paste back.
 */
import GUI from "lil-gui";
import { DEFAULT_CONFIG, INDUSTRY_IDS, type IndustriesApi } from "./turntable";

export function mountDevControls(api: IndustriesApi) {
  const c = api.config;
  const gui = new GUI({ title: "Turntable controls" });

  const rest = gui.addFolder("Rest camera");
  rest.add(c, "fov", 10, 70, 0.5).name("Field of view");
  rest.add(c, "elevation", 2, 89, 0.5).name("Angle (deg)");
  rest.add(c, "distance", 5, 80, 0.1).name("Distance (zoom)");
  rest.add(c, "targetY", -4, 8, 0.05).name("Aim height");
  rest.add(c, "targetForward", -4, 16, 0.05).name("Aim forward");

  const focus = gui.addFolder("Selected camera");
  focus.add(c, "focusFov", 10, 70, 0.5).name("Field of view");
  focus.add(c, "focusElevation", 2, 89, 0.5).name("Angle (deg)");
  focus.add(c, "focusDistance", 5, 80, 0.1).name("Distance (zoom)");
  focus.add(c, "focusTargetY", -4, 8, 0.05).name("Aim height");
  focus.add(c, "focusHorizontal", 0.2, 1, 0.01).name("Left share (1 = centre)");

  const lay = gui.addFolder("Disc layout");
  lay.add(c, "ringRadius", 4, 16, 0.05).name("Models ring radius");
  lay.add(c, "discRadius", 6, 24, 0.05).name("Disc radius");
  lay.add(c, "discThickness", 0.05, 1.5, 0.01).name("Disc thickness");

  const motion = gui.addFolder("Motion");
  motion.add(c, "rotateSpeed", 0.5, 15, 0.1).name("Turn speed");
  motion.add(c, "cameraSpeed", 0.5, 15, 0.1).name("Camera speed");
  motion.add(c, "colourSpeed", 0.5, 20, 0.1).name("Colour fade speed");
  motion.add(c, "dragSensitivity", 0.001, 0.01, 0.0001).name("Drag sensitivity");

  const light = gui.addFolder("Light");
  light.add(c, "ambient", 0, 5, 0.05).name("Ambient");
  light.add(c, "sun", 0, 5, 0.05).name("Sun");

  const test = { industry: INDUSTRY_IDS[0] };
  const actions = gui.addFolder("Try it");
  actions.add(test, "industry", INDUSTRY_IDS).name("Industry");
  actions.add({ select: () => api.select(test.industry) }, "select").name("Select (focus)");
  actions.add({ close: () => api.close() }, "close").name("Close (rest)");

  gui
    .add(
      {
        copy: () => {
          const json = JSON.stringify(api.config, null, 2);
          navigator.clipboard?.writeText(json).catch(() => {});
          console.log("Turntable settings:\n" + json);
        },
      },
      "copy",
    )
    .name("Copy settings");
  gui
    .add({ reset: () => (Object.assign(c, DEFAULT_CONFIG), gui.controllersRecursive().forEach((x) => x.updateDisplay())) }, "reset")
    .name("Reset to defaults");
  return gui;
}
