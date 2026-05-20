import { formatMoney } from "../format.js";

export const interest = {
  id: "interest",
  init() {},
  render() {
    return `
      <div class="tool utility-tool interest-tool">
        <h2 class="tool-title">Interest Calculator</h2>
        <div class="tabs">
          <button type="button" class="tab active" data-type="simple">Simple</button>
          <button type="button" class="tab" data-type="compound">Compound</button>
        </div>
        <label class="field">
          <span>Principal</span>
          <input type="number" id="int-principal" min="1" value="10000" />
        </label>
        <label class="field">
          <span>Annual rate (%)</span>
          <input type="number" id="int-rate" min="0" step="0.01" value="5" />
        </label>
        <label class="field">
          <span>Time (years)</span>
          <input type="number" id="int-years" min="0.1" step="0.1" value="3" />
        </label>
        <label class="field" id="compound-field" hidden>
          <span>Compounds per year</span>
          <input type="number" id="int-compound" min="1" value="12" />
        </label>
        <button type="button" class="btn-primary" id="int-calc">Calculate</button>
        <div class="result-card interest-result" id="int-result">
          <p class="placeholder">Simple or compound interest</p>
        </div>
      </div>`;
  },
  bindEvents(root, { api, dom }) {
    let type = "simple";
    root.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        type = tab.dataset.type;
        root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
        const cf = root.querySelector("#compound-field");
        if (cf) cf.hidden = type !== "compound";
      });
    });

    root.querySelector("#int-calc")?.addEventListener("click", async () => {
      const principal = parseFloat(root.querySelector("#int-principal")?.value);
      const rate = parseFloat(root.querySelector("#int-rate")?.value);
      const time_years = parseFloat(root.querySelector("#int-years")?.value);
      const compound_per_year = parseInt(root.querySelector("#int-compound")?.value || "12", 10);
      if (!principal || !time_years) {
        dom.showToast("Check your inputs");
        return;
      }
      dom.setLoading(true);
      try {
        const data = await api.post("/api/interest", {
          principal,
          rate,
          time_years,
          type,
          compound_per_year,
        });
        const card = root.querySelector("#int-result");
        const interestFmt = formatMoney(data.interest);
        const totalFmt = formatMoney(data.total);
        card.innerHTML = `
          <div class="result-grid three interest-grid">
            <div class="interest-stat">
              <strong class="interest-value" title="${data.interest}">${interestFmt}</strong>
              <span>Interest</span>
            </div>
            <div class="interest-stat">
              <strong class="interest-value" title="${data.total}">${totalFmt}</strong>
              <span>Total</span>
            </div>
            <div class="interest-stat">
              <strong class="interest-type">${data.type}</strong>
              <span>Type</span>
            </div>
          </div>
          <p class="muted interest-full">Principal ${formatMoney(data.principal)} · ${data.rate}% · ${data.time_years} yr</p>
          <button type="button" class="btn-icon" data-copy data-copy-text="${data.total}">⎘ Copy total</button>`;
        root.querySelector("[data-copy-text]")?.addEventListener("click", () =>
          dom.copyToClipboard(String(data.total))
        );
      } catch (e) {
        dom.showToast(e.message);
      } finally {
        dom.setLoading(false);
      }
    });
  },
};
