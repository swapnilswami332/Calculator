export const dateCounter = {
  id: "date",
  init() {},
  render() {
    return `
      <div class="tool utility-tool">
        <h2 class="tool-title">Date Counter</h2>
        <div class="tabs">
          <button type="button" class="tab active" data-op="between">Between</button>
          <button type="button" class="tab" data-op="add">Add days</button>
          <button type="button" class="tab" data-op="subtract">Subtract days</button>
        </div>
        <label class="field"><span>Date 1</span><input type="date" id="d-date1" /></label>
        <label class="field" id="d-date2-wrap"><span>Date 2</span><input type="date" id="d-date2" /></label>
        <label class="field" id="d-days-wrap" hidden><span>Days</span><input type="number" id="d-days" min="0" value="30" /></label>
        <button type="button" class="btn-primary" id="d-calc">Calculate</button>
        <div class="result-card" id="d-result"><p class="placeholder">Days between or shift dates</p></div>
      </div>`;
  },
  bindEvents(root, { api, dom }) {
    let op = "between";
    const sync = () => {
      root.querySelector("#d-date2-wrap").hidden = op !== "between";
      root.querySelector("#d-days-wrap").hidden = op === "between";
    };
    root.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        op = tab.dataset.op;
        root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
        sync();
      });
    });
    sync();

    root.querySelector("#d-calc")?.addEventListener("click", async () => {
      const date1 = root.querySelector("#d-date1")?.value;
      if (!date1) {
        dom.showToast("Date 1 is required");
        return;
      }
      const body = { operation: op, date1 };
      if (op === "between") {
        body.date2 = root.querySelector("#d-date2")?.value;
        if (!body.date2) {
          dom.showToast("Date 2 is required");
          return;
        }
      } else {
        body.days = parseInt(root.querySelector("#d-days")?.value || "0", 10);
      }
      dom.setLoading(true);
      try {
        const data = await api.post("/api/date", body);
        const card = root.querySelector("#d-result");
        if (op === "between") {
          card.innerHTML = `
            <div class="result-big">${data.days} days</div>
            <p class="muted">${data.result.from} → ${data.result.to}</p>
            <button type="button" class="btn-icon" data-copy data-copy-text="${data.days}">⎘</button>`;
        } else {
          card.innerHTML = `
            <div class="result-big">${data.result.date}</div>
            <p class="muted">${op} ${data.days} days from ${date1}</p>
            <button type="button" class="btn-icon" data-copy data-copy-text="${data.result.date}">⎘</button>`;
        }
        root.querySelector("[data-copy-text]")?.addEventListener("click", () => {
          const btn = root.querySelector("[data-copy-text]");
          dom.copyToClipboard(btn?.dataset.copyText || "");
        });
      } catch (e) {
        dom.showToast(e.message);
      } finally {
        dom.setLoading(false);
      }
    });
  },
};
