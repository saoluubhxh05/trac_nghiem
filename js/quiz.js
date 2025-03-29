import { speak, toggleMute, updateMuteButton } from "./speech-util.js";
import { renderQuestionImage } from "./image-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

let currentIndex = 0;
let correctCount = 0;

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");

if (!questions.length) {
  alert("Không có dữ liệu câu hỏi! Quay lại chọn bài.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("questionContainer");
const nextBtn = document.getElementById("nextBtn");
const speakAgainBtn = document.getElementById("speakAgainBtn");
const toggleMuteBtn = document.getElementById("toggleMuteBtn");

function shuffleOptions(q) {
  const options = [q.phuongAn1, q.phuongAn2, q.phuongAn3, q.phuongAn4];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function renderQuestion() {
  const q = questions[currentIndex];
  const options = shuffleOptions(q);

  container.innerHTML = `
    <h2>Câu ${currentIndex + 1}/${questions.length}</h2>
    <p><strong>${q.cauHoi}</strong></p>
  `;

  renderQuestionImage(q.tenAnh, container);

  const optionsHTML = options
    .map((opt) => `<div class="dap-an">${opt}</div>`)
    .join("");
  container.innerHTML += optionsHTML;

  document.querySelectorAll(".dap-an").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".dap-an")
        .forEach((d) => (d.style.pointerEvents = "none"));
      const correct = q.dapAn.trim();
      const user = el.textContent.trim();

      if (user === correct) {
        el.classList.add("dung");
        correctCount++;
      } else {
        el.classList.add("sai");
        const correctEl = Array.from(document.querySelectorAll(".dap-an")).find(
          (e) => e.textContent.trim() === correct
        );
        if (correctEl) correctEl.classList.add("dung");
      }

      speak(`${correct}`);
      speakAgainBtn.style.display = "inline-block";
      nextBtn.style.display = "inline-block";
    });
  });
}

speakAgainBtn.addEventListener("click", () => {
  const q = questions[currentIndex];
  speak(`The correct answer is: ${q.dapAn}`);
});

toggleMuteBtn.addEventListener("click", () => {
  toggleMute();
});

nextBtn.addEventListener("click", () => {
  currentIndex++;
  speakAgainBtn.style.display = "none";
  nextBtn.style.display = "none";

  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  container.innerHTML = `
    <h2>🎉 Hoàn thành!</h2>
    <p>Số câu đúng: <strong>${correctCount}</strong> / ${questions.length}</p>
  `;
  speakAgainBtn.style.display = "none";
  toggleMuteBtn.style.display = "none";
  taoNutBaiTiepTheo(container);
}

updateMuteButton();
renderQuestion();
