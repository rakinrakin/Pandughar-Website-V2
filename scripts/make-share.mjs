// Builds industries.html into ONE self-contained file (share/pandughar-industries.html):
// JS and CSS inlined, 3D models, Draco decoder and company logos embedded as data URIs.
// Opens straight from disk, no server needed (only the Sora font loads from Google Fonts).
import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "share-build");
await build({ root, logLevel: "warn", build: { outDir: out, emptyOutDir: true, rollupOptions: { input: resolve(root, "industries.html") } } });

const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString("base64")}`;
let html = readFileSync(resolve(out, "industries.html"), "utf8");

// stylesheet <link> -> <style>
html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => `<style>${readFileSync(resolve(out, "." + href), "utf8")}</style>`);

// the JS bundle, with logo paths swapped for data URIs
let js = "";
html = html.replace(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/, (_, src) => ((js = readFileSync(resolve(out, "." + src), "utf8")), "<!--APP-->"));
const logoDir = resolve(root, "public/media/logos");
for (const f of readdirSync(logoDir)) js = js.split(`/media/logos/${f}`).join(dataUri(resolve(logoDir, f), f.endsWith(".svg") ? "image/svg+xml" : "image/png"));
html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");

// models + decoder, looked up by the URL modifier in src/share/main.ts
const assets = {};
for (const f of readdirSync(resolve(root, "public/models"))) assets[`/models/${f}`] = dataUri(resolve(root, "public/models", f), "model/gltf-binary");
for (const f of ["draco_wasm_wrapper.js", "draco_decoder.wasm", "draco_decoder.js"]) assets[`/draco/${f}`] = dataUri(resolve(root, "public/draco", f), f.endsWith(".wasm") ? "application/wasm" : "text/javascript");

const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
html = html.replace("<!--APP-->", () => `<script>window.__ASSETS=${JSON.stringify(assets)}</script>\n<script type="module">${safe(js)}</script>`);

mkdirSync(resolve(root, "share"), { recursive: true });
const dest = resolve(root, "share/pandughar-industries.html");
writeFileSync(dest, html);
console.log(`${dest} ${(html.length / 1048576).toFixed(1)} MB`);
