const state = {
  allQuestions: [],
  currentQuestions: [],
  mode: null,
  currentIndex: 0,
  selectedAnswers: []
};

const el = {
  homeScreen: document.getElementById("homeScreen"),
  modeScreen: document.getElementById("modeScreen"),
  readScreen: document.getElementById("readScreen"),
  resultScreen: document.getElementById("resultScreen"),
  modeRead: document.getElementById("modeRead"),
  modeQuiz: document.getElementById("modeQuiz"),
  modeTest: document.getElementById("modeTest"),
  backHomeFromMode: document.getElementById("backHomeFromMode"),
  backHomeFromRead: document.getElementById("backHomeFromRead"),
  backHomeFromResult: document.getElementById("backHomeFromResult"),
  restartModeBtn: document.getElementById("restartModeBtn"),
  modeLabel: document.getElementById("modeLabel"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  questionText: document.getElementById("questionText"),
  optionsList: document.getElementById("optionsList"),
  explanationBox: document.getElementById("explanationBox"),
  explanationText: document.getElementById("explanationText"),
  nextBtn: document.getElementById("nextBtn"),
  submitTestBtn: document.getElementById("submitTestBtn"),
  readList: document.getElementById("readList"),
  resultTitle: document.getElementById("resultTitle"),
  resultSubtitle: document.getElementById("resultSubtitle"),
  resultStats: document.getElementById("resultStats"),
  toggleTheme: document.getElementById("toggleTheme")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();

  try {
    const response = await fetch("Json/quiz.json");
    const rawData = await response.json();
    state.allQuestions = normalizeQuestions(rawData);
  } catch (error) {
    el.homeScreen.textContent = "";
    const errorText = document.createElement("p");
    errorText.textContent = "Failed to load quiz data.";
    el.homeScreen.appendChild(errorText);
    console.error("Failed to load quiz:", error);
    return;
  }

  showHome();
}

function bindEvents() {
  el.modeRead.addEventListener("click", startReadMode);
  el.modeQuiz.addEventListener("click", () => startQuestionMode("quiz"));
  el.modeTest.addEventListener("click", () => startQuestionMode("test"));

  el.backHomeFromMode.addEventListener("click", showHome);
  el.backHomeFromRead.addEventListener("click", showHome);
  el.backHomeFromResult.addEventListener("click", showHome);
  el.restartModeBtn.addEventListener("click", () => {
    if (!state.mode) return showHome();
    if (state.mode === "read") return startReadMode();
    startQuestionMode(state.mode);
  });

  el.nextBtn.addEventListener("click", handleNext);
  el.submitTestBtn.addEventListener("click", submitTest);

  el.toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("light");
    el.toggleTheme.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });
}

function normalizeQuestions(rawData) {
  return rawData
    .map((item, index) => {
      const choices = buildChoices(item);
      const correctIndex = getCorrectIndex(item.correct_answer ?? item.AnswerKey ?? item.answerKey, choices.length);

      return {
        id: index,
        question: item.question ?? item.Question ?? `Question ${index + 1}`,
        choices,
        correctIndex,
        explanation: item.explanation ?? item.Solution ?? "No explanation provided."
      };
    })
    .filter(q => q.choices.length > 1);
}

function buildChoices(item) {
  if (Array.isArray(item.Choices) && item.Choices.length) {
    return item.Choices.filter(Boolean).map(text => String(text).trim());
  }

  const optionEntries = Object.keys(item)
    .filter(key => /^option\d+$/i.test(key))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map(key => item[key])
    .filter(value => value !== undefined && value !== null && String(value).trim() !== "")
    .map(value => String(value));

  return optionEntries;
}

function getCorrectIndex(answerKey, maxChoices) {
  if (typeof answerKey === "number") {
    return clamp(answerKey - 1, 0, maxChoices - 1);
  }

  const key = String(answerKey || "").trim().toUpperCase();

  if (/^\d+$/.test(key)) {
    return clamp(Number(key) - 1, 0, maxChoices - 1);
  }

  if (/^[A-Z]$/.test(key)) {
    return clamp(key.charCodeAt(0) - 65, 0, maxChoices - 1);
  }

  return 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showHome() {
  state.mode = null;
  state.currentIndex = 0;
  state.selectedAnswers = [];
  switchScreen("home");
}

function startReadMode() {
  state.mode = "read";
  renderReadMode();
  switchScreen("read");
}

function startQuestionMode(mode) {
  state.mode = mode;
  state.currentQuestions = [...state.allQuestions];
  state.currentIndex = 0;
  state.selectedAnswers = new Array(state.currentQuestions.length).fill(null);
  el.modeLabel.textContent = mode === "quiz" ? "Quiz Mode" : "Test Mode";
  renderCurrentQuestion();
  switchScreen("mode");
}

function renderReadMode() {
  el.readList.innerHTML = "";

  state.allQuestions.forEach((q, idx) => {
    const card = document.createElement("article");
    card.className = "read-card";

    const title = document.createElement("h3");
    title.textContent = `${idx + 1}. ${q.question}`;
    card.appendChild(title);

    const options = document.createElement("div");
    options.className = "options-list";

    q.choices.forEach((choice, optionIndex) => {
      const option = document.createElement("button");
      option.type = "button";
      option.disabled = true;
      option.className = `option-btn ${optionIndex === q.correctIndex ? "correct" : ""}`;
      option.textContent = `${String.fromCharCode(65 + optionIndex)}. ${choice}`;
      options.appendChild(option);
    });

    const explanation = document.createElement("div");
    explanation.className = "explanation";
    const explanationTitle = document.createElement("h3");
    explanationTitle.textContent = "Explanation";
    const explanationText = document.createElement("p");
    explanationText.textContent = q.explanation;
    explanation.appendChild(explanationTitle);
    explanation.appendChild(explanationText);

    card.appendChild(options);
    card.appendChild(explanation);
    el.readList.appendChild(card);
  });
}

function renderCurrentQuestion() {
  const total = state.currentQuestions.length;
  const question = state.currentQuestions[state.currentIndex];

  if (!question) return;

  el.questionText.textContent = question.question;
  el.optionsList.innerHTML = "";
  el.explanationBox.classList.add("hidden");
  el.explanationText.textContent = "";

  const chosen = state.selectedAnswers[state.currentIndex];

  question.choices.forEach((choice, optionIndex) => {
    const optionBtn = document.createElement("button");
    optionBtn.type = "button";
    optionBtn.className = "option-btn";
    optionBtn.textContent = `${String.fromCharCode(65 + optionIndex)}. ${choice}`;

    if (state.mode === "quiz") {
      optionBtn.addEventListener("click", () => handleQuizAnswer(optionIndex));
    } else {
      optionBtn.addEventListener("click", () => handleTestAnswer(optionIndex));
      if (chosen === optionIndex) optionBtn.classList.add("selected");
    }

    el.optionsList.appendChild(optionBtn);
  });

  if (state.mode === "quiz" && chosen !== null) {
    paintQuizFeedback();
  }

  updateProgress();
  updateModeActions();
}

function handleQuizAnswer(selectedIndex) {
  if (state.selectedAnswers[state.currentIndex] !== null) return;
  state.selectedAnswers[state.currentIndex] = selectedIndex;
  paintQuizFeedback();
  updateModeActions();
}

function paintQuizFeedback() {
  const question = state.currentQuestions[state.currentIndex];
  const selected = state.selectedAnswers[state.currentIndex];
  const buttons = el.optionsList.querySelectorAll(".option-btn");

  buttons.forEach((btn, index) => {
    btn.disabled = true;
    if (index === question.correctIndex) btn.classList.add("correct");
    if (index === selected && selected !== question.correctIndex) btn.classList.add("wrong");
  });

  el.explanationText.textContent = question.explanation;
  el.explanationBox.classList.remove("hidden");
}

function handleTestAnswer(selectedIndex) {
  state.selectedAnswers[state.currentIndex] = selectedIndex;
  const buttons = el.optionsList.querySelectorAll(".option-btn");
  buttons.forEach((btn, idx) => btn.classList.toggle("selected", idx === selectedIndex));
  updateModeActions();
}

function handleNext() {
  if (state.currentIndex < state.currentQuestions.length - 1) {
    state.currentIndex += 1;
    renderCurrentQuestion();
    return;
  }

  if (state.mode === "quiz") {
    showResult("Quiz complete");
  }
}

function submitTest() {
  showResult("Test submitted");
}

function showResult(title) {
  const total = state.currentQuestions.length;
  const attempted = state.selectedAnswers.filter(v => v !== null).length;
  const correct = state.currentQuestions.reduce((sum, question, index) => {
    return sum + (state.selectedAnswers[index] === question.correctIndex ? 1 : 0);
  }, 0);
  const wrong = attempted - correct;
  const skipped = total - attempted;
  const scorePct = total ? ((correct / total) * 100).toFixed(1) : "0.0";

  el.resultTitle.textContent = title;
  el.resultSubtitle.textContent = `${correct} of ${total} correct`;
  el.resultStats.textContent = "";
  [
    ["Score", `${scorePct}%`],
    ["Correct", String(correct)],
    ["Wrong", String(wrong)],
    ["Skipped", String(skipped)]
  ].forEach(([label, value]) => {
    el.resultStats.appendChild(makeStat(label, value));
  });

  switchScreen("result");
}

function makeStat(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "stat";
  const labelEl = document.createElement("span");
  labelEl.className = "stat-label";
  labelEl.textContent = label;
  const valueEl = document.createElement("span");
  valueEl.className = "stat-value";
  valueEl.textContent = value;
  wrapper.appendChild(labelEl);
  wrapper.appendChild(valueEl);
  return wrapper;
}

function updateProgress() {
  const total = state.currentQuestions.length;
  const current = state.currentIndex + 1;
  const percent = total ? (current / total) * 100 : 0;
  el.progressBar.style.width = `${percent}%`;
  el.progressText.textContent = `${current} / ${total}`;
}

function updateModeActions() {
  const isLast = state.currentIndex === state.currentQuestions.length - 1;
  const hasSelected = state.selectedAnswers[state.currentIndex] !== null;

  if (state.mode === "quiz") {
    el.nextBtn.classList.remove("hidden");
    el.submitTestBtn.classList.add("hidden");
    el.nextBtn.disabled = !hasSelected;
    el.nextBtn.textContent = isLast ? "Finish Quiz" : "Next";
    return;
  }

  el.nextBtn.classList.toggle("hidden", isLast);
  el.submitTestBtn.classList.toggle("hidden", !isLast);
  el.nextBtn.disabled = false;
  el.submitTestBtn.disabled = false;
}

function switchScreen(screen) {
  el.homeScreen.classList.toggle("hidden", screen !== "home");
  el.modeScreen.classList.toggle("hidden", screen !== "mode");
  el.readScreen.classList.toggle("hidden", screen !== "read");
  el.resultScreen.classList.toggle("hidden", screen !== "result");
}
