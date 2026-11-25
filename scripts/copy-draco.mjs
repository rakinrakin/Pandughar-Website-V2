// Copies the Draco decoder that ships with three.js into public/, so the compressed
// GLB models decode locally (no CDN dependency).
import { cpSync, existsSync } from "node:fs";

const src = "node_modules/three/examples/jsm/libs/draco/gltf";
if (existsSync(src)) {
  cpSync(src, "public/draco", { recursive: true });
  console.log("draco decoder copied to public/draco");
}
