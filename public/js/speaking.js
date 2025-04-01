import { renderQuestionImage } from "./image-util.js";
import { speak } from "./speech-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

let currentIndex = 0;
const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");

if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const questionContainer = document.getElementById("questionContainer");
const speakBtn = document.getElementById("speakBtn");
const micStatus = document.getElementById("micStatus");
const result = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");
const speakAgainBtn = document.getElementById("speakAgainBtn");
const readCounter = document.getElementById("readCounter");

let recognition;
let isListening = false;
let finalTranscript = "";
let accumulatedMatched = [];
let readLimit = 3;

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'") // chuyển dấu nháy cong thành dấu nháy thẳng
    .replace(/[^a-z0-9'\s]/g, "") // giữ lại ký tự, số, dấu nháy đơn
    .replace(/\s+/g, " ") // chuẩn hóa khoảng trắng
    .trim();
}

function updateReadCounter() {
  readCounter.textContent = `Còn lại: ${readLimit} lần`;
  speakAgainBtn.disabled = readLimit === 0;
  speakAgainBtn.style.opacity = readLimit === 0 ? "0.5" : "1";
}

function resetReadCounter() {
  readLimit = 3;
  updateReadCounter();
}

function renderQuestion() {
  const full = questions[currentIndex].dapAn.trim();
  const firstTwoWords = full.split(" ").slice(0, 2).join(" ");
  questionContainer.innerHTML = `<div class="hint">💡 Gợi ý: "${firstTwoWords}..."</div>`;

  const imageName = questions[currentIndex].tenAnh;
  renderQuestionImage(imageName, questionContainer);

  result.innerHTML = "";
  nextBtn.style.display = "none";
  nextBtn.disabled = true;
  nextBtn.style.opacity = "0.5";
  micStatus.textContent = "";
  speakBtn.textContent = "🎙️ Bắt đầu nói";
  isListening = false;
  finalTranscript = "";
  accumulatedMatched = [];
  resetReadCounter();
}

function startRecognition() {
  recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  finalTranscript = "";

  recognition.onresult = function (event) {
    const latestResult = event.results[event.results.length - 1];
    if (latestResult.isFinal) {
      finalTranscript = latestResult[0].transcript.trim();
    }
  };

  recognition.onerror = function () {
    micStatus.textContent = "❌ Lỗi ghi âm. Vui lòng thử lại.";
    speakBtn.textContent = "🎙️ Bắt đầu nói";
    isListening = false;
  };

  recognition.onend = function () {
    micStatus.textContent = "⏳ Đang xử lý...";

    const transcript = finalTranscript.trim();
    const expected = questions[currentIndex].dapAn.trim();
    const spokenWords = normalize(transcript).split(" ");
    const targetWords = normalize(expected).split(" ");

    const ans1 = targetWords
      .map((w, i) => (spokenWords[i] === w ? w : "..."))
      .join(" ");

    const updatedAns2 = targetWords.map((w, i) => {
      if (accumulatedMatched[i] === w) return w;
      if (spokenWords.includes(w)) {
        accumulatedMatched[i] = w;
        return w;
      }
      return `<input data-index="${i}" class="input-word" style="width:auto;min-width:40px;text-align:center;" />`;
    });

    const matchCount = accumulatedMatched.filter(
      (w) => w === w && w !== undefined
    ).length;
    let percent = Math.round((matchCount / targetWords.length) * 100);

    result.innerHTML = `
      <p><strong>Bạn đã nói:</strong> "${transcript}"</p>
      <p><strong>Đáp án 1 (theo thứ tự):</strong> ${ans1}</p>
      <p><strong>Đáp án 2 (không theo thứ tự, tích lũy):</strong> ${updatedAns2.join(
        " "
      )}</p>
      <p id="percentMatch"><strong>💯 Độ khớp:</strong> ${percent}%</p>
    `;

    nextBtn.style.display = "inline-block";
    nextBtn.disabled = percent < 50;
    nextBtn.style.opacity = percent >= 50 ? "1" : "0.5";

    document.querySelectorAll(".input-word").forEach((input) => {
      input.addEventListener("input", () => {
        document.querySelectorAll(".input-word").forEach((inp) => {
          const idx = parseInt(inp.dataset.index);
          const val = normalize(inp.value);
          if (val === normalize(targetWords[idx])) {
            accumulatedMatched[idx] = targetWords[idx];
          }
        });

        // Cập nhật lại phần trăm khớp sau mỗi lần gõ
        const matchNow = accumulatedMatched.filter(
          (w, i) => w === targetWords[i]
        ).length;
        const percent = Math.round((matchNow / targetWords.length) * 100);
        document.getElementById(
          "percentMatch"
        ).innerHTML = `<strong>💯 Độ khớp:</strong> ${percent}%`;

        nextBtn.disabled = percent < 50;
        nextBtn.style.opacity = percent >= 50 ? "1" : "0.5";
      });
    });

    speakBtn.textContent = "🎙️ Bắt đầu nói";
    micStatus.textContent = "";
    isListening = false;
  };

  recognition.start();
  micStatus.textContent = "🎙️ Đang nghe...";
  speakBtn.textContent = "⏳ Chờ";
  isListening = true;
}

speakBtn.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
  } else {
    startRecognition();
  }
});

speakAgainBtn.addEventListener("click", () => {
  if (readLimit > 0) {
    const textToSpeak = questions[currentIndex].dapAn;
    speak(textToSpeak);
    readLimit--;
    updateReadCounter();
  }
});

nextBtn.addEventListener("click", () => {
  if (nextBtn.disabled) return;
  currentIndex++;
  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    questionContainer.innerHTML = `<h2>✅ Hoàn thành bài luyện nói!</h2>`;
    // localStorage.setItem("lastDoneDate", new Date().toISOString());

    speakBtn.style.display = "none";
    nextBtn.style.display = "none";
    speakAgainBtn.style.display = "none";
    readCounter.style.display = "none";

    // ✅ Thêm nút chuyển bài tiếp theo
    taoNutBaiTiepTheo(questionContainer);
    // ✅ Cập nhật thời gian hoàn thành
    localStorage.setItem("lastDoneDate", new Date().toISOString());
  }
});

renderQuestion();
