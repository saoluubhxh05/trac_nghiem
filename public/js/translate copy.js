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

  let secondsLeft = defaultTime;
  let finished = false;
  let troGiupUsed = false;
  let isListening = false;
  let finalTranscript = "";
  recognition = null;

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
          helpBtn.disabled = true;
          helpBtn.style.opacity = "0.5";
        }
      }
    }, 1000);
  }

  speakBtn.onclick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Trình duyệt không hỗ trợ ghi âm!");
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
    }

    if (!isListening) {
      finalTranscript = "";
      isListening = true;
      speakBtn.textContent = "⏳ Chờ";
      recognition.start();

      recognition.onresult = (event) => {
        const r = event.results[event.results.length - 1];
        if (r.isFinal) finalTranscript = r[0].transcript.trim();
      };

      recognition.onerror = (e) => {
        alert("❌ Lỗi ghi âm: " + e.error);
        isListening = false;
        speakBtn.textContent = "🎙️ Bắt đầu nói";
      };
    } else {
      recognition.stop();
      isListening = false;
      speakBtn.textContent = "🎙️ Bắt đầu nói";

      setTimeout(() => {
        if (!finalTranscript) {
          spoken.innerHTML = `<p style="color:red">⚠️ Không nhận được nội dung nào!</p>`;
          return;
        }

        spoken.innerHTML = `<strong>Bạn nói:</strong> "${finalTranscript}"`;
        const result = compareWords(finalTranscript, q.dapAn);
        match.innerHTML = `<strong>✅ Đúng:</strong> ${result.revealed}<br>🎯 <strong>Độ khớp:</strong> ${result.percent}%`;
        accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${result.accumulated}`;

        if (result.percent >= 70) {
          clearInterval(timerInterval);
          nextBtn.disabled = false;
          replayBtn.disabled = false;
          replayBtn.style.opacity = "1";
          helpBtn.disabled = true;
          helpBtn.style.opacity = "0.5";
          finished = true;

          const fullAnswer = document.createElement("div");
          fullAnswer.innerHTML = `<strong>📌 Đáp án đúng:</strong> ${q.dapAn}`;
          block.appendChild(fullAnswer);
        } else if (result.percent >= 50 && !troGiupUsed) {
          helpBtn.disabled = false;
          helpBtn.style.opacity = "1";
        }
      }, 300);
    }
  };

  helpBtn.onclick = () => {
    for (let i = 0; i < answerWords.length; i++) {
      if (!accumulatedMatched[i]) {
        accumulatedMatched[i] = answerWords[i];
        break;
      }
    }

    const updated = accumulatedMatched.map((w) => w || "___").join(" ");
    accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${updated}`;

    const correctNow = accumulatedMatched.filter(
      (w, i) => w === answerWords[i]
    ).length;
    const newPercent = Math.round((correctNow / answerWords.length) * 100);
    match.innerHTML += `<br><em>➡️ Sau trợ giúp: ${newPercent}%</em>`;

    if (newPercent >= 70) {
      clearInterval(timerInterval);
      nextBtn.disabled = false;
      replayBtn.disabled = false;
      replayBtn.style.opacity = "1";
      finished = true;

      const fullAnswer = document.createElement("div");
      fullAnswer.innerHTML = `<strong>📌 Đáp án đúng:</strong> ${q.dapAn}`;
      block.appendChild(fullAnswer);
    }

    troGiupUsed = true;
    helpBtn.disabled = true;
    helpBtn.style.opacity = "0.5";
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

  resetTimer();
  startTimer();
  speakBtn.click();
}

renderQuestion(questions[currentIndex], currentIndex);
