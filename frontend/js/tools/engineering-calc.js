/** key = internal token, label = button display (symbols) */
const KEY_ROWS = [
  [
    { key: "2nd", label: "2nd" },
    { key: "deg", label: "DEG" },
    { key: "sin", label: "sin" },
    { key: "cos", label: "cos" },
    { key: "tan", label: "tan" },
  ],
  [
    { key: "asin", label: "sin⁻¹" },
    { key: "acos", label: "cos⁻¹" },
    { key: "atan", label: "tan⁻¹" },
    { key: "log", label: "log" },
    { key: "ln", label: "ln" },
  ],
  [
    { key: "pi", label: "π" },
    { key: "e", label: "e" },
    { key: "^", label: "xʸ" },
    { key: "sqrt", label: "√" },
    { key: "!", label: "n!" },
  ],
  [
    { key: "abs", label: "|x|" },
    { key: "mod", label: "mod" },
    { key: "%", label: "%" },
    { key: "(", label: "(" },
    { key: ")", label: ")" },
  ],
  [
    { key: "7", label: "7" },
    { key: "8", label: "8" },
    { key: "9", label: "9" },
    { key: "÷", label: "÷" },
    { key: "MC", label: "MC" },
  ],
  [
    { key: "4", label: "4" },
    { key: "5", label: "5" },
    { key: "6", label: "6" },
    { key: "×", label: "×" },
    { key: "MR", label: "MR" },
  ],
  [
    { key: "1", label: "1" },
    { key: "2", label: "2" },
    { key: "3", label: "3" },
    { key: "-", label: "−" },
    { key: "M+", label: "M+" },
  ],
  [
    { key: "0", label: "0" },
    { key: ".", label: "." },
    { key: "pow2", label: "x²" },
    { key: "+", label: "+" },
    { key: "M-", label: "M-" },
  ],
  [
    { key: "C", label: "C" },
    { key: "⌫", label: "⌫" },
    { key: "EXP", label: "×10ⁿ" },
    { key: "=", label: "=" },
    { key: "1/x", label: "1/x" },
  ],
];

const FUNC_KEYS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt", "!", "pi", "e", "EXP", "abs", "mod",
]);

const OP_KEYS = new Set(["÷", "×", "-", "+", "=", "%", "^", "(", ")"]);

export const engineeringCalc = {
  id: "engineering",
  _expression: "",

  init() {},

  render(state) {
    const angle = state.angleMode?.toUpperCase() || "DEG";
    const keysHtml = KEY_ROWS.flat()
      .map(({ key, label }) => {
        let cls = "key";
        if (FUNC_KEYS.has(key)) cls += " fn";
        if (OP_KEYS.has(key)) cls += " op";
        if (key === "=") cls += " equals";
        if (["MC", "MR", "M+", "M-"].includes(key)) cls += " mem";
        if (label.length === 1 && /[π√⁻ⁿ]/.test(label)) cls += " sym";
        return `<button type="button" class="${cls}" data-key="${key}">${label}</button>`;
      })
      .join("");

    return `
      <div class="tool engineering-calc">
        <div class="calc-display eng">
          <div class="calc-expression eng-expr" id="eng-expr"></div>
          <div class="calc-result-row">
            <span class="calc-result eng-result" id="eng-result">0</span>
            <button type="button" class="btn-icon" data-copy data-copy-target="#eng-result">⎘</button>
          </div>
        </div>
        <div class="eng-controls">
          <button type="button" class="chip active" id="angle-toggle">${angle}</button>
          <span class="hint">DEG/RAD · Enter = · ^ power · √ sqrt</span>
        </div>
        <div class="keypad eng-keypad">${keysHtml}</div>
      </div>`;
  },

  bindEvents(root, { setState, api, dom, getState }) {
    const update = (expr, res) => {
      this._expression = expr;
      const e = root.querySelector("#eng-expr");
      const r = root.querySelector("#eng-result");
      if (e) e.textContent = expr || "0";
      if (r) r.textContent = res ?? (expr || "0");
    };

    root.querySelector("#angle-toggle")?.addEventListener("click", () => {
      const s = getState();
      const next = s.angleMode === "deg" ? "rad" : "deg";
      setState({ angleMode: next });
      const btn = root.querySelector("#angle-toggle");
      if (btn) btn.textContent = next.toUpperCase();
    });

    root.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._onKey(btn.dataset.key, update, api, dom, root, setState, getState);
      });
    });

    this._keyHandler = (e) => {
      if (getState().mode !== "advanced") return;
      const map = {
        Enter: "=",
        Backspace: "⌫",
        Escape: "C",
        d: "deg",
        D: "deg",
      };
      if (map[e.key]) {
        e.preventDefault();
        if (e.key === "d" || e.key === "D") {
          root.querySelector("#angle-toggle")?.click();
          return;
        }
        this._onKey(map[e.key], update, api, dom, root, setState, getState);
        return;
      }
      if (/^[0-9.+\-*/%^(),]$/.test(e.key)) {
        this._onKey(e.key === "*" ? "×" : e.key === "/" ? "÷" : e.key, update, api, dom, root, setState, getState);
      }
    };
    document.addEventListener("keydown", this._keyHandler);
    dom.bindCopyButtons(root);
  },

  destroy() {
    if (this._keyHandler) document.removeEventListener("keydown", this._keyHandler);
  },

  async _onKey(key, update, api, dom, root, setState, getState) {
    let expr = this._expression;

    if (key === "deg") {
      root.querySelector("#angle-toggle")?.click();
      return;
    }
    if (key === "MC") {
      setState({ memory: 0 });
      dom.showToast("Memory cleared");
      return;
    }
    if (key === "MR") {
      expr += String(getState().memory);
      this._expression = expr;
      update(expr, expr);
      return;
    }
    if (key === "M+") {
      try {
        const data = await api.post("/api/calc/engineering", {
          expression: expr || "0",
          angle_mode: getState().angleMode,
        });
        const m = getState().memory + data.result;
        setState({ memory: m });
        dom.showToast(`M = ${m}`);
      } catch {
        dom.showToast("Invalid for memory");
      }
      return;
    }
    if (key === "M-") {
      try {
        const data = await api.post("/api/calc/engineering", {
          expression: expr || "0",
          angle_mode: getState().angleMode,
        });
        setState({ memory: getState().memory - data.result });
      } catch {
        dom.showToast("Invalid for memory");
      }
      return;
    }
    if (key === "C") {
      this._expression = "";
      update("", "0");
      return;
    }
    if (key === "⌫") {
      expr = expr.slice(0, -1);
      this._expression = expr;
      update(expr, expr || "0");
      return;
    }
    if (key === "=") {
      if (!expr) return;
      dom.setLoading(true);
      try {
        const data = await api.post("/api/calc/engineering", {
          expression: this._normalizeExpr(expr),
          angle_mode: getState().angleMode,
        });
        this._expression = data.formatted;
        update(expr, data.formatted);
      } catch (e) {
        dom.showToast(e.message);
      } finally {
        dom.setLoading(false);
      }
      return;
    }

    const insert = this._mapKey(key);
    if (insert === null) return;

    if (key === "1/x") {
      expr += "(1/(";
      this._expression = expr;
      update(expr, expr);
      return;
    }
    if (key === "EXP") {
      expr += "*10**(";
      this._expression = expr;
      update(expr, expr);
      return;
    }
    if (key === "pow2") {
      expr += "**2";
      this._expression = expr;
      update(expr, expr);
      return;
    }
    if (FUNC_KEYS.has(key) && !["pi", "e"].includes(key)) {
      expr += `${insert}(`;
    } else {
      expr += insert;
    }
    this._expression = expr;
    update(expr, expr);
  },

  _mapKey(key) {
    const map = {
      "×": "*",
      "÷": "/",
      "^": "**",
      EXP: "e",
      pi: "pi",
      e: "e",
      "2nd": null,
      "**": "**",
    };
    if (key in map) return map[key];
    if (key === "2nd") return null;
    return key;
  },

  _normalizeExpr(expr) {
    return expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**");
  },
};
