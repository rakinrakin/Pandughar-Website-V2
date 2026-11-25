// Version 3 reuses the version 2 page logic; v3.css loads after v2.css and re-themes it
// (white ground, Sora, brand green and red). Adds the floating industry card.
import "../v2/main";
import "./v3.css";
import { mountIndustryModal } from "./industryModal";
import { mountIndustryAutopilot } from "./industryAutopilot";

mountIndustryModal(document.getElementById("industries")!);
mountIndustryAutopilot(document.getElementById("industries")!);
