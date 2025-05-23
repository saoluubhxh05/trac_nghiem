import { speak } from "./speech-util.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("translateContainer");
const defaultTime = parseInt(localStorage.getItem("translateTime")) || 30;

let currentIndex = 0;
let recognition;
let timerInterval;
let accumulatedMatched = [];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
}

function compareWords(userText, answer) {
  const userWords = normalize(userText).split(" ");
  const answerWords = normalize(answer).split(" ");
  let correct = 0;

  const revealed = answerWords.map((w, i) => {
    if (accumulatedMatched[i] === w || userWords.includes(w)) {
      accumulatedMatched[i] = w;
      correct++;
      return w;
    }
    return "___";
  });

  const percent = Math.round((correct / answerWords.length) * 100);
  return {
    revealed: revealed.join(" "),
    percent,
    accumulated: accumulatedMatched.map((w) => w || "___").join(" "),
  };
}

function startSpeechRecognition(onResult) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói!");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = () => {
    alert("❌ Lỗi nhận diện giọng nói.");
    speakBtn.disabled = false;
  };

  recognition.start();
}

function renderQuestion(q, index) {
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `cau-${index}`; // ✅ dùng để scroll

  const vi = document.createElement("div");
  vi.className = "translate-box";
  vi.textContent = `📝 Câu ${index + 1}: ${q.cauHoi}`;

  const timer = document.createElement("div");
  timer.id = `timer-${index}`;
  timer.className = "timer";
  timer.textContent = `⏱️ ${defaultTime}s`;

  const spoken = document.createElement("div");
  spoken.className = "spoken-result";
  spoken.innerHTML = `<strong>Bạn nói:</strong> `;

  const match = document.createElement("div");
  match.className = "match-result";

  const accumulatedLine = document.createElement("div");
  accumulatedLine.className = "match-result";

  const controls = document.createElement("div");
  controls.className = "controls";

  const speakBtn = document.createElement("button");
  speakBtn.textContent = "🎙️ Bắt đầu nói";

  const replayBtn = document.createElement("button");
  replayBtn.textContent = "🔊 Đọc lại";
  replayBtn.disabled = true;
  replayBtn.style.opacity = "0.5";

  const helpBtn = document.createElement("button");
  helpBtn.textContent = "🔍 Trợ giúp";
  helpBtn.disabled = true;
  helpBtn.style.opacity = "0.5";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "➡️ Câu tiếp theo";
  nextBtn.disabled = true;

  controls.appendChild(speakBtn);
  controls.appendChild(replayBtn);
  controls.appendChild(helpBtn);
  controls.appendChild(nextBtn);

  block.appendChild(vi);
  block.appendChild(timer);
  block.appendChild(spoken);
  block.appendChild(match);
  block.appendChild(accumulatedLine);
  block.appendChild(controls);
  container.appendChild(block);

  // ✅ Cuộn xuống câu mới
  setTimeout(() => {
    block.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);

  // 🔁 phần xử lý sự kiện các nút sẽ nằm tiếp tục dưới đây như trước
}

renderQuestion(questions[currentIndex], currentIndex);
