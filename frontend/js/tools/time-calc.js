export const timeCalc = {
  id: "time",
  init() {},
  render() {
    return `
      <div class="tool utility-tool">
        <h2 class="tool-title">Time Calculator</h2>
        <div class="tabs">
          <button type="button" class="tab active" data-op="add">Add</button>
          <button type="button" class="tab" data-op="subtract">Subtract</button>
          <button type="button" class="tab" data-op="diff">Difference</button>
        </div>
        <div class="row-2">
          <label class="field"><span>Hours 1</span><input type="number" id="t-h1" min="0" max="23" value="2" /></label>
          <label class="field"><span>Min 1</span><input type="number" id="t-m1" min="0" max="59" value="30" /></label>
        </div>
        <div class="row-2">
          <label class="field"><span>Hours 2</span><input type="number" id="t-h2" min="0" max="23" value="1" /></label>
          <label class="field"><span>Min 2</span><input type="number" id="t-m2" min="0" max="59" value="45" /></label>
        </div>
        <button type="button" class="btn-primary" id="t-calc">Calculate</button>
        <div class="result-card" id="t-result"><p class="placeholder">Add, subtract, or diff times</p></div>
      </div>`;
  },
  bindEvents(root, { api, dom }) {
    let op = "add";
    root.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        op = tab.dataset.op;
        root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      });
    });
    root.querySelector("#t-calc")?.addEventListener("click", async () => {
      dom.setLoading(true);
      try {
        const data = await api.post("/api/time", {
          operation: op,
          hours1: parseInt(root.querySelector("#t-h1")?.value || "0", 10),
          minutes1: parseInt(root.querySelector("#t-m1")?.value || "0", 10),
          hours2: parseInt(root.querySelector("#t-h2")?.value || "0", 10),
          minutes2: parseInt(root.querySelector("#t-m2")?.value || "0", 10),
        });
        const r = data.result;
        root.querySelector("#t-result").innerHTML = `
          <div class="result-big">${r.formatted}</div>
          <p class="muted">${r.hours}h ${r.minutes}m · ${data.operation}</p>
          <button type="button" class="btn-icon" data-copy data-copy-text="${r.formatted}">⎘</button>`;
        root.querySelector("[data-copy-text]")?.addEventListener("click", () =>
          dom.copyToClipboard(r.formatted)
        );
      } catch (e) {
        dom.showToast(e.message);
      } finally {
        dom.setLoading(false);
      }
    });
  },
};
