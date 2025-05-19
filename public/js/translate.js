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

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "➡️ Câu tiếp theo";
  nextBtn.disabled = true;

  controls.appendChild(speakBtn);
  controls.appendChild(replayBtn);
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

  const answerWords = normalize(q.dapAn).split(" ");
  accumulatedMatched = new Array(answerWords.length).fill("");

  function resetTimer() {
    clearInterval(timerInterval);
    secondsLeft = defaultTime;
    timer.textContent = `⏱️ ${secondsLeft}s`;
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsLeft--;
      timer.textContent = `⏱️ ${secondsLeft}s`;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (!finished) {
          alert("⏳ Hết giờ! Hãy thử lại.");
          spoken.innerHTML = `<strong>Bạn nói:</strong> `;
          match.innerHTML = "";
          accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${accumulatedMatched
            .map((w) => w || "___")
            .join(" ")}`;
          nextBtn.disabled = true;
          speakBtn.disabled = false;
          replayBtn.disabled = true;
          replayBtn.style.opacity = "0.5";
        }
      }
    }, 1000);
  }

  speakBtn.onclick = () => {
    speakBtn.disabled = true;
    replayBtn.disabled = true;
    replayBtn.style.opacity = "0.5";

    // KHÔNG reset hoặc startTimer ở đây – timer chạy duy nhất 1 lần

    startSpeechRecognition((userSpeech) => {
      spoken.innerHTML = `<strong>Bạn nói:</strong> "${userSpeech}"`;
      const result = compareWords(userSpeech, q.dapAn);
      match.innerHTML = `<strong>✅ Đúng:</strong> ${result.revealed}<br>🎯 <strong>Độ khớp:</strong> ${result.percent}%`;
      accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${result.accumulated}`;

      if (result.percent >= 80) {
        clearInterval(timerInterval);
        nextBtn.disabled = false;
        replayBtn.disabled = false;
        replayBtn.style.opacity = "1";
        finished = true;
      } else {
        speakBtn.disabled = false;
      }
    });
  };

  replayBtn.onclick = () => {
    speak(q.dapAn);
  };

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      const done = document.createElement("div");
      done.innerHTML = `<h2>🎉 Bạn đã hoàn thành bài luyện dịch!</h2>`;
      container.appendChild(done);
    }
  };

  // Gọi 1 lần duy nhất khi load câu
  resetTimer();
  startTimer();
  speakBtn.click();
}
renderQuestion(questions[currentIndex], currentIndex);
