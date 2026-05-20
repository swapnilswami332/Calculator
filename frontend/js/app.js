import { api } from "./api.js";
import * as dom from "./dom.js";
import { getState, setState, subscribe } from "./state.js";
import { basicCalc } from "./tools/basic-calc.js";
import { engineeringCalc } from "./tools/engineering-calc.js";
import { ageCounter } from "./tools/age-counter.js";
import { currency } from "./tools/currency.js";
import { interest } from "./tools/interest.js";
import { timeCalc } from "./tools/time-calc.js";
import { dateCounter } from "./tools/date-counter.js";

const STANDARD_TOOLS = [basicCalc, ageCounter, currency, interest, timeCalc, dateCounter];
const ADVANCED_TOOL = engineeringCalc;

let activeModule = null;
let lastToolKey = "";

function getActiveToolId(state) {
  return state.mode === "advanced" ? "engineering" : state.activeTool;
}

function getModule(toolId) {
  if (toolId === "engineering") return ADVANCED_TOOL;
  return STANDARD_TOOLS.find((t) => t.id === toolId) || basicCalc;
}

function renderTool(state) {
  const toolKey = `${state.mode}:${getActiveToolId(state)}`;
  if (toolKey === lastToolKey) return;
  lastToolKey = toolKey;

  if (activeModule?.destroy) activeModule.destroy();

  const toolId = getActiveToolId(state);
  const mod = getModule(toolId);
  activeModule = mod;

  const boundRoot = dom.mountToolPanel(mod.render(state));
  if (boundRoot) {
    mod.bindEvents(boundRoot, { setState, getState, api, dom });
  }
}

function initShell() {
  document.getElementById("mode-toggle")?.addEventListener("click", () => {
    const s = getState();
    if (s.mode === "advanced") {
      setState({ mode: "standard" });
    } else {
      setState({ mode: "advanced", activeTool: "engineering" });
    }
  });

  document.querySelectorAll("[data-tool]").forEach((el) => {
    el.addEventListener("click", () => {
      const tool = el.dataset.tool;
      if (tool === "engineering") {
        setState({ mode: "advanced", activeTool: "engineering" });
      } else {
        setState({ mode: "standard", activeTool: tool });
      }
    });
  });

  document.getElementById("sound-toggle")?.addEventListener("change", (e) => {
    setState({ soundEnabled: e.target.checked });
  });
}

subscribe((state) => {
  dom.renderApp(state);
  renderTool(state);
});

function boot() {
  try {
    initShell();
    dom.renderApp(getState());
    lastToolKey = "";
    renderTool(getState());
  } catch (err) {
    console.error("NexusCalc failed to start:", err);
    const panel = document.getElementById("tool-panel");
    if (panel) {
      panel.innerHTML = `<div class="tool utility-tool"><p class="field-error">Failed to load app: ${err.message}. Try a hard refresh (Ctrl+F5).</p></div>`;
    }
  }
}

boot();
