let currencyList = [];

function buildOptions(list, selected) {
  return list
    .map(
      (c) =>
        `<option value="${c.code}"${c.code === selected ? " selected" : ""}>${c.label}${c.live ? "" : " *"}</option>`
    )
    .join("");
}

function filterList(query) {
  const q = query.trim().toLowerCase();
  if (!q) return currencyList;
  return currencyList.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q)
  );
}

function refillSelect(select, list, selected) {
  if (!select) return;
  const current = selected || select.value;
  select.innerHTML = buildOptions(list, current);
}

export const currency = {
  id: "currency",
  init() {},

  render() {
    return `
      <div class="tool utility-tool currency-tool">
        <h2 class="tool-title">Currency Converter</h2>
        <label class="field">
          <span>Search currency</span>
          <input type="search" id="cur-search" placeholder="Country or code (e.g. India, INR)" />
        </label>
        <label class="field">
          <span>Amount</span>
          <input type="number" id="cur-amount" min="0.01" step="0.01" value="100" />
          <span class="field-error" data-error="currency.amount" hidden></span>
        </label>
        <div class="row-2 currency-row">
          <label class="field">
            <span>From</span>
            <select id="cur-from" class="currency-select" size="1"></select>
          </label>
          <button type="button" class="btn-icon swap" id="cur-swap" title="Swap">⇄</button>
          <label class="field">
            <span>To</span>
            <select id="cur-to" class="currency-select" size="1"></select>
          </label>
        </div>
        <p class="muted currency-note">* Exotic codes may use EUR cross-rates when live quote unavailable</p>
        <button type="button" class="btn-primary" id="cur-convert">Convert</button>
        <div class="result-card" id="cur-result">
          <p class="placeholder">Loading currencies…</p>
        </div>
      </div>`;
  },

  bindEvents(root, { api, dom }) {
    this._initCurrency(root, api, dom);
  },

  async _initCurrency(root, api, dom) {
    const fromSel = root.querySelector("#cur-from");
    const toSel = root.querySelector("#cur-to");
    const search = root.querySelector("#cur-search");

    try {
      const data = await api.get("/api/currency/currencies");
      currencyList = data.currencies || [];
      refillSelect(fromSel, currencyList, "USD");
      refillSelect(toSel, currencyList, "INR");
      const card = root.querySelector("#cur-result");
      if (card) card.innerHTML = `<p class="placeholder">${currencyList.length} currencies available</p>`;
    } catch (e) {
      dom.showToast(e.message || "Could not load currencies");
    }

    search?.addEventListener("input", () => {
      const filtered = filterList(search.value);
      refillSelect(fromSel, filtered);
      refillSelect(toSel, filtered);
    });

    root.querySelector("#cur-swap")?.addEventListener("click", () => {
      if (fromSel && toSel) {
        const t = fromSel.value;
        fromSel.value = toSel.value;
        toSel.value = t;
      }
    });

    root.querySelector("#cur-convert")?.addEventListener("click", async () => {
      const amount = parseFloat(root.querySelector("#cur-amount")?.value);
      const from = fromSel?.value;
      const to = toSel?.value;
      dom.clearValidation("currency");
      if (!amount || amount <= 0) {
        dom.showValidation("currency", "amount", "Enter a positive amount");
        return;
      }
      dom.setLoading(true);
      const card = root.querySelector("#cur-result");
      try {
        const data = await api.post("/api/currency/convert", {
          amount,
          from,
          to,
        });
        card.innerHTML = `
          <div class="result-big currency-result">${data.result.toLocaleString("en-US")} ${data.to}</div>
          <p class="muted">1 ${data.from} = ${data.rate} ${data.to}</p>
          <p class="muted">Source: ${data.source}${data.stale ? " (cached)" : ""}</p>
          <button type="button" class="btn-icon" data-copy data-copy-text="${data.result}">⎘ Copy</button>`;
        root.querySelector("[data-copy-text]")?.addEventListener("click", () =>
          dom.copyToClipboard(String(data.result))
        );
      } catch (e) {
        dom.showToast(e.message);
      } finally {
        dom.setLoading(false);
      }
    });
  },
};
