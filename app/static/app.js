// ---- State ----
// answers[i] = chosen Likert value (1-5) for item number i, or null if unanswered.
const answers = {};
// Reflection is persisted to localStorage so users can come back and finish later.
let reflectionText = localStorage.getItem("sg-reflection") || "";

// ---- Helpers ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $("#view-" + name).classList.add("active");
  document.querySelectorAll('.nav-link').forEach((a) =>
    a.classList.toggle("active", a.dataset.nav === name)
  );
  window.scrollTo({ top: 0 });
}

// ---- Navigation / modal ----
document.querySelectorAll("[data-nav]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    showView(a.dataset.nav);
  })
);

$("#btn-how").addEventListener("click", () => {
  $("#how-modal").classList.remove("hidden");
  $("#how-modal").setAttribute("aria-hidden", "false");
});
$("#how-close").addEventListener("click", closeHow);
function closeHow() {
  $("#how-modal").classList.add("hidden");
  $("#how-modal").setAttribute("aria-hidden", "true");
}
$("#how-modal").addEventListener("click", (e) => {
  if (e.target === $("#how-modal")) closeHow();
});

// ---- Learn view: gift grid ----
const grid = $("#gift-grid");
GIFTS.forEach((g) => {
  const el = document.createElement("article");
  el.className = "gift-card card";
  el.innerHTML = `
    <div class="gift-card-head">
      <h3>${g.name}</h3>
      <span class="scripture">${g.scripture}</span>
    </div>
    <p>${g.summary}</p>`;
  grid.appendChild(el);
});

// ---- Assessment view ----
const questionCard = $("#question-card");
const endCard = $("#end-card");
let current = 0;

function initAssessment() {
  current = 0;
  showQuestion();
}

function answeredCount() {
  return QUESTIONS.filter(([n]) => answers[n] != null).length;
}

function renderProgress() {
  const done = answeredCount();
  $("#progress-count").textContent = `${done} / ${QUESTIONS.length}`;
  $("#progress-bar").style.width = `${(done / QUESTIONS.length) * 100}%`;
}

function showQuestion() {
  renderProgress();

  // All 80 answered and we're past the last question -> show the end card.
  if (current >= QUESTIONS.length) {
    questionCard.classList.add("hidden");
    endCard.classList.remove("hidden");
    return;
  }

  questionCard.classList.remove("hidden");
  endCard.classList.add("hidden");

  const [num, text] = QUESTIONS[current];
  const chosen = answers[num];

  const options = LIKERT.map(
    (opt) => `
      <button class="option ${chosen === opt.value ? "selected" : ""}" data-value="${opt.value}">
        <span class="option-num">${opt.value}</span>
        <span class="option-label">${opt.label}<small>${opt.hint}</small></span>
      </button>`
  ).join("");

  questionCard.innerHTML = `
    <div class="question-num">Question ${num} of ${QUESTIONS.length}</div>
    <h2 class="question-text">${text}</h2>
    <div class="options">${options}</div>
    <div class="question-nav">
      <button class="btn btn-ghost" id="q-prev" ${current === 0 ? "disabled" : ""}>Back</button>
      <button class="btn btn-primary" id="q-next" ${chosen === undefined ? "disabled" : ""}>Next</button>
    </div>`;

  // Select an option: record it and re-render (updates selection + enables Next).
  questionCard.querySelectorAll(".option").forEach((b) =>
    b.addEventListener("click", () => {
      answers[num] = parseInt(b.dataset.value, 10);
      showQuestion();
    })
  );

  // Linear navigation: Back/Next move one question at a time.
  $("#q-prev").addEventListener("click", () => {
    if (current > 0) {
      current = current - 1;
      showQuestion();
    }
  });
  $("#q-next").addEventListener("click", () => {
    if (answers[num] != null) {
      current = current + 1;
      showQuestion();
    }
  });
}

function computeResults() {
  return GIFTS.map((g) => {
    const total = g.items.reduce((sum, item) => sum + (answers[item] || 0), 0);
    return { ...g, total };
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function scoreColor(score) {
  // 0-25 scale
  if (score >= 20) return "#b23a48"; // strong
  if (score >= 15) return "#e07a5f"; // growing
  return "#8aab7f"; // developing
}

function showResults() {
  const ranked = computeResults();
  const top3 = ranked.slice(0, 3);

  // Top gifts
  $("#top-gifts").innerHTML = top3
    .map(
      (g, i) => `
      <div class="top-gift card">
        <span class="top-rank">${i + 1}</span>
        <div>
          <h3>${g.name}</h3>
          <span class="scripture">${g.scripture}</span>
          <p>${g.summary}</p>
        </div>
        <div class="top-score">${g.total}<small>/25</small></div>
      </div>`
    )
    .join("");

  // Chart
  const chart = $("#chart");
  chart.innerHTML = ranked
    .map((g) => {
      const pct = (g.total / 25) * 100;
      return `
        <div class="bar-row">
          <div class="bar-label">${g.name}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${scoreColor(g.total)}">
              <span class="bar-value">${g.total}</span>
            </div>
          </div>
        </div>`;
    })
    .join("");

  // Reflection
  $("#reflect-list").innerHTML = top3.map((g) => `<li>${g.name}</li>`).join("");
  $("#reflect-input").value = reflectionText;
  $("#save-note").textContent = "";
}

$("#btn-see-results").addEventListener("click", () => {
  showResults();
  showView("results");
});

$("#btn-save").addEventListener("click", () => {
  reflectionText = $("#reflect-input").value.trim();
  localStorage.setItem("sg-reflection", reflectionText);
  const note = $("#save-note");
  note.textContent = reflectionText
    ? "Saved. 📌 Come back anytime — your reflection is remembered on this device."
    : "Nothing to save yet — write how you sense God may want you to serve.";
});

$("#btn-retake").addEventListener("click", () => {
  if (!confirm("Clear all your answers and start over?")) return;
  QUESTIONS.forEach(([n]) => delete answers[n]);
  initAssessment();
  showView("assessment");
});

$("#btn-reset").addEventListener("click", () => {
  if (!confirm("Clear all your answers and start over?")) return;
  QUESTIONS.forEach(([n]) => delete answers[n]);
  initAssessment();
});

$("#btn-print").addEventListener("click", () => window.print());

// ---- Start ----
initAssessment();
$("#reflect-input").value = reflectionText;