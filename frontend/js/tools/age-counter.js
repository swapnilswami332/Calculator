export const ageCounter = {
  id: "age",
  init() {},
  render() {
    const today = new Date().toISOString().slice(0, 10);
    return `
      <div class="tool utility-tool">
        <h2 class="tool-title">Age Counter</h2>
        <label class="field">
          <span>Birth date</span>
          <input type="date" id="age-birth" max="${today}" />
          <span class="field-error" data-error="age.birth" hidden></span>
        </label>
        <button type="button" class="btn-primary" id="age-calc">Calculate Age</button>
        <div class="result-card" id="age-result">
          <p class="placeholder">Enter your birth date</p>
        </div>
      </div>`;
  },
  bindEvents(root, { api, dom }) {
    root.querySelector("#age-calc")?.addEventListener("click", async () => {
      const birth = root.querySelector("#age-birth")?.value;
      dom.clearValidation("age");
      if (!birth) {
        dom.showValidation("age", "birth", "Birth date is required");
        return;
      }
      dom.setLoading(true);
      const card = root.querySelector("#age-result");
      try {
        const data = await api.post("/api/age", { birth_date: birth });
        card.innerHTML = `
          <div class="result-grid">
            <div><strong>${data.years}</strong><span>Years</span></div>
            <div><strong>${data.months}</strong><span>Months</span></div>
            <div><strong>${data.days}</strong><span>Days</span></div>
            <div><strong>${data.total_days}</strong><span>Total days lived</span></div>
          </div>
          <div class="result-row">
            <span>Next birthday: ${data.next_birthday} (${data.days_until_birthday} days)</span>
            <button type="button" class="btn-icon" data-copy data-copy-text="${data.years}y ${data.months}m ${data.days}d">⎘</button>
          </div>`;
        root.querySelectorAll("[data-copy-text]").forEach((btn) => {
          btn.addEventListener("click", () => dom.copyToClipboard(btn.dataset.copyText));
        });
      } catch (e) {
        dom.showValidation("age", "birth", e.message);
      } finally {
        dom.setLoading(false);
      }
    });
  },
};
