// Standalone copy of the v3 Business section (industries.html), used to hand the 3D disc to
// someone on its own. In the single-file build (scripts/make-share.mjs) the models and the
// Draco decoder arrive as data URIs in window.__ASSETS; the URL modifier swaps them in.
import * as THREE from "three";
import "../v2/v2.css";
import "../industries/industries.css";
import "../v3/v3.css";
import { createIndustries, type IndustriesApi } from "../industries/turntable";
import { mountIndustryModal } from "../v3/industryModal";
import { mountIndustryAutopilot } from "../v3/industryAutopilot";

const inlined = (window as { __ASSETS?: Record<string, string> }).__ASSETS;
if (inlined) THREE.DefaultLoadingManager.setURLModifier((url) => inlined[url.replace(/^.*?(\/(models|draco)\/)/, "$1")] ?? url);

const stage = document.getElementById("industries")! as HTMLElement & { industries?: IndustriesApi };
stage.industries = createIndustries(stage, {
  config: { distance: 19, targetForward: 7.8, targetY: 1.1, elevation: 16, focusDistance: 16, focusTargetY: 1.4 },
});
mountIndustryModal(stage);
mountIndustryAutopilot(stage);
