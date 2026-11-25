import "./industries/industries.css";
import "./demo.css";
import { createIndustries } from "./industries/turntable";

const section = document.getElementById("industries")!;
const api = createIndustries(section);

// Dev tuning panel: in `npm run dev`, in builds made with VITE_DEV_PANEL=true (the hosted demo),
// or with ?dev on any build. Production builds without the flag show only the disc.
const params = new URLSearchParams(location.search);
const showPanel =
  (import.meta.env.DEV || import.meta.env.VITE_DEV_PANEL === "true" || params.has("dev")) && !params.has("clean");
if (showPanel) {
  import("./industries/devControls").then(({ mountDevControls }) => mountDevControls(api));
}

// for manual testing in the console
(window as unknown as { industries: typeof api }).industries = api;
