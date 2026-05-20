const KEYS = [
  ["C", "⌫", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["±", "0", ".", "="],
];

const OP_MAP = { "×": "*", "÷": "/" };

export const basicCalc = {
  id: "basic",
  _expression: "0",
  _history: [],

  init() {},

  render() {
    return `
      <div class="tool basic-calc">
        <div class="calc-display">
          <div class="calc-expression" id="basic-expr">0</div>
          <div class="calc-result-row">
            <span class="calc-result" id="basic-result">0</span>
            <button type="button" class="btn-icon" data-copy data-copy-target="#basic-result" title="Copy">⎘</button>
          </div>
        </div>
        <div class="keypad">
          ${KEYS.flat()
            .map(
              (k) =>
                `<button type="button" class="key ${["=", "+", "-", "×", "÷", "%"].includes(k) ? "op" : ""} ${k === "=" ? "equals" : ""}" data-key="${k}">${k}</button>`
            )
            .join("")}
        </div>
        <div class="history-strip" id="basic-history"></div>
      </div>`;
  },

  bindEvents(root, { api, dom }) {
    const updateDisplay = (expr, disp) => {
      this._expression = expr;
      const expEl = root.querySelector("#basic-expr");
      const resEl = root.querySelector("#basic-result");
      if (expEl) expEl.textContent = expr;
      if (resEl) resEl.textContent = disp;
    };

    root.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._handleKey(btn.dataset.key, updateDisplay, api, dom, root);
      });
    });
    dom.bindCopyButtons(root);
  },

  async _handleKey(key, updateDisplay, api, dom, root) {
    let expr = this._expression === "0" ? "" : this._expression;

    if (key === "C") {
      this._expression = "0";
      updateDisplay("0", "0");
      return;
    }
    if (key === "⌫") {
      expr = expr.slice(0, -1) || "0";
      this._expression = expr;
      updateDisplay(expr, expr);
      return;
    }
    if (key === "±") {
      if (expr.startsWith("-")) expr = expr.slice(1);
      else if (expr) expr = "-" + expr;
      this._expression = expr || "0";
      updateDisplay(this._expression, this._expression);
      return;
    }
    if (key === "=") {
      const toEval = expr.replace(/×/g, "*").replace(/÷/g, "/");
      if (!toEval) return;
      dom.setLoading(true);
      try {
        const data = await api.post("/api/calc/basic", { expression: toEval });
        this._history.unshift(`${toEval} = ${data.formatted}`);
        this._history = this._history.slice(0, 5);
        const hist = root.querySelector("#basic-history");
        if (hist) {
          hist.innerHTML = this._history
            .map((h) => `<div class="history-item">${h}</div>`)
            .join("");
        }
        this._expression = data.formatted;
        updateDisplay(toEval, data.formatted);
      } catch (e) {
        dom.showToast(e.message);
      } finally {
        dom.setLoading(false);
      }
      return;
    }

    const mapped = OP_MAP[key] || key;
    if (expr === "0" && !isNaN(Number(mapped))) expr = "";
    expr += mapped;
    this._expression = expr;
    updateDisplay(expr, expr);
  },
};
