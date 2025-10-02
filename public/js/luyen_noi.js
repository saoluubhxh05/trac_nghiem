import { speak } from "./speech-util.js";
import {
  langToLocale,
  normalize,
  splitWords,
  compareWords,
} from "./lang-util.js";
import { renderQuestionImage } from "./image-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz-2.html";
}

const container = document.getElementById("luyenNoiContainer");
let currentIndex = 0;
let part = 1; // Part 1 hoặc 2 của KET
let recognition;
let timerInterval;
let accumulatedMatched = [];
const defaultTime = 120; // Tăng lên 2 phút cho câu dài

function startSpeechRecognition(onResult) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói!");
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true; // Bật chế độ ghi âm liên tục
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join(" ")
      .trim();
    onResult(transcript);
  };
  recognition.onerror = (e) => alert(`❌ Lỗi nhận diện: ${e.error}`);
  recognition.start();
}

function renderQuestion(q, index) {
  container.innerHTML = "";
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `cau-${index}`;
  const progress = document.createElement("div");
  progress.textContent = `📌 Câu ${index + 1} / ${
    questions.length
  } - Part ${part}`;
  block.appendChild(progress);

  const prompt = document.createElement("div");
  prompt.innerHTML = `<strong>Nhiệm vụ:</strong> ${
    part === 1
      ? "Trả lời câu hỏi cá nhân."
      : "Mô tả/thảo luận chủ đề với cue cards."
  }<br>${q.cauHoi}`;
  block.appendChild(prompt);

  renderQuestionImage(q.tenAnh, block);

  const timer = document.createElement("div");
  timer.id = `timer-${index}`;
  timer.textContent = `⏱️ ${defaultTime}s`;
  block.appendChild(timer);

  const spoken = document.createElement("div");
  spoken.innerHTML = `<strong>Bạn nói:</strong> <span id="interimText"></span>`;
  block.appendChild(spoken);

  const match = document.createElement("div");
  match.className = "match-result";
  block.appendChild(match);

  const tips = document.createElement("div");
  tips.innerHTML = `<em>Tips high score: Nói rõ ràng, dùng từ vựng/grammar phức tạp, giữ fluency >10s, tương tác tự nhiên.</em>`;
  block.appendChild(tips);

  const controls = document.createElement("div");
  const speakBtn = document.createElement("button");
  speakBtn.textContent = "🎙️ Bắt đầu nói";
  const stopBtn = document.createElement("button");
  stopBtn.textContent = "⏹️ Dừng nói";
  stopBtn.disabled = true;
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "➡️ Tiếp theo";
  nextBtn.disabled = true;
  controls.appendChild(speakBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(nextBtn);
  block.appendChild(controls);

  let secondsLeft = defaultTime;
  let isListening = false;
  let finalTranscript = "";

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsLeft--;
      timer.textContent = `⏱️ ${secondsLeft}s`;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (isListening) {
          recognition.stop();
          isListening = false;
          speakBtn.textContent = "🎙️ Bắt đầu nói";
          stopBtn.disabled = true;
          evaluateSpeech();
        }
      }
    }, 1000);
  }

  function evaluateSpeech() {
    const result = compareWords(
      finalTranscript,
      q.dapAn,
      "en",
      accumulatedMatched
    );
    accumulatedMatched = result.accumulatedArray;
    match.innerHTML = `
      <p><strong>Đáp án mẫu:</strong> ${q.dapAn}</p>
      <p><strong>💯 Độ khớp:</strong> ${result.percent}% (Grammar/Vocab: ${
      result.percent > 70 ? "Tốt" : "Cần cải thiện"
    }, Pronunciation: Clear, Fluency: ${
      finalTranscript.length > 50 ? "Tốt" : "Ngắn"
    })</p>
    `;
    if (result.percent >= 70) {
      nextBtn.disabled = false;
    } else {
      let mustRedo = JSON.parse(localStorage.getItem("mustRedo") || "[]");
      mustRedo.push(q);
      localStorage.setItem("mustRedo", JSON.stringify(mustRedo));
    }
  }

  speakBtn.onclick = () => {
    if (!isListening) {
      isListening = true;
      speakBtn.disabled = true;
      stopBtn.disabled = false;
      startSpeechRecognition((transcript) => {
        document.getElementById("interimText").textContent = transcript;
        finalTranscript = transcript; // Cập nhật liên tục
      });
      startTimer();
    }
  };

  stopBtn.onclick = () => {
    if (isListening) {
      recognition.stop();
      clearInterval(timerInterval);
      isListening = false;
      speakBtn.disabled = false;
      stopBtn.disabled = true;
      evaluateSpeech();
    }
  };

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      part = part === 1 ? 2 : 1;
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      container.innerHTML = `<h2>🎉 Hoàn thành luyện nói KET!</h2>`;
      taoNutBaiTiepTheo(container);
    }
  };

  container.appendChild(block);
}

renderQuestion(questions[currentIndex], currentIndex);
