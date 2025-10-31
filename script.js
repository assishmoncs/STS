let quizData = [];
let currentIndex = 0;
let score = 0, attempted = 0;
let selectedTopic = "";
let quizEnded = false;

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("quiz.json");
  quizData = await res.json();

  const topics = [...new Set(quizData.map(q => q.Topic))];
  const topicSelect = document.getElementById("topicFilter");
  topicSelect.innerHTML = `<option value="">All Topics</option>` + topics.map(t => `<option value="${t}">${t}</option>`).join("");

  topicSelect.addEventListener("change", () => {
    selectedTopic = topicSelect.value;
    resetQuiz();
  });

  document.getElementById("toggleTheme").addEventListener("click", toggleTheme);
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  document.getElementById("endBtn").addEventListener("click", endQuiz);
  document.getElementById("restartBtn").addEventListener("click", resetQuiz);

  loadQuestion();
});

function toggleTheme() {
  document.body.classList.toggle("light");
  const icon = document.getElementById("toggleTheme");
  icon.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
}

function getFilteredQuestions() {
  return selectedTopic ? quizData.filter(q => q.Topic === selectedTopic) : quizData;
}

function loadQuestion() {
  const filtered = getFilteredQuestions();
  if (quizEnded || currentIndex >= filtered.length) return;

  const q = filtered[currentIndex];
  document.getElementById("question").textContent = q.Question;
  document.getElementById("difficulty").textContent =
    "Difficulty: " + (q.Difficulty === "E" ? "Easy" : q.Difficulty === "A" ? "Average" : "Tough");
  document.getElementById("solution").classList.add("hidden");

  const opts = document.getElementById("options");
  opts.innerHTML = "";
  q.Choices.forEach((ch, i) => {
    const btn = document.createElement("button");
    btn.textContent = ch;
    btn.onclick = () => checkAnswer(i + 1, btn);
    opts.appendChild(btn);
  });

  const nextBtn = document.getElementById("nextBtn");
  nextBtn.textContent = currentIndex === filtered.length - 1 ? "Submit" : "Next";

  updateProgress(filtered.length);
}

function checkAnswer(choice, btn) {
  if (quizEnded) return;

  const filtered = getFilteredQuestions();
  const q = filtered[currentIndex];
  const allBtns = document.querySelectorAll("#options button");
  allBtns.forEach(b => b.disabled = true);
  attempted++;

  if (choice === q.AnswerKey) {
    btn.classList.add("correct");
    score++;
  } else {
    btn.classList.add("wrong");
    allBtns[q.AnswerKey - 1].classList.add("correct");
  }

  const sol = document.getElementById("solution");
  sol.textContent = "Solution: " + q.Solution;
  sol.classList.remove("hidden");
}

function nextQuestion() {
  if (quizEnded) return;

  const filtered = getFilteredQuestions();
  if (currentIndex === filtered.length - 1) {
    endQuiz();
  } else {
    currentIndex++;
    loadQuestion();
  }
}

function updateProgress(total) {
  const progress = ((currentIndex + 1) / total) * 100;
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  bar.style.width = `${progress}%`;
  text.textContent = `(${currentIndex + 1}/${total})`;
}


function endQuiz() {
  if (quizEnded) return;
  quizEnded = true;
  showScore();
}

function showScore() {
  document.getElementById("questionBox").classList.add("hidden");
  document.getElementById("scoreBox").classList.remove("hidden");

  const total = getFilteredQuestions().length;
  const unattempted = total - attempted;
  const accuracy = total ? ((score / total) * 100).toFixed(1) : 0;

  document.getElementById("scoreDetails").innerHTML = `
    <div class="score-summary">
      <p><strong>Total Questions:</strong> ${total}</p>
      <p><strong>Attempted:</strong> ${attempted}</p>
      <p><strong>Unattempted:</strong> ${unattempted}</p>
      <p><strong>Correct:</strong> ${score}</p>
      <p><strong>Wrong:</strong> ${attempted - score}</p>
      <p><strong>Accuracy:</strong> ${accuracy}%</p>
    </div>
  `;
}

function resetQuiz() {
  currentIndex = 0;
  score = 0;
  attempted = 0;
  quizEnded = false;

  document.getElementById("scoreBox").classList.add("hidden");
  document.getElementById("questionBox").classList.remove("hidden");

  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("progress-text").textContent = "";

  loadQuestion();
}
