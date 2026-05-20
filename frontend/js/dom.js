import { getState } from "./state.js";

let toastTimer = null;

const TOOL_LABELS = {
  basic: "Basic",
  age: "Age",
  currency: "Currency",
  interest: "Interest",
  time: "Time",
  date: "Date",
  engineering: "Engineering",
};

export function renderApp(state) {
  document.documentElement.setAttribute("data-theme", state.theme);
  document.body.classList.toggle("is-loading", state.loading);

  const overlay = document.getElementById("loader-overlay");
  if (overlay) overlay.hidden = !state.loading;

  const modeBtn = document.getElementById("mode-toggle");
  if (modeBtn) {
    modeBtn.textContent = state.mode === "advanced" ? "Standard Mode" : "Advanced Mode";
    modeBtn.setAttribute("aria-pressed", state.mode === "advanced");
  }

  document.querySelectorAll("[data-tool]").forEach((el) => {
    const tool = el.dataset.tool;
    const active =
      state.mode === "advanced"
        ? tool === "engineering"
        : tool === state.activeTool;
    el.classList.toggle("active", active);
    el.setAttribute("aria-current", active ? "page" : "false");
  });

  const angleBadge = document.getElementById("angle-badge");
  if (angleBadge) {
    angleBadge.textContent = state.angleMode.toUpperCase();
    angleBadge.hidden = state.mode !== "advanced";
  }
}

export function mountToolPanel(html) {
  const panel = document.getElementById("tool-panel");
  if (!panel) return null;
  panel.innerHTML = html;
  return panel.querySelector(".tool") || panel;
}

export function showValidation(toolId, field, message) {
  const el = document.querySelector(`[data-error="${toolId}.${field}"]`);
  if (el) {
    el.textContent = message;
    el.hidden = !message;
  }
}

export function clearValidation(toolId) {
  document.querySelectorAll(`[data-error^="${toolId}."]`).forEach((el) => {
    el.textContent = "";
    el.hidden = true;
  });
}

export function setLoading(isLoading) {
  document.body.classList.toggle("is-loading", isLoading);
  const overlay = document.getElementById("loader-overlay");
  if (overlay) overlay.hidden = !isLoading;
}

export function showToast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2200);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(String(text));
    showToast("Copied to clipboard");
  } catch {
    showToast("Copy failed");
  }
}

export function playClickSound(enabled) {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.03;
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    /* ignore */
  }
}

export function getToolLabel(id) {
  return TOOL_LABELS[id] || id;
}

export function updateResultDisplay(selector, value, loading = false) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.toggle("shimmer", loading);
  if (!loading) el.textContent = value ?? "—";
}

export function bindCopyButtons(root) {
  root.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.copyTarget;
      const el = target ? root.querySelector(target) : btn.previousElementSibling;
      if (el) copyToClipboard(el.textContent);
    });
  });
}
