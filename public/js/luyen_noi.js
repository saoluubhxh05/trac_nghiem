import { speak } from "./speech-util.js";
import {
  langToLocale,
  normalize,
  splitWords,
  compareWords,
} from "./lang-util.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length || questions[0].language !== "en") {
  alert("Không có dữ liệu tiếng Anh. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("luyenNoiContainer");
const defaultTime = 30; // Timer cho speaking
let currentIndex = 0;
let recognition;
let timerInterval;
let accumulatedMatched = [];

function startSpeechRecognition(onResult) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition)
    return alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói!");
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true; // Feedback real-time cho KET
  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript);
  };
  recognition.onerror = () => alert("❌ Lỗi nhận diện giọng nói.");
  recognition.start();
}

function renderQuestion(q, index) {
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `cau-${index}`;
  block.innerHTML = `
    <div class="question-progress">📌 Câu ${index + 1} / ${
    questions.length
  } (KET Part ${q.chuDe.includes("personal") ? 1 : 2})</div>
    <div class="translate-box">📝 Prompt: ${
      q.cauHoi
    }</div>  <!-- e.g., "Tell me about your family." -->
    <div id="timer-${index}" class="timer">⏱️ ${defaultTime}s</div>
    <div class="spoken-result"><strong>Bạn nói:</strong> </div>
    <div class="match-result"></div>
    <div class="controls">
      <button id="speakBtn">🎙️ Bắt đầu nói</button>
      <button id="replayBtn" disabled>🔊 Đọc mẫu</button>
      <button id="helpBtn" disabled>🔍 Trợ giúp (Dịch)</button>
      <button id="nextBtn" disabled>➡️ Câu tiếp theo</button>
    </div>
    <div id="tips" style="color:gray;">Tips cho max score: Use connectors, pronounce clearly, interact naturally.</div>
  `;
  container.appendChild(block);

  // Logic tương tự translate-en.js: Timer, speakBtn onclick start recognition, compareWords, retry, help (hiển thị q.dichDapAn làm hint)
  // ... (Copy logic từ translate-en.js: secondsLeft, finished, troGiupUsed, etc.)
  // Ví dụ: Trong onResult, dùng compareWords(transcript, q.dapAn, 'en', accumulatedMatched)
  // Nếu % >=70%: Hiển thị "Good job! Max score potential with clear pronunciation."
  // Help: Hiển thị q.dichDapAn nếu có.

  // NextBtn: Chuyển câu hoặc hoàn thành với redo list
}

renderQuestion(questions[currentIndex], currentIndex);
