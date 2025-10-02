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
const defaultTime = 60; // 1 phút cho mỗi phần, giống KET

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
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join(" ");
    onResult(transcript);
  };
  recognition.onerror = () => alert("❌ Lỗi nhận diện giọng nói.");
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

  renderQuestionImage(q.tenAnh, block); // Nếu có hình cho Part 2

  const timer = document.createElement("div");
  timer.id = `timer-${index}`;
  timer.textContent = `⏱️ ${defaultTime}s`;
  block.appendChild(timer);

  const spoken = document.createElement("div");
  spoken.innerHTML = `<strong>Bạn nói:</strong> `;
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
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "➡️ Tiếp theo";
  nextBtn.disabled = true;
  controls.appendChild(speakBtn);
  controls.appendChild(nextBtn);
  block.appendChild(controls);

  let secondsLeft = defaultTime;
  let isListening = false;
  let finalTranscript = "";

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsLeft--;
      timer.textContent = `⏱️ ${secondsLeft}s`;
      if (secondsLeft <= 0) clearInterval(timerInterval);
    }, 1000);
  }

  speakBtn.onclick = () => {
    if (!isListening) {
      isListening = true;
      speakBtn.textContent = "⏳ Đang ghi...";
      startSpeechRecognition((transcript) => {
        spoken.innerHTML = `<strong>Bạn nói:</strong> ${transcript}`;
        finalTranscript = transcript;
      });
      startTimer();
    } else {
      recognition.stop();
      isListening = false;
      speakBtn.textContent = "🎙️ Bắt đầu nói";
      clearInterval(timerInterval);

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
        // Lưu redo nếu thấp
        let mustRedo = JSON.parse(localStorage.getItem("mustRedo") || "[]");
        mustRedo.push(q);
        localStorage.setItem("mustRedo", JSON.stringify(mustRedo));
      }
    }
  };

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      part = part === 1 ? 2 : 1; // Luân phiên Part 1/2
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      container.innerHTML = `<h2>🎉 Hoàn thành luyện nói KET!</h2>`;
      taoNutBaiTiepTheo(container);
    }
  };

  container.appendChild(block);
}

renderQuestion(questions[currentIndex], currentIndex);
