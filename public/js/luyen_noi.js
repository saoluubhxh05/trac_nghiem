import { speak } from "./speech-util.js";
import {
  langToLocale,
  normalize,
  splitWords,
  compareWords,
} from "./lang-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz-2.html";
}

const container = document.getElementById("luyenNoiContainer");
const defaultTime = 30;
let currentIndex = 0;
let recognition = null;
let timerInterval;
let retryCount = 0;
let retryScores = [];
let mustRedo = JSON.parse(localStorage.getItem("mustRedo") || "[]");

function renderQuestion(q, index) {
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `cau-${index}`;
  block.innerHTML = `
    <div class="question-progress" style="margin-bottom:6px;font-weight:bold;">
      📌 Câu ${index + 1} / ${questions.length}
    </div>
    <div class="question-box" style="font-size:18px;margin-bottom:10px;">
      📝 Câu hỏi: ${q.cauHoi}
    </div>
    <div id="timer-${index}" class="timer">⏱️ ${defaultTime}s</div>
    <div class="spoken-result"><strong>Bạn nói:</strong> <span id="spoken-${index}"></span></div>
    <div class="match-result" id="match-${index}"></div>
    <div class="hint-result" id="hint-${index}"></div>
    <div class="controls">
      <button id="speakBtn-${index}">🎙️ Bắt đầu nói</button>
      <button id="replayBtn-${index}" disabled style="opacity:0.5;">🔊 Đọc đáp án mẫu</button>
      <button id="hintBtn-${index}" disabled style="opacity:0.5;">🔍 Gợi ý dịch</button>
      <button id="nextBtn-${index}" disabled>➡️ Câu tiếp theo</button>
    </div>
  `;
  container.appendChild(block);

  let secondsLeft = defaultTime;
  let isListening = false;
  let finished = false;
  let hintUsed = false;
  const answerWords = splitWords(normalize(q.dapAn, "en"), "en");
  let accumulatedMatched = new Array(answerWords.length).fill("");

  function resetTimer() {
    clearInterval(timerInterval);
    secondsLeft = defaultTime;
    document.getElementById(
      `timer-${index}`
    ).textContent = `⏱️ ${secondsLeft}s`;
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsLeft--;
      document.getElementById(
        `timer-${index}`
      ).textContent = `⏱️ ${secondsLeft}s`;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (!finished) handleResult("");
      }
    }, 1000);
  }

  document.getElementById(`speakBtn-${index}`).onclick = () => {
    if (!recognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition)
        return alert("⚠️ Trình duyệt không hỗ trợ ghi âm!");
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
    }

    if (!isListening) {
      isListening = true;
      document.getElementById(`speakBtn-${index}`).textContent =
        "⏳ Đang ghi...";
      recognition.start();
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (!event.results[i].isFinal) {
            document.getElementById(`spoken-${index}`).textContent = transcript;
          }
        }
        if (event.results[event.results.length - 1].isFinal) {
          recognition.stop();
          isListening = false;
          document.getElementById(`speakBtn-${index}`).textContent =
            "🎙️ Bắt đầu nói";
          handleResult(transcript.trim());
        }
      };
      recognition.onerror = () => {
        isListening = false;
        document.getElementById(`speakBtn-${index}`).textContent =
          "🎙️ Bắt đầu nói";
        alert("❌ Lỗi ghi âm!");
      };
    } else {
      recognition.stop();
      isListening = false;
      document.getElementById(`speakBtn-${index}`).textContent =
        "🎙️ Bắt đầu nói";
    }
  };

  function handleResult(transcript) {
    if (!transcript) {
      document.getElementById(`match-${index}`).innerHTML =
        "<p style='color:red'>⚠️ Không nhận được nội dung!</p>";
      retryCount++;
      if (retryCount < 3) return;
    }

    const result = compareWords(transcript, q.dapAn, "en", accumulatedMatched);
    accumulatedMatched = result.accumulatedArray;
    retryScores.push(result.percent);

    document.getElementById(`spoken-${index}`).textContent =
      transcript || "Không có";
    document.getElementById(`match-${index}`).innerHTML = `
      <p><strong>Đáp án mẫu:</strong> ${result.revealed}</p>
      <p><strong>💯 Độ khớp:</strong> ${result.percent}%</p>
      <p><strong>Đáp án tích lũy:</strong> ${result.accumulated || ""}</p>
      <p><strong>Từ sai:</strong> ${
        result.wrongWords.join(", ") || "Không có"
      }</p>
    `;

    if (retryCount >= 2 || result.percent >= 70) {
      clearInterval(timerInterval);
      const avg = Math.round(
        retryScores.reduce((a, b) => a + b, 0) / retryScores.length
      );
      document.getElementById(
        `match-${index}`
      ).innerHTML += `<p><strong>📊 Trung bình: ${avg}% → ${
        avg >= 70 ? "✅ Đạt" : "❌ Chưa đạt"
      }</strong></p>`;
      if (avg < 70) mustRedo.push(q);
      localStorage.setItem("mustRedo", JSON.stringify(mustRedo));
      document.getElementById(`nextBtn-${index}`).disabled = false;
      document.getElementById(`replayBtn-${index}`).disabled = false;
      document.getElementById(`replayBtn-${index}`).style.opacity = "1";
      finished = true;
    } else if (result.percent >= 50 && !hintUsed) {
      document.getElementById(`hintBtn-${index}`).disabled = false;
      document.getElementById(`hintBtn-${index}`).style.opacity = "1";
    }
    retryCount++;
  }

  document.getElementById(`hintBtn-${index}`).onclick = () => {
    document.getElementById(
      `hint-${index}`
    ).innerHTML = `<p><strong>Gợi ý dịch:</strong> ${q.dichDapAn}</p>`;
    hintUsed = true;
    document.getElementById(`hintBtn-${index}`).disabled = true;
    document.getElementById(`hintBtn-${index}`).style.opacity = "0.5";
  };

  document.getElementById(`replayBtn-${index}`).onclick = () =>
    speak(q.dapAn, "en");

  document.getElementById(`nextBtn-${index}`).onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      container.innerHTML = "";
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      container.innerHTML = `<h2>🎉 Hoàn thành bài luyện nói!</h2>`;
      if (mustRedo.length) {
        container.innerHTML +=
          `<p style="color:red"><strong>❌ Câu cần làm lại:</strong></p><ul>` +
          mustRedo
            .map((q, i) => `<li>Câu ${i + 1}: ${q.cauHoi}</li>`)
            .join("") +
          "</ul>";
      }
      localStorage.removeItem("mustRedo");
      taoNutBaiTiepTheo(container);
    }
  };

  resetTimer();
  startTimer();
  setTimeout(
    () =>
      document
        .getElementById(`cau-${index}`)
        ?.scrollIntoView({ behavior: "smooth" }),
    100
  );
}

renderQuestion(questions[currentIndex], currentIndex);
