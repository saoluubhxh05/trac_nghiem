// translate.js
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
let onTapLaiList = [];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
}

function compareWords(userText, answer) {
  const userWords = normalize(userText).split(" ");
  const answerWords = normalize(answer).split(" ");
  const revealed = [];
  let correct = 0;

  answerWords.forEach((w, i) => {
    if (accumulatedMatched[i] === w || userWords.includes(w)) {
      accumulatedMatched[i] = w;
      revealed.push(w);
      correct++;
    } else {
      revealed.push("___");
    }
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
    alert("⚠️ Trình duyệt không hỗ trợ ghi âm!");
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
  };

  recognition.start();
}

function renderQuestion(q, index) {
  const block = document.createElement("div");
  block.className = "question-block";

  const vi = document.createElement("div");
  vi.className = "translate-box";
  vi.textContent = `📝 Câu ${index + 1}: ${q.cauHoi}`;

  const timer = document.createElement("div");
  timer.className = "timer";
  timer.textContent = `⏱️ ${defaultTime}s`;

  const spoken = document.createElement("div");
  const match = document.createElement("div");
  const accumulatedLine = document.createElement("div");

  const controls = document.createElement("div");
  const speakBtn = document.createElement("button");
  speakBtn.textContent = "🎙️ Bắt đầu nói";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "➡️ Câu tiếp theo";
  nextBtn.disabled = true;

  controls.appendChild(speakBtn);
  controls.appendChild(nextBtn);

  block.appendChild(vi);
  block.appendChild(timer);
  block.appendChild(spoken);
  block.appendChild(match);
  block.appendChild(accumulatedLine);
  block.appendChild(controls);

  container.appendChild(block);

  let secondsLeft = defaultTime;
  let finished = false;
  let retryMode = false;
  let retryCount = 0;
  let retryResults = [];
  accumulatedMatched = new Array(q.dapAn.trim().split(" ").length).fill("");

  function resetTimer() {
    clearInterval(timerInterval);
    secondsLeft = defaultTime;
    timer.textContent = `⏱️ ${secondsLeft}s`;
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsLeft--;
      timer.textContent = `⏱️ ${secondsLeft}s`;
      if (secondsLeft <= 0 && !finished) {
        clearInterval(timerInterval);
        startRetryMode();
      }
    }, 1000);
  }

  function startRetryMode() {
    retryMode = true;
    retryCount = 0;
    retryResults = [];
    speakBtn.disabled = false;

    block.appendChild(document.createElement("hr"));
    const note = document.createElement("div");
    note.innerHTML = `<p><strong>📌 Đáp án đúng:</strong> ${q.dapAn}</p><p style="color: orange;">⚠️ Hãy ghi nhớ đáp án đúng, sau đó bấm nút bắt đầu nói và nói 3 lần. Tổng điểm trung bình ≥ 60% sẽ qua.</p>`;
    block.appendChild(note);
  }

  function processTranscript(userSpeech) {
    const result = compareWords(userSpeech, q.dapAn);
    spoken.innerHTML = `<strong>Bạn nói:</strong> "${userSpeech}"`;
    match.innerHTML = `<strong>✅ Đúng:</strong> ${result.revealed} <br> 🎯 <strong>Độ khớp:</strong> ${result.percent}%`;
    accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${result.accumulated}`;

    if (!retryMode) {
      if (result.percent >= 70) {
        clearInterval(timerInterval);
        nextBtn.disabled = false;
        finished = true;
      }
    } else {
      retryResults.push(result.percent);
      retryCount++;

      const line = document.createElement("p");
      line.innerHTML = `🗣️ Lần ${retryCount}: ${userSpeech} → 🎯 ${result.percent}%`;
      block.appendChild(line);

      if (retryCount === 3) {
        const avg = Math.round(retryResults.reduce((a, b) => a + b, 0) / 3);
        const summary = document.createElement("p");
        summary.innerHTML = `<strong>📊 Tổng điểm trung bình: ${avg}%</strong>`;
        block.appendChild(summary);

        if (avg >= 60) {
          nextBtn.disabled = false;
        } else {
          onTapLaiList.push(q);
        }
      }
    }
  }

  speakBtn.onclick = () => {
    startSpeechRecognition((transcript) => {
      processTranscript(transcript);
    });
  };

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      showSummary();
    }
  };

  resetTimer();
  startTimer();
}

function showSummary() {
  container.innerHTML = "<h2>✅ Hoàn thành bài luyện dịch!</h2>";
  if (onTapLaiList.length) {
    const retryDiv = document.createElement("div");
    retryDiv.innerHTML = `<h3>🛠️ Các câu cần làm lại (${onTapLaiList.length}):</h3>`;
    onTapLaiList.forEach((q, i) => {
      const p = document.createElement("p");
      p.innerText = `${i + 1}. ${q.cauHoi}`;
      retryDiv.appendChild(p);
    });
    container.appendChild(retryDiv);
  }
}

renderQuestion(questions[currentIndex], currentIndex);
