/* =====================================================
   CONFIG
   Point this at your running FastAPI instance.
===================================================== */
const API_BASE_URL = "https://mental-health-score-2-qryg.onrender.com";
const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;

/* =====================================================
   ELEMENT REFS
===================================================== */
const form            = document.getElementById("predict-form");
const submitBtn       = document.getElementById("submit-btn");
const formError       = document.getElementById("form-error");
const resultCard      = document.getElementById("result-card");
const resultScoreEl   = document.getElementById("result-score");
const resultTagEl     = document.getElementById("result-tag");
const resultHeadingEl = document.getElementById("result-heading");
const resultCopyEl    = document.getElementById("result-copy");
const gaugeFill       = document.getElementById("gauge-fill");
const resetBtn        = document.getElementById("reset-btn");

const countrySelect    = document.getElementById("country");
const countryOtherWrap = document.getElementById("country-other-wrap");
const countryOtherInput = document.getElementById("country-other");

const stressGroup = document.getElementById("stress_level");
const stressValue  = document.getElementById("stress_level_value");

/* =====================================================
   SLIDER LIVE LABELS
===================================================== */
const sliders = ["avg_daily_usage_hours", "study_hours", "physical_activity_hours", "sleep_hours_per_night"];

sliders.forEach((id) => {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const sync = () => { out.textContent = `${parseFloat(input.value).toFixed(1)} hrs`; };
  input.addEventListener("input", sync);
  sync();
});

/* =====================================================
   COUNTRY "OTHER" TOGGLE
===================================================== */
countrySelect.addEventListener("change", () => {
  const isOther = countrySelect.value === "Other";
  countryOtherWrap.classList.toggle("is-hidden", !isOther);
  countryOtherInput.required = isOther;
  if (!isOther) countryOtherInput.value = "";
});

/* =====================================================
   STRESS LEVEL SEGMENTED CONTROL
===================================================== */
stressGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".segmented__opt");
  if (!btn) return;
  [...stressGroup.children].forEach((c) => c.classList.remove("is-active"));
  btn.classList.add("is-active");
  stressValue.value = btn.dataset.value;
});

/* =====================================================
   FORM SUBMIT -> CALL /predict
===================================================== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  const payload = buildPayload();
  const validationMessage = validatePayload(payload);
  if (validationMessage) {
    showError(validationMessage);
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(PREDICT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    renderResult(data.predicted_mental_health_score);
  } catch (err) {
    console.error(err);
    showError(
      err.message === "Failed to fetch"
        ? "Couldn't reach the prediction server. Make sure the FastAPI backend is running at " + API_BASE_URL + "."
        : `Prediction failed: ${err.message}`
    );
  } finally {
    setLoading(false);
  }
});

resetBtn.addEventListener("click", () => {
  resultCard.classList.add("is-hidden");
  form.classList.remove("is-hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* =====================================================
   HELPERS
===================================================== */
function buildPayload() {
  const country = countrySelect.value === "Other" ? countryOtherInput.value.trim() : countrySelect.value;

  return {
    age: numberOrNaN(document.getElementById("age").value, true),
    gender: document.getElementById("gender").value,
    country: country,
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: numberOrNaN(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: numberOrNaN(document.getElementById("daily_unlocks").value, true),
    study_hours: numberOrNaN(document.getElementById("study_hours").value),
    physical_activity_hours: numberOrNaN(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: numberOrNaN(document.getElementById("sleep_hours_per_night").value),
    stress_level: stressValue.value,
  };
}

function numberOrNaN(value, isInt = false) {
  if (value === "" || value === null) return NaN;
  return isInt ? parseInt(value, 10) : parseFloat(value);
}

function validatePayload(p) {
  if (!p.country) return "Please select or enter your country.";
  if (!p.gender) return "Please select a gender.";
  if (!p.academic_level) return "Please select an academic level.";
  if (!p.most_used_platform) return "Please select your most-used platform.";
  if (!p.purpose_of_use) return "Please select your main purpose of use.";
  if (!p.stress_level) return "Please select your current stress level.";
  if (Number.isNaN(p.age) || p.age < 10 || p.age > 100) return "Age must be between 10 and 100.";
  if (Number.isNaN(p.daily_unlocks) || p.daily_unlocks < 0) return "Daily unlocks must be 0 or more.";
  if ([p.avg_daily_usage_hours, p.study_hours, p.physical_activity_hours, p.sleep_hours_per_night].some(
    (v) => Number.isNaN(v) || v < 0 || v > 24
  )) return "Hour fields must be between 0 and 24.";
  return null;
}

async function safeReadError(response) {
  try {
    const body = await response.json();
    if (Array.isArray(body.detail)) {
      return body.detail.map((d) => d.msg).join(" ");
    }
    return body.detail || null;
  } catch {
    return null;
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

function showError(message) {
  formError.textContent = message;
  formError.classList.remove("is-hidden");
}

function hideError() {
  formError.classList.add("is-hidden");
  formError.textContent = "";
}

/* =====================================================
   RESULT RENDERING
   Score is treated on a 0-10 scale (matches the training
   data's Mental_Health_Score range). Adjust SCALE_MAX if
   your model's target range differs.
===================================================== */
const SCALE_MAX = 10;
const GAUGE_PATH_LENGTH = 251.2; // matches the arc length in index.html

function renderResult(score) {
  const clamped = Math.max(0, Math.min(SCALE_MAX, score));
  const ratio = clamped / SCALE_MAX;

  resultScoreEl.textContent = score.toFixed(2);

  const offset = GAUGE_PATH_LENGTH * (1 - ratio);
  requestAnimationFrame(() => {
    gaugeFill.style.strokeDashoffset = String(offset);
  });

  let band;
  if (ratio < 0.4) band = { tag: "Needs attention", color: "var(--low)", copy: "Your habits are landing on the lower end of the range in this model. Consider adjusting sleep, screen time, or stress management, and don't hesitate to talk to someone you trust." };
  else if (ratio < 0.7) band = { tag: "Moderate", color: "var(--mid)", copy: "This sits in a middle range &mdash; there's room to improve a few habits, but nothing here looks alarming on its own." };
  else band = { tag: "Looking good", color: "var(--good)", copy: "Your reported habits align with higher wellbeing scores in the training data. Keep up whatever's working." };

  gaugeFill.style.stroke = band.color;
  resultTagEl.textContent = band.tag;
  resultHeadingEl.textContent = `Predicted score: ${score.toFixed(2)} / ${SCALE_MAX}`;
  resultCopyEl.innerHTML = band.copy;

  form.classList.add("is-hidden");
  resultCard.classList.remove("is-hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}
