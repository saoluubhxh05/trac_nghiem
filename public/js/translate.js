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
let canLamLai = [];

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
    if (userWords.includes(w)) {
      correct++;
      revealed.push(w);
    } else {
      revealed.push("___");
    }
  });

  const percent = Math.round((correct / answerWords.length) * 100);
  return {
    revealed: revealed.join(" "),
    percent,
    total: correct,
    totalWords: answerWords.length,
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
  spoken.className = "spoken-result";

  const match = document.createElement("div");
  match.className = "match-result";

  const retryBlock = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "controls";

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
  block.appendChild(retryBlock);
  block.appendChild(controls);
  container.appendChild(block);

  let secondsLeft = defaultTime;
  let finished = false;
  let isRetryMode = false;
  let retryCount = 0;
  let retryScores = [];

  let isListening = false;
  let finalTranscript = "";

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
          const answer = q.dapAn;
          spoken.innerHTML = `<strong>📌 Đáp án đúng:</strong> ${answer}`;
          match.innerHTML = `<strong>⏳ Hết giờ!</strong><br>💡 Hãy ghi nhớ đáp án đúng sau đó bấm "Bắt đầu nói" và nói 3 lần.<br>✅ Nếu tổng độ khớp của 3 lần ≥ 60% bạn sẽ hoàn thành.`;

          isRetryMode = true;
          retryCount = 0;
          retryScores = [];

          speakBtn.disabled = false;
          speakBtn.textContent = "🎙️ Bắt đầu nói (3 lần)";
        }
      }
    }, 1000);
  }

  speakBtn.onclick = () => {
    if (isListening) return;

    isListening = true;
    speakBtn.textContent = "⏳ Đang nghe...";
    finalTranscript = "";

    startSpeechRecognition((userSpeech) => {
      isListening = false;
      speakBtn.textContent = isRetryMode
        ? "🎙️ Bắt đầu nói (3 lần)"
        : "🎙️ Bắt đầu nói";

      const result = compareWords(userSpeech, q.dapAn);
      spoken.innerHTML = `<strong>Bạn nói:</strong> "${userSpeech}"`;
      match.innerHTML = `<strong>✅ Đúng:</strong> ${result.revealed}<br>🎯 <strong>Độ khớp:</strong> ${result.percent}%`;

      if (!isRetryMode) {
        if (result.percent >= 70) {
          clearInterval(timerInterval);
          nextBtn.disabled = false;
          finished = true;

          const fullAnswer = document.createElement("div");
          fullAnswer.innerHTML = `<strong>📌 Đáp án đúng:</strong> ${q.dapAn}`;
          block.appendChild(fullAnswer);
        }
      } else {
        retryCount++;
        retryScores.push(result.percent);

        const line = document.createElement("p");
        line.innerHTML = `🔁 Lần ${retryCount}: <em>"${userSpeech}"</em> → 🎯 ${result.percent}%`;
        retryBlock.appendChild(line);

        if (retryCount === 3) {
          const total = retryScores.reduce((a, b) => a + b, 0);
          const summary = document.createElement("p");
          summary.innerHTML = `<strong>📊 Tổng độ khớp sau 3 lần: ${total}%</strong>`;
          retryBlock.appendChild(summary);

          if (total >= 60) {
            nextBtn.disabled = false;
            finished = true;
          } else {
            canLamLai.push(q);
            const warn = document.createElement("p");
            warn.style.color = "red";
            warn.innerHTML =
              "⚠️ Bạn chưa hoàn thành đủ yêu cầu. Câu này sẽ được luyện lại sau.";
            retryBlock.appendChild(warn);
            nextBtn.disabled = false;
          }
        }
      }
    });
  };

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      const done = document.createElement("div");
      done.innerHTML = `<h2>🎉 Bạn đã hoàn thành bài luyện dịch!</h2>`;
      container.appendChild(done);

      if (canLamLai.length > 0) {
        const list = document.createElement("div");
        list.innerHTML = `<h3>📌 Các câu cần làm lại:</h3><ul>${canLamLai
          .map((q, i) => `<li>${i + 1}. ${q.cauHoi}</li>`)
          .join("")}</ul>`;
        container.appendChild(list);
      }
    }
  };

  resetTimer();
  startTimer();
}
renderQuestion(questions[currentIndex], currentIndex);
