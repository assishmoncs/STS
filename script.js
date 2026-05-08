let quizData = [];
let currentIndex = 0;
let score = 0;
let attempted = 0;
let quizEnded = false;
let filteredQuestions = [];

const elements = {
  question: document.getElementById("question"),
  options: document.getElementById("options"),
  difficulty: document.getElementById("difficulty"),
  solutionBox: document.getElementById("solutionBox"),
  solutionText: document.getElementById("solutionText"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  nextBtn: document.getElementById("nextBtn"),
  endBtn: document.getElementById("endBtn"),
  restartBtn: document.getElementById("restartBtn"),
  topicFilter: document.getElementById("topicFilter"),
  scoreBox: document.getElementById("scoreBox"),
  questionBox: document.getElementById("questionBox"),
  scoreDetails: document.getElementById("scoreDetails"),
  toggleTheme: document.getElementById("toggleTheme")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const res = await fetch("quiz.json");
    const data = await res.json();
    
    // Standardize data format (matching actual quiz.json)
    quizData = data.map((item, index) => ({
      id: index,
      question: item.Question,
      choices: item.Choices,
      answerKey: item.AnswerKey, // Number 1-4
      explanation: item.Solution || "No explanation provided.",
      topic: item.Topic || "General",
      difficulty: item.Difficulty || "A"
    }));

    setupFilters();
    attachListeners();
    resetQuiz();
  } catch (error) {


    console.error("Failed to load quiz data:", error);
    elements.question.textContent = "Error loading quiz. Please try again later.";
  }
}

function setupFilters() {
  const topics = [...new Set(quizData.map(q => q.topic))];
  elements.topicFilter.innerHTML = `<option value="">All Topics</option>` + 
    topics.map(t => `<option value="${t}">${t}</option>`).join("");
}

function attachListeners() {
  elements.topicFilter.addEventListener("change", resetQuiz);
  elements.toggleTheme.addEventListener("click", toggleTheme);
  elements.nextBtn.addEventListener("click", handleNext);
  elements.endBtn.addEventListener("click", endQuiz);
  elements.restartBtn.addEventListener("click", resetQuiz);
}

function toggleTheme() {
  document.body.classList.toggle("light");
  elements.toggleTheme.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
}

function resetQuiz() {
  currentIndex = 0;
  score = 0;
  attempted = 0;
  quizEnded = false;
  
  const topic = elements.topicFilter.value;
  filteredQuestions = topic ? quizData.filter(q => q.topic === topic) : quizData;
  
  // Shuffle questions for variety if needed (optional)
  // filteredQuestions.sort(() => Math.random() - 0.5);

  elements.scoreBox.classList.add("hidden");
  elements.questionBox.classList.remove("hidden");
  loadQuestion();
}

function loadQuestion() {
  if (currentIndex >= filteredQuestions.length) {
    endQuiz();
    return;
  }

  const q = filteredQuestions[currentIndex];
  
  elements.question.textContent = q.question;
  elements.difficulty.textContent = getDifficultyLabel(q.difficulty);
  elements.solutionBox.classList.add("hidden");
  elements.nextBtn.textContent = currentIndex === filteredQuestions.length - 1 ? "Finish Quiz" : "Next Question";
  
  // Render options
  elements.options.innerHTML = "";
  q.choices.forEach((choice, index) => {
    if (!choice) return; // Skip empty options
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(index, btn);
    elements.options.appendChild(btn);
  });

  updateProgress();
}

function getDifficultyLabel(code) {
  switch(code) {
    case 'E': return "Easy";
    case 'A': return "Average";
    case 'T': return "Tough";
    default: return "Average";
  }
}

function checkAnswer(selectedIndex, selectedBtn) {
  if (elements.solutionBox.classList.contains("hidden") === false) return; // Prevent multiple clicks

  const q = filteredQuestions[currentIndex];
  const correctIdx = getCorrectIndex(q.answerKey);
  const allBtns = elements.options.querySelectorAll("button");
  
  attempted++;
  allBtns.forEach(btn => btn.disabled = true);

  if (selectedIndex === correctIdx) {
    selectedBtn.classList.add("correct");
    score++;
  } else {
    selectedBtn.classList.add("wrong");
    allBtns[correctIdx].classList.add("correct");
  }

  // Show explanation
  elements.solutionText.textContent = q.explanation;
  elements.solutionBox.classList.remove("hidden");
  
  // Scroll to solution if on mobile
  if (window.innerWidth < 768) {
    elements.solutionBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function getCorrectIndex(key) {
  if (typeof key === 'number') return key - 1;
  const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  return map[key] || 0;
}

function handleNext() {
  if (elements.solutionBox.classList.contains("hidden")) {
    // If user hasn't answered, maybe show a hint or just skip?
    // Let's allow skipping but count as unattempted.
  }
  
  currentIndex++;
  if (currentIndex < filteredQuestions.length) {
    loadQuestion();
  } else {
    endQuiz();
  }
}

function updateProgress() {
  const total = filteredQuestions.length;
  const progress = ((currentIndex + 1) / total) * 100;
  elements.progressBar.style.width = `${progress}%`;
  elements.progressText.textContent = `${currentIndex + 1} of ${total}`;
}

function endQuiz() {
  quizEnded = true;
  elements.questionBox.classList.add("hidden");
  elements.scoreBox.classList.remove("hidden");

  const total = filteredQuestions.length;
  const unattempted = total - attempted;
  const wrong = attempted - score;
  const accuracy = attempted > 0 ? ((score / attempted) * 100).toFixed(1) : 0;

  elements.scoreDetails.innerHTML = `
    <div class="score-summary">
      <div class="score-item">
        <span class="score-label">Accuracy</span>
        <span class="score-value">${accuracy}%</span>
      </div>
      <div class="score-item">
        <span class="score-label">Correct</span>
        <span class="score-value">${score}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Wrong</span>
        <span class="score-value">${wrong}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Skipped</span>
        <span class="score-value">${unattempted}</span>
      </div>
    </div>
  `;
}
