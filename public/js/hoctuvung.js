import { speak } from "./speech-util.js";
import {
  langToLocale,
  normalize,
  splitWords,
  compareWords,
} from "./lang-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
const mode = localStorage.getItem("hoctuvungMode") || "new";
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz-2.html";
}

const container = document.getElementById("hoctuvungContainer");
const completeBtn = document.getElementById("completeBtn");
let vocabList = []; // List từ vựng/dịch tổng hợp từ questions
let progress = {}; // {word: percent} theo dõi >=50%

// Extract vocab từ questions
questions.forEach((q) => {
  if (q.tuVung && q.dichTuVung && q.tuVung.length === q.dichTuVung.length) {
    q.tuVung.forEach((word, i) => {
      vocabList.push({ word: word.trim(), dich: q.dichTuVung[i].trim() });
      progress[word] = 0; // Init progress
    });
  }
});
vocabList = [...new Set(vocabList.map((v) => v.word))].map((w) =>
  vocabList.find((v) => v.word === w)
); // Unique words

if (!vocabList.length) {
  container.innerHTML = "<p>Không có từ vựng để học.</p>";
} else {
  renderVocab();
}

function renderVocab() {
  container.innerHTML = `<h2>Chế độ: ${
    mode === "new" ? "Học mới" : "Ôn lại"
  }</h2>`;
  vocabList.forEach((v, index) => {
    const item = document.createElement("div");
    item.className = "word-item";
    const hint = document.createElement("div");
    hint.className = "word-hint";
    const resultDiv = document.createElement("div");
    resultDiv.className = "word-result";

    if (mode === "new") {
      // Học mới: Từ + Nút đọc + Dịch + Nút lặp lại
      hint.innerHTML = `Từ: ${v.word} - Dịch: ${v.dich}`;
      const readBtn = document.createElement("button");
      readBtn.textContent = "🔊 Đọc";
      readBtn.onclick = () => speak(v.word, "en-US");
      const repeatBtn = document.createElement("button");
      repeatBtn.textContent = "🎙️ Lặp lại";
      repeatBtn.onclick = () => toggleRepeat(v.word, resultDiv, index);
      item.appendChild(hint);
      item.appendChild(readBtn);
      item.appendChild(repeatBtn);
      item.appendChild(resultDiv);
    } else {
      // Ôn lại: Nghĩa TV + Từ blank với 3 chữ random
      hint.innerHTML = `Nghĩa: ${v.dich}`;
      const blankWord = createBlankWord(v.word);
      item.appendChild(hint);
      item.innerHTML += blankWord;
      const checkBtn = document.createElement("button");
      checkBtn.textContent = "Kiểm tra";
      checkBtn.onclick = () => checkReview(v.word, item, resultDiv, index);
      item.appendChild(checkBtn);
      item.appendChild(resultDiv);
    }
    container.appendChild(item);
  });
  updateProgress();
}

function toggleRepeat(word, resultDiv, index) {
  if (!recognition) {
    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      resultDiv.textContent = `Bạn nói: ${transcript}`;
    };
    recognition.onend = () => {
      const result = compareWords(finalTranscript, word, "en", []);
      progress[word] = result.percent;
      resultDiv.textContent += ` - Độ khớp: ${result.percent}%`;
      updateProgress();
    };
  }
  if (isListening) {
    recognition.stop();
    isListening = false;
  } else {
    finalTranscript = "";
    recognition.start();
    isListening = true;
    resultDiv.textContent = "Đang ghi...";
  }
}

function createBlankWord(word) {
  const letters = word.split("");
  const randomIndices = [];
  while (randomIndices.length < 3 && letters.length > 3) {
    const idx = Math.floor(Math.random() * letters.length);
    if (!randomIndices.includes(idx)) randomIndices.push(idx);
  }
  return (
    letters.map((l, i) => (randomIndices.includes(i) ? l : "_")).join("") +
    "<br>(Điền từ đầy đủ)"
  );
}

function checkReview(word, item, resultDiv, index) {
  const input = item.querySelector("input");
  if (input && normalize(input.value) === normalize(word)) {
    progress[word] = 100;
    resultDiv.textContent = "Đúng! Từ: " + word;
  } else {
    progress[word] = 0;
    resultDiv.textContent = "Sai. Thử lại.";
  }
  updateProgress();
}

function updateProgress() {
  const done = Object.values(progress).every((p) => p >= 50);
  const progressText = document.createElement("div");
  progressText.id = "progress";
  progressText.textContent = `Tiến độ: ${Math.round(
    (Object.values(progress).reduce((a, b) => a + b, 0) /
      (Object.keys(progress).length * 100)) *
      100
  )}%`;
  container.appendChild(progressText);
  completeBtn.style.display = done ? "block" : "none";
  completeBtn.onclick = () => {
    container.innerHTML = "<h2>🎉 Hoàn thành học từ vựng!</h2>";
    taoNutBaiTiepTheo(container);
  };
}
